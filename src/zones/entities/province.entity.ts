import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CityEntity } from "./cities.entity";

@Entity("provinces")
export class ProvinceEntity {
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

  @OneToMany(() => CityEntity, (city) => city.province)
  cities: CityEntity[];
}
