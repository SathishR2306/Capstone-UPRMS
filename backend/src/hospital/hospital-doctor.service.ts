import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Doctor, DoctorRole, DoctorStatus } from '../doctor/entities/doctor.entity';
import { DoctorActivityLog } from '../doctor/entities/doctor-activity-log.entity';
import { DoctorPatientAssignment } from '../doctor/entities/doctor-patient-assignment.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';
import { Hospital } from './entities/hospital.entity';

@Injectable()
export class HospitalDoctorService {
    constructor(
        @InjectRepository(Hospital)
        private readonly hospitalRepo: Repository<Hospital>,
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
    ) { }

    // ── Helper: resolve hospital from JWT userId ──────────────────────────────
    private async getHospital(userId: number): Promise<Hospital> {
        const h = await this.hospitalRepo.findOne({ where: { userId } });
        if (!h) throw new NotFoundException('Hospital profile not found');
        return h;
    }

    // ── Register a new doctor ─────────────────────────────────────────────────
    async registerDoctor(
        adminUserId: number,
        dto: {
            phone: string;
            aadhaarNumber: string;
            password: string;
            fullName: string;
            specialization?: string;
            department?: string;
            role?: DoctorRole;
            licenseNumber?: string;
        },
    ) {
        const hospital = await this.getHospital(adminUserId);

        // Check uniqueness
        const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (existing) throw new ConflictException('A user with this phone already exists');

        const hashed = await bcrypt.hash(dto.password, 10);
        const user = this.userRepo.create({
            phone: dto.phone,
            aadhaar_number: dto.aadhaarNumber,
            password: hashed,
            role: UserRole.DOCTOR,
        });
        const savedUser = await this.userRepo.save(user);

        const doctor = this.doctorRepo.create({
            userId: savedUser.id,
            hospitalId: hospital.id,
            fullName: dto.fullName,
            specialization: dto.specialization,
            department: dto.department,
            role: dto.role ?? DoctorRole.JUNIOR_DOCTOR,
            licenseNumber: dto.licenseNumber,
            status: DoctorStatus.ACTIVE,
        });
        const savedDoctor = await this.doctorRepo.save(doctor);

        return {
            message: 'Doctor registered successfully',
            doctorId: savedDoctor.id,
            userId: savedUser.id,
        };
    }

    // ── List all doctors in this hospital ─────────────────────────────────────
    async listDoctors(adminUserId: number) {
        const hospital = await this.getHospital(adminUserId);

        const doctors = await this.doctorRepo.find({
            where: { hospitalId: hospital.id },
            relations: ['user'],
            order: { id: 'ASC' },
        });

        return doctors.map(d => {
            let licenseStatus = 'VALID';
            let daysRemaining: number | null = null;

            return {
                id: d.id,
                userId: d.userId,
                fullName: d.fullName,
                specialization: d.specialization,
                department: d.department,
                role: d.role,
                status: d.status,
                licenseNumber: d.licenseNumber,
                licenseStatus,
                daysRemaining,
                phone: d.user?.phone,
                workingHoursStart: d.workingHoursStart,
                workingHoursEnd: d.workingHoursEnd,
            };
        });
    }

    // ── Update a doctor (role, department, status, schedule) ──────────────────
    async updateDoctor(
        adminUserId: number,
        doctorId: number,
        dto: {
            fullName?: string;
            specialization?: string;
            department?: string;
            role?: DoctorRole;
            status?: DoctorStatus;
            licenseNumber?: string;
            workingHoursStart?: string;
            workingHoursEnd?: string;
        },
    ) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        Object.assign(doctor, {
            ...(dto.fullName !== undefined && { fullName: dto.fullName }),
            ...(dto.specialization !== undefined && { specialization: dto.specialization }),
            ...(dto.department !== undefined && { department: dto.department }),
            ...(dto.role !== undefined && { role: dto.role }),
            ...(dto.status !== undefined && { status: dto.status }),
            ...(dto.licenseNumber !== undefined && { licenseNumber: dto.licenseNumber }),
            ...(dto.workingHoursStart !== undefined && { workingHoursStart: dto.workingHoursStart }),
            ...(dto.workingHoursEnd !== undefined && { workingHoursEnd: dto.workingHoursEnd }),
        });

        await this.doctorRepo.save(doctor);
        return { message: 'Doctor updated successfully' };
    }

    // ── Suspend a doctor ──────────────────────────────────────────────────────
    async suspendDoctor(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        doctor.status = DoctorStatus.SUSPENDED;
        await this.doctorRepo.save(doctor);
        return { message: 'Doctor suspended successfully' };
    }

    // ── Remove (hard delete) a doctor ─────────────────────────────────────────
    async removeDoctor(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        // Remove all assignments first to avoid FK violation
        await this.assignmentRepo.delete({ doctorId: doctor.id });
        await this.doctorRepo.remove(doctor);
        return { message: 'Doctor removed successfully' };
    }

    // ── Doctor performance analytics ──────────────────────────────────────────
    async getDoctorPerformance(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        const logs = await this.activityRepo.find({ where: { doctorId: doctor.id } });

        const counts: Record<string, number> = {};
        for (const log of logs) {
            counts[log.action] = (counts[log.action] || 0) + 1;
        }

        const outOfHoursCount = logs.filter(l => l.isOutsideWorkHours).length;

        // Assigned patients count
        const assignedCount = await this.assignmentRepo.count({ where: { doctorId: doctor.id } });

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
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        return this.activityRepo.find({
            where: { doctorId: doctor.id },
            relations: ['patient'],
            order: { timestamp: 'DESC' },
            take: 200,
        });
    }

    // ── Assign a patient to a doctor ──────────────────────────────────────────
    async assignPatient(
        adminUserId: number,
        doctorId: number,
        dto: { patientId: number; isEmergency?: boolean },
    ) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');
        if (doctor.status !== DoctorStatus.ACTIVE) {
            throw new ForbiddenException('Cannot assign patients to a non-active doctor');
        }

        const patient = await this.patientRepo.findOne({ where: { id: dto.patientId } });
        if (!patient) throw new NotFoundException('Patient not found');

        // Check if patient is already assigned to ANY doctor
        const existingAssignment = await this.assignmentRepo.findOne({
            where: { patientId: dto.patientId },
            relations: ['doctor', 'doctor.hospital']
        });

        if (existingAssignment) {
            if (existingAssignment.doctorId === doctor.id) {
                // Same doctor: just update flags
                existingAssignment.isEmergency = dto.isEmergency ?? false;
                existingAssignment.assignedBy = hospital.hospitalName;
                await this.assignmentRepo.save(existingAssignment);
                return { message: 'Patient assignment updated', assignmentId: existingAssignment.id };
            } else {
                // Different doctor: throw conflict
                const otherDoc = existingAssignment.doctor;
                throw new ConflictException(
                    `Patient is already assigned to Dr. ${otherDoc.fullName} (Hospital: ${otherDoc.hospital?.hospitalName}). Please unassign them first.`
                );
            }
        }

        const assignment = this.assignmentRepo.create({
            doctorId: doctor.id,
            patientId: dto.patientId,
            isEmergency: dto.isEmergency ?? false,
            assignedBy: hospital.hospitalName,
        });
        const saved = await this.assignmentRepo.save(assignment);
        return { message: 'Patient assigned successfully', assignmentId: saved.id };
    }

    // ── Unassign a patient from a doctor ──────────────────────────────────────
    async unassignPatient(
        adminUserId: number,
        doctorId: number,
        patientId: number
    ) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

        const assignment = await this.assignmentRepo.findOne({
            where: { doctorId, patientId }
        });
        if (!assignment) throw new NotFoundException('Assignment not found');

        await this.assignmentRepo.remove(assignment);
        return { message: 'Patient unassigned successfully' };
    }

    // ── Get patients assigned to a doctor ─────────────────────────────────────
    async getDoctorPatients(adminUserId: number, doctorId: number) {
        const hospital = await this.getHospital(adminUserId);
        const doctor = await this.doctorRepo.findOne({ where: { id: doctorId, hospitalId: hospital.id } });
        if (!doctor) throw new NotFoundException('Doctor not found in your hospital');

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
}
