import { Controller, Get, Patch, Post, Delete, Param, ParseIntPipe, Body, Query, UseGuards, Request } from '@nestjs/common';
import { PatientService } from './patient.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patient')
export class PatientController {
    constructor(private readonly patientService: PatientService) { }

    @Get('profile')
    @Roles('PATIENT')
    getProfile(@Request() req) {
        return this.patientService.getProfile(req.user.userId);
    }

    @Patch('profile')
    @Roles('PATIENT')
    updateProfile(@Request() req, @Body() body: { phone?: string, bloodGroup?: string, emergencyContactName?: string, emergencyContactPhone?: string, emergencyContactRelation?: string }) {
        return this.patientService.updateProfile(req.user.userId, body);
    }

    @Get('search')
    @Roles('HOSPITAL')
    searchPatients(
        @Request() req, 
        @Query('q') query: string,
        @Query('linked') linked?: string
    ) {
        return this.patientService.searchPatients(query, req.user.userId, linked === 'true');
    }

    @Get('find')
    @Roles('HOSPITAL')
    findByRegNumber(@Request() req, @Query('q') query: string) {
        return this.patientService.findByRegNumber(query, req.user.userId);
    }

    @Get('insurance')
    @Roles('PATIENT')
    getInsurance(@Request() req) {
        return this.patientService.getInsurance(req.user.userId);
    }

    @Post('insurance')
    @Roles('PATIENT')
    addOrUpdateInsurance(@Request() req, @Body() body: any) {
        return this.patientService.addOrUpdateInsurance(req.user.userId, body);
    }

    @Delete('insurance/:id')
    @Roles('PATIENT')
    deleteInsurance(@Request() req, @Param('id', ParseIntPipe) id: number) {
        return this.patientService.deleteInsurance(req.user.userId, id);
    }
}
