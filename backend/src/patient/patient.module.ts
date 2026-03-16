import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientInsurance } from './entities/patient-insurance.entity';
import { User } from '../user/entities/user.entity';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Patient, PatientInsurance, User])],
    providers: [PatientService],
    controllers: [PatientController],
    exports: [TypeOrmModule],
})
export class PatientModule { }
