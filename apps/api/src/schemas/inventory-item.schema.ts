import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InventoryItemDocument = InventoryItem & Document;

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({ required: true })
  tenant_id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ unique: true, sparse: true })
  sku?: string;

  @Prop({ required: true })
  unit!: string; // kg, g, L, ml, piece, box, etc.

  @Prop({ required: true })
  cost_per_unit!: number; // Cost per single unit (e.g., cost per kg or cost per piece)

  @Prop({ required: true })
  current_quantity!: number; // Quantity in the specified unit

  @Prop()
  reorder_level?: number; // When to reorder (in same unit)

  @Prop()
  reorder_quantity?: number; // How much to order (in same unit)

  @Prop()
  restocking_quantity?: number; // Default amount for bulk restocking (in same unit)

  @Prop()
  category?: string;

  @Prop()
  supplier_id?: string;

  @Prop()
  storage_location?: string;

  @Prop({ default: true })
  is_active?: boolean;

  @Prop()
  description?: string;

  @Prop()
  image_url?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);

// Create indexes for performance
InventoryItemSchema.index({ tenant_id: 1 });
InventoryItemSchema.index({ tenant_id: 1, sku: 1 }, { unique: true, sparse: true });
InventoryItemSchema.index({ tenant_id: 1, current_quantity: 1 });
InventoryItemSchema.index({ tenant_id: 1, name: 'text' }); // For text search
