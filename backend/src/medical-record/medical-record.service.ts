import {
    Injectable,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MedicalRecord } from './entities/medical-record.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';
import { Hospital } from '../hospital/entities/hospital.entity';
import { Doctor } from '../doctor/entities/doctor.entity';
import { UploadRecordDto } from './dto/upload-record.dto';

@Injectable()
export class MedicalRecordService {
    constructor(
        @InjectRepository(MedicalRecord)
        private readonly recordRepo: Repository<MedicalRecord>,
        @InjectRepository(AccessPermission)
        private readonly permRepo: Repository<AccessPermission>,
        @InjectRepository(Hospital)
        private readonly hospitalRepo: Repository<Hospital>,
        @InjectRepository(Doctor)
        private readonly doctorRepo: Repository<Doctor>,
    ) { }

    // ── Step 9: Hospital uploads record ──────────────────────────────────────
    async upload(
        dto: UploadRecordDto,
        file: Express.Multer.File | undefined,
        hospitalUserId: number,
    ) {
        // Resolve hospital from JWT userId
        const hospital = await this.hospitalRepo.findOne({
            where: { userId: hospitalUserId },
        });
        if (!hospital) throw new NotFoundException('Hospital profile not found');

        // Access gate: patient must have granted access to this hospital
        const permission = await this.permRepo.findOne({
            where: {
                patientId: Number(dto.patientId),
                hospitalId: hospital.id,
                accessGranted: true,
            },
        });
        if (!permission)
            throw new ForbiddenException(
                'Patient has not granted access to this hospital',
            );

        const reportFileURL = file ? `uploads/${file.filename}` : null;

        const record = this.recordRepo.create({
            patientId: Number(dto.patientId),
            hospitalId: hospital.id,
            diagnosis: dto.diagnosis,
            prescription: dto.prescription,
            visitDate: dto.visitDate,
            reportFileURL,
        });

        await this.recordRepo.save(record);
        return { message: 'Record uploaded successfully', recordId: record.id };
    }

    // ── Step 10: Doctor views records for their linked hospital ──────────────
    async findByDoctor(doctorUserId: number) {
        const doctorProfile = await this.doctorRepo.findOne({
            where: { userId: doctorUserId },
        });
        if (!doctorProfile)
            throw new NotFoundException('Doctor profile not found');

        return this.recordRepo.find({
            where: { hospitalId: doctorProfile.hospitalId },
            relations: ['patient', 'patient.user', 'hospital'],
            order: { createdAt: 'DESC' },
        });
    }

    // ── Hospital views all their own records ─────────────────────────────────
    async findByHospital(hospitalUserId: number) {
        const hospital = await this.hospitalRepo.findOne({
            where: { userId: hospitalUserId },
        });
        if (!hospital) throw new NotFoundException('Hospital profile not found');

        return this.recordRepo.find({
            where: { hospitalId: hospital.id },
            relations: ['patient', 'patient.user'],
            order: { createdAt: 'DESC' },
        });
    }

    // ── View records by patient (hospital or doctor) ─────────────────────────
    async findByPatient(patientId: number, requestingUserId: number, role: string) {
        let checkHospitalId: number;

        if (role === 'HOSPITAL') {
            const hosp = await this.hospitalRepo.findOne({ where: { userId: requestingUserId } });
            if (!hosp) throw new NotFoundException('Hospital not found');
            checkHospitalId = hosp.id;
        } else if (role === 'DOCTOR') {
            const doc = await this.doctorRepo.findOne({ where: { userId: requestingUserId } });
            if (!doc) throw new NotFoundException('Doctor not found');
            checkHospitalId = doc.hospitalId;
        } else {
            throw new ForbiddenException('Invalid role for this endpoint');
        }

        const permission = await this.permRepo.findOne({
            where: { patientId, hospitalId: checkHospitalId, accessGranted: true }
        });

        if (!permission) throw new ForbiddenException('Patient has not granted active access');

        return this.recordRepo.find({
            where: { patientId },
            relations: ['hospital'],
            order: { visitDate: 'ASC' },
        });
    }

    // ── Patient views their own records (using userId from JWT) ──────────────
    async findByPatientUserId(userId: number) {
        const patient = await this.doctorRepo.manager
            .getRepository('patients')
            .findOne({ where: { userId } }) as { id: number } | null;
        if (!patient) return [];

        return this.recordRepo.find({
            where: { patientId: patient.id },
            relations: ['hospital'],
            order: { visitDate: 'ASC' },
        });
    }
}

