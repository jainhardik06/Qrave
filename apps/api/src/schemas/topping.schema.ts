import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ToppingDocument = Topping & Document;

@Schema({ timestamps: true })
export class Topping {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant_id: any;

  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ default: 0 })
  price: number = 0;

  @Prop({ default: true })
  is_active: boolean = true;

  @Prop({ default: Date.now })
  created_at: Date = new Date();

  @Prop({ default: Date.now })
  updated_at: Date = new Date();
}

export const ToppingSchema = SchemaFactory.createForClass(Topping);
