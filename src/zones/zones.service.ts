import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";

import { ProvinceEntity } from "./entities/province.entity";
import { CityEntity } from "./entities/cities.entity";
import { DistrictsEntity } from "./entities/district.entity";

interface RajaOngkirDestinationItem {
  id: number;
  name: string;
  zip_code?: string;
}

interface RajaOngkirDestinationResponse {
  meta: { message: string; code: number; status: string };
  data: RajaOngkirDestinationItem[];
}

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(ProvinceEntity)
    private readonly province: Repository<ProvinceEntity>,
    @InjectRepository(CityEntity)
    private readonly city: Repository<CityEntity>,
    @InjectRepository(DistrictsEntity)
    private readonly district: Repository<DistrictsEntity>,
    private readonly configService: ConfigService,
  ) { }

  private getApiKey(): string {
    const apiKey = this.configService.get<string>("RJ_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException("RajaOngkir API key is not configured");
    }
    return apiKey;
  }

  private async fetchFromRajaOngkir(path: string): Promise<RajaOngkirDestinationItem[]> {
    const response = await fetch(`https://rajaongkir.komerce.id/api/v1/destination/${path}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        key: this.getApiKey(),
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException(`Failed to fetch data from RajaOngkir (${path})`);
    }

    const json: RajaOngkirDestinationResponse = await response.json();
    return json.data;
  }

  async getProvinces() {
    const provinces = await this.province.find({
      select: { id: true, name: true },
    });

    if (provinces.length > 0) {
      return provinces;
    }

    const remoteProvinces = await this.fetchFromRajaOngkir("province");

    const entities = remoteProvinces.map((p) =>
      this.province.create({
        external_id: p.id,
        name: p.name,
      }),
    );

    const saved = await this.province.save(entities);

    return saved.map((p) => ({ id: p.id, name: p.name }));
  }

  async getCities(province_id: number) {
    const cities = await this.city.find({
      where: { province_id },
      select: { id: true, name: true },
    });

    if (cities.length > 0) {
      return cities;
    }

    const province = await this.province.findOne({
      where: { id: province_id },
      select: { id: true, external_id: true },
    });

    if (!province) {
      throw new NotFoundException("Province not found");
    }

    const remoteCities = await this.fetchFromRajaOngkir(`city/${province.external_id}`);

    const entities = remoteCities.map((c) =>
      this.city.create({
        external_id: c.id,
        province_id: province.id,
        name: c.name,
      }),
    );

    const saved = await this.city.save(entities);

    return saved.map((c) => ({ id: c.id, name: c.name }));
  }

  async getDistrict(city_id: number) {
    const districts = await this.district.find({
      where: { city_id },
      select: { id: true, name: true },
    });

    if (districts.length > 0) {
      return districts;
    }

    const city = await this.city.findOne({
      where: { id: city_id },
      select: { id: true, external_id: true },
    });

    if (!city) {
      throw new NotFoundException("City not found");
    }

    const remoteDistricts = await this.fetchFromRajaOngkir(`district/${city.external_id}`);

    const entities = remoteDistricts.map((d) =>
      this.district.create({
        external_id: d.id,
        city_id: city.id,
        name: d.name,
      }),
    );

    const saved = await this.district.save(entities);

    return saved.map((d) => ({ id: d.id, name: d.name }));
  }
}
