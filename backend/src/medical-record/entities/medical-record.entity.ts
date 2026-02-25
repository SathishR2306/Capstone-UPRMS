import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Patient } from '../../patient/entities/patient.entity';
import { Hospital } from '../../hospital/entities/hospital.entity';

@Entity('medical_records')
export class MedicalRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @Column()
    patientId: number;

    @ManyToOne(() => Hospital)
    @JoinColumn({ name: 'hospitalId' })
    hospital: Hospital;

    @Column()
    hospitalId: number;

    @Column({ type: 'text' })
    diagnosis: string;

    @Column({ type: 'text' })
    prescription: string;

    @Column({ type: 'date' })
    visitDate: string;

    @Column({ type: 'text', nullable: true })
    reportFileURL: string | null;


    @CreateDateColumn()
    createdAt: Date;
}
