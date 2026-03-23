import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    Request,
    UseGuards,
} from '@nestjs/common';
import { HospitalDoctorService } from './hospital-doctor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HOSPITAL')
@Controller('hospitals/doctors')
export class HospitalDoctorController {
    constructor(private readonly hospitalDoctorService: HospitalDoctorService) {}

    @Post()
    registerDoctor(
        @Request() req,
        @Body()
        body: {
            phone: string;
            aadhaarNumber: string;
            password: string;
            fullName: string;
            specialization?: string;
            department?: string;
            role?: string;
            licenseNumber?: string;
        },
    ) {
        return this.hospitalDoctorService.registerDoctor(req.user.userId, body);
    }

    @Get()
    listDoctors(@Request() req) {
        return this.hospitalDoctorService.listDoctors(req.user.userId);
    }

    @Patch(':id')
    updateDoctor(
        @Param('id', ParseIntPipe) doctorId: number,
        @Request() req,
        @Body()
        body: {
            fullName?: string;
            specialization?: string;
            department?: string;
            role?: string;
            status?: string;
            licenseNumber?: string;
            workingHoursStart?: string;
            workingHoursEnd?: string;
        },
    ) {
        return this.hospitalDoctorService.updateDoctor(req.user.userId, doctorId, body);
    }

    @Patch(':id/suspend')
    suspendDoctor(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.suspendDoctor(req.user.userId, doctorId);
    }

    @Delete(':id')
    removeDoctor(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.removeDoctor(req.user.userId, doctorId);
    }

    @Get(':id/performance')
    getDoctorPerformance(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.getDoctorPerformance(req.user.userId, doctorId);
    }

    @Get(':id/activity')
    getDoctorActivity(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.getDoctorActivity(req.user.userId, doctorId);
    }

    @Post(':id/assign-patient')
    assignPatient(
        @Param('id', ParseIntPipe) doctorId: number,
        @Request() req,
        @Body() body: { patientId: number; isEmergency?: boolean },
    ) {
        return this.hospitalDoctorService.assignPatient(req.user.userId, doctorId, body);
    }

    @Get(':id/patients')
    getDoctorPatients(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.getDoctorPatients(req.user.userId, doctorId);
    }

    @Delete(':id/unassign-patient/:patientId')
    unassignPatient(
        @Param('id', ParseIntPipe) doctorId: number,
        @Param('patientId', ParseIntPipe) patientId: number,
        @Request() req,
    ) {
        return this.hospitalDoctorService.unassignPatient(req.user.userId, doctorId, patientId);
    }
}
