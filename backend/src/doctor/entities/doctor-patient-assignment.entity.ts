import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from '../../patient/entities/patient.entity';

@Entity('doctor_patient_assignments')
@Unique(['doctorId', 'patientId'])
export class DoctorPatientAssignment {
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

    @Column({ default: false })
    isEmergency: boolean;

    @Column({ nullable: true })
    assignedBy: string; // hospital name or admin user

    @CreateDateColumn()
    assignedAt: Date;
}
