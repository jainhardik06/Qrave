import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  subdomain!: string;

  @Prop({ type: String, enum: ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'], default: 'TRIAL' })
  subscription_status!: string;

  @Prop({ type: Number, default: 0 })
  monthly_revenue?: number;

  @Prop({ type: Date })
  trial_ends_at?: Date;

  @Prop({ type: Date })
  subscribed_at?: Date;

  @Prop({ type: Object, default: {
    menu_management: true,
    order_processing: true,
    staff_management: true,
    analytics: false,
    customer_database: false,
    payment_integration: false
  }})
  features?: Record<string, boolean>;

  @Prop({ type: Boolean, default: true })
  is_active!: boolean;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
(TenantSchema as any).set('skipTenantPlugin', true);
