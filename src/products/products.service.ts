import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Product } from "./products.entity";
import { Like, Repository } from "typeorm";

interface FindProps {
  q?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repository: Repository<Product>,
  ) { }

  async findProducts({ q, page = "1", limit = "10" }: FindProps) {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const query = this.repository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.author", "author");

    if (q) {
      query.where("product.title LIKE :q OR author.name LIKE :q", { q: `%${q}%` });
    }

    const [data, total] = await query
      .select(["product.id", "product.slug", "product.title", "product.price", "product.image"])
      .orderBy("product.id", "DESC")
      .skip(skip)
      .take(limitNumber)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async showProduct(slug: string) {
    const product = await this.repository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.author", "author")
      .leftJoinAndSelect("product.publisher", "publisher")
      .leftJoinAndSelect("product.category", "category")
      .where("product.slug = :slug", { slug: slug })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Produk dengan slug "${slug}" tidak ditemukan`);
    }

    return product;
  }

  async findProductByCategory(slug: string, page: string = "1", limit: string = "10") {
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 10, 1);
    const skip = (pageNumber - 1) * limitNumber;

    const query = this.repository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.category", "category")
      .where("category.slug = :slug", { slug: slug });

    const [data, total] = await query
      .select(["product.id", "product.slug", "product.title", "product.price", "product.image"])
      .orderBy("product.id", "DESC")
      .skip(skip)
      .take(limitNumber)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async getProductStock(book_id) {
    return await this.repository.findOne({
      where: { id: book_id },
      select: { id: true, stock: true },
    });
  }
}
