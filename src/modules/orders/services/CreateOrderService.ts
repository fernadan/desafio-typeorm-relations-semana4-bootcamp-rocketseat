import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const orderDTO: ICreateOrderDTO = {
      customer,
      products: [],
    };

    for await (const product of products) {
      const productFindedById = await this.productsRepository.findAllById([
        { id: product.id },
      ]);

      if (productFindedById && productFindedById.length > 0) {
        if (product.quantity > productFindedById[0].quantity) {
          throw new AppError('Insufficient product quantity.');
        }

        orderDTO.products.push({
          product_id: product.id,
          price: productFindedById[0].price,
          quantity: product.quantity,
        });
      } else {
        throw new AppError('Invalid product.');
      }
    }

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create(orderDTO);

    return order;
  }
}

export default CreateOrderService;
