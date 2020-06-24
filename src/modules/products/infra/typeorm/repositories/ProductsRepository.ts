import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productList = await this.ormRepository.find({
      id: In<string>(
        products.map(product => {
          return product.id;
        }),
      ),
    });

    return productList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productListQuantityUpdated: Product[] = [];

    for await (const product of products) {
      const quantityUpdated = await this.ormRepository.findOne({
        where: {
          id: product.id,
        },
      });

      if (quantityUpdated) {
        quantityUpdated.quantity -= product.quantity;

        await this.ormRepository.save(quantityUpdated);

        productListQuantityUpdated.push(quantityUpdated);
      }
    }

    return productListQuantityUpdated;
  }
}

export default ProductsRepository;
