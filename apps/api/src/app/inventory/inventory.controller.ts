import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InventoryItemService } from './inventory-item.service';
import { InventoryTransactionService } from './inventory-transaction.service';
import { InventoryRecipeService } from './inventory-recipe.service';
import { RestockingArmyService } from './restocking-army.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, AdjustInventoryDto } from './dto/create-inventory-item.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './inventory-recipe.service';
import { CreateRestockingArmyDto, UpdateRestockingArmyDto } from './dto/restocking-army.dto';
import { RequestContext } from '../../common/context/request-context';
import { convertUnit } from './utils/unit-conversion';

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(
    private readonly itemService: InventoryItemService,
    private readonly transactionService: InventoryTransactionService,
    private readonly recipeService: InventoryRecipeService,
    private readonly restockingArmyService: RestockingArmyService,
  ) {}

  // ============== ITEMS ENDPOINTS ==============

  @Post('items')
  async createItem(@Body() createDto: CreateInventoryItemDto, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.itemService.create(tenantId, createDto);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('items')
  async getAllItems(@Query('limit') limit = 50, @Query('skip') skip = 0, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      const result = await this.itemService.findAll(tenantId, parseInt(limit as any), parseInt(skip as any));
      return result;
    } catch (error: any) {
      this.logger.error(`Error fetching items: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('items/search/:query')
  async searchItems(@Param('query') query: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.itemService.search(tenantId, query);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('items/:id')
  async getItem(@Param('id') id: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      const item = await this.itemService.findById(tenantId, id);
      if (!item) {
        throw new BadRequestException('Item not found');
      }
      return item;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Patch('items/:id')
  async updateItem(@Param('id') id: string, @Body() updateDto: UpdateInventoryItemDto, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.itemService.update(tenantId, id, updateDto);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }
  
   // Availability lookup for dishes to drive menu badges
  @Get('availability')
  async availability(@Req() req: any, @Query('dishIds') dishIds: string) {
     const rawTenantId = RequestContext.getTenantId();
     if (!rawTenantId) {
       throw new BadRequestException('Tenant ID is required');
     }
     const tenantId = String(rawTenantId);
     const ids = (dishIds || '')
       .split(',')
       .map((id) => id.trim())
       .filter(Boolean);
 
     return this.recipeService.getAvailabilityForDishes(tenantId, ids);
   }

  @Delete('items/:id')
  async deleteItem(@Param('id') id: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.itemService.deactivate(tenantId, id);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Patch('items/:id/adjust')
  async adjustStock(@Param('id') id: string, @Body() adjustDto: AdjustInventoryDto, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.itemService.adjustStock(tenantId, id, adjustDto);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('items/:id/restock')
  async restockItem(@Param('id') id: string, @Body() body: { quantity: number }, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      
      if (!body.quantity || body.quantity <= 0) {
        throw new BadRequestException('Quantity must be greater than 0');
      }

      // Use refundStock with a dummy orderId for the restock operation
      return await this.itemService.refundStock(tenantId, id, body.quantity, 'manual-restock');
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('items/low-stock')
  async getLowStockItems(@Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.itemService.getLowStockItems(tenantId);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============== TRANSACTIONS ENDPOINTS ==============

  @Get('transactions/audit-trail/:itemId')
  async getAuditTrail(@Param('itemId') itemId: string, @Query('limit') limit = 100, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.transactionService.getAuditTrail(tenantId, itemId, parseInt(limit as any));
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('transactions')
  async getAllTransactions(@Query('limit') limit = 100, @Query('skip') skip = 0, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.transactionService.getAllTransactions(tenantId, parseInt(limit as any), parseInt(skip as any));
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('transactions/order/:orderId')
  async getOrderTransactions(@Param('orderId') orderId: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.transactionService.getTransactionsByOrder(tenantId, orderId);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============== RECIPES ENDPOINTS ==============

  @Post('recipes')
  async createRecipe(@Body() createDto: CreateRecipeDto, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.recipeService.create(tenantId, createDto);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('recipes')
  async getAllRecipes(@Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.recipeService.findAll(tenantId);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('recipes/:dishId')
  async getRecipe(@Param('dishId') dishId: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      
      // Try to get recipe with enriched details first
      const recipeWithDetails = await this.recipeService.getIngredientsWithDetails(tenantId, dishId);
      if (recipeWithDetails) {
        return recipeWithDetails;
      }
      
      // If no enriched details, return raw recipe
      const recipe = await this.recipeService.findByDishId(tenantId, dishId);
      return recipe || null;
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Patch('recipes/:dishId')
  async updateRecipe(@Param('dishId') dishId: string, @Body() updateDto: UpdateRecipeDto, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.recipeService.update(tenantId, dishId, updateDto);
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete('recipes/:dishId')
  async deleteRecipe(@Param('dishId') dishId: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      await this.recipeService.delete(tenantId, dishId);
      return { success: true };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============== ANALYTICS ENDPOINTS ==============

  @Get('dashboard/summary')
  async getDashboardSummary(@Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);

      const totalValue = await this.itemService.getTotalValue(tenantId);
      const itemsCount = await this.itemService.getItemsCount(tenantId);
      const lowStockCount = (await this.itemService.getLowStockItems(tenantId)).length;

      return {
        total_inventory_value: totalValue,
        items_count: itemsCount,
        low_stock_count: lowStockCount,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============== RESTOCKING ARMIES ENDPOINTS ==============

  @Post('restocking-armies')
  async createRestockingArmy(@Body() createDto: CreateRestockingArmyDto, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.restockingArmyService.create(tenantId, createDto);
    } catch (error: any) {
      this.logger.error(`Error creating restocking army: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('restocking-armies')
  async getRestockingArmies(@Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.restockingArmyService.findAll(tenantId);
    } catch (error: any) {
      this.logger.error(`Error fetching restocking armies: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('restocking-armies/:id')
  async getRestockingArmy(@Param('id') id: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      const army = await this.restockingArmyService.findById(tenantId, id);
      if (!army) {
        throw new BadRequestException('Restocking army not found');
      }
      return army;
    } catch (error: any) {
      this.logger.error(`Error fetching restocking army: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Patch('restocking-armies/:id')
  async updateRestockingArmy(@Param('id') id: string, @Body() updateDto: UpdateRestockingArmyDto, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.restockingArmyService.update(tenantId, id, updateDto);
    } catch (error: any) {
      this.logger.error(`Error updating restocking army: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Delete('restocking-armies/:id')
  async deleteRestockingArmy(@Param('id') id: string, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.restockingArmyService.delete(tenantId, id);
    } catch (error: any) {
      this.logger.error(`Error deleting restocking army: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Post('restocking-armies/:id/execute')
  async executeRestockingArmy(@Param('id') id: string, @Body() body: { user_id?: string; notes?: string }, @Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.restockingArmyService.execute(tenantId, id, body.user_id, body.notes);
    } catch (error: any) {
      this.logger.error(`Error executing restocking army: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  @Get('restocking-armies/summary')
  async getRestockingSummary(@Req() req: any) {
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      return await this.restockingArmyService.getRestockingSummary(tenantId);
    } catch (error: any) {
      this.logger.error(`Error fetching restocking summary: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
  }

  // ============== INVENTORY REVERT ENDPOINT ==============
  // DEPRECATED: This endpoint is no longer used.
  // Refunds are now handled automatically by OrdersService.update() when status changes to CANCELLED.
  // This uses transaction history instead of recipe lookup, ensuring accurate refunds.

  @Patch('revert')
  async revertInventory(
    @Body() body: { dish_id: string; quantity: number; order_id: string },
    @Req() req: any,
  ) {
    // DISABLED: This endpoint caused duplicate/incorrect refunds.
    // Refunds are now handled automatically in orders.service.ts when status changes to CANCELLED.
    this.logger.warn('⚠️ DEPRECATED: /api/inventory/revert called but is disabled. Refunds are now automatic via OrdersService.');
    return { 
      success: true, 
      message: 'This endpoint is deprecated. Refunds are handled automatically when order status changes to CANCELLED.',
      deprecated: true 
    };

    /* OLD CODE - DISABLED
    try {
      const rawTenantId = RequestContext.getTenantId();
      if (!rawTenantId) {
        throw new BadRequestException('Tenant ID is required');
      }
      const tenantId = String(rawTenantId);
      const { dish_id, quantity, order_id } = body;

      if (!dish_id || !quantity) {
        throw new BadRequestException('dish_id and quantity are required');
      }

      // Find the recipe for this dish to get ingredients
      const recipe = await this.recipeService.findByDishId(tenantId, dish_id);
      if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
        this.logger.warn(`No recipe found for dish_id: ${dish_id}`);
        return { success: false, message: 'Recipe not found for dish' };
      }

      // Revert inventory for each ingredient - MUST MIRROR deductStock logic
      for (const ingredient of recipe.ingredients) {
        try {
          // Calculate total quantity to revert
          // This mirrors: totalQuantityNeeded = ingredient.quantity_per_dish * item.quantity
          const totalQuantityToRevert = ingredient.quantity_per_dish * quantity;

          // Get the inventory item to handle unit conversion if needed
          const inventoryItem = await this.itemService.findById(
            tenantId,
            ingredient.item_id.toString(),
          );

          if (!inventoryItem) {
            this.logger.warn(`Inventory item not found: ${ingredient.item_id}`);
            continue;
          }

          // Convert quantity from recipe unit to inventory item unit (mirrors deductStock logic)
          let convertedQuantity = totalQuantityToRevert;
          if (ingredient.unit && ingredient.unit !== inventoryItem.unit) {
            try {
              convertedQuantity = convertUnit(
                totalQuantityToRevert,
                ingredient.unit,
                inventoryItem.unit,
              );
            } catch (conversionError) {
              this.logger.warn(`Unit conversion failed: ${conversionError}`);
              // If conversion fails, use the original quantity
            }
          }

          const adjustDto: AdjustInventoryDto = {
            quantity_change: convertedQuantity,
            reason: `Order ${order_id} cancelled - reverted`,
          };

          await this.itemService.adjustStock(tenantId, ingredient.item_id.toString(), adjustDto);

          this.logger.log(
            `Reverted ${convertedQuantity} ${inventoryItem.unit} from order ${order_id}`,
          );
        } catch (error: any) {
          this.logger.warn(`Failed to revert ingredient ${ingredient.item_id}: ${error.message}`);
          // Continue with other ingredients even if one fails
        }
      }

      this.logger.log(`Successfully reverted inventory for order ${order_id}`);
      return { success: true, message: 'Inventory reverted successfully' };
    } catch (error: any) {
      this.logger.error(`Error reverting inventory: ${error.message}`, error.stack);
      throw new InternalServerErrorException(error.message);
    }
    */
  }
}


