import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './entities/doctor.entity';
import { DoctorActivityLog } from './entities/doctor-activity-log.entity';
import { DoctorPatientAssignment } from './entities/doctor-patient-assignment.entity';
import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';
import { User } from '../user/entities/user.entity';
import { Patient } from '../patient/entities/patient.entity';
import { Hospital } from '../hospital/entities/hospital.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Doctor,
            DoctorActivityLog,
            DoctorPatientAssignment,
            User,
            Patient,
            Hospital,
            AccessPermission,
            MedicalRecord,
        ]),
    ],
    providers: [DoctorService],
    controllers: [DoctorController],
    exports: [TypeOrmModule, DoctorService],
})
export class DoctorModule { }
