import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrderEntity } from "./order.entity";
import { Product } from "src/products/products.entity";

@Entity("purchase_details")
export class PurchaseDetailEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  purchase_id: number;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column("decimal", { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: "int", unsigned: true, default: 1 })
  quantity: number;

  @ManyToOne(() => OrderEntity, (order) => order.detail)
  @JoinColumn({ name: "purchase_id" })
  purchase: OrderEntity;

  @Column()
  book_id: number;

  @ManyToOne(() => Product, (product) => product.detail)
  @JoinColumn({ name: "book_id" })
  book: Product;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
