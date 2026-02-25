import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Hospital } from './entities/hospital.entity';
import { User } from '../user/entities/user.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';

@Injectable()
export class HospitalService {
    constructor(
        @InjectRepository(Hospital) private hospitalRepo: Repository<Hospital>,
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) { }

    async findAll() {
        return this.hospitalRepo.find({
            select: ['id', 'hospitalName', 'registrationNumber'],
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
}
