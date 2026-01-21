import { Body, Controller, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ConsumerService } from './consumer.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('public/orders')
export class PublicOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly consumerService: ConsumerService,
  ) {}

  @Post()
  async create(@Body() body: any) {
    // Extract customer details
    const customerName = body.customer_name || body.customerName;
    const customerPhone = body.customer_phone || body.customerPhone;
    const customerEmail = body.customer_email || body.customerEmail;

    if (!customerPhone) {
      throw new Error('Customer phone is required');
    }

    // Find or create consumer (handles name updates automatically)
    const consumer = await this.consumerService.findOrCreate({
      phone: customerPhone,
      name: customerName || 'Guest',
      email: customerEmail,
    });

    // Map incoming QR payload to CreateOrderDto shape
    const dto: CreateOrderDto = {
      items: (body.items || []).map((i: any) => ({
        dish_id: i.dish_id || i.dish,
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
        notes: i.notes,
      })),
      total_amount: typeof body.total_amount === 'number' ? body.total_amount : undefined,
      consumer_id: (consumer as any)._id.toString(),
      customer_name: consumer.name,
      customer_phone: consumer.phone,
      customer_email: consumer.email,
      order_type: body.order_type || body.deliveryType || 'dine-in',
      delivery_address: body.delivery_address || body.addressForm,
      notes: body.notes,
      status: 'QUEUED',
    };

    // Create order
    const order = await this.ordersService.create(dto);

    // Update consumer stats
    await this.consumerService.updateOrderStats((consumer as any)._id.toString(), dto.total_amount || 0);

    // Save delivery address if provided
    if (dto.order_type === 'delivery' && dto.delivery_address) {
      await this.consumerService.updateAddress((consumer as any)._id.toString(), dto.delivery_address);
    }

    return order;
  }
}
