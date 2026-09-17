import { User } from "src/user/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ExpeditionEntity } from "./expedition.entity";
import { PurchaseDetailEntity } from "./purchase-detail.entity";
import { DistrictsEntity } from "src/zones/entities/district.entity";

export enum PurchaseStatus {
  PENDING = "pending",
  PAID = "paid",
  SHIPPED = "shipped",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity("purchases")
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.purchases, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => ExpeditionEntity, (expedition) => expedition.purchases, { nullable: true })
  @JoinColumn({ name: "expedition_id" })
  expedition: ExpeditionEntity;

  @Column()
  invoice_number: string;

  @Column("decimal", { precision: 10, scale: 2 })
  subtotal: number;

  @Column("decimal", { precision: 10, scale: 2 })
  shipping_cost: number;

  @Column("decimal", { precision: 10, scale: 2 })
  total_price: number;

  @Column({
    type: "enum",
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING,
  })
  status: PurchaseStatus;

  @Column({ type: "date" })
  purchased_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PurchaseDetailEntity, (detail) => detail.purchase)
  detail: PurchaseDetailEntity[];
}
