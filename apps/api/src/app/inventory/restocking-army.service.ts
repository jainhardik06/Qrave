import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RestockingArmy, RestockingArmyDocument, RestockingItem } from '../../schemas/restocking-army.schema';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { InventoryTransaction, InventoryTransactionDocument } from '../../schemas/inventory-transaction.schema';
import { CreateRestockingArmyDto, UpdateRestockingArmyDto } from './dto/restocking-army.dto';

@Injectable()
export class RestockingArmyService {
  constructor(
    @InjectModel(RestockingArmy.name) private restockingArmyModel: Model<RestockingArmyDocument>,
    @InjectModel(InventoryItem.name) private inventoryItemModel: Model<InventoryItemDocument>,
    @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransactionDocument>,
  ) {}

  /**
   * Create a new restocking army template
   */
  async create(tenantId: string, createDto: CreateRestockingArmyDto): Promise<RestockingArmyDocument> {
    // Filter out empty items and validate
    const validItems = createDto.items.filter(item => item.item_id && item.item_id.trim());
    
    if (validItems.length === 0) {
      throw new Error('No valid items provided');
    }

    const itemIds = validItems.map((item) => {
      try {
        return new Types.ObjectId(item.item_id);
      } catch (e) {
        throw new Error(`Invalid item ID format: ${item.item_id}`);
      }
    });

    const items = await this.inventoryItemModel
      .find({ _id: { $in: itemIds }, tenant_id: tenantId })
      .exec();

    if (items.length !== validItems.length) {
      throw new Error(`One or more items not found. Expected ${validItems.length}, found ${items.length}`);
    }

    // Build restocking items with full details
    const restockingItems: RestockingItem[] = validItems.map((itemDto) => {
      const item = items.find((i) => i._id.toString() === itemDto.item_id);
      if (!item) {
        throw new Error(`Item ${itemDto.item_id} not found`);
      }
      return {
        item_id: item._id,
        item_name: item.name,
        sku: item.sku,
        quantity: itemDto.quantity,
        unit: item.unit,
      };
    });

    const army = new this.restockingArmyModel({
      ...createDto,
      items: restockingItems,
      tenant_id: tenantId,
    });

    return army.save();
  }

  /**
   * Get all restocking armies for a tenant
   */
  async findAll(tenantId: string): Promise<RestockingArmyDocument[]> {
    return this.restockingArmyModel.find({ tenant_id: tenantId, is_active: true }).exec();
  }

  /**
   * Get restocking army by ID
   */
  async findById(tenantId: string, armyId: string): Promise<RestockingArmyDocument | null> {
    return this.restockingArmyModel
      .findOne({
        _id: new Types.ObjectId(armyId),
        tenant_id: tenantId,
      })
      .exec();
  }

  /**
   * Update restocking army
   */
  async update(
    tenantId: string,
    armyId: string,
    updateDto: UpdateRestockingArmyDto,
  ): Promise<RestockingArmyDocument | null> {
    // If items are being updated, validate them first
    let updates: any = { ...updateDto, updatedAt: new Date() };

    if (updateDto.items && updateDto.items.length > 0) {
      // Filter out empty item IDs and validate
      const validItems = updateDto.items.filter(item => item.item_id && item.item_id.trim());
      
      if (validItems.length === 0) {
        throw new Error('No valid items provided');
      }

      const itemIds = validItems.map((item) => {
        try {
          return new Types.ObjectId(item.item_id);
        } catch (e) {
          throw new Error(`Invalid item ID format: ${item.item_id}`);
        }
      });

      const items = await this.inventoryItemModel
        .find({ _id: { $in: itemIds }, tenant_id: tenantId })
        .exec();

      if (items.length !== validItems.length) {
        throw new Error(`One or more items not found. Expected ${validItems.length}, found ${items.length}`);
      }

      const restockingItems: RestockingItem[] = validItems.map((itemDto) => {
        const item = items.find((i) => i._id.toString() === itemDto.item_id);
        if (!item) {
          throw new Error(`Item ${itemDto.item_id} not found`);
        }
        return {
          item_id: item._id,
          item_name: item.name,
          sku: item.sku,
          quantity: itemDto.quantity,
          unit: item.unit,
        };
      });

      updates.items = restockingItems;
    }

    return this.restockingArmyModel
      .findOneAndUpdate({ _id: new Types.ObjectId(armyId), tenant_id: tenantId }, updates, {
        new: true,
      })
      .exec();
  }

  /**
   * Delete (deactivate) a restocking army
   */
  async delete(tenantId: string, armyId: string): Promise<RestockingArmyDocument | null> {
    return this.restockingArmyModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(armyId), tenant_id: tenantId },
        { is_active: false },
        { new: true },
      )
      .exec();
  }

  /**
   * Execute a restocking army - add items to inventory
   */
  async execute(
    tenantId: string,
    armyId: string,
    userId?: string,
    notes?: string,
  ): Promise<{ success: boolean; items_restocked: number; errors: string[] }> {
    const army = await this.findById(tenantId, armyId);

    if (!army) {
      throw new Error('Restocking army not found');
    }

    const errors: string[] = [];
    let itemsRestocked = 0;

    // Process each item in the army
    for (const restockingItem of army.items) {
      try {
        const item = await this.inventoryItemModel
          .findOne({
            _id: restockingItem.item_id,
            tenant_id: tenantId,
          })
          .exec();

        if (!item) {
          errors.push(`Item ${restockingItem.sku} not found`);
          continue;
        }

        const newQuantity = item.current_quantity + restockingItem.quantity;

        // Create transaction record
        await this.transactionModel.create({
          tenant_id: tenantId,
          item_id: item._id,
          transaction_type: 'restock',
          quantity_change: restockingItem.quantity,
          quantity_before: item.current_quantity,
          quantity_after: newQuantity,
          reason: 'restocking_army',
          user_id: userId,
          notes: `Restocking from army: ${army.name}. ${notes || ''}`,
        });

        // Update item quantity
        await this.inventoryItemModel.updateOne(
          { _id: item._id },
          { current_quantity: newQuantity, updatedAt: new Date() },
        );

        itemsRestocked++;
      } catch (error: any) {
        errors.push(`Failed to restock ${restockingItem.sku}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      items_restocked: itemsRestocked,
      errors,
    };
  }

  /**
   * Get restocking summary - useful for dashboard
   */
  async getRestockingSummary(tenantId: string): Promise<{
    total_armies: number;
    active_armies: number;
  }> {
    const total = await this.restockingArmyModel.countDocuments({ tenant_id: tenantId });
    const active = await this.restockingArmyModel.countDocuments({
      tenant_id: tenantId,
      is_active: true,
    });

    return { total_armies: total, active_armies: active };
  }
}
