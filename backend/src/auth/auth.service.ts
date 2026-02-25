import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { User, UserRole } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';
import { Hospital } from '../hospital/entities/hospital.entity';
import { Doctor } from '../doctor/entities/doctor.entity';

import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Patient) private patientRepo: Repository<Patient>,
        @InjectRepository(Hospital) private hospitalRepo: Repository<Hospital>,
        @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
        private jwtService: JwtService,
    ) { }

    // ── Patient Registration ─────────────────────────────────────────────────
    async registerPatient(dto: RegisterPatientDto) {
        const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (existing) throw new BadRequestException('Phone already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            phone: dto.phone,
            aadhaar_number: dto.aadhaar_number,
            password: hashed,
            role: UserRole.PATIENT,
        });
        let savedUser;
        try {
            savedUser = await this.userRepo.save(user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new BadRequestException('Aadhaar number already registered');
            }
            throw error;
        }

        const patient = this.patientRepo.create({
            userId: savedUser.id,
            fullName: dto.fullName,
            dateOfBirth: dto.dateOfBirth,
            gender: dto.gender,
        });
        await this.patientRepo.save(patient);

        return { message: 'Patient registered successfully', userId: savedUser.id };
    }

    // ── Hospital Registration ─────────────────────────────────────────────────
    async registerHospital(dto: RegisterHospitalDto) {
        const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (existing) throw new BadRequestException('Phone already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            phone: dto.phone,
            aadhaar_number: dto.aadhaar_number,
            password: hashed,
            role: UserRole.HOSPITAL,
        });
        let savedUser;
        try {
            savedUser = await this.userRepo.save(user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new BadRequestException('Aadhaar number already registered');
            }
            throw error;
        }

        const hospital = this.hospitalRepo.create({
            userId: savedUser.id,
            hospitalName: dto.hospitalName,
            registrationNumber: dto.registrationNumber,
        });
        await this.hospitalRepo.save(hospital);

        return { message: 'Hospital registered successfully', userId: savedUser.id };
    }

    // ── Doctor Registration (created by hospital admin) ───────────────────────
    async registerDoctor(dto: RegisterDoctorDto) {
        const existing = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (existing) throw new BadRequestException('Phone already registered');

        const hashed = await bcrypt.hash(dto.password, 10);

        const user = this.userRepo.create({
            phone: dto.phone,
            aadhaar_number: dto.aadhaar_number,
            password: hashed,
            role: UserRole.DOCTOR,
        });
        let savedUser;
        try {
            savedUser = await this.userRepo.save(user);
        } catch (error: any) {
            if (error.code === '23505' && error.detail && error.detail.includes('aadhaar_number')) {
                throw new BadRequestException('Aadhaar number already registered');
            }
            throw error;
        }

        const doctor = this.doctorRepo.create({
            userId: savedUser.id,
            hospitalId: dto.hospitalId,
        });
        await this.doctorRepo.save(doctor);

        return { message: 'Doctor registered successfully', userId: savedUser.id };
    }

    // ── Login ────────────────────────────────────────────────────────────────
    async login(dto: LoginDto) {
        const user = await this.userRepo.findOne({ where: { phone: dto.phone } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const match = await bcrypt.compare(dto.password, user.password);
        if (!match) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, phone: user.phone, role: user.role };
        const token = await this.jwtService.signAsync(payload);

        return { access_token: token, role: user.role };
    }
}
