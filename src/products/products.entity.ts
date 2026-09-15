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
import { Category } from "src/category/category.entity";
import { Publisher } from "src/publisher/publisher.entity";
import { Author } from "src/author/author.entity";
import { CartEntity } from "src/cart/entities/cart.entity";
import { PurchaseDetailEntity } from "src/checkout-order/entity/purchase-detail.entity";

@Entity("books")
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("decimal", { precision: 10, scale: 2 })
  price: number;

  @Column({ unique: true })
  slug: string;

  @Column("float")
  weight: number;

  @Column()
  category_id: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "category_id" })
  category: Category;

  @Column()
  author_id: number;

  @ManyToOne(() => Author, (author) => author.products)
  @JoinColumn({ name: "author_id" })
  author: Author;

  @Column()
  publisher_id: number;

  @ManyToOne(() => Publisher, (publisher) => publisher.products)
  @JoinColumn({ name: "publisher_id" })
  publisher: Publisher;

  @Column({ unique: true })
  isbn: string;

  @Column("float")
  width: number;

  @Column("float")
  length: number;

  @Column()
  language: string;

  @Column()
  pages: number;

  @Column({ type: "date" })
  publication_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  image: string;

  @OneToMany(() => CartEntity, (cart) => cart.book)
  carts: CartEntity[];

  @OneToMany(() => PurchaseDetailEntity, (detail) => detail.book)
  detail: PurchaseDetailEntity[];
}
