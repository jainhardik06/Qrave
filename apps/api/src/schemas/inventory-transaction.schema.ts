import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryTransactionDocument = InventoryTransaction & Document;

@Schema({ timestamps: true })
export class InventoryTransaction {
  @Prop({ required: true })
  tenant_id!: string;

  @Prop({ required: true, type: Types.ObjectId })
  item_id!: Types.ObjectId;

  @Prop({ required: true })
  transaction_type!: string;

  @Prop({ required: true })
  quantity_change!: number;

  @Prop({ required: true })
  quantity_before!: number;

  @Prop({ required: true })
  quantity_after!: number;

  @Prop()
  reason?: string;

  @Prop()
  order_id?: string;

  @Prop()
  reference_id?: string;

  @Prop()
  user_id?: string;

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  timestamp?: Date;
}

export const InventoryTransactionSchema = SchemaFactory.createForClass(InventoryTransaction);

// Create indexes
InventoryTransactionSchema.index({ tenant_id: 1 });
InventoryTransactionSchema.index({ tenant_id: 1, item_id: 1, timestamp: -1 });
InventoryTransactionSchema.index({ order_id: 1 });
