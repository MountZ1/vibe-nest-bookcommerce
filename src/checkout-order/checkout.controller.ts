import { Body, Controller, Post, UseGuards, Req, Get, Param, Query } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import { CheckoutDTO } from "./dto/checkout.dto";
import { CreateOrderDTO } from "./dto/create-order.dto";
import { JwtAuthGuard } from "src/user/guards/jwt-auth.guard";
import { CurrentUser } from "src/user/decorator/current-user.decorator";

@Controller("")
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) { }

  @Post("checkout")
  getSummary(@Body() dto: CheckoutDTO, @CurrentUser() user: any) {
    return this.checkoutService.getCheckoutSummary(dto, user.userId);
  }

  @Get("orders")
  async getOrderList(
    @CurrentUser() user: any,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.checkoutService.getOrderByUserId(
      user.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get("orders/:invoice_number")
  async getOrderDetail(@Param("invoice_number") invoice_number: string, @CurrentUser() user: any) {
    return this.checkoutService.getOrderByInvoice(invoice_number, user.userId);
  }

  @Post("order")
  createOrder(@Body() dto: CreateOrderDTO, @CurrentUser() user: any) {
    return this.checkoutService.createOrder(dto, user.userId);
  }
}
