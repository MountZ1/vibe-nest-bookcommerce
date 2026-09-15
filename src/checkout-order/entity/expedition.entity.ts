import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrderEntity } from "./order.entity";

@Entity("expeditions")
export class ExpeditionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: "boolean", default: true })
  is_active: true;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => OrderEntity, (purchase) => purchase.expedition)
  purchases: OrderEntity[];
}
