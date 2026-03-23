import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class RegisterDoctorDto {
    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    aadhaarNumber: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsNumber()
    hospitalId: number;

    @IsString()
    @IsOptional()
    fullName?: string;

    @IsString()
    @IsOptional()
    specialization?: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsOptional()
    licenseNumber?: string;

    @IsString()
    @IsOptional()
    role?: string;
}
