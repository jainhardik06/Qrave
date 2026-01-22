import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RestockingArmyDocument = RestockingArmy & Document;

export interface RestockingItem {
  item_id: Types.ObjectId;
  item_name: string;
  sku?: string;
  quantity: number;
  unit: string;
}

@Schema({ timestamps: true })
export class RestockingArmy {
  @Prop({ required: true })
  tenant_id!: string;

  @Prop({ required: true })
  name!: string; // e.g., "Standard Restock", "Daily Prep", "Emergency Stock"

  @Prop()
  description?: string;

  @Prop({ required: true, type: [Object] })
  items!: RestockingItem[]; // Array of items with quantities

  @Prop({ default: true })
  is_active?: boolean;

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const RestockingArmySchema = SchemaFactory.createForClass(RestockingArmy);

// Create indexes
RestockingArmySchema.index({ tenant_id: 1 });
RestockingArmySchema.index({ tenant_id: 1, name: 1 }, { unique: true });
RestockingArmySchema.index({ tenant_id: 1, is_active: 1 });
