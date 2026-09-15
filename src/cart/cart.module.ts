import { Module } from "@nestjs/common";
import { CartService } from "./cart.service";
import { CartController } from "./cart.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CartEntity } from "./entities/cart.entity";
import { ProductsModule } from "src/products/products.module";

@Module({
  imports: [TypeOrmModule.forFeature([CartEntity]), ProductsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [TypeOrmModule],
})
export class CartModule { }
