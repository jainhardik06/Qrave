import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryItem, InventoryItemSchema } from '../../schemas/inventory-item.schema';
import { InventoryTransaction, InventoryTransactionSchema } from '../../schemas/inventory-transaction.schema';
import { InventoryRecipe, InventoryRecipeSchema } from '../../schemas/inventory-recipe.schema';
import { RestockingArmy, RestockingArmySchema } from '../../schemas/restocking-army.schema';
import { InventoryItemService } from './inventory-item.service';
import { InventoryTransactionService } from './inventory-transaction.service';
import { InventoryRecipeService } from './inventory-recipe.service';
import { RestockingArmyService } from './restocking-army.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryItem.name, schema: InventoryItemSchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
      { name: InventoryRecipe.name, schema: InventoryRecipeSchema },
      { name: RestockingArmy.name, schema: RestockingArmySchema },
    ]),
  ],
  providers: [InventoryItemService, InventoryTransactionService, InventoryRecipeService, RestockingArmyService],
  controllers: [InventoryController],
  exports: [InventoryItemService, InventoryRecipeService, InventoryTransactionService, RestockingArmyService],
})
export class InventoryModule {}
