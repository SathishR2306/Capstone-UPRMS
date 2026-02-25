import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { AccessPermission } from '../access-permission/entities/access-permission.entity';
import { Hospital } from '../hospital/entities/hospital.entity';
import { Doctor } from '../doctor/entities/doctor.entity';
import { MedicalRecordService } from './medical-record.service';
import { MedicalRecordController } from './medical-record.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([MedicalRecord, AccessPermission, Hospital, Doctor]),
    ],
    providers: [MedicalRecordService],
    controllers: [MedicalRecordController],
    exports: [TypeOrmModule],
})
export class MedicalRecordModule { }
