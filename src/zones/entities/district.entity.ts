import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProvinceEntity } from "./province.entity";
import { CityEntity } from "./cities.entity";
import { Profile } from "src/user/entities/profile.entity";

@Entity("districts")
export class DistrictsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  external_id: number;

  @Column()
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  city_id: number;

  @ManyToOne(() => CityEntity, (city) => city.district)
  @JoinColumn({ name: "city_id" })
  city: CityEntity;

  @OneToMany(() => Profile, (prof) => prof.district)
  profile: Profile[];
}
