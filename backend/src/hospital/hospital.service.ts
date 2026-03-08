import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Hospital } from './entities/hospital.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { Doctor } from '../doctor/entities/doctor.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HospitalService {
    constructor(
        @InjectRepository(Hospital) private hospitalRepo: Repository<Hospital>,
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) { }

    async findAll() {
        return this.hospitalRepo.find({
            select: ['id', 'hospitalName', 'registrationNumber', 'slug'],
            order: { hospitalName: 'ASC' },
        });
    }

    async getProfile(userId: number) {
        const hospital = await this.hospitalRepo.findOne({
            where: { userId },
            relations: ['user']
        });
        if (!hospital) throw new NotFoundException('Hospital not found');

        return {
            id: hospital.id,
            hospitalName: hospital.hospitalName,
            registrationNumber: hospital.registrationNumber,
            slug: hospital.slug,
            phone: hospital.user.phone,
        };
    }

    async updateProfile(userId: number, updateDto: { phone?: string }) {
        if (updateDto.phone) {
            await this.entityManager.update(User, { id: userId }, { phone: updateDto.phone });
        }
        return { message: 'Profile updated successfully' };
    }

    async getDashboardStats(userId: number) {
        const hospital = await this.hospitalRepo.findOne({ where: { userId } });
        if (!hospital) throw new NotFoundException('Hospital not found');

        const hospitalId = hospital.id;

        const totalPatients = await this.entityManager.count(AccessPermission, {
            where: { hospitalId, accessGranted: true }
        });

        const totalRecords = await this.entityManager.count(MedicalRecord, {
            where: { hospitalId }
        });

        const recentUploads = await this.entityManager.find(MedicalRecord, {
            where: { hospitalId },
            relations: ['patient', 'patient.user'],
            order: { createdAt: 'DESC' },
            take: 5
        });

        const activity = recentUploads.map(r => ({
            id: r.id,
            type: 'UPLOAD',
            patientName: r.patient.fullName,
            date: r.createdAt,
            diagnosis: r.diagnosis
        }));

        return {
            totalPatients,
            totalRecords,
            recentActivity: activity
        };
    }

    // ── Doctor Registration ──────────────────────────────────────────────────
    async registerDoctor(hospitalUserId: number, dto: any) {
        // 1. Find the hospital to get its true ID
        const hospital = await this.hospitalRepo.findOne({ where: { userId: hospitalUserId } });
        if (!hospital) throw new NotFoundException('Hospital not found');

        // 2. Check if phone already exists
        const existing = await this.entityManager.findOne(User, { where: { phone: dto.phone } });
        if (existing) throw new NotFoundException('Phone number is already registered');

        // 3. Hash temporary password
        const hashed = await bcrypt.hash(dto.password, 10);

        // 4. Create User
        const user = this.entityManager.create(User, {
            phone: dto.phone,
            aadhaar_number: dto.aadhaarNumber,
            password: hashed,
            role: UserRole.DOCTOR,
        });

        let savedUser;
        try {
            savedUser = await this.entityManager.save(User, user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new NotFoundException('Aadhaar number already registered');
            }
            throw error;
        }

        // 5. Create Doctor Profile
        const doctor = this.entityManager.create(Doctor, {
            userId: savedUser.id,
            hospitalId: hospital.id,
            fullName: dto.fullName,
            specialization: dto.specialization,
            department: dto.department,
            role: dto.role, // JUNIOR_DOCTOR, etc.
            licenseNumber: dto.licenseNumber,
        });

        await this.entityManager.save(Doctor, doctor);

        return { message: 'Doctor registered successfully', doctorId: doctor.id };
    }

    // ── Patient Registration (by hospital admin) ──────────────────────────────
    async registerPatient(hospitalUserId: number, dto: {
        fullName: string;
        phone: string;
        aadhaarNumber: string;
        dateOfBirth: string;
        gender: string;
    }) {
        const hospital = await this.hospitalRepo.findOne({ where: { userId: hospitalUserId } });
        if (!hospital) throw new NotFoundException('Hospital not found');

        const existingPhone = await this.entityManager.findOne(User, { where: { phone: dto.phone } });
        if (existingPhone) throw new ConflictException('Phone number is already registered');

        // Auto-generate a readable temp password: first 4 letters of name + @ + last 4 of phone
        const namePart = dto.fullName.replace(/\s+/g, '').slice(0, 4).toLowerCase();
        const phonePart = dto.phone.slice(-4);
        const tempPassword = `${namePart}@${phonePart}`;
        const hashed = await bcrypt.hash(tempPassword, 10);

        const user = this.entityManager.create(User, {
            phone: dto.phone,
            aadhaar_number: dto.aadhaarNumber,
            password: hashed,
            role: UserRole.PATIENT,
        });

        let savedUser;
        try {
            savedUser = await this.entityManager.save(User, user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new ConflictException('Aadhaar number already registered');
            }
            throw error;
        }

        const patient = this.entityManager.create(Patient, {
            userId: savedUser.id,
            fullName: dto.fullName,
            dateOfBirth: dto.dateOfBirth,
            gender: dto.gender,
        });
        const savedPatient = await this.entityManager.save(Patient, patient);

        return {
            message: 'Patient registered successfully',
            patientId: savedPatient.id,
            userId: savedUser.id,
            fullName: dto.fullName,
            phone: dto.phone,
            tempPassword,
        };
    }
}
