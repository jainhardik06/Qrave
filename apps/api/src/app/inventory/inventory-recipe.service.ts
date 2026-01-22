import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InventoryRecipe, InventoryRecipeDocument, RecipeIngredient } from '../../schemas/inventory-recipe.schema';
import { InventoryItem, InventoryItemDocument } from '../../schemas/inventory-item.schema';
import { convertUnit } from './utils/unit-conversion';

export interface CreateRecipeDto {
  dish_id: string;
  dish_name: string;
  ingredients: RecipeIngredient[];
}

export interface UpdateRecipeDto {
  ingredients?: RecipeIngredient[];
  dish_name?: string;
  notes?: string;
}

@Injectable()
export class InventoryRecipeService {
  constructor(
    @InjectModel(InventoryRecipe.name) private recipeModel: Model<InventoryRecipeDocument>,
    @InjectModel(InventoryItem.name) private itemModel: Model<InventoryItemDocument>,
  ) {}

  // Create recipe for a dish
  async create(tenantId: string, createDto: CreateRecipeDto): Promise<InventoryRecipeDocument> {
    // Calculate total cost
    let totalCost = 0;

    for (const ingredient of createDto.ingredients) {
      const item = await this.itemModel.findOne({
        _id: new Types.ObjectId(ingredient.item_id),
        tenant_id: tenantId,
      });

      if (item) {
        // Convert ingredient quantity to inventory item's unit before calculating cost
        const convertedQuantity = convertUnit(
          ingredient.quantity_per_dish,
          ingredient.unit,
          item.unit,
        );
        totalCost += convertedQuantity * item.cost_per_unit;
      }
    }

    const recipe = new this.recipeModel({
      ...createDto,
      tenant_id: tenantId,
      total_cost_per_dish: totalCost,
    });

    return recipe.save();
  }

  // Get recipe for a dish
  async findByDishId(tenantId: string, dishId: string): Promise<InventoryRecipeDocument | null> {
    return this.recipeModel.findOne({
      tenant_id: tenantId,
      dish_id: new Types.ObjectId(dishId),
    }).exec();
  }

  // Get all recipes for tenant
  async findAll(tenantId: string): Promise<InventoryRecipeDocument[]> {
    return this.recipeModel
      .find({ tenant_id: tenantId, is_active: true })
      .exec();
  }

  // Update recipe
  async update(tenantId: string, dishId: string, updateDto: UpdateRecipeDto): Promise<InventoryRecipeDocument | null> {
    let totalCost = 0;

    if (updateDto.ingredients) {
      for (const ingredient of updateDto.ingredients) {
        const item = await this.itemModel.findOne({
          _id: new Types.ObjectId(ingredient.item_id),
          tenant_id: tenantId,
        });

        if (item) {
          // Convert ingredient quantity to inventory item's unit before calculating cost
          const convertedQuantity = convertUnit(
            ingredient.quantity_per_dish,
            ingredient.unit,
            item.unit,
          );
          totalCost += convertedQuantity * item.cost_per_unit;
        }
      }
    }

    return this.recipeModel
      .findOneAndUpdate(
        { tenant_id: tenantId, dish_id: new Types.ObjectId(dishId) },
        {
          ...updateDto,
          dish_id: new Types.ObjectId(dishId),
          tenant_id: tenantId,
          total_cost_per_dish: totalCost > 0 ? totalCost : undefined,
          updatedAt: new Date(),
        },
        { new: true, upsert: true }, // upsert: create if doesn't exist
      )
      .exec();
  }

  // Delete recipe
  async delete(tenantId: string, dishId: string): Promise<void> {
    await this.recipeModel.deleteOne({
      tenant_id: tenantId,
      dish_id: new Types.ObjectId(dishId),
    });
  }

  // Get cost per dish
  async getCostPerDish(tenantId: string, dishId: string): Promise<number> {
    const recipe = await this.findByDishId(tenantId, dishId);
    return recipe?.total_cost_per_dish || 0;
  }

  // Check availability and low-stock status for multiple dishes based on recipes and item stock
  // Uses unit conversion for accurate comparisons (e.g., 100g used from 1kg stock)
  async getAvailabilityForDishes(tenantId: string, dishIds: string[]) {
    if (!dishIds.length) return [];

    const recipes = await this.recipeModel
      .find({ tenant_id: tenantId, dish_id: { $in: dishIds.map((id) => new Types.ObjectId(id)) }, is_active: true })
      .lean()
      .exec();

    if (!recipes.length) return [];

    // Map item ids used across recipes
    const itemIds = Array.from(
      new Set(
        recipes.flatMap((r) => r.ingredients?.map((ing) => ing.item_id?.toString()).filter(Boolean) as string[]),
      ),
    ).map((id) => new Types.ObjectId(id));

    const items = await this.itemModel
      .find({ tenantId: tenantId, _id: { $in: itemIds }, is_active: true })
      .lean()
      .exec();

    const itemById = new Map(items.map((i) => [i._id.toString(), i]));

    return recipes.map((recipe) => {
      const missing: any[] = [];
      let available = true;
      let low = false;

      for (const ingredient of recipe.ingredients || []) {
        const item = itemById.get(ingredient.item_id?.toString());
        if (!item) {
          available = false;
          missing.push({ item_id: ingredient.item_id, required: ingredient.quantity_per_dish, available: 0 });
          continue;
        }

        const current = item.current_quantity ?? 0;
        const required = ingredient.quantity_per_dish;

        // Use unit-aware comparison: convert required quantity to item's unit for proper comparison
        let requiredInItemUnit = required;
        try {
          // If ingredient unit differs from item unit, convert for comparison
          if (ingredient.unit && ingredient.unit !== item.unit) {
            requiredInItemUnit = convertUnit(required, ingredient.unit, item.unit);
          }
        } catch (error) {
          // If units are incompatible, just use the required quantity as-is
          // This handles cases where units can't be converted (e.g., pieces vs kg)
        }

        if (current < requiredInItemUnit) {
          available = false;
          missing.push({ 
            item_id: item._id, 
            name: item.name, 
            required: requiredInItemUnit, 
            available: current,
            unit: item.unit
          });
        }

        if (item.reorder_level !== undefined && current <= item.reorder_level) {
          low = true;
        }
      }

      return {
        dish_id: recipe.dish_id?.toString(),
        available,
        lowStock: low && available,
        missingIngredients: missing,
      };
    });
  }

  // Get ingredients with item details
  async getIngredientsWithDetails(tenantId: string, dishId: string) {
    const recipe = await this.findByDishId(tenantId, dishId);

    if (!recipe) {
      return null;
    }

    const ingredientsWithDetails = [];

    for (const ingredient of recipe.ingredients) {
      const item = await this.itemModel.findOne({
        _id: ingredient.item_id,
        tenant_id: tenantId,
      });

      if (item) {
        ingredientsWithDetails.push({
          ...ingredient,
          item_name: item.name,
          item_sku: item.sku,
          cost_per_unit: item.cost_per_unit,
          ingredient_cost: ingredient.quantity_per_dish * item.cost_per_unit,
          available_quantity: item.current_quantity,
        });
      }
    }

    return {
      dish_id: recipe.dish_id,
      dish_name: recipe.dish_name,
      ingredients: ingredientsWithDetails,
      total_cost_per_dish: recipe.total_cost_per_dish,
    };
  }
}