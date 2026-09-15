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
import { DistrictsEntity } from "./district.entity";

@Entity("cities")
export class CityEntity {
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
  province_id: number;

  @ManyToOne(() => ProvinceEntity, (province) => province.cities)
  @JoinColumn({ name: "province_id" })
  province: ProvinceEntity;

  @OneToMany(() => DistrictsEntity, (district) => district.city)
  district: DistrictsEntity[];
}
