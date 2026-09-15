import { User } from "src/user/entities/user.entity";
import { DistrictsEntity } from "src/zones/entities/district.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("profiles")
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "user_id" })
  user_id: number;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ length: 150, nullable: true })
  full_name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ name: "province_id", nullable: true })
  province_id: number;

  @Column({ name: "city_id", nullable: true })
  city_id: number;

  @Column({ name: "district_id", nullable: true })
  district_id: number;

  @ManyToOne(() => DistrictsEntity, { nullable: true })
  @JoinColumn({ name: "district_id" })
  district: DistrictsEntity;

  @Column({ length: 10, nullable: true })
  postal_code: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
