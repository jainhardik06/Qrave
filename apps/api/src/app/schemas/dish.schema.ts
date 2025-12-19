import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Dish extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  category!: string;

  @Prop()
  image_url?: string;

  @Prop({ default: true })
  is_available!: boolean;

  @Prop({
    type: [
      {
        inventory_item_id: { type: MongooseSchema.Types.ObjectId, ref: 'Inventory' },
        quantity: { type: Number, min: 0 },
      },
    ],
    default: [],
  })
  recipe!: Record<string, any>[];
}

export const DishSchema = SchemaFactory.createForClass(Dish);
