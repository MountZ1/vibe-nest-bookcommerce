import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { ConfigService } from "@nestjs/config";

import { Product } from "src/products/products.entity";
import { CartEntity } from "src/cart/entities/cart.entity";
import { Profile } from "src/user/entities/profile.entity";
import { DistrictsEntity } from "src/zones/entities/district.entity";
import { ExpeditionEntity } from "./entity/expedition.entity";
import { OrderEntity, PurchaseStatus } from "./entity/order.entity";
import { PurchaseDetailEntity } from "./entity/purchase-detail.entity";
import { CheckoutDTO } from "./dto/checkout.dto";
import { CreateOrderDTO } from "./dto/create-order.dto";

export interface CartProductDetail {
  cart_id: number;
  book_id: number;
  quantity: number;
  price: number;
  weight: number;
}

interface DistrictOrigin {
  id: number;
  external_id: number;
}

export interface ShippingOption {
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
}

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(CartEntity)
    private readonly cartRepo: Repository<CartEntity>,
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(ExpeditionEntity)
    private readonly expeditionRepo: Repository<ExpeditionEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(DistrictsEntity)
    private readonly districtRepo: Repository<DistrictsEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) { }

  private async getCartDetails(cartIds: number[], user_id: number): Promise<CartProductDetail[]> {
    const carts = await this.cartRepo.find({
      where: { id: In(cartIds), user_id },
    });

    if (carts.length !== cartIds.length) {
      throw new NotFoundException("One or more cart items were not found");
    }

    const bookIds = carts.map((c) => c.book_id);

    const products = await this.productRepo.find({
      where: { id: In(bookIds) },
      select: { id: true, price: true, weight: true, title: true, image: true },
    });

    if (products.length !== bookIds.length) {
      throw new NotFoundException("One or more products no longer exist");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    return carts.map((cart) => {
      const product = productMap.get(cart.book_id);
      return {
        cart_id: cart.id,
        book_id: cart.book_id,
        quantity: cart.quantity,
        price: Number(product.price),
        title: product.title,
        image: product.image,
        weight: product.weight,
      };
    });
  }

  private async getDestinationExternalId(user_id: number): Promise<number> {
    const profile = await this.profileRepo.findOne({
      where: { user_id },
      relations: { district: true },
    });

    if (!profile?.district) {
      throw new NotFoundException("User address/district is not set");
    }

    return profile.district.external_id;
  }

  async getCheckoutSummary(dto: CheckoutDTO, user_id: number) {
    const details = await this.getCartDetails(dto.cart_id, user_id);
    const destination = await this.getDestinationExternalId(user_id);
    const shippingOptions = await this.calculateShippingCost(details, user_id, destination);

    const subtotal = details.reduce((sum, d) => sum + d.price * d.quantity, 0);

    return {
      items: details,
      subtotal,
      shipping_options: shippingOptions,
    };
  }

  private async calculateShippingCost(
    productDetail: CartProductDetail[],
    user_id: number,
    location: number,
  ): Promise<ShippingOption[]> {
    const totalWeight = productDetail.reduce((sum, item) => sum + item.weight * item.quantity, 0);

    const cacheKey = {
      EXPEDITIONS: "expeditions",
      DISTRICT_ORIGIN: "district_origin_id",
      USER_REQUEST: `shipping_cost_${totalWeight}_to_${location}`,
    };

    let expeditions = await this.cacheManager.get<{ id: number; code: string }[]>(
      cacheKey.EXPEDITIONS,
    );
    if (!expeditions) {
      expeditions = await this.expeditionRepo.find({ select: { id: true, code: true } });
      await this.cacheManager.set(cacheKey.EXPEDITIONS, expeditions, 30 * 60 * 1000);
    }

    const expeditionCodes = expeditions.map((e) => e.code);
    const expeditionMap = new Map(expeditions.map((e) => [e.code, e.id])); // code -> id

    let districtOrigin = await this.cacheManager.get<DistrictOrigin>(cacheKey.DISTRICT_ORIGIN);
    if (!districtOrigin) {
      const district = await this.districtRepo.findOne({
        where: { name: "BANYUMANIK" },
        select: { id: true, external_id: true },
      });

      if (!district) {
        throw new InternalServerErrorException("Origin district is not configured");
      }

      districtOrigin = district;
      await this.cacheManager.set(cacheKey.DISTRICT_ORIGIN, districtOrigin, 24 * 3600 * 1000);
    }

    let shippingOptions = await this.cacheManager.get<ShippingOption[]>(cacheKey.USER_REQUEST);
    if (!shippingOptions) {
      const apiKey = this.configService.get<string>("RJ_API_KEY");
      if (!apiKey) {
        throw new InternalServerErrorException("RajaOngkir API key is not configured");
      }

      const response = await fetch(
        "https://rajaongkir.komerce.id/api/v1/calculate/district/domestic-cost",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            key: apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            origin: String(districtOrigin.external_id),
            destination: String(location),
            courier: expeditionCodes.join(":"),
            weight: String(totalWeight),
            price: "lowest",
          }),
        },
      );

      const json = await response.json();

      if (!response.ok) {
        throw new InternalServerErrorException(
          json.meta?.message || "Failed to fetch shipping cost",
        );
      }

      // Merge expedition_id ke tiap hasil, cocokkan berdasarkan code
      shippingOptions = (json.data as ShippingOption[])
        .map((option) => ({
          ...option,
          expedition_id: expeditionMap.get(option.code) ?? null,
        }))
        .filter((option) => option.expedition_id !== null); // buang kalau code tidak match di DB

      await this.cacheManager.set(cacheKey.USER_REQUEST, shippingOptions, 30 * 60 * 1000);
    }

    return shippingOptions;
  }

  async createOrder(dto: CreateOrderDTO, user_id: number) {
    const details = await this.getCartDetails(dto.cart_id, user_id);

    const expedition = await this.expeditionRepo.findOne({ where: { id: dto.expedition_id } });
    if (!expedition) {
      throw new NotFoundException("Expedition not found");
    }

    const destination = await this.getDestinationExternalId(user_id);
    const shippingOptions = await this.calculateShippingCost(details, user_id, destination);

    const selectedShipping = shippingOptions.find(
      (opt) => opt.code === expedition.code && opt.service === dto.service,
    );

    if (!selectedShipping) {
      throw new NotFoundException("Selected shipping service is not available");
    }

    const subtotal = details.reduce((sum, d) => sum + d.price * d.quantity, 0);
    const shippingCost = selectedShipping.cost;
    const totalPrice = subtotal + shippingCost;

    const invoiceNumber = `INV-${Date.now()}-${user_id}`;

    return this.dataSource.transaction(async (manager) => {
      for (const item of details) {
        const product = await manager
          .createQueryBuilder(Product, "product")
          .setLock("pessimistic_write")
          .where("product.id = :id", { id: item.book_id })
          .getOne();

        if (!product) {
          throw new NotFoundException(`Product ${item.book_id} no longer exists`);
        }
        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Product with id ${item.book_id} stock only available at ${product.stock}`,
          );
        }

        await manager.decrement(Product, { id: item.book_id }, "stock", item.quantity);
      }

      const orderData = {
        user: { id: user_id },
        expedition: { id: dto.expedition_id },
        invoice_number: invoiceNumber,
        subtotal: subtotal,
        shipping_cost: shippingCost,
        total_price: totalPrice,
        status: PurchaseStatus.PENDING,
        purchased_at: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }),
      };

      const order = manager.create(OrderEntity, orderData);
      const savedOrder = await manager.save(order);

      const orderDetails = details.map((item) =>
        manager.create(PurchaseDetailEntity, {
          purchase: { id: savedOrder.id },
          book: { id: item.book_id },
          subtotal: item.price * item.quantity,
          quantity: item.quantity,
          price: item.price,
        }),
      );
      await manager.save(orderDetails);

      await manager.delete(CartEntity, { id: In(dto.cart_id) });

      return savedOrder;
    });
  }

  async getOrderByUserId(user_id: number, page: number = 1, limit: number = 10) {
    const [orders, total] = await this.orderRepo
      .createQueryBuilder("order")
      .leftJoin("order.detail", "detail")
      .leftJoin("detail.book", "product")
      .select([
        "order.id",
        "order.invoice_number",
        "order.subtotal",
        "order.shipping_cost",
        "order.total_price",
        "order.status",
        "order.purchased_at",
        "detail.id",
        "detail.quantity",
        "product.id",
        "product.title",
        "product.image",
      ])
      .where("order.user_id = :user_id", { user_id })
      .orderBy("order.purchased_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const data = orders.map((order) => {
      const firstDetail = order.detail?.[0];

      return {
        invoice_number: order.invoice_number,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        total_price: order.total_price,
        status: order.status,
        purchased_at: order.purchased_at,
        total_items: order.detail.reduce((sum, d) => sum + d.quantity, 0),
        item: firstDetail
          ? {
            title: firstDetail.book?.title ?? null,
            image: firstDetail.book?.image ?? null,
            quantity: firstDetail.quantity,
          }
          : null,
        has_more: order.detail.length > 1,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderByInvoice(invoice_number: string, user_id: number) {
    const order = await this.orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.expedition", "expedition")
      .leftJoinAndSelect("order.detail", "detail")
      .leftJoinAndSelect("detail.book", "book")
      .where("order.invoice_number = :invoice_number", { invoice_number })
      .andWhere("order.user_id = :user_id", { user_id })
      .getOne();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return {
      invoice_number: order.invoice_number,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      total_price: order.total_price,
      status: order.status,
      purchased_at: order.purchased_at,
      expedition: {
        name: order.expedition?.name ?? null,
        code: order.expedition?.code ?? null,
      },
      items: order.detail.map((d) => ({
        id: d.id,
        book_id: d.book?.id,
        title: d.book?.title,
        image: d.book?.image,
        quantity: d.quantity,
        price: d.price,
        subtotal: d.price * d.quantity,
      })),
    };
  }
}
