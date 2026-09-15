import { IsArray, ArrayNotEmpty, IsInt, Min, IsString, IsNotEmpty } from "class-validator";

export class CreateOrderDTO {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  cart_id: number[];

  @IsInt()
  @Min(1)
  expedition_id: number;

  @IsString()
  @IsNotEmpty()
  service: string;
}
