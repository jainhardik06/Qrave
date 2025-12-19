import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TenantDocument = HydratedDocument<Tenant>;

@Schema({ timestamps: true })
export class Tenant {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  subdomain!: string;

  @Prop({ type: String, default: 'TRIAL' })
  subscription_status!: string;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
(TenantSchema as any).set('skipTenantPlugin', true);
