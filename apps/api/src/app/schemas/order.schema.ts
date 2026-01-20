import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export type OrderStatus = 'QUEUED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant_id!: Types.ObjectId;

  @Prop({
    type: [
      {
        dish_id: { type: MongooseSchema.Types.ObjectId, ref: 'Dish', required: true },
        quantity: { type: Number, min: 1, required: true },
        price: { type: Number, min: 0, required: true },
        notes: { type: String },
      },
    ],
    required: true,
    default: [],
  })
  items!: Array<{
    dish_id: Types.ObjectId;
    quantity: number;
    price: number;
    notes?: string;
  }>;

  @Prop({ type: Number, required: true, min: 0 })
  total_amount!: number;

  @Prop({ type: String, enum: ['QUEUED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'], default: 'QUEUED' })
  status!: OrderStatus;

  @Prop({ type: String })
  customer_name?: string;

  @Prop({ type: String })
  customer_phone?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  staff_id?: Types.ObjectId;

  @Prop({ type: String })
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
