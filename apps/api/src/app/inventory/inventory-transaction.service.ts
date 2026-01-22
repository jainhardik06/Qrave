import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InventoryTransaction, InventoryTransactionDocument } from '../../schemas/inventory-transaction.schema';

@Injectable()
export class InventoryTransactionService {
  constructor(
    @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransactionDocument>,
  ) {}

  // Get audit trail for an item
  async getAuditTrail(tenantId: string, itemId: string, limit = 100): Promise<InventoryTransactionDocument[]> {
    return this.transactionModel
      .find({
        tenant_id: tenantId,
        item_id: new Types.ObjectId(itemId),
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  // Get all transactions for a tenant
  async getAllTransactions(tenantId: string, limit = 100, skip = 0): Promise<InventoryTransactionDocument[]> {
    return this.transactionModel
      .find({ tenant_id: tenantId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  // Get transactions by order ID
  async getTransactionsByOrder(tenantId: string, orderId: string): Promise<InventoryTransactionDocument[]> {
    return this.transactionModel
      .find({
        tenant_id: tenantId,
        order_id: orderId,
      })
      .sort({ timestamp: -1 })
      .exec();
  }

  // Get transactions by type
  async getTransactionsByType(
    tenantId: string,
    transactionType: string,
    limit = 100,
  ): Promise<InventoryTransactionDocument[]> {
    return this.transactionModel
      .find({
        tenant_id: tenantId,
        transaction_type: transactionType,
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }
}
