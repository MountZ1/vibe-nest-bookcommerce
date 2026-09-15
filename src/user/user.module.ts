import { Module } from "@nestjs/common";
import { UsersService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { JwtModule } from "@nestjs/jwt";
import { Role } from "./entities/role.entity";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { Profile } from "./entities/profile.entity";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Profile]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: { expiresIn: "1d" },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UsersService, JwtStrategy],
  exports: [TypeOrmModule],
})
export class UserModule { }
