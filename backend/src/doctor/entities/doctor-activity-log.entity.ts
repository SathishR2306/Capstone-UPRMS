import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from '../../patient/entities/patient.entity';

@Entity('doctor_activity_logs')
export class DoctorActivityLog {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Doctor)
    @JoinColumn({ name: 'doctorId' })
    doctor: Doctor;

    @Column()
    doctorId: number;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    patientId: number;

    @Column()
    action: string; // e.g. 'VIEW_RECORDS', 'DOWNLOAD_REPORT', 'VIEW_AI_SUMMARY'

    @Column({ nullable: true })
    detail: string;

    @CreateDateColumn()
    timestamp: Date;
}
