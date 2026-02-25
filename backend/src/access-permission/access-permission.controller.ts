import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AccessPermissionService } from './access-permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('access')
export class AccessPermissionController {
    constructor(private readonly service: AccessPermissionService) { }

    /** Patient grants a hospital access to upload records */
    @Post('grant')
    grant(
        @Request() req,
        @Body('hospitalId') hospitalId: number,
    ) {
        // patientId comes from the JWT token — patient cannot spoof another patient
        return this.service.grantAccess(req.user.userId, hospitalId);
    }

    /** Patient revokes a hospital's access */
    @Post('revoke')
    revoke(
        @Request() req,
        @Body('hospitalId') hospitalId: number,
    ) {
        return this.service.revokeAccess(req.user.userId, hospitalId);
    }

    /** Any authenticated user can check if a hospital has access */
    @Get('check/:patientId/:hospitalId')
    check(
        @Param('patientId', ParseIntPipe) patientId: number,
        @Param('hospitalId', ParseIntPipe) hospitalId: number,
    ) {
        return this.service.hasAccess(patientId, hospitalId);
    }

    /** Patient gets all their own access permissions */
    @Get('my-permissions')
    myPermissions(@Request() req) {
        return this.service.myPermissions(req.user.userId);
    }

    /** Patient gets access audit history */
    @Get('history')
    @Roles('PATIENT')
    getHistory(@Request() req) {
        return this.service.getAccessHistory(req.user.userId);
    }

    /** Patient rejects a hospital's access request */
    @Post('reject')
    @Roles('PATIENT')
    reject(
        @Request() req,
        @Body('hospitalId') hospitalId: number,
    ) {
        return this.service.rejectAccess(req.user.userId, hospitalId);
    }

    // === HOSPITAL ENDPOINTS ===

    /** Hospital requests access to a patient */
    @Post('request')
    @Roles('HOSPITAL')
    requestAccess(
        @Request() req,
        @Body('patientId') patientId: number,
    ) {
        return this.service.requestAccess(patientId, req.user.userId);
    }

    /** Hospital gets all its access requests */
    @Get('hospital-requests')
    @Roles('HOSPITAL')
    getHospitalRequests(@Request() req) {
        return this.service.getHospitalRequests(req.user.userId);
    }

    /** Hospital cancels a pending access request */
    @Post('cancel-request')
    @Roles('HOSPITAL')
    cancelRequest(
        @Request() req,
        @Body('patientId') patientId: number,
    ) {
        return this.service.cancelRequest(req.user.userId, patientId);
    }
}
