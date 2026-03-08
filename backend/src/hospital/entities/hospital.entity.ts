import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('hospitals')
export class Hospital {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: number;

    @Column()
    hospitalName: string;

    @Column({ unique: true })
    registrationNumber: string;

    @Column({ unique: true, nullable: true })
    slug: string;
}
