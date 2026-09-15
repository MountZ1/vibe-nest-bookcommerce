import { Product } from "src/products/products.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("publishers")
export class Publisher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  slug: string;

  @OneToMany(() => Product, (product) => product.publisher)
  products: Product[];
}
