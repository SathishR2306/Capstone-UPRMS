import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';
import { Hospital } from '../hospital/entities/hospital.entity';
import { Doctor } from '../doctor/entities/doctor.entity';

import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Patient) private patientRepo: Repository<Patient>,
        @InjectRepository(Hospital) private hospitalRepo: Repository<Hospital>,
        @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
        private jwtService: JwtService,
    ) { }

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
        const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (existing) throw new BadRequestException('Phone already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            phone: dto.phone,
            aadhaar_number: dto.aadhaar_number,
            password: hashed,
            role: UserRole.PATIENT,
        });
        let savedUser;
        try {
            savedUser = await this.userRepo.save(user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new BadRequestException('Aadhaar number already registered');
            }
            throw error;
        }

        const patient = this.patientRepo.create({
            userId: savedUser.id,
            fullName: dto.fullName,
            dateOfBirth: dto.dateOfBirth,
            gender: dto.gender,
        });
        await this.patientRepo.save(patient);

        return { message: 'Patient registered successfully', userId: savedUser.id };
    }

    // ── Hospital Registration ─────────────────────────────────────────────────
    async registerHospital(dto: RegisterHospitalDto) {
        const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (existing) throw new BadRequestException('Phone already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            phone: dto.phone,
            aadhaar_number: dto.aadhaar_number,
            password: hashed,
            role: UserRole.HOSPITAL,
        });
        let savedUser;
        try {
            savedUser = await this.userRepo.save(user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new BadRequestException('Aadhaar number already registered');
            }
            throw error;
        }

        let slug = this.slugify(dto.hospitalName);
        const slugExists = await this.hospitalRepo.findOne({ where: { slug } });
        if (slugExists) { slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`; }

        const hospital = this.hospitalRepo.create({
            userId: savedUser.id,
            hospitalName: dto.hospitalName,
            registrationNumber: dto.registrationNumber,
            slug,
        });
        await this.hospitalRepo.save(hospital);

        return { message: 'Hospital registered successfully', userId: savedUser.id, slug };
    }

    // ── Doctor Registration (created by hospital admin) ───────────────────────
    async registerDoctor(dto: RegisterDoctorDto) {
        const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (existing) throw new BadRequestException('Phone already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            phone: dto.phone,
            aadhaar_number: dto.aadhaar_number,
            password: hashed,
            role: UserRole.DOCTOR,
        });
        let savedUser;
        try {
            savedUser = await this.userRepo.save(user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new BadRequestException('Aadhaar number already registered');
            }
            throw error;
        }

        const doctor = this.doctorRepo.create({
            userId: savedUser.id,
            hospitalId: dto.hospitalId,
        });
        await this.doctorRepo.save(doctor);

        return { message: 'Doctor registered successfully', userId: savedUser.id };
    }

    // ── Login ────────────────────────────────────────────────────────────────
    async login(dto: LoginDto) {
        let user: User | null = null;

        if (dto.phone) {
            // Patient login
            user = await this.userRepo.findOne({ where: { phone: dto.phone.trim() } });
        } else if (dto.hospitalName && dto.registrationNumber) {
            // Hospital login
            console.log(`Attempting hospital login for: ${dto.hospitalName}, Reg: ${dto.registrationNumber}`);
            const h = await this.hospitalRepo.findOne({
                where: { 
                    hospitalName: ILike(dto.hospitalName.trim()), 
                    registrationNumber: ILike(dto.registrationNumber.trim()) 
                },
                relations: ['user']
            });

            if (h) {
                console.log(`Hospital found: ${h.hospitalName}, User ID: ${h.userId}`);
                user = h.user;
            } else {
                console.log(`Hospital not found for Name: ${dto.hospitalName}, Reg: ${dto.registrationNumber}`);
                // Try finding by Reg number only to see if name is the issue
                const hByReg = await this.hospitalRepo.findOne({
                    where: { registrationNumber: ILike(dto.registrationNumber.trim()) }
                });

                if (hByReg) {
                    console.log(`FOUND hospital by Reg Number but name mismatched: DB Name: "${hByReg.hospitalName}" vs Input: "${dto.hospitalName}"`);
                }
            }
        } else if (dto.hospitalName && dto.docId) {
            // Doctor login
            const h = await this.hospitalRepo.findOne({ 
                where: { hospitalName: ILike(dto.hospitalName.trim()) } 
            });
            if (h) {
                const d = await this.doctorRepo.findOne({
                    where: { id: dto.docId, hospitalId: h.id },
                    relations: ['user']
                });
                if (d) user = d.user;
            }
        }

        if (!user) {
            console.log('Login failed: User not found in database with provided credentials.');
            throw new UnauthorizedException('Invalid credentials');
        }

        const match = await bcrypt.compare(dto.password, user.password);
        if (!match) {
            console.log(`Password mismatch for user: ${user.phone || user.id}`);
            throw new UnauthorizedException('Invalid credentials');
        }


        const payload = { sub: user.id, phone: user.phone, role: user.role };
        const token = await this.jwtService.signAsync(payload);

        let hospitalSlug: string | undefined;
        let doctorId: number | undefined;

        if (user.role === UserRole.HOSPITAL) {
            const h = await this.hospitalRepo.findOne({ where: { userId: user.id } });
            if (h) {
                if (!h.slug) {
                    h.slug = this.slugify(h.hospitalName);
                    // Check for collision
                    const exists = await this.hospitalRepo.findOne({ where: { slug: h.slug } });
                    if (exists && exists.id !== h.id) h.slug = `${h.slug}-${h.id}`;
                    await this.hospitalRepo.save(h);
                }
                hospitalSlug = h.slug;
            }
        } else if (user.role === UserRole.DOCTOR) {
            const d = await this.doctorRepo.findOne({ where: { userId: user.id }, relations: ['hospital'] });
            if (d) {
                doctorId = d.id;
                if (d.hospital) {
                    if (!d.hospital.slug) {
                        d.hospital.slug = this.slugify(d.hospital.hospitalName);
                        // Check for collision
                        const exists = await this.hospitalRepo.findOne({ where: { slug: d.hospital.slug } });
                        if (exists && exists.id !== d.hospital.id) d.hospital.slug = `${d.hospital.slug}-${d.hospital.id}`;
                        await this.hospitalRepo.save(d.hospital);
                    }
                    hospitalSlug = d.hospital.slug;
                }
            }
        }

        return { access_token: token, role: user.role, slug: hospitalSlug, doctorId };
    }
}
