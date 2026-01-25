import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InventoryItemService } from '../inventory/inventory-item.service';
import { InventoryRecipeService } from '../inventory/inventory-recipe.service';
import { InventoryTransactionService } from '../inventory/inventory-transaction.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryRecipeService: InventoryRecipeService,
    private readonly inventoryTransactionService: InventoryTransactionService,
  ) {}

  async create(dto: CreateOrderDto) {
    const computedTotal = dto.total_amount ?? dto.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const payload = { ...dto, total_amount: computedTotal };
    
    try {
      const createdOrder = await this.orderModel.create(payload);
      console.log('✅ Order created:', createdOrder._id);
      
      // Deduct inventory for each dish in the order
      // Get tenant_id from the created order (added by tenancy plugin/middleware)
      const tenantId = (createdOrder as any).tenant_id?.toString();
      const consumerId = dto.consumer_id?.toString();
      
      if (!tenantId) {
        console.warn('⚠️ No tenant_id found in created order');
        return createdOrder;
      }

      for (const item of dto.items) {
        try {
          // Find recipe for this dish
          const dishId = String((item as any).dish_id);
          const recipe = await this.inventoryRecipeService.findByDishId(tenantId, dishId);

          if (!recipe) {
            console.warn(`⚠️ No recipe found for dish ${dishId}. Skipping inventory deduction.`);
            continue;
          }

          const variantId = (item as any).variant_id;
          const toppings = ((item as any).toppings || []) as Array<{ topping_id: string; quantity?: number }>;

          console.log(`📦 ===== DEDUCTING INVENTORY FOR DISH ${dishId} =====`);
          console.log(`📦 Order variant_id:`, variantId, `(type: ${typeof variantId})`);
          console.log(`📦 Order toppings:`, toppings);
          console.log(`📦 Recipe has ${recipe.ingredients.length} total ingredients`);
          
          // Log ALL recipe ingredients with their scopes
          recipe.ingredients.forEach((ing, idx) => {
            console.log(`📦 Recipe ingredient #${idx}:`, {
              item_id: String(ing.item_id),
              quantity: ing.quantity_per_dish,
              unit: ing.unit,
              variant_id: ing.variant_id,
              topping_id: ing.topping_id,
              hasVariant: !!ing.variant_id,
              hasTopping: !!ing.topping_id,
              isBase: !ing.variant_id && !ing.topping_id,
            });
          });

          const baseIngredients = recipe.ingredients.filter((ing) => !ing.variant_id && !ing.topping_id);
          const variantIngredients = variantId 
            ? recipe.ingredients.filter((ing) => {
                // Normalize both to lowercase for case-insensitive comparison
                const normalizedRecipeId = ing.variant_id?.toLowerCase();
                const normalizedOrderId = variantId.toLowerCase();
                const matches = normalizedRecipeId === normalizedOrderId;
                console.log(`📦 Checking variant ingredient: variant_id="${ing.variant_id}" (normalized: "${normalizedRecipeId}") === order variantId="${variantId}" (normalized: "${normalizedOrderId}") ? ${matches}`);
                return matches;
              })
            : [];

          console.log(`📊 ===== INGREDIENT BREAKDOWN =====`);
          console.log(`📊 Base ingredients (no variant/topping): ${baseIngredients.length}`);
          baseIngredients.forEach(ing => console.log(`  - ${String(ing.item_id)}: ${ing.quantity_per_dish} ${ing.unit}`));
          
          console.log(`📊 Variant ingredients (for "${variantId}"): ${variantIngredients.length}`);
          variantIngredients.forEach(ing => console.log(`  - ${String(ing.item_id)}: ${ing.quantity_per_dish} ${ing.unit} [variant: ${ing.variant_id}]`));
          
          console.log(`📊 Available variant IDs in recipe:`, recipe.ingredients.filter(ing => ing.variant_id).map(ing => ing.variant_id));

          console.log(`📊 Available variant IDs in recipe:`, recipe.ingredients.filter(ing => ing.variant_id).map(ing => ing.variant_id));

          const toppingIngredients = toppings.flatMap((top) => {
            const tid = top.topping_id;
            console.log(`📦 Looking for topping ingredients with topping_id="${tid}"`);
            const found = recipe.ingredients
              .filter((ing) => {
                // Normalize both to lowercase for case-insensitive comparison
                const normalizedRecipeId = ing.topping_id?.toLowerCase();
                const normalizedOrderId = tid.toLowerCase();
                const matches = normalizedRecipeId === normalizedOrderId;
                if (ing.topping_id) {
                  console.log(`  - Recipe topping_id="${ing.topping_id}" (normalized: "${normalizedRecipeId}") === order topping_id="${tid}" (normalized: "${normalizedOrderId}") ? ${matches}`);
                }
                return matches;
              })
              .map((ing) => ({ ing, topQty: top.quantity ?? 1 }));
            console.log(`  ✅ Found ${found.length} ingredient(s) for topping "${tid}"`);
            return found;
          });

          console.log(`📊 Topping ingredients: ${toppingIngredients.length}`);
          toppingIngredients.forEach(({ ing, topQty }) => 
            console.log(`  - ${String(ing.item_id)}: ${ing.quantity_per_dish} ${ing.unit} x${topQty} [topping: ${ing.topping_id}]`)
          );

          console.log(`📊 ===== FINAL DEDUCTION LIST =====`);

          console.log(`📊 ===== FINAL DEDUCTION LIST =====`);
          const deductions: Array<{ ingredient: any; multiplier: number }> = [];
          baseIngredients.forEach((ing) => deductions.push({ ingredient: ing, multiplier: 1 }));
          variantIngredients.forEach((ing) => deductions.push({ ingredient: ing, multiplier: 1 }));
          toppingIngredients.forEach(({ ing, topQty }) => deductions.push({ ingredient: ing, multiplier: topQty }));

          console.log(`📊 Total deductions to make: ${deductions.length}`);
          deductions.forEach((d, idx) => {
            const total = d.ingredient.quantity_per_dish * item.quantity * d.multiplier;
            console.log(`  ${idx + 1}. Item: ${String(d.ingredient.item_id)}, Qty: ${total} ${d.ingredient.unit} (${d.ingredient.quantity_per_dish} x ${item.quantity} x ${d.multiplier})`);
          });

          for (const { ingredient, multiplier } of deductions) {
            const totalQuantityNeeded = ingredient.quantity_per_dish * item.quantity * multiplier;
            const itemId = String((ingredient as any).item_id);

            console.log(`💰 Deducting: ${totalQuantityNeeded} ${ingredient.unit} from item ${itemId}`);
            
            await this.inventoryItemService.deductStock(
              tenantId,
              itemId,
              totalQuantityNeeded,
              `Order #${createdOrder._id}`,
              createdOrder._id.toString(),
              consumerId,
              ingredient.unit,
            );
            
            console.log(`✅ Successfully deducted from item ${itemId}`);
          }
        } catch (error) {
          console.error('❌ Failed to deduct inventory for order item', { 
            orderId: createdOrder._id, 
            dishId: item.dish_id,
            error: error instanceof Error ? error.message : error
          });
          // Continue processing other items, but track the error
        }
      }

      return createdOrder;
    } catch (error) {
      console.error('❌ Order creation failed:', error instanceof Error ? error.message : error);
      throw error;
    }
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
    
    // Prevent double-cancellation
    if (previousStatus === 'CANCELLED' && dto.status === 'CANCELLED') {
      console.warn(`⚠️ Order ${id} is already cancelled. Skipping duplicate cancellation.`);
      return existing.toObject();
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Order not found');

    const shouldRefund = dto.status === 'CANCELLED' && previousStatus !== 'CANCELLED';

    if (shouldRefund) {
      const tenantId = existing.tenant_id?.toString();
      const consumerId = existing.consumer_id?.toString();

      if (!tenantId) {
        console.warn('⚠️ No tenant_id in existing order, skipping refund');
        return updated;
      }

      if (tenantId) {
        try {
          console.log(`🔄 ===== REFUNDING CANCELLED ORDER ${existing._id} =====`);
          
          // First check if this order has already been refunded
          const allTransactions = await this.inventoryTransactionService.getTransactionsByOrder(
            tenantId,
            existing._id.toString()
          );

          const hasRefund = allTransactions.some(t => 
            t.transaction_type === 'adjustment' && 
            t.reason === 'order_cancelled'
          );

          if (hasRefund) {
            console.warn('⚠️ Order has already been refunded. Skipping duplicate refund.');
            return updated;
          }

          // Get only usage (deduction) transactions
          const usageTransactions = allTransactions.filter(t => t.transaction_type === 'usage');

          console.log(`📊 Found ${usageTransactions.length} deduction transactions to refund`);
          console.log(`📊 Transactions:`, usageTransactions.map(t => ({
            itemId: String(t.item_id),
            quantityChange: t.quantity_change,
            reason: t.reason,
            notes: t.notes,
          })));

          if (usageTransactions.length === 0) {
            console.warn('⚠️ No deduction transactions found for this order. Nothing to refund.');
            return updated;
          }

          // Refund each deduction transaction
          for (const transaction of usageTransactions) {
            const itemId = String(transaction.item_id);
            const quantityToRefund = Math.abs(transaction.quantity_change); // quantity_change is negative for deductions
            
            console.log(`💰 Refunding transaction:`, {
              itemId,
              originalChange: transaction.quantity_change,
              quantityToRefund,
              reason: transaction.reason,
              quantityBefore: transaction.quantity_before,
              quantityAfter: transaction.quantity_after,
            });

            await this.inventoryItemService.refundStock(
              tenantId,
              itemId,
              quantityToRefund,
              existing._id.toString(),
              consumerId,
            );

            console.log(`✅ Successfully refunded ${quantityToRefund} to item ${itemId}`);
          }

          console.log(`✅ Refund complete: ${usageTransactions.length} items refunded`);
        } catch (error) {
          // Log but do not fail the order status change
          console.error('❌ Refund stock failed for order cancellation', { 
            orderId: id, 
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }
    }

    return updated;
  }
}
