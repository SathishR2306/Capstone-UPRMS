import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadRecordDto } from './dto/upload-record.dto';
import * as path from 'path';

@Injectable()
export class MedicalRecordService {
    constructor(private readonly prisma: PrismaService) {}

    // ── Hospital uploads record (access-gated) ────────────────────────────────
    async upload(
        dto: UploadRecordDto,
        file: Express.Multer.File | undefined,
        hospitalUserId: number,
    ) {
        const hospital = await this.prisma.hospital.findUnique({ where: { userId: hospitalUserId } });
        if (!hospital) throw new NotFoundException('Hospital profile not found');

        const patientId = Number(dto.patientId);

        // Access gate
        const permission = await this.prisma.accessPermission.findUnique({
            where: {
                patientId_hospitalId: { patientId, hospitalId: hospital.id },
            },
        });
        if (!permission || permission.status !== 'APPROVED') {
            throw new ForbiddenException('Patient has not granted access to this hospital');
        }

        const reportFileUrl = file ? `uploads/${file.filename}` : null;

        const record = await this.prisma.medicalRecord.create({
            data: {
                patientId,
                hospitalId: hospital.id,
                diagnosis: dto.diagnosis,
                prescription: dto.prescription,
                visitDate: dto.visitDate,
                reportFileUrl,
            },
        });

        return { message: 'Record uploaded successfully', recordId: record.id };
    }

    // ── Hospital: all their uploaded records ──────────────────────────────────
    async findByHospital(hospitalUserId: number) {
        const hospital = await this.prisma.hospital.findUnique({ where: { userId: hospitalUserId } });
        if (!hospital) throw new NotFoundException('Hospital profile not found');

        return this.prisma.medicalRecord.findMany({
            where: { hospitalId: hospital.id },
            include: { patient: { select: { fullName: true, id: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // ── View records for specific patient (HOSPITAL or DOCTOR, consent-gated) ──
    async findByPatient(patientId: number, requestingUserId: number, role: string) {
        let checkHospitalId: number;

        if (role === 'HOSPITAL') {
            const hosp = await this.prisma.hospital.findUnique({ where: { userId: requestingUserId } });
            if (!hosp) throw new NotFoundException('Hospital not found');
            checkHospitalId = hosp.id;
        } else if (role === 'DOCTOR') {
            const doc = await this.prisma.doctor.findUnique({ where: { userId: requestingUserId } });
            if (!doc) throw new NotFoundException('Doctor not found');
            checkHospitalId = doc.hospitalId;
        } else {
            throw new ForbiddenException('Invalid role for this endpoint');
        }

        const permission = await this.prisma.accessPermission.findUnique({
            where: { patientId_hospitalId: { patientId, hospitalId: checkHospitalId } },
        });
        if (!permission || permission.status !== 'APPROVED') {
            throw new ForbiddenException('Patient has not granted active access');
        }

        return this.prisma.medicalRecord.findMany({
            where: { patientId },
            include: { hospital: { select: { id: true, hospitalName: true } } },
            orderBy: { visitDate: 'asc' },
        });
    }

    // ── Patient: own records ──────────────────────────────────────────────────
    async findByPatientUserId(userId: number) {
        const patient = await this.prisma.patient.findUnique({ where: { userId } });
        if (!patient) return [];

        return this.prisma.medicalRecord.findMany({
            where: { patientId: patient.id },
            include: { hospital: { select: { id: true, hospitalName: true } } },
            orderBy: { visitDate: 'asc' },
        });
    }

    // ── Secure file download (path traversal protection) ─────────────────────
    sanitizeFilename(filename: string): string {
        // Strip path separators and any ".." segments
        const base = path.basename(filename);
        if (base !== filename || base.includes('..') || base.startsWith('/')) {
            throw new BadRequestException('Invalid filename');
        }
        return base;
    }
}
