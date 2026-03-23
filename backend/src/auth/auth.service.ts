import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    // ── Slug helper ──────────────────────────────────────────────────────────
    private slugify(name: string): string {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // ── Patient Registration ─────────────────────────────────────────────────
    async registerPatient(dto: RegisterPatientDto) {
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        phone: dto.phone,
                        aadhaarNumber: dto.aadhaarNumber,
                        passwordHash,
                        role: 'PATIENT',
                        patient: {
                            create: {
                                fullName: dto.fullName,
                                dateOfBirth: dto.dateOfBirth,
                                gender: dto.gender,
                            },
                        },
                    },
                    select: { id: true, patient: { select: { id: true } } },
                });
                return user;
            });

            return { message: 'Patient registered successfully', userId: result.id };
        } catch (e: any) {
            this.handlePrismaConflict(e, 'phone', 'aadhaarNumber');
        }
    }

    // ── Hospital Registration ─────────────────────────────────────────────────
    async registerHospital(dto: RegisterHospitalDto) {
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        // Build slug with collision safety
        let slug = this.slugify(dto.hospitalName);
        const slugExists = await this.prisma.hospital.findUnique({ where: { slug } });
        if (slugExists) {
            slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        phone: dto.phone,
                        aadhaarNumber: dto.aadhaarNumber,
                        passwordHash,
                        role: 'HOSPITAL',
                        hospital: {
                            create: {
                                hospitalName: dto.hospitalName,
                                registrationNumber: dto.registrationNumber,
                                slug,
                            },
                        },
                    },
                    select: { id: true, hospital: { select: { id: true, slug: true } } },
                });
                return user;
            });

            return {
                message: 'Hospital registered successfully',
                userId: result.id,
                slug: result.hospital?.slug,
            };
        } catch (e: any) {
            this.handlePrismaConflict(e, 'phone', 'aadhaarNumber', 'registrationNumber', 'slug');
        }
    }

    // ── Doctor Registration (by hospital admin) ───────────────────────────────
    async registerDoctor(dto: RegisterDoctorDto) {
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        phone: dto.phone,
                        aadhaarNumber: dto.aadhaarNumber,
                        passwordHash,
                        role: 'DOCTOR',
                        doctor: {
                            create: {
                                hospitalId: dto.hospitalId,
                                fullName: dto.fullName,
                                specialization: dto.specialization,
                                department: dto.department,
                                licenseNumber: dto.licenseNumber,
                                role: (dto.role as any) ?? 'JUNIOR_DOCTOR',
                                status: 'ACTIVE',
                            },
                        },
                    },
                    select: { id: true, doctor: { select: { id: true } } },
                });
                return user;
            });

            return {
                message: 'Doctor registered successfully',
                userId: result.id,
                doctorId: result.doctor?.id,
            };
        } catch (e: any) {
            this.handlePrismaConflict(e, 'phone', 'aadhaarNumber');
        }
    }

    // ── Unified Login ────────────────────────────────────────────────────────
    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { phone: dto.phone.trim() },
            include: {
                patient: { select: { id: true } },
                hospital: { select: { id: true, slug: true } },
                doctor: { select: { id: true } },
            },
        });

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const match = await bcrypt.compare(dto.password, user.passwordHash);
        if (!match) throw new UnauthorizedException('Invalid credentials');

        // Rich JWT payload — downstream services never need an extra DB lookup
        const payload: Record<string, unknown> = {
            sub: user.id,
            role: user.role,
            patientId: user.patient?.id ?? undefined,
            hospitalId: user.hospital?.id ?? undefined,
            doctorId: user.doctor?.id ?? undefined,
        };

        const token = await this.jwtService.signAsync(payload);

        return {
            access_token: token,
            role: user.role,
            slug: user.hospital?.slug,
            doctorId: user.doctor?.id,
        };
    }

    // ── Helper: surface field-specific Prisma unique constraint errors ────────
    private handlePrismaConflict(e: any, ...fields: string[]): never {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            const target: string = (e.meta?.target as string[] | undefined)?.join(', ') ?? '';
            if (fields.some((f) => target.includes(f))) {
                if (target.includes('phone')) {
                    throw new ConflictException('Phone number is already registered');
                }
                if (target.includes('aadhaar') || target.includes('aadhaarNumber')) {
                    throw new ConflictException('Aadhaar number is already registered');
                }
                if (target.includes('registrationNumber')) {
                    throw new ConflictException('Hospital registration number is already registered');
                }
                if (target.includes('slug')) {
                    throw new ConflictException('Hospital slug conflict — try again');
                }
            }
            throw new ConflictException('A record with these details already exists');
        }
        throw e;
    }
}
