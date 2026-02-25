import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PatientModule } from './patient/patient.module';
import { HospitalModule } from './hospital/hospital.module';
import { MedicalRecordModule } from './medical-record/medical-record.module';
import { AccessPermissionModule } from './access-permission/access-permission.module';
import { AuthModule } from './auth/auth.module';
import { DoctorModule } from './doctor/doctor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    UserModule,
    PatientModule,
    HospitalModule,
    MedicalRecordModule,
    AccessPermissionModule,
    AuthModule,
    DoctorModule,
  ],
})
export class AppModule { }

