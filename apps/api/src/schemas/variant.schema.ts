import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VariantDocument = Variant & Document;

@Schema({ timestamps: true })
export class Variant {
  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ default: 1.0 })
  price_multiplier: number = 1.0;

  @Prop({ default: true })
  is_active: boolean = true;

  @Prop({ default: Date.now })
  created_at: Date = new Date();

  @Prop({ default: Date.now })
  updated_at: Date = new Date();
}

export const VariantSchema = SchemaFactory.createForClass(Variant);
