import { Module } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { HospitalController } from './hospital.controller';
import { HospitalDoctorService } from './hospital-doctor.service';
import { HospitalDoctorController } from './hospital-doctor.controller';

@Module({
    providers: [HospitalService, HospitalDoctorService],
    controllers: [HospitalController, HospitalDoctorController],
})
export class HospitalModule {}
