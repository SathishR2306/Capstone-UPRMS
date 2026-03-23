import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;
const maskAadhaar = (n: string | null) => (n ? 'XXXX-XXXX-' + n.slice(-4) : 'N/A');

@Injectable()
export class DoctorService {
    constructor(private readonly prisma: PrismaService) {}

    // ── Profile ──────────────────────────────────────────────────────────────
    async getProfile(userId: number) {
        const doctor = await this.prisma.doctor.findUnique({
            where: { userId },
            include: {
                user: { select: { phone: true, aadhaarNumber: true } },
                hospital: { select: { hospitalName: true, id: true } },
            },
        });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        return {
            id: doctor.id,
            userId: doctor.userId,
            fullName: doctor.fullName,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber,
            department: doctor.department,
            role: doctor.role,
            status: doctor.status,
            workingHoursStart: doctor.workingHoursStart,
            workingHoursEnd: doctor.workingHoursEnd,
            phone: doctor.user?.phone,
            maskedAadhaar: maskAadhaar(doctor.user?.aadhaarNumber ?? null),
            hospitalId: doctor.hospitalId,
            hospitalName: doctor.hospital?.hospitalName,
        };
    }

    async updateProfile(
        userId: number,
        dto: { fullName?: string; specialization?: string; licenseNumber?: string; phone?: string },
    ) {
        await this.prisma.$transaction(async (tx) => {
            const updateData: Prisma.DoctorUpdateInput = {};
            if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
            if (dto.specialization !== undefined) updateData.specialization = dto.specialization;
            if (dto.licenseNumber !== undefined) updateData.licenseNumber = dto.licenseNumber;
            if (Object.keys(updateData).length > 0) {
                await tx.doctor.update({ where: { userId }, data: updateData });
            }
            if (dto.phone) {
                await tx.user.update({ where: { id: userId }, data: { phone: dto.phone } });
            }
        });
        return { message: 'Profile updated successfully' };
    }

    async changePassword(
        userId: number,
        dto: { currentPassword: string; newPassword: string },
    ) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const match = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!match) throw new BadRequestException('Current password is incorrect');

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS) },
        });

        return { message: 'Password changed successfully' };
    }

    // ── License status ────────────────────────────────────────────────────────
    async getLicenseStatus(userId: number) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');
        return { status: 'VALID', daysRemaining: null, licenseNumber: doctor.licenseNumber };
    }

    // ── Schedule ──────────────────────────────────────────────────────────────
    async getSchedule(userId: number) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');
        return {
            workingHoursStart: doctor.workingHoursStart,
            workingHoursEnd: doctor.workingHoursEnd,
            leaveDays: (doctor.leaveDays as string[]) || [],
        };
    }

    async updateSchedule(
        userId: number,
        dto: { workingHoursStart?: string; workingHoursEnd?: string; leaveDays?: string[] },
    ) {
        const updateData: Prisma.DoctorUpdateInput = {};
        if (dto.workingHoursStart !== undefined) updateData.workingHoursStart = dto.workingHoursStart;
        if (dto.workingHoursEnd !== undefined) updateData.workingHoursEnd = dto.workingHoursEnd;
        if (dto.leaveDays !== undefined) updateData.leaveDays = dto.leaveDays;
        await this.prisma.doctor.update({ where: { userId }, data: updateData });
        return { message: 'Schedule updated successfully' };
    }

    // ── Assigned Patients ─────────────────────────────────────────────────────
    async getAssignedPatients(userId: number) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        const assignments = await this.prisma.doctorPatientAssignment.findMany({
            where: { doctorId: doctor.id },
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

    // ── Patient Search (suspended doctors blocked) ────────────────────────────
    async searchPatient(query: string, doctorUserId: number) {
        if (!query || query.trim().length < 2) return [];

        const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');
        if (doctor.status === 'SUSPENDED') {
            throw new ForbiddenException('Your account has been suspended. Contact your hospital admin.');
        }

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
                    where: { hospitalId: doctor.hospitalId },
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
                phone: p.user?.phone,
                gender: p.gender,
                dob: p.dateOfBirth,
                maskedAadhaar: maskAadhaar(p.user?.aadhaarNumber ?? null),
                accessStatus: perm ? perm.status : 'NOT_REQUESTED',
                accessGranted: perm?.status === 'APPROVED',
                grantedAt: perm?.grantedAt ?? null,
            };
        });
    }

    // ── Patient Records (consent-gated + activity logged) ─────────────────────
    async getPatientRecords(patientId: number, doctorUserId: number, ip?: string) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');
        if (doctor.status === 'SUSPENDED') {
            throw new ForbiddenException('Your account has been suspended.');
        }

        const permission = await this.prisma.accessPermission.findUnique({
            where: { patientId_hospitalId: { patientId, hospitalId: doctor.hospitalId } },
        });
        if (!permission || permission.status !== 'APPROVED') {
            throw new ForbiddenException('Patient has not granted access to your hospital');
        }

        const outsideHours = this.isOutsideWorkHours(
            doctor.workingHoursStart ?? undefined,
            doctor.workingHoursEnd ?? undefined,
        );
        await this.logActivity(doctor.id, patientId, 'VIEW_RECORDS', undefined, outsideHours, ip);

        return this.prisma.medicalRecord.findMany({
            where: { patientId },
            include: { hospital: { select: { id: true, hospitalName: true } } },
            orderBy: { visitDate: 'asc' },
        });
    }

    // ── Activity Log ─────────────────────────────────────────────────────────
    async getActivityLog(doctorUserId: number) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        return this.prisma.doctorActivityLog.findMany({
            where: { doctorId: doctor.id },
            include: { patient: { select: { fullName: true, id: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    // ── Notifications ─────────────────────────────────────────────────────────
    async getNotifications(doctorUserId: number) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        const notifications: {
            id: string;
            type: 'emergency' | 'assignment' | 'access' | 'activity' | 'info';
            title: string;
            message: string;
            time: Date;
            patientName?: string;
            patientId?: number;
            isEmergency?: boolean;
            assignedBy?: string;
            read: boolean;
        }[] = [];

        const [assignments, recentLogs] = await this.prisma.$transaction([
            this.prisma.doctorPatientAssignment.findMany({
                where: { doctorId: doctor.id },
                include: { patient: { select: { fullName: true, id: true } } },
                orderBy: { assignedAt: 'desc' },
            }),
            this.prisma.doctorActivityLog.findMany({
                where: { doctorId: doctor.id, isOutsideWorkHours: true },
                include: { patient: { select: { fullName: true, id: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }),
        ]);

        for (const a of assignments) {
            const name = a.patient?.fullName ?? `Patient #${a.patientId}`;
            const isNew = (Date.now() - new Date(a.assignedAt).getTime()) / 1000 / 60 / 60 < 24;

            if (a.isEmergency) {
                notifications.push({
                    id: `emergency-${a.id}`,
                    type: 'emergency',
                    title: '🚨 Emergency Patient Assigned',
                    message: `${name} has been assigned to you as an EMERGENCY case by ${a.assignedBy ?? 'your hospital'}.`,
                    time: a.assignedAt,
                    patientName: name,
                    patientId: a.patientId,
                    isEmergency: true,
                    assignedBy: a.assignedBy ?? undefined,
                    read: false,
                });
            } else if (isNew) {
                notifications.push({
                    id: `new-assignment-${a.id}`,
                    type: 'assignment',
                    title: '👤 New Patient Assigned',
                    message: `${name} has been newly assigned to your care by ${a.assignedBy ?? 'your hospital'}.`,
                    time: a.assignedAt,
                    patientName: name,
                    patientId: a.patientId,
                    isEmergency: false,
                    assignedBy: a.assignedBy ?? undefined,
                    read: false,
                });
            } else {
                notifications.push({
                    id: `assignment-${a.id}`,
                    type: 'assignment',
                    title: '👥 Patient Under Your Care',
                    message: `${name} is currently assigned to you by ${a.assignedBy ?? 'your hospital'}.`,
                    time: a.assignedAt,
                    patientName: name,
                    patientId: a.patientId,
                    isEmergency: false,
                    assignedBy: a.assignedBy ?? undefined,
                    read: true,
                });
            }
        }

        for (const log of recentLogs) {
            const pName = log.patient?.fullName ?? `Patient #${log.patientId}`;
            notifications.push({
                id: `activity-${log.id}`,
                type: 'activity',
                title: '⏰ Out-of-Hours Record Access',
                message: `You accessed records for ${pName} outside your working hours. This is logged.`,
                time: log.createdAt,
                patientName: pName,
                patientId: log.patientId ?? undefined,
                read: true,
            });
        }

        notifications.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.time).getTime() - new Date(a.time).getTime();
        });

        return notifications.slice(0, 30);
    }

    // ── Log activity ──────────────────────────────────────────────────────────
    async logActivity(
        doctorId: number,
        patientId: number | null,
        action: string,
        detail?: string,
        isOutsideWorkHours?: boolean,
        ipAddress?: string,
    ) {
        await this.prisma.doctorActivityLog.create({
            data: {
                doctorId,
                patientId: patientId ?? undefined,
                action: action as any,
                detail,
                isOutsideWorkHours: isOutsideWorkHours ?? false,
                ipAddress,
            },
        });
    }

    async logDownload(doctorUserId: number, patientId: number, fileName: string) {
        const doctor = await this.prisma.doctor.findUnique({ where: { userId: doctorUserId } });
        if (!doctor) return;
        const outsideHours = this.isOutsideWorkHours(
            doctor.workingHoursStart ?? undefined,
            doctor.workingHoursEnd ?? undefined,
        );
        await this.logActivity(doctor.id, patientId, 'DOWNLOAD_REPORT', fileName, outsideHours);
        return { message: 'Download logged' };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private isOutsideWorkHours(start?: string, end?: string): boolean {
        if (!start || !end) return false;
        const now = new Date();
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        return nowMins < startMins || nowMins > endMins;
    }
}
