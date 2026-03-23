import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Helper
const maskAadhaar = (n: string | null) => (n ? 'XXXX-XXXX-' + n.slice(-4) : 'N/A');

@Injectable()
export class PatientService {
    constructor(private readonly prisma: PrismaService) {}

    // ── Profile ──────────────────────────────────────────────────────────────
    async getProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                patient: true,
            },
        });
        if (!user || !user.patient) throw new NotFoundException('Patient profile not found');

        const p = user.patient;
        return {
            id: p.id,
            userId: user.id,
            fullName: p.fullName,
            phone: user.phone,
            maskedAadhaar: maskAadhaar(user.aadhaarNumber),
            dateOfBirth: p.dateOfBirth,
            gender: p.gender,
            bloodGroup: p.bloodGroup,
            emergencyContactName: p.emergencyContactName,
            emergencyContactPhone: p.emergencyContactPhone,
            emergencyContactRelation: p.emergencyContactRelation,
            role: user.role,
        };
    }

    // ── Update profile ───────────────────────────────────────────────────────
    async updateProfile(
        userId: number,
        dto: {
            phone?: string;
            bloodGroup?: string;
            emergencyContactName?: string;
            emergencyContactPhone?: string;
            emergencyContactRelation?: string;
        },
    ) {
        await this.prisma.$transaction(async (tx) => {
            if (dto.phone) {
                await tx.user.update({ where: { id: userId }, data: { phone: dto.phone } });
            }
            const patientData: Prisma.PatientUpdateInput = {};
            if (dto.bloodGroup !== undefined) patientData.bloodGroup = dto.bloodGroup;
            if (dto.emergencyContactName !== undefined) patientData.emergencyContactName = dto.emergencyContactName;
            if (dto.emergencyContactPhone !== undefined) patientData.emergencyContactPhone = dto.emergencyContactPhone;
            if (dto.emergencyContactRelation !== undefined)
                patientData.emergencyContactRelation = dto.emergencyContactRelation;
            if (Object.keys(patientData).length > 0) {
                await tx.patient.update({ where: { userId }, data: patientData });
            }
        });
        return { message: 'Profile updated successfully' };
    }

    // ── Search patients (HOSPITAL only) — single query with access status ────
    async searchPatients(query: string, hospitalUserId: number) {
        if (!query || query.trim().length < 2) return [];

        const hospital = await this.prisma.hospital.findUnique({ where: { userId: hospitalUserId } });
        if (!hospital) throw new NotFoundException('Hospital profile not found');

        const patients = await this.prisma.patient.findMany({
            where: {
                OR: [
                    { fullName: { contains: query, mode: 'insensitive' } },
                    { user: { phone: { contains: query, mode: 'insensitive' } } },
                    { user: { aadhaarNumber: { contains: query, mode: 'insensitive' } } },
                ],
            },
            include: {
                user: { select: { phone: true, aadhaarNumber: true } },
                accessPermissions: {
                    where: { hospitalId: hospital.id },
                    select: { status: true, grantedAt: true },
                    take: 1,
                },
            },
            take: 20,
        });

        return patients.map((p) => {
            const perm = p.accessPermissions[0] ?? null;
            return {
                id: p.id,
                fullName: p.fullName,
                phone: p.user.phone,
                maskedAadhaar: maskAadhaar(p.user.aadhaarNumber),
                gender: p.gender,
                dob: p.dateOfBirth,
                accessStatus: perm ? perm.status : 'NOT_REQUESTED',
                accessGranted: perm?.status === 'APPROVED',
                grantedAt: perm?.grantedAt ?? null,
            };
        });
    }

    // ── Find by Aadhaar exact match (HOSPITAL only) ──────────────────────────
    async findByAadhaar(aadhaarNumber: string, hospitalUserId: number) {
        if (!aadhaarNumber || aadhaarNumber.trim().length === 0) return [];

        const hospital = await this.prisma.hospital.findUnique({ where: { userId: hospitalUserId } });
        if (!hospital) throw new NotFoundException('Hospital profile not found');

        const user = await this.prisma.user.findUnique({
            where: { aadhaarNumber: aadhaarNumber.trim() },
            include: {
                patient: {
                    include: {
                        accessPermissions: {
                            where: { hospitalId: hospital.id },
                            select: { status: true, grantedAt: true },
                            take: 1,
                        },
                    },
                },
            },
        });

        if (!user?.patient) return [];

        const p = user.patient;
        const perm = p.accessPermissions[0] ?? null;

        return [
            {
                id: p.id,
                userId: user.id,
                fullName: p.fullName,
                phone: user.phone,
                maskedAadhaar: maskAadhaar(user.aadhaarNumber),
                gender: p.gender,
                dob: p.dateOfBirth,
                accessStatus: perm ? perm.status : 'NOT_REQUESTED',
                accessGranted: perm?.status === 'APPROVED',
            },
        ];
    }

    // ── Insurance ────────────────────────────────────────────────────────────
    async getInsurance(userId: number) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Patient profile not found');
        return this.prisma.patientInsurance.findMany({ where: { patientId: patient.id } });
    }

    async addOrUpdateInsurance(
        userId: number,
        dto: {
            id?: number;
            providerName: string;
            policyNumber: string;
            groupNumber?: string;
            validUntil?: string;
            isActive?: boolean;
        },
    ) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Patient profile not found');

        if (dto.id) {
            const existing = await this.prisma.patientInsurance.findFirst({
                where: { id: dto.id, patientId: patient.id },
            });
            if (!existing) throw new NotFoundException('Insurance record not found');
            return this.prisma.patientInsurance.update({
                where: { id: dto.id },
                data: {
                    providerName: dto.providerName,
                    policyNumber: dto.policyNumber,
                    groupNumber: dto.groupNumber,
                    validUntil: dto.validUntil,
                    isActive: dto.isActive,
                },
            });
        }

        return this.prisma.patientInsurance.create({
            data: {
                patientId: patient.id,
                providerName: dto.providerName,
                policyNumber: dto.policyNumber,
                groupNumber: dto.groupNumber,
                validUntil: dto.validUntil,
                isActive: dto.isActive ?? true,
            },
        });
    }

    async deleteInsurance(userId: number, insuranceId: number) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) throw new NotFoundException('Patient profile not found');

        const existing = await this.prisma.patientInsurance.findFirst({
            where: { id: insuranceId, patientId: patient.id },
        });
        if (!existing) throw new NotFoundException('Insurance record not found');

        await this.prisma.patientInsurance.delete({ where: { id: insuranceId } });
        return { message: 'Insurance deleted successfully' };
    }
}
