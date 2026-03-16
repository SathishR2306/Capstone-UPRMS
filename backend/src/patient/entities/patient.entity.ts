import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('patients')
export class Patient {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: number;

    @Column()
    fullName: string;

    @Column({ type: 'date' })
    dateOfBirth: string;

    @Column()
    gender: string;

    @Column({ nullable: true })
    bloodGroup: string;

    @Column({ nullable: true })
    emergencyContactName: string;

    @Column({ nullable: true })
    emergencyContactPhone: string;

    @Column({ nullable: true })
    emergencyContactRelation: string;
}
