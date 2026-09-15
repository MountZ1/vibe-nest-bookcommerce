import { Product } from "src/products/products.entity";
import { User } from "src/user/entities/user.entity";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("carts")
export class CartEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  book_id: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "book_id" })
  book: Product;

  @Column({ type: "int", unsigned: true, default: 1 })
  quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
