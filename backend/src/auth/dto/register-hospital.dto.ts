import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterHospitalDto {
    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    aadhaarNumber: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    @IsNotEmpty()
    hospitalName: string;

    @IsString()
    @IsNotEmpty()
    registrationNumber: string;
}
