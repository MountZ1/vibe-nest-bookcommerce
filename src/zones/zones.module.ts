import { Module } from "@nestjs/common";
import { ZonesService } from "./zones.service";
import { ZonesController } from "./zones.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProvinceEntity } from "./entities/province.entity";
import { CityEntity } from "./entities/cities.entity";
import { DistrictsEntity } from "./entities/district.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProvinceEntity, CityEntity, DistrictsEntity])],
  controllers: [ZonesController],
  providers: [ZonesService],
  exports: [TypeOrmModule],
})
export class ZonesModule { }
