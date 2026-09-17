import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";
import { Role } from "./entities/role.entity";
import { LoginDTO } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { Profile } from "./entities/profile.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

  async createUser(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException("Email already registered");
    }

    const buyerRole = await this.roleRepository.findOne({
      where: { name: "buyer" },
    });
    if (!buyerRole) {
      throw new InternalServerErrorException("Default role 'buyer' not found");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role_id: buyerRole.id,
    });

    const savedUser = await this.userRepository.save(user);
    const profile = this.profileRepository.create({
      user_id: savedUser.id,
      full_name: savedUser.name,
    });
    this.profileRepository.save(profile);

    const { password, ...result } = savedUser;
    return result;
  }

  async login(dto: LoginDTO) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .innerJoinAndSelect("user.role", "role")
      .select(["user.id", "user.name", "user.email", "user.password", "role.name"])
      .where("user.email = :email", { email: dto.email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException("Email or password is incorrect");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Email or password is incorrect");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    return await this.jwtService.signAsync(payload);
  }

  async getUserProfile(user: any) {
    return this.profileRepository.findOne({
      where: { user_id: user.userId },
    });
  }

  async logout(token: string) {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;

    if (!decoded?.exp) {
      throw new UnauthorizedException("Invalid token");
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = decoded.exp - nowInSeconds;

    if (remainingSeconds <= 0) {
      return { message: "Token already expired" };
    }

    await this.cacheManager.set(
      `blacklist_token:${token}`,
      true,
      remainingSeconds * 1000, // TTL dalam ms, samain sisa umur token
    );

    return { message: "Logged out successfully" };
  }

  async updateProfile(dto: UpdateProfileDto, user_id: number) {
    const profile = await this.profileRepository.findOne({ where: { user_id } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    return await this.dataSource.transaction(async (manager) => {
      Object.assign(profile, dto);
      const updatedProfile = await manager.save(Profile, profile);

      if (dto.full_name) {
        await manager.update(User, { id: user_id }, { name: dto.full_name });
      }

      return updatedProfile;
    });
  }
}
