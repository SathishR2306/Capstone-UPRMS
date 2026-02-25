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

@Entity('access_permissions')
export class AccessPermission {
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

    @Column({ default: false })
    accessGranted: boolean;

    @Column({ default: 'APPROVED' })
    status: string; // 'PENDING', 'APPROVED', 'REJECTED', 'REVOKED'

    @CreateDateColumn()
    grantedAt: Date;
}
