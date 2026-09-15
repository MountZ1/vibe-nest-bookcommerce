import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ProductsModule } from "./products/products.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryModule } from "./category/category.module";
import { UserModule } from "./user/user.module";
import { ZonesModule } from "./zones/zones.module";
import { CartModule } from "./cart/cart.module";
import { CheckoutModule } from "./checkout-order/checkout.module";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (opt: ConfigService) => ({
        type: opt.get<"mysql">("DB_DRIVER"),
        host: opt.get<string>("DB_HOST"),
        port: opt.get<number>("DB_PORT"),
        username: opt.get<string>("DB_USERNAME"),
        password: opt.get<string>("DB_PASSWORD"),
        database: opt.get<string>("DB_DATABASE"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
      }),
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 1000,
      max: 100,
    }),
    ProductsModule,
    CategoryModule,
    UserModule,
    ZonesModule,
    CartModule,
    CheckoutModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
