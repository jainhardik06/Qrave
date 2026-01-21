import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConsumerDocument = HydratedDocument<Consumer>;

/**
 * Consumer Schema - Represents end customers who order via QR menu
 * Separate from User schema (which is for staff/admin)
 * 
 * Key Features:
 * - Phone number as primary identifier per tenant
 * - Name can be updated without creating new consumer
 * - Stores order history, addresses, preferences
 * - Used for CRM, billing, analytics
 */
@Schema({ timestamps: true })
export class Consumer {
  @Prop({ type: String, ref: 'Tenant', required: true })
  tenant_id!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  // Address history for delivery orders
  @Prop({
    type: [
      {
        address_line: String,
        area: String,
        landmark: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        last_used_at: Date,
      },
    ],
    default: [],
  })
  addresses!: Array<{
    address_line?: string;
    area?: string;
    landmark?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    last_used_at?: Date;
  }>;

  // CRM & Analytics fields
  @Prop({ default: 0 })
  total_orders!: number;

  @Prop({ default: 0 })
  total_spent!: number;

  @Prop({ type: Date })
  last_order_at?: Date;

  @Prop({ type: Date })
  first_order_at?: Date;

  // Preferences & Notes
  @Prop({ type: [String], default: [] })
  dietary_preferences!: string[];

  @Prop()
  notes?: string;

  @Prop({ default: true })
  is_active!: boolean;
}

export const ConsumerSchema = SchemaFactory.createForClass(Consumer);

// Create compound index for phone + tenant_id (unique per tenant)
ConsumerSchema.index({ tenant_id: 1, phone: 1 }, { unique: true });
