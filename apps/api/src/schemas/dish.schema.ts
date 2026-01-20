import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DishDocument = Dish & Document;

export interface Inventory {
  ingredient_id: Types.ObjectId;
  quantity_per_serving: number;
  unit: string;
}

export interface DishVariant {
  name: string;
  price: number;
}

export interface Topping {
  _id?: Types.ObjectId;
  name: string;
  price: number;
}

@Schema({ timestamps: true })
export class Dish {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant_id!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Category', required: true, default: [] })
  category_ids!: Types.ObjectId[];

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop()
  image_url?: string;

  @Prop({ default: 0 })
  base_price!: number;

  @Prop({ type: [Object], default: [] })
  variants!: DishVariant[];

  @Prop({ type: [Object], default: [] })
  toppings!: Topping[];

  @Prop({ type: [String], default: [] })
  allergens!: string[];

  @Prop({ type: [String], default: [] })
  dietary_tags!: string[];

  @Prop({ default: 15 })
  preparation_time_minutes!: number;

  @Prop({ default: false })
  is_bestseller!: boolean;

  @Prop({ default: false })
  is_new!: boolean;

  @Prop({ default: true })
  is_available!: boolean;

  @Prop({ type: [Object], default: [] })
  inventory_consumption!: Inventory[];

  @Prop({ default: 0 })
  calories!: number;

  @Prop({ default: false })
  is_vegetarian!: boolean;

  @Prop({ default: false })
  is_vegan!: boolean;

  @Prop({ default: Date.now })
  created_at!: Date;

  @Prop({ default: Date.now })
  updated_at!: Date;
}

export const DishSchema = SchemaFactory.createForClass(Dish);
