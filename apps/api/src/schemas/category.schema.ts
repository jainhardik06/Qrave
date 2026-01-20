import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: String, ref: 'Tenant', required: true })
  tenant_id: string = '';

  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: 'utensils' })
  icon: string = 'utensils';

  @Prop({ default: '#ef4444' })
  color: string = '#ef4444';

  @Prop({ default: 0 })
  order: number = 0;

  @Prop({ default: true })
  is_active: boolean = true;

  @Prop({ default: Date.now })
  created_at: Date = new Date();

  @Prop({ default: Date.now })
  updated_at: Date = new Date();
}

export const CategorySchema = SchemaFactory.createForClass(Category);
