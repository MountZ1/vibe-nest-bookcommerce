import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CartDTO {
  @IsInt()
  @Min(1)
  book_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export enum CartMethod {
  ADD = "add",
  REDUCE = "reduce",
}

export class UpdateCartQuantity extends CartDTO {
  @IsNumber()
  id: number;

  @IsOptional()
  @IsEnum(CartMethod, {
    message: "method must be either 'add' or 'reduce'",
  })
  method?: CartMethod;
}
