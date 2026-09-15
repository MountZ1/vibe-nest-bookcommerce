import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UsersService } from "./user.service";
import { LoginDTO } from "./dto/login.dto";
import { CurrentUser } from "./decorator/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

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
}
