import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Doctor, DoctorStatus } from './entities/doctor.entity';
import { DoctorActivityLog } from './entities/doctor-activity-log.entity';
import { DoctorPatientAssignment } from './entities/doctor-patient-assignment.entity';
import { User } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';
import { Hospital } from '../hospital/entities/hospital.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';

@Injectable()
export class DoctorService {
    constructor(
        @InjectRepository(Doctor)
        private readonly doctorRepo: Repository<Doctor>,
        @InjectRepository(DoctorActivityLog)
        private readonly activityRepo: Repository<DoctorActivityLog>,
        @InjectRepository(DoctorPatientAssignment)
        private readonly assignmentRepo: Repository<DoctorPatientAssignment>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectRepository(Patient)
        private readonly patientRepo: Repository<Patient>,
        @InjectRepository(Hospital)
        private readonly hospitalRepo: Repository<Hospital>,
        @InjectRepository(AccessPermission)
        private readonly permRepo: Repository<AccessPermission>,
        @InjectRepository(MedicalRecord)
        private readonly recordRepo: Repository<MedicalRecord>,
    ) { }

    // ── Profile ──────────────────────────────────────────────────────────────
    async getProfile(userId: number) {
        const doctor = await this.doctorRepo.findOne({
            where: { userId },
            relations: ['user', 'hospital'],
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
            maskedAadhaar: doctor.user?.aadhaar_number
                ? 'XXXX-XXXX-' + doctor.user.aadhaar_number.slice(-4)
                : 'N/A',
            hospitalId: doctor.hospitalId,
            hospitalName: doctor.hospital?.hospitalName,
        };
    }

    async updateProfile(
        userId: number,
        dto: { fullName?: string; specialization?: string; licenseNumber?: string; phone?: string },
    ) {
        const doctor = await this.doctorRepo.findOne({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        if (dto.fullName !== undefined) doctor.fullName = dto.fullName;
        if (dto.specialization !== undefined) doctor.specialization = dto.specialization;
        if (dto.licenseNumber !== undefined) doctor.licenseNumber = dto.licenseNumber;
        await this.doctorRepo.save(doctor);

        if (dto.phone) {
            await this.userRepo.update({ id: userId }, { phone: dto.phone });
        }

        return { message: 'Profile updated successfully' };
    }

    async changePassword(
        userId: number,
        dto: { currentPassword: string; newPassword: string },
    ) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const match = await bcrypt.compare(dto.currentPassword, user.password);
        if (!match) throw new BadRequestException('Current password is incorrect');

        user.password = await bcrypt.hash(dto.newPassword, 10);
        await this.userRepo.save(user);
        return { message: 'Password changed successfully' };
    }

    // ── License Status ────────────────────────────────────────────────────────
    async getLicenseStatus(userId: number) {
        const doctor = await this.doctorRepo.findOne({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        return {
            status: 'VALID',
            daysRemaining: null,
            licenseNumber: doctor.licenseNumber,
        };
    }

    // ── Schedule ──────────────────────────────────────────────────────────────
    async getSchedule(userId: number) {
        const doctor = await this.doctorRepo.findOne({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        return {
            workingHoursStart: doctor.workingHoursStart,
            workingHoursEnd: doctor.workingHoursEnd,
            leaveDays: doctor.leaveDays || [],
        };
    }

    async updateSchedule(
        userId: number,
        dto: { workingHoursStart?: string; workingHoursEnd?: string; leaveDays?: string[] },
    ) {
        const doctor = await this.doctorRepo.findOne({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        if (dto.workingHoursStart !== undefined) doctor.workingHoursStart = dto.workingHoursStart;
        if (dto.workingHoursEnd !== undefined) doctor.workingHoursEnd = dto.workingHoursEnd;
        if (dto.leaveDays !== undefined) doctor.leaveDays = dto.leaveDays;

        await this.doctorRepo.save(doctor);
        return { message: 'Schedule updated successfully' };
    }

    // ── Assigned Patients ─────────────────────────────────────────────────────
    async getAssignedPatients(userId: number) {
        const doctor = await this.doctorRepo.findOne({ where: { userId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        const assignments = await this.assignmentRepo.find({
            where: { doctorId: doctor.id },
            relations: ['patient', 'patient.user'],
            order: { assignedAt: 'DESC' },
        });

        return assignments.map(a => ({
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

    // ── Patient Search ────────────────────────────────────────────────────────
    async searchPatient(query: string, doctorUserId: number) {
        if (!query || query.trim().length < 2) return [];

        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        // Check if suspended
        if (doctor.status === DoctorStatus.SUSPENDED) {
            throw new ForbiddenException('Your account has been suspended. Please contact your hospital admin.');
        }

        const patients = await this.patientRepo
            .createQueryBuilder('patient')
            .leftJoinAndSelect('patient.user', 'user')
            .where('CAST(patient.id AS TEXT) = :q', { q: query.trim() })
            .orWhere('user.phone ILIKE :qlike', { qlike: `%${query}%` })
            .orWhere('user.aadhaar_number ILIKE :qlike', { qlike: `%${query}%` })
            .orWhere('patient.fullName ILIKE :qlike', { qlike: `%${query}%` })
            .take(20)
            .getMany();

        const result = await Promise.all(
            patients.map(async (p) => {
                const permission = await this.permRepo.findOne({
                    where: { patientId: p.id, hospitalId: doctor.hospitalId },
                });
                return {
                    id: p.id,
                    fullName: p.fullName,
                    phone: p.user?.phone,
                    gender: p.gender,
                    dob: p.dateOfBirth,
                    maskedAadhaar: p.user?.aadhaar_number
                        ? 'XXXX-XXXX-' + p.user.aadhaar_number.slice(-4)
                        : 'N/A',
                    accessStatus: permission ? permission.status : 'NOT_REQUESTED',
                    accessGranted: permission ? permission.accessGranted : false,
                    grantedAt: permission?.grantedAt ?? null,
                };
            }),
        );

        return result;
    }

    // ── Patient Records (consent-gated) ───────────────────────────────────────
    async getPatientRecords(patientId: number, doctorUserId: number, ip?: string) {
        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        if (doctor.status === DoctorStatus.SUSPENDED) {
            throw new ForbiddenException('Your account has been suspended.');
        }

        const permission = await this.permRepo.findOne({
            where: { patientId, hospitalId: doctor.hospitalId, accessGranted: true },
        });
        if (!permission)
            throw new ForbiddenException('Patient has not granted access to your hospital');

        // Detect out-of-hours
        const outsideHours = this.isOutsideWorkHours(doctor.workingHoursStart, doctor.workingHoursEnd);
        await this.logActivity(doctor.id, patientId, 'VIEW_RECORDS', undefined, outsideHours, ip);

        return this.recordRepo.find({
            where: { patientId },
            relations: ['hospital'],
            order: { visitDate: 'ASC' },
        });
    }

    // ── Activity Log ─────────────────────────────────────────────────────────
    async getActivityLog(doctorUserId: number) {
        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        return this.activityRepo.find({
            where: { doctorId: doctor.id },
            relations: ['patient'],
            order: { timestamp: 'DESC' },
            take: 100,
        });
    }

    // ── Notifications (derived from real assignment + activity data) ──────────
    async getNotifications(doctorUserId: number) {
        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
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

        // 1. All assigned patients → generate notifications
        const assignments = await this.assignmentRepo.find({
            where: { doctorId: doctor.id },
            relations: ['patient'],
            order: { assignedAt: 'DESC' },
        });

        for (const a of assignments) {
            const name = a.patient?.fullName ?? `Patient #${a.patientId}`;
            const isNew = ((Date.now() - new Date(a.assignedAt).getTime()) / 1000 / 60 / 60) < 24;

            if (a.isEmergency) {
                notifications.push({
                    id: `emergency-${a.id}`,
                    type: 'emergency',
                    title: '🚨 Emergency Patient Assigned',
                    message: `${name} has been assigned to you as an EMERGENCY case by ${a.assignedBy ?? 'your hospital'}. Immediate attention required.`,
                    time: a.assignedAt,
                    patientName: name,
                    patientId: a.patientId,
                    isEmergency: true,
                    assignedBy: a.assignedBy,
                    read: false,
                });
            } else if (isNew) {
                notifications.push({
                    id: `new-assignment-${a.id}`,
                    type: 'assignment',
                    title: '👤 New Patient Assigned',
                    message: `${name} has been newly assigned to your care by ${a.assignedBy ?? 'your hospital'}. Please review their medical history.`,
                    time: a.assignedAt,
                    patientName: name,
                    patientId: a.patientId,
                    isEmergency: false,
                    assignedBy: a.assignedBy,
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
                    assignedBy: a.assignedBy,
                    read: true,
                });
            }
        }

        // 2. Recent out-of-hours access activity
        const recentLogs = await this.activityRepo.find({
            where: { doctorId: doctor.id, isOutsideWorkHours: true },
            relations: ['patient'],
            order: { timestamp: 'DESC' },
            take: 5,
        });

        for (const log of recentLogs) {
            const pName = log.patient?.fullName ?? `Patient #${log.patientId}`;
            notifications.push({
                id: `activity-${log.id}`,
                type: 'activity',
                title: '⏰ Out-of-Hours Record Access',
                message: `You accessed records for ${pName} outside your scheduled working hours. This has been logged in the audit trail.`,
                time: log.timestamp,
                patientName: pName,
                patientId: log.patientId,
                read: true,
            });
        }

        // Sort: unread first, then newest first
        notifications.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return new Date(b.time).getTime() - new Date(a.time).getTime();
        });

        return notifications.slice(0, 30);
    }

    async logActivity(
        doctorId: number,
        patientId: number | null,
        action: string,
        detail?: string,
        isOutsideWorkHours?: boolean,
        ipAddress?: string,
    ) {
        const log = this.activityRepo.create({
            doctorId,
            patientId: patientId ?? undefined,
            action,
            detail,
            isOutsideWorkHours: isOutsideWorkHours ?? false,
            ipAddress,
        });
        await this.activityRepo.save(log);
    }

    async logDownload(doctorUserId: number, patientId: number, fileName: string) {
        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
        if (!doctor) return;
        const outsideHours = this.isOutsideWorkHours(doctor.workingHoursStart, doctor.workingHoursEnd);
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
