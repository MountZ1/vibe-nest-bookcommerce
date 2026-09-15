import { IsArray, IsInt, ArrayNotEmpty } from "class-validator";

export class CheckoutDTO {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  cart_id: number[];
}
