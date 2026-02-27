import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { AccessPermission } from './entities/access-permission.entity';

@Injectable()
export class AccessPermissionService {
    constructor(
        @InjectRepository(AccessPermission)
        private readonly repo: Repository<AccessPermission>,
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) { }

    private async getPatientIdFromUser(userId: number): Promise<number> {
        const patient = await this.entityManager.findOne('Patient', { where: { userId } }) as any;
        if (!patient) throw new NotFoundException('Patient profile not found');
        return patient.id;
    }

    private async getHospitalIdFromUser(userId: number): Promise<number> {
        const hospital = await this.entityManager.findOne('Hospital', { where: { userId } }) as any;
        if (!hospital) throw new NotFoundException('Hospital profile not found');
        return hospital.id;
    }

    // ── Grant access ─────────────────────────────────────────────────────────
    async grantAccess(patientUserId: number, hospitalId: number) {
        const patientId = await this.getPatientIdFromUser(patientUserId);
        let record = await this.repo.findOne({ where: { patientId, hospitalId } });

        if (record) {
            record.accessGranted = true;
            record.status = 'APPROVED';
            record.grantedAt = new Date();
        } else {
            record = this.repo.create({ patientId, hospitalId, accessGranted: true, status: 'APPROVED' });
        }

        await this.repo.save(record);
        return { message: 'Access granted', patientId, hospitalId };
    }

    // ── Revoke access ────────────────────────────────────────────────────────
    async revokeAccess(patientUserId: number, hospitalId: number) {
        const patientId = await this.getPatientIdFromUser(patientUserId);
        const record = await this.repo.findOne({ where: { patientId, hospitalId } });
        if (!record) throw new NotFoundException('No permission record found');

        record.accessGranted = false;
        record.status = 'REVOKED';
        await this.repo.save(record);
        return { message: 'Access revoked', patientId, hospitalId };
    }

    // ── Check access ─────────────────────────────────────────────────────────
    async hasAccess(patientId: number, hospitalId: number) {
        const record = await this.repo.findOne({ where: { patientId, hospitalId } });
        return { accessGranted: record?.accessGranted ?? false };
    }

    // ── All permissions for a patient ────────────────────────────────────────
    async myPermissions(patientUserId: number) {
        const patientId = await this.getPatientIdFromUser(patientUserId);
        return this.repo.find({
            where: { patientId },
            relations: ['hospital'],
        });
    }

    // ── Access History (Audit) ───────────────────────────────────────────────
    async getAccessHistory(patientUserId: number) {
        const patientId = await this.getPatientIdFromUser(patientUserId);
        return this.repo.find({
            where: { patientId },
            relations: ['hospital'],
            order: { grantedAt: 'DESC' },
        });
    }

    // ── Hospital Actions ─────────────────────────────────────────────────────
    async requestAccess(patientId: number, hospitalUserId: number) {
        const hospitalId = await this.getHospitalIdFromUser(hospitalUserId);
        let record = await this.repo.findOne({ where: { patientId, hospitalId } });
        if (record) {
            if (record.accessGranted) return { message: 'Already granted' };
            record.status = 'PENDING';
            record.grantedAt = new Date();
        } else {
            record = this.repo.create({ patientId, hospitalId, accessGranted: false, status: 'PENDING' });
        }
        await this.repo.save(record);
        return { message: 'Access requested' };
    }

    async getHospitalRequests(hospitalUserId: number) {
        const hospitalId = await this.getHospitalIdFromUser(hospitalUserId);
        // Needs patient and user relation to show patient details beautifully
        const records = await this.repo.find({
            where: { hospitalId },
            relations: ['patient', 'patient.user'],
            order: { grantedAt: 'DESC' },
        });

        // Map to return clean data (flatten user + patient)
        return records.map(r => ({
            patientId: r.patientId,
            fullName: r.patient.fullName,
            phone: r.patient.user.phone,
            maskedAadhaar: r.patient.user.aadhaar_number ? 'XXXX-XXXX-' + r.patient.user.aadhaar_number.slice(-4) : 'N/A',
            status: r.status,
            grantedAt: r.grantedAt
        }));
    }

    async cancelRequest(hospitalUserId: number, patientId: number) {
        const hospitalId = await this.getHospitalIdFromUser(hospitalUserId);
        const record = await this.repo.findOne({ where: { patientId, hospitalId } });
        if (record && record.status === 'PENDING') {
            await this.repo.remove(record);
        }
        return { message: 'Request cancelled' };
    }

    async rejectAccess(patientUserId: number, hospitalId: number) {
        const patientId = await this.getPatientIdFromUser(patientUserId);
        const record = await this.repo.findOne({ where: { patientId, hospitalId } });
        if (record) {
            record.accessGranted = false;
            record.status = 'REJECTED';
            await this.repo.save(record);
        }
        return { message: 'Request rejected' };
    }
}
