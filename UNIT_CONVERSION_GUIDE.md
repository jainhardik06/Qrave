# Unit Conversion System - Complete Guide

## 🔧 Critical Fix Applied (Jan 23, 2026)

### Problem Identified
**DOUBLE INVENTORY DEDUCTION** with inconsistent unit conversion causing massive inventory errors:
- Orders were deducting inventory TWICE:
  1. In `public-orders.controller.ts` - WITHOUT unit parameter (wrong conversion)
  2. In `orders.service.ts` - WITH unit parameter (correct conversion)
- Result: Items deducted with wrong units (-50, -100) PLUS correct units (-0.05, -0.1)

### Solution Applied
✅ **Removed duplicate deduction** from `public-orders.controller.ts`
✅ **Single source of truth**: Only `orders.service.ts` handles inventory deduction
✅ **Consistent unit conversion**: Always passes `ingredient.unit` to `deductStock()`

---

## 📊 How Unit Conversion Works

### 1. Supported Units

#### Weight Units (Base: kg)
- `kg` - Kilogram (1 kg = 1000 g)
- `g` - Gram (1 g = 0.001 kg)
- `mg` - Milligram (1 mg = 0.000001 kg)
- `lb` - Pound (1 lb = 0.453592 kg)
- `oz` - Ounce (1 oz = 0.0283495 kg)

#### Volume Units (Base: L)
- `L` - Liter (1 L = 1000 ml)
- `ml` - Milliliter (1 ml = 0.001 L)
- `gallon` - US Gallon (1 gal = 3.78541 L)
- `pint` - Pint (1 pt = 0.473176 L)
- `cup` - Cup (1 cup = 0.236588 L)
- `tbsp` - Tablespoon (1 tbsp = 0.0147868 L)
- `tsp` - Teaspoon (1 tsp = 0.00492892 L)

#### Quantity Units (Base: piece)
- `piece` - Individual items (1 piece = 1)
- `box` - Box (1 box = 1)
- `bag` - Bag (1 bag = 1)
- `dozen` - Dozen (1 dozen = 12 pieces)
- `bundle` - Bundle (1 bundle = 1)

### 2. Conversion Rules

✅ **Compatible**: Weight ↔ Weight, Volume ↔ Volume, Quantity ↔ Quantity
❌ **Incompatible**: Weight ↔ Volume, Weight ↔ Quantity, Volume ↔ Quantity

#### Example Conversions
```
100 ml → kg: ❌ Error (volume cannot convert to weight)
100 g → kg: ✅ 0.1 kg
50 ml → L: ✅ 0.05 L
2 pieces → dozen: ✅ 0.167 dozen
```

---

## 🔄 Complete Flow: Order to Inventory

### Step 1: Recipe Creation
```
Dish: Burger
Ingredients:
  - Flour: 100g (recipe unit: g, inventory unit: kg)
  - Ketchup: 50ml (recipe unit: ml, inventory unit: L)
  - Bun: 2 pieces (recipe unit: piece, inventory unit: piece)
```

### Step 2: Order Placed
```
Customer orders: 1x Burger
System calculates per ingredient:
  - Flour: 1 × 100g = 100g needed
  - Ketchup: 1 × 50ml = 50ml needed
  - Bun: 1 × 2 pieces = 2 pieces needed
```

### Step 3: Inventory Deduction (orders.service.ts)
```typescript
for (const ingredient of recipe.ingredients) {
  const totalQuantityNeeded = ingredient.quantity_per_dish * item.quantity;
  
  await inventoryItemService.deductStock(
    tenantId,
    ingredient.item_id,
    totalQuantityNeeded,        // 100 (g), 50 (ml), 2 (pieces)
    `Order #${orderId}`,
    orderId,
    consumerId,
    ingredient.unit              // 'g', 'ml', 'piece' ← CRITICAL
  );
}
```

### Step 4: Unit Conversion in deductStock()
```typescript
// inventory-item.service.ts
async deductStock(tenantId, itemId, quantity, reason, orderId, userId, quantityUnit) {
  const item = await findById(tenantId, itemId);
  // item.unit = 'kg', quantityUnit = 'g'
  
  let deductQuantity = quantity; // 100
  if (quantityUnit && quantityUnit !== item.unit) {
    deductQuantity = convertUnit(quantity, quantityUnit, item.unit);
    // convertUnit(100, 'g', 'kg') → 0.1 kg ✅
  }
  
  // Deduct 0.1 kg from inventory
  item.current_quantity -= deductQuantity;
}
```

### Step 5: Transaction Recorded
```
Transaction Type: usage
Quantity Change: -0.1 kg (for flour)
Quantity Change: -0.05 L (for ketchup)
Quantity Change: -2 pieces (for bun)
```

---

## 🔙 Inventory Revert on Cancellation

### Step 1: Order Cancelled
```
Customer cancels order #123
System finds recipe ingredients
```

### Step 2: Revert Logic (inventory.controller.ts)
```typescript
for (const ingredient of recipe.ingredients) {
  const totalToRevert = ingredient.quantity_per_dish * orderQuantity;
  // 100g, 50ml, 2 pieces
  
  const item = await findById(tenantId, ingredient.item_id);
  
  // Apply same unit conversion
  let converted = totalToRevert;
  if (ingredient.unit !== item.unit) {
    converted = convertUnit(totalToRevert, ingredient.unit, item.unit);
    // 100g → 0.1kg, 50ml → 0.05L
  }
  
  await adjustStock(tenantId, item_id, { quantity_change: +converted });
}
```

### Step 3: Transaction Recorded
```
Transaction Type: adjustment
Quantity Change: +0.1 kg (flour restored)
Quantity Change: +0.05 L (ketchup restored)
Quantity Change: +2 pieces (bun restored)
Reason: "Order #123 cancelled - reverted"
```

---

## 📝 Best Practices

### ✅ DO:
1. **Store inventory in base units**: kg, L, piece
2. **Allow recipes to use any compatible unit**: g, ml, dozen
3. **Always pass unit parameter** to deductStock/adjustStock
4. **Let backend handle conversion** - don't duplicate logic
5. **Use single deduction point** - orders.service.ts only

### ❌ DON'T:
1. **Don't mix incompatible units** (weight ↔ volume)
2. **Don't deduct inventory in multiple places**
3. **Don't forget unit parameter** in deductStock calls
4. **Don't assume units match** between recipe and inventory
5. **Don't calculate costs without considering units**

---

## 🐛 Common Issues & Solutions

### Issue 1: "Insufficient stock" error
**Cause**: Recipe uses large numbers (100g) but inventory uses small units (0.1kg)
**Solution**: System auto-converts. Check if inventory actually has enough in base unit.

### Issue 2: Double deduction
**Cause**: Multiple places calling deductStock
**Solution**: ✅ FIXED - Only orders.service.ts deducts now

### Issue 3: Wrong amounts deducted
**Cause**: Missing unit parameter in deductStock call
**Solution**: Always pass `ingredient.unit` as 7th parameter

### Issue 4: Revert not matching deduction
**Cause**: Revert logic not mirroring deduction conversion
**Solution**: ✅ FIXED - Both use same convertUnit() logic

---

## 🔍 Debugging Unit Issues

### Check Transaction Log
```sql
Look for:
- Multiple "usage" entries for same order (double deduction)
- Large numbers without conversion (-100 instead of -0.1)
- Mismatched units in reason field
```

### Verify Recipe Units
```
1. Open recipe in dashboard
2. Check ingredient units match inventory items
3. Look for unit warnings (⚠️ Unit stored: kg)
```

### Test Conversion
```typescript
import { convertUnit } from './utils/unit-conversion';

// Test conversions
convertUnit(100, 'g', 'kg'); // Should return 0.1
convertUnit(50, 'ml', 'L');  // Should return 0.05
convertUnit(2, 'piece', 'dozen'); // Should return 0.167
```

---

## 📊 Files Modified

### Backend
1. ✅ `apps/api/src/app/orders/public-orders.controller.ts`
   - Removed duplicate inventory deduction
   - Removed unused imports

2. ✅ `apps/api/src/app/orders/orders.service.ts`
   - Confirmed correct: passes ingredient.unit to deductStock

3. ✅ `apps/api/src/app/inventory/inventory.controller.ts`
   - Fixed revert endpoint to mirror deduction logic
   - Added unit conversion in revert

4. ✅ `apps/api/src/app/inventory/inventory-item.service.ts`
   - Already correct: handles unit conversion in deductStock

### Frontend
1. ✅ `apps/web/app/dashboard/inventory/recipes/new/page.tsx`
   - Added unit mismatch warnings
   - Improved cost calculation notes
   - Better error handling

2. ✅ `apps/web/app/dashboard/orders/page.tsx`
   - Date filtering for today's orders
   - Inventory revert on cancellation

---

## ✨ Summary

**The system now has:**
- ✅ Single inventory deduction point (no duplicates)
- ✅ Consistent unit conversion everywhere
- ✅ Proper revert logic matching deduction
- ✅ Visual warnings for unit mismatches
- ✅ Comprehensive conversion support (weight, volume, quantity)

**Your inventory is now accurate!**
🎯 Deductions: -0.1 kg, -0.05 L, -2 pieces
🔄 Reverts: +0.1 kg, +0.05 L, +2 pieces
✅ Perfect balance!
