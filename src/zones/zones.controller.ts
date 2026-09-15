import { Controller, Get, Param, Query } from "@nestjs/common";
import { ZonesService } from "./zones.service";

@Controller("zones")
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) { }

  @Get("provinces")
  async getProvinces() {
    return await this.zonesService.getProvinces();
  }

  @Get("cities")
  async getCities(@Query("province_id") province_id: string) {
    const id = parseInt(province_id);
    return await this.zonesService.getCities(id);
  }

  @Get("districts")
  async getDistricts(@Query("city_id") city_id: string) {
    const id = parseInt(city_id);
    return await this.zonesService.getDistrict(id);
  }
}
