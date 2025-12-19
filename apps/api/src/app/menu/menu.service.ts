import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dish } from '../schemas/dish.schema';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Injectable()
export class MenuService {
  constructor(@InjectModel(Dish.name) private dishModel: Model<Dish>) {}

  async create(createDishDto: CreateDishDto) {
    return this.dishModel.create(createDishDto);
  }

  async findAll() {
    return this.dishModel.find().exec();
  }

  async delete(id: string) {
    return this.dishModel.findByIdAndDelete(id).exec();
  }

  async findOne(id: string) {
    const doc = await this.dishModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Dish not found');
    return doc;
  }

  async update(id: string, updateDto: UpdateDishDto) {
    const updated = await this.dishModel
      .findByIdAndUpdate(id, updateDto, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException('Dish not found');
    return updated;
  }
}
