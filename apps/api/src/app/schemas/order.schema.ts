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
        variant_id: { type: String },
        toppings: {
          type: [
            {
              topping_id: { type: String, required: true },
              quantity: { type: Number, min: 0, default: 1 },
            },
          ],
          default: [],
        },
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
    variant_id?: string;
    toppings?: Array<{ topping_id: string; quantity?: number }>;
  }>;

  @Prop({ type: Number, required: true, min: 0 })
  total_amount!: number;

  @Prop({ type: String, enum: ['QUEUED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'], default: 'QUEUED' })
  status!: OrderStatus;

  // Consumer reference (replaces customer_name/phone for CRM tracking)
  @Prop({ type: Types.ObjectId, ref: 'Consumer', required: true })
  consumer_id!: Types.ObjectId;

  // Legacy fields (kept for backwards compatibility, auto-populated from Consumer)
  @Prop({ type: String })
  customer_name?: string;

  @Prop({ type: String })
  customer_phone?: string;

  @Prop({ type: String })
  customer_email?: string;

  // Order type & delivery details
  @Prop({ type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'dine-in' })
  order_type!: string;

  @Prop({
    type: {
      address_line: String,
      area: String,
      landmark: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
  })
  delivery_address?: {
    address_line?: string;
    area?: string;
    landmark?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @Prop({ type: Types.ObjectId, ref: 'User' })
  staff_id?: Types.ObjectId;

  @Prop({ type: String })
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
