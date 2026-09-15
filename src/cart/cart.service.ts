import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CartEntity } from "./entities/cart.entity";
import { CartDTO, UpdateCartQuantity } from "./dto/cart.dto";
import { retry } from "rxjs";
import { Product } from "src/products/products.entity";
import { ProductsService } from "src/products/products.service";

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartEntity)
    private readonly cart: Repository<CartEntity>,
    private readonly productService: ProductsService,
  ) { }

  async create(dto: CartDTO, user_id: number) {
    return await this.cart.create({
      book_id: dto.book_id,
      quantity: dto.quantity,
      user_id: user_id,
    });
  }

  async updateQuantity(dto: UpdateCartQuantity, user_id: number) {
    const cartProduct = await this.cart.findOne({ where: { id: dto.id, user_id } });
    if (!cartProduct) {
      throw new NotFoundException("Data cart cant be found");
    }

    const product = await this.productService.getProductStock(dto.book_id);
    if (!product) {
      this.cart.delete(cartProduct);
      throw new NotFoundException("Something went wrong, cant find data product");
    }

    if (!dto.method) {
      if (product.stock < dto.quantity) {
        throw new ConflictException(`Product stock only available at ${product.stock}`);
      }
      cartProduct.quantity = dto.quantity;
      return await this.cart.save(cartProduct);
    } else {
      if (dto.method == "add") {
        if (product.stock < cartProduct.quantity + 1) {
          throw new ConflictException(`Product stock only available at ${product.stock}`);
        }
        cartProduct.quantity += 1;
        return await this.cart.save(cartProduct);
      } else if (dto.method == "reduce") {
        if (cartProduct.quantity == 1) {
          return this.cart.delete(cartProduct);
        }
        cartProduct.quantity -= 1;
        return this.cart.save(cartProduct);
      } else {
        return;
      }
    }
  }

  async deleteCart(cart_id, user_id) {
    return await this.cart.delete({ id: cart_id, user_id });
  }
}
