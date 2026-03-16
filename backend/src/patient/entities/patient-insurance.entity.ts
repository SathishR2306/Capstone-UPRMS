import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('patient_insurances')
export class PatientInsurance {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    patientId: number;

    @Column()
    providerName: string;

    @Column()
    policyNumber: string;

    @Column()
    groupNumber: string;

    @Column({ type: 'date', nullable: true })
    validUntil: string;

    @Column({ default: true })
    isActive: boolean;
}
