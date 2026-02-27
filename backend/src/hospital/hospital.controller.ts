import { Controller, Get, Post, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { HospitalService } from './hospital.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('hospitals')
export class HospitalController {
    constructor(private readonly hospitalService: HospitalService) { }

    @Get()
    findAll() {
        return this.hospitalService.findAll();
    }

    @Get('profile')
    @UseGuards(RolesGuard)
    @Roles('HOSPITAL')
    getProfile(@Request() req) {
        return this.hospitalService.getProfile(req.user.userId);
    }

    @Patch('profile')
    @UseGuards(RolesGuard)
    @Roles('HOSPITAL')
    updateProfile(@Request() req, @Body() body: { phone?: string }) {
        return this.hospitalService.updateProfile(req.user.userId, body);
    }

    @Get('stats')
    @UseGuards(RolesGuard)
    @Roles('HOSPITAL')
    getDashboardStats(@Request() req) {
        return this.hospitalService.getDashboardStats(req.user.userId);
    }

    @Post('doctors')
    @UseGuards(RolesGuard)
    @Roles('HOSPITAL')
    registerDoctor(@Request() req, @Body() dto: any) {
        return this.hospitalService.registerDoctor(req.user.userId, dto);
    }
}
