import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InventoryRecipeDocument = InventoryRecipe & Document;

export interface RecipeIngredient {
  item_id: Types.ObjectId;
  quantity_per_dish: number;
  unit: string;
  // Optional scoping for variant- or topping-specific consumption (use string IDs for flexibility)
  variant_id?: string;
  topping_id?: string;
}

@Schema({ timestamps: true })
export class InventoryRecipe {
  @Prop({ required: true })
  tenant_id!: string;

  @Prop({ required: true, type: Types.ObjectId })
  dish_id!: Types.ObjectId;

  @Prop({ required: true })
  dish_name!: string;

  @Prop({ required: true, type: [Object] })
  ingredients!: RecipeIngredient[];

  @Prop()
  total_cost_per_dish?: number;

  @Prop({ default: true })
  is_active?: boolean;

  @Prop()
  notes?: string;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const InventoryRecipeSchema = SchemaFactory.createForClass(InventoryRecipe);

// Create indexes
InventoryRecipeSchema.index({ tenant_id: 1 });
InventoryRecipeSchema.index({ tenant_id: 1, dish_id: 1 }, { unique: true });
