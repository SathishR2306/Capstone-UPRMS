import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Helper
const maskAadhaar = (n: string | null) => (n ? 'XXXX-XXXX-' + n.slice(-4) : 'N/A');

@Injectable()
export class AccessPermissionService {
    constructor(private readonly prisma: PrismaService) {}

    private async getPatientId(userId: number): Promise<number> {
        const p = await this.prisma.patient.findUnique({ where: { userId } });
        if (!p) throw new NotFoundException('Patient profile not found');
        return p.id;
    }

    private async getHospitalId(userId: number): Promise<number> {
        const h = await this.prisma.hospital.findUnique({ where: { userId } });
        if (!h) throw new NotFoundException('Hospital profile not found');
        return h.id;
    }

    // ── Patient grants ────────────────────────────────────────────────────────
    async grantAccess(patientUserId: number, hospitalId: number) {
        const patientId = await this.getPatientId(patientUserId);

        await this.prisma.accessPermission.upsert({
            where: { patientId_hospitalId: { patientId, hospitalId } },
            update: { status: 'APPROVED', grantedAt: new Date() },
            create: { patientId, hospitalId, status: 'APPROVED', grantedAt: new Date() },
        });

        return { message: 'Access granted', patientId, hospitalId };
    }

    // ── Patient revokes ───────────────────────────────────────────────────────
    async revokeAccess(patientUserId: number, hospitalId: number) {
        const patientId = await this.getPatientId(patientUserId);
        const record = await this.prisma.accessPermission.findUnique({
            where: { patientId_hospitalId: { patientId, hospitalId } },
        });
        if (!record) throw new NotFoundException('No permission record found');

        await this.prisma.accessPermission.update({
            where: { patientId_hospitalId: { patientId, hospitalId } },
            data: { status: 'REVOKED' },
        });

        return { message: 'Access revoked', patientId, hospitalId };
    }

    // ── Check ─────────────────────────────────────────────────────────────────
    async hasAccess(patientId: number, hospitalId: number) {
        const record = await this.prisma.accessPermission.findUnique({
            where: { patientId_hospitalId: { patientId, hospitalId } },
        });
        return { accessGranted: record?.status === 'APPROVED' };
    }

    // ── Patient: all their permissions ────────────────────────────────────────
    async myPermissions(patientUserId: number) {
        const patientId = await this.getPatientId(patientUserId);
        return this.prisma.accessPermission.findMany({
            where: { patientId },
            include: { hospital: { select: { id: true, hospitalName: true, slug: true, city: true } } },
            orderBy: { updatedAt: 'desc' },
        });
    }

    // ── Patient: full audit history ───────────────────────────────────────────
    async getAccessHistory(patientUserId: number) {
        const patientId = await this.getPatientId(patientUserId);
        return this.prisma.accessPermission.findMany({
            where: { patientId },
            include: { hospital: { select: { id: true, hospitalName: true, slug: true, city: true } } },
            orderBy: { grantedAt: 'desc' },
        });
    }

    // ── Patient rejects ───────────────────────────────────────────────────────
    async rejectAccess(patientUserId: number, hospitalId: number) {
        const patientId = await this.getPatientId(patientUserId);
        const record = await this.prisma.accessPermission.findUnique({
            where: { patientId_hospitalId: { patientId, hospitalId } },
        });
        if (record) {
            await this.prisma.accessPermission.update({
                where: { patientId_hospitalId: { patientId, hospitalId } },
                data: { status: 'REJECTED' },
            });
        }
        return { message: 'Request rejected' };
    }

    // ── Hospital: request access ──────────────────────────────────────────────
    async requestAccess(patientId: number, hospitalUserId: number) {
        const hospitalId = await this.getHospitalId(hospitalUserId);

        await this.prisma.accessPermission.upsert({
            where: { patientId_hospitalId: { patientId, hospitalId } },
            update: { status: 'PENDING' },
            create: { patientId, hospitalId, status: 'PENDING' },
        });

        return { message: 'Access requested' };
    }

    // ── Hospital: view all requests ───────────────────────────────────────────
    async getHospitalRequests(hospitalUserId: number) {
        const hospitalId = await this.getHospitalId(hospitalUserId);
        const records = await this.prisma.accessPermission.findMany({
            where: { hospitalId },
            include: {
                patient: {
                    include: { user: { select: { phone: true, aadhaarNumber: true } } },
                },
            },
            orderBy: { grantedAt: 'desc' },
        });

        return records.map((r) => ({
            patientId: r.patientId,
            fullName: r.patient.fullName,
            phone: r.patient.user.phone,
            maskedAadhaar: maskAadhaar(r.patient.user.aadhaarNumber),
            status: r.status,
            grantedAt: r.grantedAt,
        }));
    }

    // ── Hospital: cancel pending ──────────────────────────────────────────────
    async cancelRequest(hospitalUserId: number, patientId: number) {
        const hospitalId = await this.getHospitalId(hospitalUserId);
        const record = await this.prisma.accessPermission.findUnique({
            where: { patientId_hospitalId: { patientId, hospitalId } },
        });
        if (record && record.status === 'PENDING') {
            await this.prisma.accessPermission.delete({
                where: { patientId_hospitalId: { patientId, hospitalId } },
            });
        }
        return { message: 'Request cancelled' };
    }
}
