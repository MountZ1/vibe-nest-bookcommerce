import { Module } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import { CheckoutController } from "./checkout.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExpeditionEntity } from "./entity/expedition.entity";
import { OrderEntity } from "./entity/order.entity";
import { PurchaseDetailEntity } from "./entity/purchase-detail.entity";
import { ProductsModule } from "src/products/products.module";
import { CartModule } from "src/cart/cart.module";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ExpeditionEntity, OrderEntity, PurchaseDetailEntity]),
    ProductsModule,
    CartModule,
    UserModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule { }
