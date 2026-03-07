import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { User } from '../user/entities/user.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';

@Injectable()
export class PatientService {
    constructor(
        @InjectRepository(Patient) private patientRepo: Repository<Patient>,
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
            role: user.role,
        };
    }

    async updateProfile(userId: number, updateDto: { phone?: string }) {
        if (updateDto.phone) {
            await this.userRepo.update({ id: userId }, { phone: updateDto.phone });
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

}
