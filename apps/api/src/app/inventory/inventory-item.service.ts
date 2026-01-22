import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { InventoryTransaction, InventoryTransactionDocument } from '../../schemas/inventory-transaction.schema';
import { CreateInventoryItemDto, UpdateInventoryItemDto, AdjustInventoryDto } from './dto/create-inventory-item.dto';
import { convertUnit } from './utils/unit-conversion';

@Injectable()
export class InventoryItemService {
  constructor(
    @InjectModel(InventoryItem.name) private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransactionDocument>,
  ) {}

  async create(tenantId: string, createDto: CreateInventoryItemDto): Promise<InventoryItemDocument> {
    // Auto-generate SKU if not provided
    let sku = createDto.sku;
    if (!sku) {
      // Generate from name: take first 3 chars + random suffix
      const namePrefix = createDto.name.substring(0, 3).toUpperCase();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      sku = `${namePrefix}-${randomSuffix}`;
    }

    const item = new this.inventoryItemModel({
      ...createDto,
      sku,
      tenant_id: tenantId,
    });
    return item.save();
  }

  async findAll(tenantId: string, limit = 50, skip = 0): Promise<InventoryItemDocument[]> {
    return this.inventoryItemModel
      .find({ tenant_id: tenantId, is_active: true })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async search(tenantId: string, query: string): Promise<InventoryItemDocument[]> {
    return this.inventoryItemModel
      .find({
        tenant_id: tenantId,
        is_active: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { sku: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
        ],
      })
      .exec();
  }

  async findById(tenantId: string, itemId: string): Promise<InventoryItemDocument | null> {
    return this.inventoryItemModel
      .findOne({
        _id: new Types.ObjectId(itemId),
        tenant_id: tenantId,
      })
      .exec();
  }

  async update(
    tenantId: string,
    itemId: string,
    updateDto: UpdateInventoryItemDto,
  ): Promise<InventoryItemDocument | null> {
    return this.inventoryItemModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(itemId), tenant_id: tenantId },
        { ...updateDto, updatedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async deductStock(
    tenantId: string,
    itemId: string,
    quantity: number,
    reason: string,
    orderId?: string,
    userId?: string,
    quantityUnit?: string, // Optional: unit of the quantity being deducted (if different from item's unit)
  ): Promise<InventoryItemDocument | null> {
    const item = await this.findById(tenantId, itemId);

    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    // Convert quantity to item's unit if necessary
    let deductQuantity = quantity;
    if (quantityUnit && quantityUnit !== item.unit) {
      try {
        deductQuantity = convertUnit(quantity, quantityUnit, item.unit);
      } catch (error) {
        // If units are incompatible, proceed with the original quantity
        // This maintains backward compatibility
      }
    }

    if (item.current_quantity < deductQuantity) {
      throw new Error(
        `Insufficient stock for ${item.name}. Required: ${deductQuantity.toFixed(2)} ${item.unit}, Available: ${item.current_quantity} ${item.unit}`,
      );
    }

    const newQuantity = item.current_quantity - deductQuantity;

    await this.transactionModel.create({
      tenant_id: tenantId,
      item_id: new Types.ObjectId(itemId),
      transaction_type: 'usage',
      quantity_change: -deductQuantity,
      quantity_before: item.current_quantity,
      quantity_after: newQuantity,
      reason,
      order_id: orderId,
      user_id: userId,
      notes: `Stock deducted for order ${orderId}`,
    });

    return this.inventoryItemModel
      .findByIdAndUpdate(item._id, { current_quantity: newQuantity }, { new: true })
      .exec();
  }

  async refundStock(
    tenantId: string,
    itemId: string,
    quantity: number,
    orderId: string,
    userId?: string,
  ): Promise<InventoryItemDocument | null> {
    const item = await this.findById(tenantId, itemId);

    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const newQuantity = item.current_quantity + quantity;

    await this.transactionModel.create({
      tenant_id: tenantId,
      item_id: new Types.ObjectId(itemId),
      transaction_type: 'adjustment',
      quantity_change: quantity,
      quantity_before: item.current_quantity,
      quantity_after: newQuantity,
      reason: 'order_cancelled',
      order_id: orderId,
      user_id: userId,
      notes: `Stock refunded due to cancelled order ${orderId}`,
    });

    return this.inventoryItemModel
      .findByIdAndUpdate(item._id, { current_quantity: newQuantity }, { new: true })
      .exec();
  }

  async adjustStock(
    tenantId: string,
    itemId: string,
    adjustDto: AdjustInventoryDto,
  ): Promise<InventoryItemDocument | null> {
    const item = await this.findById(tenantId, itemId);

    if (!item) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const newQuantity = item.current_quantity + adjustDto.quantity_change;

    if (newQuantity < 0) {
      throw new Error('Cannot adjust: would result in negative stock');
    }

    await this.transactionModel.create({
      tenant_id: tenantId,
      item_id: new Types.ObjectId(itemId),
      transaction_type: 'adjustment',
      quantity_change: adjustDto.quantity_change,
      quantity_before: item.current_quantity,
      quantity_after: newQuantity,
      reason: adjustDto.reason,
      user_id: adjustDto.user_id,
      notes: adjustDto.notes,
    });

    return this.inventoryItemModel
      .findByIdAndUpdate(item._id, { current_quantity: newQuantity }, { new: true })
      .exec();
  }

  async getLowStockItems(tenantId: string): Promise<InventoryItemDocument[]> {
    return this.inventoryItemModel
      .find({
        tenant_id: tenantId,
        is_active: true,
        $expr: { $lte: ['$current_quantity', '$reorder_level'] },
      })
      .exec();
  }

  async getTotalValue(tenantId: string): Promise<number> {
    const items = await this.inventoryItemModel
      .find({ tenant_id: tenantId, is_active: true })
      .exec();
    return items.reduce((total, item) => total + item.current_quantity * item.cost_per_unit, 0);
  }

  async getItemsCount(tenantId: string): Promise<number> {
    return this.inventoryItemModel.countDocuments({ tenant_id: tenantId, is_active: true });
  }

  async deactivate(tenantId: string, itemId: string): Promise<InventoryItemDocument | null> {
    return this.inventoryItemModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(itemId), tenant_id: tenantId },
        { is_active: false },
        { new: true },
      )
      .exec();
  }
}
