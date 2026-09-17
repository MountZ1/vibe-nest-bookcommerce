import { IsString, IsOptional, IsInt, MaxLength, Min } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  province_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  city_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  district_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postal_code?: string;
}
