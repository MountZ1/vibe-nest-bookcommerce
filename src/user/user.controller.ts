import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
  Req,
  Put,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./user.service";
import { LoginDTO } from "./dto/login.dto";
import { CurrentUser } from "./decorator/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller()
export class UserController {
  constructor(private readonly userService: UsersService) { }

  @Post("register")
  async create(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Post("login")
  async login(@Body() dto: LoginDTO) {
    return this.userService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async profile(@CurrentUser() user) {
    return this.userService.getUserProfile(user);
  }

  @UseGuards(JwtAuthGuard)
  @Put("profile")
  async updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: any) {
    return this.userService.updateProfile(dto, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Req() req: Request) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException("Token not provided");
    }

    return this.userService.logout(token);
  }
}
