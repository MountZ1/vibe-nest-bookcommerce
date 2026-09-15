import { Body, Controller, Post, UseGuards, Req } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import { CheckoutDTO } from "./dto/checkout.dto";
import { CreateOrderDTO } from "./dto/create-order.dto";
import { JwtAuthGuard } from "src/user/guards/jwt-auth.guard";

@Controller("")
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

  @Post("checkout")
  getSummary(@Body() dto: CheckoutDTO, @Req() req) {
    return this.checkoutService.getCheckoutSummary(dto, req.user.id);
  }

  @Post("order")
  createOrder(@Body() dto: CreateOrderDTO, @Req() req) {
    return this.checkoutService.createOrder(dto, req.user.id);
  }
}
