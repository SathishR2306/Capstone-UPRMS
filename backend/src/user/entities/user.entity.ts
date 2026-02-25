import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
    PATIENT = 'PATIENT',
    HOSPITAL = 'HOSPITAL',
    DOCTOR = 'DOCTOR',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    phone: string;

    @Column({ unique: true })
    aadhaar_number: string;

    @Column()
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.PATIENT,
    })
    role: UserRole;
}
