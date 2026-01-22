import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InventoryItemService } from '../inventory/inventory-item.service';
import { InventoryRecipeService } from '../inventory/inventory-recipe.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryRecipeService: InventoryRecipeService,
  ) {}

  async create(dto: CreateOrderDto) {
    const computedTotal = dto.total_amount ?? dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const payload = { ...dto, total_amount: computedTotal };
    const createdOrder = await this.orderModel.create(payload);
    
    // Deduct inventory for each dish in the order
    // Get tenant_id from the created order (added by tenancy plugin/middleware)
    const tenantId = (createdOrder as any).tenant_id?.toString();
    const consumerId = dto.consumer_id?.toString();
    
    if (tenantId) {
      for (const item of dto.items) {
        try {
          // Find recipe for this dish
          const recipe = await this.inventoryRecipeService.findByDishId(tenantId, item.dish_id.toString());
          
          if (recipe && recipe.ingredients) {
            // Deduct each ingredient from inventory
            for (const ingredient of recipe.ingredients) {
              const totalQuantityNeeded = ingredient.quantity_per_dish * item.quantity;
              
              await this.inventoryItemService.deductStock(
                tenantId,
                ingredient.item_id.toString(),
                totalQuantityNeeded,
                `Order #${createdOrder._id}`,
                createdOrder._id.toString(),
                consumerId,
                ingredient.unit,
              );
            }
          }
        } catch (error) {
          // Log but don't fail the order if inventory deduction fails
          // eslint-disable-next-line no-console
          console.error('Failed to deduct inventory for order item', { 
            orderId: createdOrder._id, 
            dishId: item.dish_id,
            error 
          });
        }
      }
    }
    
    return createdOrder;
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
    const existing = await this.orderModel.findById(id).exec();
    if (!existing) throw new NotFoundException('Order not found');

    const previousStatus = existing.status;

    const updated = await this.orderModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Order not found');

    const shouldRefund = dto.status === 'CANCELLED' && previousStatus !== 'CANCELLED';

    if (shouldRefund) {
      const tenantId = existing.tenant_id?.toString();
      const consumerId = existing.consumer_id?.toString();

      if (tenantId) {
        for (const item of existing.items || []) {
          try {
            const recipe = await this.inventoryRecipeService.findByDishId(tenantId, item.dish_id.toString());
            if (!recipe) continue;

            for (const ingredient of recipe.ingredients) {
              const qty = ingredient.quantity_per_dish * item.quantity;
              await this.inventoryItemService.refundStock(
                tenantId,
                ingredient.item_id.toString(),
                qty,
                existing._id.toString(),
                consumerId,
              );
            }
          } catch (error) {
            // Log but do not fail the order status change
            // eslint-disable-next-line no-console
            console.error('Refund stock failed for order cancellation', { orderId: id, error });
          }
        }
      }
    }

    return updated;
  }
}
