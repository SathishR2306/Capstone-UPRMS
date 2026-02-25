import {
    Controller,
    Post,
    Get,
    Param,
    ParseIntPipe,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Request,
    Body,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { MedicalRecordService } from './medical-record.service';
import { UploadRecordDto } from './dto/upload-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordController {
    constructor(private readonly service: MedicalRecordService) { }

    // ── Step 9: Hospital uploads a record ────────────────────────────────────
    @Post('upload')
    @Roles('HOSPITAL')
    @UseInterceptors(
        FileInterceptor('report', {
            storage: diskStorage({
                destination: './uploads',
                filename: (_req, file, cb) => {
                    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `${unique}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (_req, file, cb) => {
                // Accept only PDFs and images
                const allowed = /pdf|jpeg|jpg|png/;
                const ok = allowed.test(extname(file.originalname).toLowerCase());
                cb(ok ? null : new Error('Only PDF/image files are allowed'), ok);
            },
        }),
    )
    upload(
        @Request() req,
        @Body() dto: UploadRecordDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.service.upload(dto, file, req.user.userId);
    }

    // ── Step 10: Doctor views all records for their hospital ─────────────────
    @Get('my-records')
    @Roles('DOCTOR')
    getDoctorRecords(@Request() req) {
        return this.service.findByDoctor(req.user.userId);
    }

    // ── Hospital views their own uploaded records ─────────────────────────────
    @Get('hospital-records')
    @Roles('HOSPITAL')
    getHospitalRecords(@Request() req) {
        return this.service.findByHospital(req.user.userId);
    }

    // ── View records for a specific patient (hospital or doctor) ─────────────
    @Get('patient/:patientId')
    @Roles('HOSPITAL', 'DOCTOR')
    getPatientRecords(
        @Param('patientId', ParseIntPipe) patientId: number,
        @Request() req
    ) {
        return this.service.findByPatient(patientId, req.user.userId, req.user.role);
    }

    // ── Patient views their own records ──────────────────────────────────────
    @Get('patient-records')
    @Roles('PATIENT')
    getMyRecords(@Request() req) {
        return this.service.findByPatientUserId(req.user.userId);
    }

    // ── Download a report file ────────────────────────────────────────────────
    @Get('download/:filename')
    downloadFile(
        @Param('filename') filename: string,
        @Res() res: Response,
    ) {
        const filePath = join(process.cwd(), 'uploads', filename);
        return res.download(filePath, filename);
    }
}

