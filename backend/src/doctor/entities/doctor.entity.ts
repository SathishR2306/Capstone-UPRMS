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
}
