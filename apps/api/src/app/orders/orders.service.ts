import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private readonly orderModel: Model<Order>) {}

  async create(dto: CreateOrderDto) {
    const computedTotal = dto.total_amount ?? dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const payload = { ...dto, total_amount: computedTotal };
    return this.orderModel.create(payload);
  }

  async findAll(status?: string) {
    const query = status ? { status } : {};
    return this.orderModel.find(query).sort({ createdAt: -1 }).lean().exec();
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id).lean().exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const updated = await this.orderModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!updated) throw new NotFoundException('Order not found');
    return updated;
  }
}
