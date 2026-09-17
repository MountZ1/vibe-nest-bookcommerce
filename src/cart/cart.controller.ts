import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Put } from "@nestjs/common";
import { CartService } from "./cart.service";
import { JwtAuthGuard } from "src/user/guards/jwt-auth.guard";
import { CartDTO, UpdateCartQuantity } from "./dto/cart.dto";
import { CurrentUser } from "src/user/decorator/current-user.decorator";
import { strict } from "assert";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.cartService.findAllByUser(user.userId);
  }

  @Post("")
  async addItem(@Body() dto: CartDTO, @CurrentUser() user: any) {
    return this.cartService.create(dto, user.userId);
  }

  @Put("")
  async updateQuantity(@Body() dto: UpdateCartQuantity, @CurrentUser() user: any) {
    return this.cartService.updateQuantity(dto, user.userId);
  }

  @Delete(":cart_id")
  async removeCartProduct(@Param("cart_id") cart_id: string, @CurrentUser() user: any) {
    const id = parseInt(cart_id);
    return this.cartService.deleteCart(id, user.userId);
  }
}
