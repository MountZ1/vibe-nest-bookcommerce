import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException("User no longer exists");
    }

    if (user.deleted_at) {
      throw new UnauthorizedException("Account has been deactivated");
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    const isBlacklisted = await this.cacheManager.get(`blacklist_token:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException("Token has been revoked");
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role.name,
    };
  }
}
