import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hospital } from './entities/hospital.entity';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { HospitalDoctorService } from './hospital-doctor.service';
import { HospitalDoctorController } from './hospital-doctor.controller';
import { Doctor } from '../doctor/entities/doctor.entity';
import { DoctorActivityLog } from '../doctor/entities/doctor-activity-log.entity';
import { DoctorPatientAssignment } from '../doctor/entities/doctor-patient-assignment.entity';
import { User } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Hospital,
            Doctor,
            DoctorActivityLog,
            DoctorPatientAssignment,
            User,
            Patient,
        ]),
    ],
    providers: [HospitalService, HospitalDoctorService],
    controllers: [HospitalController, HospitalDoctorController],
    exports: [TypeOrmModule],
})
export class HospitalModule { }
