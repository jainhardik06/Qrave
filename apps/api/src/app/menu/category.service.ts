import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { RequestContext } from '../../common/context/request-context';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(
    createCategoryDto: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
    },
  ): Promise<Category> {
    const tenant_id = RequestContext.getTenantId();
    console.log('CategoryService.create - tenant_id:', tenant_id);
    if (!tenant_id) {
      throw new Error('Tenant ID is required');
    }
    const category = new this.categoryModel({
      tenant_id,
      ...createCategoryDto,
    });
    return category.save();
  }

  async findAll(): Promise<Category[]> {
    const tenant_id = RequestContext.getTenantId();
    console.log('CategoryService.findAll - tenant_id:', tenant_id);
    if (!tenant_id) {
      console.warn('No tenant_id found');
      return [];
    }
    return this.categoryModel
      .find({ tenant_id })
      .sort({ order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Category | null> {
    const tenant_id = RequestContext.getTenantId();
    return this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      tenant_id,
    });
  }

  async update(
    id: string,
    updateCategoryDto: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      order?: number;
      is_active?: boolean;
    },
  ): Promise<Category | null> {
    const tenant_id = RequestContext.getTenantId();
    return this.categoryModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenant_id },
      { ...updateCategoryDto, updated_at: new Date() },
      { new: true },
    );
  }

  async delete(id: string): Promise<void> {
    const tenant_id = RequestContext.getTenantId();
    await this.categoryModel.deleteOne({
      _id: new Types.ObjectId(id),
      tenant_id,
    });
  }

  async reorder(reorderData: Array<{ id: string; order: number }>): Promise<void> {
    const tenant_id = RequestContext.getTenantId();
    const updates = reorderData.map((item) =>
      this.categoryModel.updateOne(
        { _id: new Types.ObjectId(item.id), tenant_id },
        { order: item.order, updated_at: new Date() },
      ),
    );
    await Promise.all(updates);
  }
}
