import { Controller, Get, Query, Param } from "@nestjs/common";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  findAll(@Query("q") q?: string, @Query("page") page?: string, @Query("limit") limit?: string) {
    return this.productsService.findProducts({ q, page, limit });
  }

  @Get(":slug")
  find(@Param("slug") slug: string) {
    return this.productsService.showProduct(slug);
  }

  @Get("/category/:category")
  findByCategory(
    @Param("category") category: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.productsService.findProductByCategory(category, page, limit);
  }
}
