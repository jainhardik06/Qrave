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
    console.log('CategoryService.create - tenant_id:', tenant_id, 'type:', typeof tenant_id);
    if (!tenant_id) {
      throw new Error('Tenant ID is required');
    }
    // Store tenant_id as string (database stores it as string)
    const category = new this.categoryModel({
      tenant_id: tenant_id,
      ...createCategoryDto,
    });
    console.log('CategoryService.create - saving category:', createCategoryDto);
    return category.save();
  }

  async findAll(): Promise<Category[]> {
    const tenant_id = RequestContext.getTenantId();
    console.log('CategoryService.findAll - tenant_id:', tenant_id, 'type:', typeof tenant_id);
    if (!tenant_id) {
      console.warn('No tenant_id found');
      return [];
    }
    // Query with string tenant_id (database stores it as string)
    const query = { tenant_id: tenant_id };
    console.log('CategoryService.findAll - query:', JSON.stringify(query));
    const categories = await this.categoryModel
      .find(query)
      .sort({ order: 1 })
      .exec();
    console.log('CategoryService.findAll - found categories:', categories.length);
    return categories;
  }

  async findOne(id: string): Promise<Category | null> {
    const tenant_id = RequestContext.getTenantId();
    if (!tenant_id) return null;
    console.log('CategoryService.findOne - tenant_id:', tenant_id, 'id:', id);
    return this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      tenant_id: tenant_id,
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
    if (!tenant_id) return null;
    console.log('CategoryService.update - tenant_id:', tenant_id, 'id:', id);
    return this.categoryModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), tenant_id: tenant_id },
      { ...updateCategoryDto, updated_at: new Date() },
      { new: true },
    );
  }

  async delete(id: string): Promise<void> {
    const tenant_id = RequestContext.getTenantId();
    if (!tenant_id) return;
    const objectIdTenant = typeof tenant_id === 'string' ? new Types.ObjectId(tenant_id) : tenant_id;
    console.log('CategoryService.delete - tenant_id:', tenant_id, 'objectId:', objectIdTenant.toString());
    await this.categoryModel.deleteOne({
      _id: new Types.ObjectId(id),
      tenant_id: tenant_id,
    });
  }

  async reorder(reorderData: Array<{ id: string; order: number }>): Promise<void> {
    const tenant_id = RequestContext.getTenantId();
    if (!tenant_id) return;
    console.log('CategoryService.reorder - tenant_id:', tenant_id);
    const updates = reorderData.map((item) =>
      this.categoryModel.updateOne(
        { _id: new Types.ObjectId(item.id), tenant_id: tenant_id },
        { order: item.order, updated_at: new Date() },
      ),
    );
    await Promise.all(updates);
  }
}
