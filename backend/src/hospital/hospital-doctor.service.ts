import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

// Helper: mask aadhaar
const maskAadhaar = (n: string | null) =>
    n ? 'XXXX-XXXX-' + n.slice(-4) : 'N/A';

@Injectable()
export class HospitalDoctorService {
    constructor(private readonly prisma: PrismaService) {}

    // ── Helper: resolve hospital from JWT userId ──────────────────────────────
    private async getHospital(userId: number) {
        const h = await this.prisma.hospital.findUnique({ where: { userId } });
        if (!h) throw new NotFoundException('Hospital profile not found');
        return h;
    }

    // ── Register doctor ───────────────────────────────────────────────────────
    async registerDoctor(
        adminUserId: number,
        dto: {
            phone: string;
            aadhaarNumber: string;
            password: string;
            fullName: string;
            specialization?: string;
            department?: string;
            role?: string;
            licenseNumber?: string;
        },
    ) {
        const hospital = await this.getHospital(adminUserId);
        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                return tx.user.create({
                    data: {
                        phone: dto.phone,
                        aadhaarNumber: dto.aadhaarNumber,
                        passwordHash,
                        role: 'DOCTOR',
                        doctor: {
                            create: {
                                hospitalId: hospital.id,
                                fullName: dto.fullName,
                                specialization: dto.specialization,
                                department: dto.department,
                                role: (dto.role as any) ?? 'JUNIOR_DOCTOR',
                                licenseNumber: dto.licenseNumber,
                                status: 'ACTIVE',
                            },
                        },
                    },
                    select: { id: true, doctor: { select: { id: true } } },
                });
            });

            return {
                message: 'Doctor registered successfully',
                doctorId: result.doctor?.id,
                userId: result.id,
            };
        } catch (e: any) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                const target = (e.meta?.target as string[] | undefined)?.join(', ') ?? '';
                if (target.includes('phone')) throw new ConflictException('A user with this phone already exists');
                if (target.includes('aadhaar')) throw new ConflictException('Aadhaar number already registered');
            }
            throw e;
        }
    }

    // ── List doctors ──────────────────────────────────────────────────────────
    async listDoctors(adminUserId: number) {
        const hospital = await this.getHospital(adminUserId);

        const doctors = await this.prisma.doctor.findMany({
            where: { hospitalId: hospital.id },
            include: { user: { select: { phone: true } } },
            orderBy: { id: 'asc' },
        });

        return doctors.map((d) => ({
            id: d.id,
            userId: d.userId,
            fullName: d.fullName,
            specialization: d.specialization,
            department: d.department,
            role: d.role,
            status: d.status,
            licenseNumber: d.licenseNumber,
            licenseStatus: 'VALID',
            daysRemaining: null,
            phone: d.user?.phone,
            workingHoursStart: d.workingHoursStart,
            workingHoursEnd: d.workingHoursEnd,
        }));
    }

    // ── Update doctor ─────────────────────────────────────────────────────────
    async updateDoctor(
        adminUserId: number,
        doctorId: number,
        dto: {
            fullName?: string;
            specialization?: string;
            department?: string;
            role?: string;
            status?: string;
            licenseNumber?: string;
            workingHoursStart?: string;
            workingHoursEnd?: string;
        },
    ) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        await this.prisma.doctor.update({
            where: { id: doctorId },
            data: {
                ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                ...(dto.specialization !== undefined && { specialization: dto.specialization }),
                ...(dto.department !== undefined && { department: dto.department }),
                ...(dto.role !== undefined && { role: dto.role as any }),
                ...(dto.status !== undefined && { status: dto.status as any }),
                ...(dto.licenseNumber !== undefined && { licenseNumber: dto.licenseNumber }),
                ...(dto.workingHoursStart !== undefined && { workingHoursStart: dto.workingHoursStart }),
                ...(dto.workingHoursEnd !== undefined && { workingHoursEnd: dto.workingHoursEnd }),
            },
        });

        return { message: 'Doctor updated successfully' };
    }

    // ── Suspend doctor ────────────────────────────────────────────────────────
    async suspendDoctor(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        await this.prisma.doctor.update({ where: { id: doctorId }, data: { status: 'SUSPENDED' } });
        return { message: 'Doctor suspended successfully' };
    }

    // ── Remove doctor (hard delete) ───────────────────────────────────────────
    async removeDoctor(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        // Cascade set up in schema; just delete doctor (assignments cascade)
        await this.prisma.$transaction([
            this.prisma.doctorPatientAssignment.deleteMany({ where: { doctorId } }),
            this.prisma.doctor.delete({ where: { id: doctorId } }),
        ]);

        return { message: 'Doctor removed successfully' };
    }

    // ── Performance analytics ─────────────────────────────────────────────────
    async getDoctorPerformance(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        const [logs, assignedCount] = await this.prisma.$transaction([
            this.prisma.doctorActivityLog.findMany({ where: { doctorId } }),
            this.prisma.doctorPatientAssignment.count({ where: { doctorId } }),
        ]);

        const counts: Record<string, number> = {};
        for (const log of logs) {
            counts[log.action] = (counts[log.action] || 0) + 1;
        }
        const outOfHoursCount = logs.filter((l) => l.isOutsideWorkHours).length;

        return {
            doctorId,
            fullName: doctor.fullName,
            totalActions: logs.length,
            breakdownByAction: counts,
            outOfHoursAccess: outOfHoursCount,
            assignedPatients: assignedCount,
        };
    }

    // ── Doctor activity log (admin view) ──────────────────────────────────────
    async getDoctorActivity(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        return this.prisma.doctorActivityLog.findMany({
            where: { doctorId },
            include: { patient: { select: { fullName: true, id: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }

    // ── Assign patient to doctor ──────────────────────────────────────────────
    async assignPatient(
        adminUserId: number,
        doctorId: number,
        dto: { patientId: number; isEmergency?: boolean },
    ) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');
        if (doctor.status !== 'ACTIVE') {
            throw new ForbiddenException('Cannot assign patients to a non-active doctor');
        }

        const patient = await this.prisma.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient) throw new NotFoundException('Patient not found');

        // Check if patient already assigned to any doctor
        const existing = await this.prisma.doctorPatientAssignment.findUnique({
            where: { patientId: dto.patientId },
            include: { doctor: { select: { fullName: true, hospital: { select: { hospitalName: true } } } } },
        });

        if (existing) {
            if (existing.doctorId === doctorId) {
                await this.prisma.doctorPatientAssignment.update({
                    where: { patientId: dto.patientId },
                    data: { isEmergency: dto.isEmergency ?? false, assignedBy: hospital.hospitalName },
                });
                return { message: 'Patient assignment updated', assignmentId: existing.id };
            } else {
                throw new ConflictException(
                    `Patient is already assigned to Dr. ${existing.doctor.fullName} (Hospital: ${existing.doctor.hospital?.hospitalName}). Please unassign first.`,
                );
            }
        }

        const assignment = await this.prisma.doctorPatientAssignment.create({
            data: {
                doctorId,
                patientId: dto.patientId,
                isEmergency: dto.isEmergency ?? false,
                assignedBy: hospital.hospitalName,
            },
        });

        return { message: 'Patient assigned successfully', assignmentId: assignment.id };
    }

    // ── Unassign patient ──────────────────────────────────────────────────────
    async unassignPatient(adminUserId: number, doctorId: number, patientId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        const assignment = await this.prisma.doctorPatientAssignment.findFirst({
            where: { doctorId, patientId },
        });
        if (!assignment) throw new NotFoundException('Assignment not found');

        await this.prisma.doctorPatientAssignment.delete({ where: { id: assignment.id } });
        return { message: 'Patient unassigned successfully' };
    }

    // ── Get patients assigned to a doctor ─────────────────────────────────────
    async getDoctorPatients(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.prisma.doctor.findFirst({
            where: { id: doctorId, hospitalId: hospital.id },
        });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        const assignments = await this.prisma.doctorPatientAssignment.findMany({
            where: { doctorId },
            include: {
                patient: {
                    include: { user: { select: { phone: true } } },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });

        return assignments.map((a) => ({
            assignmentId: a.id,
            patientId: a.patientId,
            fullName: a.patient?.fullName,
            gender: a.patient?.gender,
            dateOfBirth: a.patient?.dateOfBirth,
            phone: a.patient?.user?.phone,
            isEmergency: a.isEmergency,
            assignedAt: a.assignedAt,
        }));
    }
}
