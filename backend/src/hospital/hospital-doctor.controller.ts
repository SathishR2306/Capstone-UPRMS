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
import { DoctorRole, DoctorStatus } from '../doctor/entities/doctor.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HOSPITAL')
@Controller('hospitals/doctors')
export class HospitalDoctorController {
    constructor(private readonly hospitalDoctorService: HospitalDoctorService) { }

    // POST /hospitals/doctors  – register a new doctor
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
            role?: DoctorRole;
            licenseNumber?: string;
        },
    ) {
        return this.hospitalDoctorService.registerDoctor(req.user.userId, body);
    }

    // GET /hospitals/doctors  – list all doctors under this hospital
    @Get()
    listDoctors(@Request() req) {
        return this.hospitalDoctorService.listDoctors(req.user.userId);
    }

    // PATCH /hospitals/doctors/:id  – update doctor role/department/status
    @Patch(':id')
    updateDoctor(
        @Param('id', ParseIntPipe) doctorId: number,
        @Request() req,
        @Body()
        body: {
            fullName?: string;
            specialization?: string;
            department?: string;
            role?: DoctorRole;
            status?: DoctorStatus;
            licenseNumber?: string;
            workingHoursStart?: string;
            workingHoursEnd?: string;
        },
    ) {
        return this.hospitalDoctorService.updateDoctor(req.user.userId, doctorId, body);
    }

    // PATCH /hospitals/doctors/:id/suspend  – suspend doctor
    @Patch(':id/suspend')
    suspendDoctor(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.suspendDoctor(req.user.userId, doctorId);
    }

    // DELETE /hospitals/doctors/:id  – remove doctor
    @Delete(':id')
    removeDoctor(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.removeDoctor(req.user.userId, doctorId);
    }

    // GET /hospitals/doctors/:id/performance  – performance analytics
    @Get(':id/performance')
    getDoctorPerformance(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.getDoctorPerformance(req.user.userId, doctorId);
    }

    // GET /hospitals/doctors/:id/activity  – raw activity log (admin)
    @Get(':id/activity')
    getDoctorActivity(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.getDoctorActivity(req.user.userId, doctorId);
    }

    // POST /hospitals/doctors/:id/assign-patient
    @Post(':id/assign-patient')
    assignPatient(
        @Param('id', ParseIntPipe) doctorId: number,
        @Request() req,
        @Body() body: { patientId: number; isEmergency?: boolean },
    ) {
        return this.hospitalDoctorService.assignPatient(req.user.userId, doctorId, body);
    }

    // GET /hospitals/doctors/:id/patients
    @Get(':id/patients')
    getDoctorPatients(@Param('id', ParseIntPipe) doctorId: number, @Request() req) {
        return this.hospitalDoctorService.getDoctorPatients(req.user.userId, doctorId);
    }

    // DELETE /hospitals/doctors/:id/unassign-patient/:patientId
    @Delete(':id/unassign-patient/:patientId')
    unassignPatient(
        @Param('id', ParseIntPipe) doctorId: number,
        @Param('patientId', ParseIntPipe) patientId: number,
        @Request() req,
    ) {
        return this.hospitalDoctorService.unassignPatient(req.user.userId, doctorId, patientId);
    }
}
