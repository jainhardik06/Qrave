import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true })
  tenant_id!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
