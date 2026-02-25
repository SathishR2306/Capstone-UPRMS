import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterHospitalDto } from './dto/register-hospital.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register/patient')
    registerPatient(@Body() dto: RegisterPatientDto) {
        return this.authService.registerPatient(dto);
    }

    @Post('register/hospital')
    registerHospital(@Body() dto: RegisterHospitalDto) {
        return this.authService.registerHospital(dto);
    }

    @Post('register/doctor')
    registerDoctor(@Body() dto: RegisterDoctorDto) {
        return this.authService.registerDoctor(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
}
