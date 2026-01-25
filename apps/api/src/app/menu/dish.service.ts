import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dish, DishDocument } from '../../schemas/dish.schema';
import { RequestContext } from '../../common/context/request-context';

@Injectable()
export class DishService {
  constructor(
    @InjectModel(Dish.name) private dishModel: Model<DishDocument>,
  ) {}

  async create(createDishDto: {
    category_ids: string[];
    name: string;
    description?: string;
    image_url?: string;
    base_price: number;
    variants?: any[];
    toppings?: any[];
    allergens?: string[];
    dietary_tags?: string[];
    preparation_time_minutes?: number;
    is_bestseller?: boolean;
    is_new?: boolean;
    is_available?: boolean;
    calories?: number;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
  }): Promise<Dish> {
    try {
      const tenant_id = RequestContext.getTenantId();
      console.log('DishService.create - tenant_id:', tenant_id, 'type:', typeof tenant_id);
      const { category_ids, variants, toppings, ...rest } = createDishDto;
      
      if (!category_ids || category_ids.length === 0) {
        throw new Error('At least one category_id is required');
      }
      
      if (!tenant_id) {
        throw new Error('Tenant ID is required');
      }

      // Generate _id for variants that don't have one (slug-based)
      const processedVariants = (variants || []).map(v => {
        if (!v._id) {
          const slug = (v.name || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          return { ...v, _id: slug };
        }
        return v;
      });

      // Generate _id for toppings that don't have one (slug-based)
      const processedToppings = (toppings || []).map(t => {
        if (!t._id) {
          const slug = (t.name || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          return { ...t, _id: slug };
        }
        return t;
      });
      
      // Store tenant_id as string (database stores it as string)
      const dish = new this.dishModel({
        tenant_id: tenant_id,
        category_ids: category_ids.map(id => new Types.ObjectId(id)),
        variants: processedVariants,
        toppings: processedToppings,
        ...rest,
      });
      console.log('DishService.create - saving dish with tenant_id:', tenant_id, 'categories:', category_ids.length);
      return dish.save();
    } catch (error) {
      console.error('Error creating dish:', error);
      throw error;
    }
  }

  async findAll(
    categoryId?: string,
    allergen?: string,
  ): Promise<Dish[]> {
    const tenant_id = RequestContext.getTenantId();
    console.log('DishService.findAll - tenant_id:', tenant_id, 'type:', typeof tenant_id);
    
    if (!tenant_id) {
      console.warn('DishService.findAll - No tenant_id found!');
      return [];
    }
    
    // Query with string tenant_id (database stores it as string)
    const query: any = { tenant_id: tenant_id };
    
    if (categoryId) {
      // Use $in operator for array field
      query.category_ids = { $in: [new Types.ObjectId(categoryId)] };
    }

    if (allergen) {
      query.allergens = { $nin: [allergen] };
    }

    console.log('DishService.findAll - query:', JSON.stringify(query));
    const dishes = await this.dishModel.find(query).exec();
    console.log('DishService.findAll - found dishes:', dishes.length);
    return dishes;
  }

  async findOne(id: string): Promise<Dish | null> {
    const tenant_id = RequestContext.getTenantId();
    return this.dishModel.findOne({
      _id: new Types.ObjectId(id),
      tenant_id: tenant_id,
    });
  }

  async update(
    id: string,
    updateDishDto: Partial<any>,
  ): Promise<Dish | null> {
    const tenant_id = RequestContext.getTenantId();
    const updateData: any = { ...updateDishDto, updated_at: new Date() };
    
    // If category_ids are being updated, convert them to ObjectIds
    if (updateData.category_ids && Array.isArray(updateData.category_ids)) {
      updateData.category_ids = updateData.category_ids.map((id: any) => 
        typeof id === 'string' ? new Types.ObjectId(id) : id
      );
    }

    // Generate _id for variants that don't have one (slug-based)
    if (updateData.variants && Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.map((v: any) => {
        if (!v._id) {
          const slug = (v.name || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          return { ...v, _id: slug };
        }
        return v;
      });
    }

    // Generate _id for toppings that don't have one (slug-based)
    if (updateData.toppings && Array.isArray(updateData.toppings)) {
      updateData.toppings = updateData.toppings.map((t: any) => {
        if (!t._id) {
          const slug = (t.name || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          return { ...t, _id: slug };
        }
        return t;
      });
    }
    
    return this.dishModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenant_id: tenant_id },
      updateData,
      { new: true },
    );
  }

  async delete(id: string): Promise<void> {
    const tenant_id = RequestContext.getTenantId();
    await this.dishModel.deleteOne({
      _id: new Types.ObjectId(id),
      tenant_id: tenant_id,
    });
  }

  async findByCategory(categoryId: string): Promise<Dish[]> {
    const tenant_id = RequestContext.getTenantId();
    return this.dishModel
      .find({
        tenant_id: tenant_id,
        category_ids: { $in: [new Types.ObjectId(categoryId)] },
      })
      .exec();
  }
}
