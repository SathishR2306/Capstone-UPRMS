import {
    Controller,
    Get,
    Patch,
    Post,
    Param,
    ParseIntPipe,
    Query,
    Body,
    Request,
    UseGuards,
} from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DOCTOR')
@Controller('doctors')
export class DoctorController {
    constructor(private readonly doctorService: DoctorService) { }

    // GET /doctors/profile
    @Get('profile')
    getProfile(@Request() req) {
        return this.doctorService.getProfile(req.user.userId);
    }

    // PATCH /doctors/profile
    @Patch('profile')
    updateProfile(
        @Request() req,
        @Body()
        body: {
            fullName?: string;
            specialization?: string;
            licenseNumber?: string;
            phone?: string;
        },
    ) {
        return this.doctorService.updateProfile(req.user.userId, body);
    }

    // PATCH /doctors/change-password
    @Patch('change-password')
    changePassword(
        @Request() req,
        @Body() body: { currentPassword: string; newPassword: string },
    ) {
        return this.doctorService.changePassword(req.user.userId, body);
    }

    // GET /doctors/search-patient?q=
    @Get('search-patient')
    searchPatient(@Request() req, @Query('q') query: string) {
        return this.doctorService.searchPatient(query, req.user.userId);
    }

    // GET /doctors/patients/:patientId/records
    @Get('patients/:patientId/records')
    getPatientRecords(
        @Param('patientId', ParseIntPipe) patientId: number,
        @Request() req,
    ) {
        return this.doctorService.getPatientRecords(patientId, req.user.userId);
    }

    // POST /doctors/patients/:patientId/log-download
    @Post('patients/:patientId/log-download')
    logDownload(
        @Param('patientId', ParseIntPipe) patientId: number,
        @Request() req,
        @Body() body: { fileName: string },
    ) {
        return this.doctorService.logDownload(req.user.userId, patientId, body.fileName);
    }

    // GET /doctors/activity-log
    @Get('activity-log')
    getActivityLog(@Request() req) {
        return this.doctorService.getActivityLog(req.user.userId);
    }
}
