import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Doctor } from './entities/doctor.entity';
import { DoctorActivityLog } from './entities/doctor-activity-log.entity';
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

    // ── Patient Search ────────────────────────────────────────────────────────
    async searchPatient(query: string, doctorUserId: number) {
        if (!query || query.trim().length < 2) return [];

        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

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
    async getPatientRecords(patientId: number, doctorUserId: number) {
        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
        if (!doctor) throw new NotFoundException('Doctor profile not found');

        const permission = await this.permRepo.findOne({
            where: { patientId, hospitalId: doctor.hospitalId, accessGranted: true },
        });
        if (!permission)
            throw new ForbiddenException('Patient has not granted access to your hospital');

        // Log activity
        await this.logActivity(doctor.id, patientId, 'VIEW_RECORDS');

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

    async logActivity(doctorId: number, patientId: number, action: string, detail?: string) {
        const log = this.activityRepo.create({ doctorId, patientId, action, detail });
        await this.activityRepo.save(log);
    }

    // ── Log download from controller ─────────────────────────────────────────
    async logDownload(doctorUserId: number, patientId: number, fileName: string) {
        const doctor = await this.doctorRepo.findOne({ where: { userId: doctorUserId } });
        if (!doctor) return;
        await this.logActivity(doctor.id, patientId, 'DOWNLOAD_REPORT', fileName);
        return { message: 'Download logged' };
    }
}
