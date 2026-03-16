import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { PatientInsurance } from './entities/patient-insurance.entity';
import { User } from '../user/entities/user.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';

@Injectable()
export class PatientService {
    constructor(
        @InjectRepository(Patient) private patientRepo: Repository<Patient>,
        @InjectRepository(PatientInsurance) private insuranceRepo: Repository<PatientInsurance>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) { }

    async getProfile(userId: number) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const patient = await this.patientRepo.findOne({ where: { userId } });
        if (!patient) throw new NotFoundException('Patient profile not found');

        // Mask Aadhaar: show only last 4 digits
        const maskedAadhaar = user.aadhaar_number
            ? 'XXXX-XXXX-' + user.aadhaar_number.slice(-4)
            : 'N/A';

        return {
            id: patient.id,
            userId: user.id,
            fullName: patient.fullName,
            phone: user.phone,
            maskedAadhaar,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            emergencyContactName: patient.emergencyContactName,
            emergencyContactPhone: patient.emergencyContactPhone,
            emergencyContactRelation: patient.emergencyContactRelation,
            role: user.role,
        };
    }

    async updateProfile(userId: number, updateDto: { phone?: string, bloodGroup?: string, emergencyContactName?: string, emergencyContactPhone?: string, emergencyContactRelation?: string }) {
        if (updateDto.phone) {
            await this.userRepo.update({ id: userId }, { phone: updateDto.phone });
        }
        
        const patient = await this.patientRepo.findOne({ where: { userId } });
        if (patient) {
            if (updateDto.bloodGroup !== undefined) patient.bloodGroup = updateDto.bloodGroup;
            if (updateDto.emergencyContactName !== undefined) patient.emergencyContactName = updateDto.emergencyContactName;
            if (updateDto.emergencyContactPhone !== undefined) patient.emergencyContactPhone = updateDto.emergencyContactPhone;
            if (updateDto.emergencyContactRelation !== undefined) patient.emergencyContactRelation = updateDto.emergencyContactRelation;
            await this.patientRepo.save(patient);
        }

        return { message: 'Profile updated successfully' };
    }

    async searchPatients(query: string, hospitalUserId: number, onlyLinked: boolean = false) {
        // If not searching for a specific patient but just want the list (e.g. for onlyLinked), 
        // we might allow empty query if onlyLinked is true.
        if (!onlyLinked && (!query || query.trim().length < 2)) return [];

        const hospital = await this.entityManager.findOne('Hospital', { where: { userId: hospitalUserId } }) as any;
        if (!hospital) throw new NotFoundException('Hospital profile not found');

        const hospitalId = hospital.id;

        const qb = this.patientRepo.createQueryBuilder('patient')
            .leftJoinAndSelect('patient.user', 'user');

        if (onlyLinked) {
            qb.innerJoin(AccessPermission, 'perm', 'perm.patientId = patient.id')
              .where('perm.hospitalId = :hospitalId', { hospitalId })
              .andWhere('perm.accessGranted = :granted', { granted: true });
            
            if (query && query.trim().length >= 2) {
                qb.andWhere('(patient.fullName ILIKE :query OR user.phone ILIKE :query OR user.aadhaar_number ILIKE :query)', { query: `%${query}%` });
            }
        } else {
            qb.where('patient.fullName ILIKE :query', { query: `%${query}%` })
              .orWhere('user.phone ILIKE :query', { query: `%${query}%` })
              .orWhere('user.aadhaar_number ILIKE :query', { query: `%${query}%` });
        }

        const patients = await qb.take(20).getMany();

        const result = await Promise.all(patients.map(async (p) => {
            const permission = await this.entityManager.findOne(AccessPermission, {
                where: { patientId: p.id, hospitalId }
            });

            return {
                id: p.id,
                fullName: p.fullName,
                phone: p.user.phone,
                maskedAadhaar: p.user.aadhaar_number ? 'XXXX-XXXX-' + p.user.aadhaar_number.slice(-4) : 'N/A',
                gender: p.gender,
                dob: p.dateOfBirth,
                accessStatus: permission ? permission.status : 'NOT_REQUESTED',
                accessGranted: permission ? permission.accessGranted : false,
            };
        }));

        return result;
    }

    async findByRegNumber(query: string, hospitalUserId: number) {
        if (!query || query.trim().length === 0) return [];

        const hospital = await this.entityManager.findOne('Hospital', { where: { userId: hospitalUserId } }) as any;
        if (!hospital) throw new NotFoundException('Hospital profile not found');
        const hospitalId = hospital.id;

        // Search by Aadhaar number
        const patients = await this.patientRepo.createQueryBuilder('patient')
            .leftJoinAndSelect('patient.user', 'user')
            .where('user.aadhaar_number = :query', { query: query.trim() })
            .getMany();

        const result = await Promise.all(patients.map(async (p) => {
            const permission = await this.entityManager.findOne(AccessPermission, {
                where: { patientId: p.id, hospitalId }
            });

            return {
                id: p.id,
                userId: p.user.id,
                fullName: p.fullName,
                phone: p.user.phone,
                // Mask Aadhaar for search result security
                maskedAadhaar: p.user.aadhaar_number ? 'XXXX-XXXX-' + p.user.aadhaar_number.slice(-4) : 'N/A',
                gender: p.gender,
                dob: p.dateOfBirth,
                accessStatus: permission ? permission.status : 'NOT_REQUESTED',
                accessGranted: permission ? permission.accessGranted : false,
            };
        }));

        return result;
    }

    async getInsurance(userId: number) {
        const patient = await this.patientRepo.findOne({ where: { userId } });
        if (!patient) throw new NotFoundException('Patient profile not found');

        const insurance = await this.insuranceRepo.find({ where: { patientId: patient.id } });
        return insurance;
    }

    async addOrUpdateInsurance(userId: number, dto: { id?: number, providerName: string, policyNumber: string, groupNumber: string, validUntil?: string, isActive?: boolean }) {
        const patient = await this.patientRepo.findOne({ where: { userId } });
        if (!patient) throw new NotFoundException('Patient profile not found');

        if (dto.id) {
            const existing = await this.insuranceRepo.findOne({ where: { id: dto.id, patientId: patient.id } });
            if (!existing) throw new NotFoundException('Insurance record not found');
            Object.assign(existing, dto);
            return this.insuranceRepo.save(existing);
        } else {
            const newInsurance = this.insuranceRepo.create({
                ...dto,
                patientId: patient.id
            });
            return this.insuranceRepo.save(newInsurance);
        }
    }

    async deleteInsurance(userId: number, insuranceId: number) {
        const patient = await this.patientRepo.findOne({ where: { userId } });
        if (!patient) throw new NotFoundException('Patient profile not found');

        const existing = await this.insuranceRepo.findOne({ where: { id: insuranceId, patientId: patient.id } });
        if (!existing) throw new NotFoundException('Insurance record not found');

        await this.insuranceRepo.remove(existing);
        return { message: 'Insurance deleted successfully' };
    }
}
