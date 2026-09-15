import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";
import { Role } from "./entities/role.entity";
import { LoginDTO } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { Profile } from "./entities/profile.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly jwtService: JwtService,
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
}
