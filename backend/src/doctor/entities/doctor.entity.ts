import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Hospital } from '../../hospital/entities/hospital.entity';

export enum DoctorRole {
    SENIOR_CONSULTANT = 'SENIOR_CONSULTANT',
    JUNIOR_DOCTOR = 'JUNIOR_DOCTOR',
    RESIDENT = 'RESIDENT',
    READ_ONLY = 'READ_ONLY',
}

export enum DoctorStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING',
}

@Entity('doctors')
export class Doctor {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ unique: true })
    userId: number;

    @ManyToOne(() => Hospital)
    @JoinColumn({ name: 'hospitalId' })
    hospital: Hospital;

    @Column()
    hospitalId: number;

    @Column({ nullable: true })
    fullName: string;

    @Column({ nullable: true })
    specialization: string;

    @Column({ nullable: true })
    licenseNumber: string;

    @Column({ nullable: true, type: 'date' })
    licenseExpiry: Date;

    @Column({ nullable: true })
    department: string;

    @Column({
        type: 'enum',
        enum: DoctorRole,
        default: DoctorRole.JUNIOR_DOCTOR,
    })
    role: DoctorRole;

    @Column({
        type: 'enum',
        enum: DoctorStatus,
        default: DoctorStatus.ACTIVE,
    })
    status: DoctorStatus;

    @Column({ nullable: true })
    workingHoursStart: string; // e.g. "09:00"

    @Column({ nullable: true })
    workingHoursEnd: string; // e.g. "17:00"

    @Column({ type: 'simple-array', nullable: true })
    leaveDays: string[]; // ISO dates e.g. ["2025-03-01","2025-03-02"]
}
