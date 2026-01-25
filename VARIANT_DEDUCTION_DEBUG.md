# Variant & Topping Deduction - Enhanced Debugging

## Enhanced Logging Added

### Orders Service - Inventory Deduction Flow

When an order is placed, the system now logs:

1. **Order Details**
   - Dish ID
   - Variant ID from order
   - Toppings from order

2. **Recipe Analysis**
   - Total ingredient count
   - Each ingredient with its scope (base/variant/topping)
   - All available variant IDs in recipe
   - All available topping IDs in recipe

3. **Ingredient Matching**
   - Base ingredients found
   - Variant ingredients matching the order variant_id
   - Topping ingredients matching each order topping_id
   - Comparison logs showing why each ingredient matches or doesn't match

4. **Deduction Execution**
   - Total deductions planned
   - Each deduction with calculated quantity
   - Success confirmation for each deduction

## What to Look For

### If Variant Ingredients NOT Deducted:

Check logs for:
```
📦 Order variant_id: "small" (type: string)
📊 Available variant IDs in recipe: ["medium", "large"]
```
**Problem**: Recipe doesn't have ingredients for "small" variant

OR:

```
📦 Checking variant ingredient: variant_id="Small" === order variantId="small" ? false
```
**Problem**: Case mismatch or slug format issue

### If Topping Ingredients NOT Deducted:

Check logs for:
```
📦 Looking for topping ingredients with topping_id="extra-cheese"
📦 Recipe topping_id="cheese" === order topping_id="extra-cheese" ? false
```
**Problem**: Topping ID mismatch in recipe vs order

## Testing Steps

1. **Restart Server** to load new logging
2. **Place Order** with variant and toppings
3. **Check Console** for detailed logs
4. **Verify Inventory** deductions in database
5. **Check Transaction Log** to see what was deducted

## Expected Log Output

```
📦 ===== DEDUCTING INVENTORY FOR DISH 6789xyz =====
📦 Order variant_id: "small" (type: string)
📦 Order toppings: [ { topping_id: 'extra-cheese', quantity: 1 } ]
📦 Recipe has 4 total ingredients

📦 Recipe ingredient #0: {
  item_id: '123abc',
  quantity: 0.2,
  unit: 'kg',
  variant_id: undefined,
  topping_id: undefined,
  hasVariant: false,
  hasTopping: false,
  isBase: true
}

📦 Recipe ingredient #1: {
  item_id: '456def',
  quantity: 0.1,
  unit: 'kg',
  variant_id: 'small',
  topping_id: undefined,
  hasVariant: true,
  hasTopping: false,
  isBase: false
}

📦 Checking variant ingredient: variant_id="small" === order variantId="small" ? true

📊 ===== INGREDIENT BREAKDOWN =====
📊 Base ingredients: 1
  - 123abc: 0.2 kg
📊 Variant ingredients (for "small"): 1
  - 456def: 0.1 kg [variant: small]
📊 Available variant IDs in recipe: ["small", "medium", "large"]

📦 Looking for topping ingredients with topping_id="extra-cheese"
  - Recipe topping_id="extra-cheese" === order topping_id="extra-cheese" ? true
  ✅ Found 1 ingredient(s) for topping "extra-cheese"
📊 Topping ingredients: 1
  - 789ghi: 0.05 kg x1 [topping: extra-cheese]

📊 ===== FINAL DEDUCTION LIST =====
📊 Total deductions to make: 3
  1. Item: 123abc, Qty: 0.2 kg (0.2 x 1 x 1)
  2. Item: 456def, Qty: 0.1 kg (0.1 x 1 x 1)
  3. Item: 789ghi, Qty: 0.05 kg (0.05 x 1 x 1)

💰 Deducting: 0.2 kg from item 123abc
✅ Successfully deducted from item 123abc
💰 Deducting: 0.1 kg from item 456def
✅ Successfully deducted from item 456def
💰 Deducting: 0.05 kg from item 789ghi
✅ Successfully deducted from item 789ghi
```

## Common Issues & Solutions

### Issue 1: Recipe Not Found
```
⚠️ No recipe found for dish 6789xyz. Skipping inventory deduction.
```
**Solution**: Create recipe in dashboard Step 5

### Issue 2: Variant ID Mismatch
```
📊 Available variant IDs in recipe: []
```
**Solution**: Recipe has no variant ingredients. Add them in Step 5.

OR:
```
📊 Available variant IDs in recipe: ["Small", "Medium"]
Order variant_id: "small"
```
**Solution**: Case mismatch. Re-save dish to regenerate slug IDs.

### Issue 3: Topping ID Mismatch
```
📦 Looking for topping ingredients with topping_id="extra-cheese"
✅ Found 0 ingredient(s) for topping "extra-cheese"
```
**Solution**: Recipe has no ingredients for this topping. Add in Step 5.

## How Matching Works

### Variant Matching
```typescript
ing.variant_id === variantId
"small" === "small" → TRUE ✅
"Small" === "small" → FALSE ❌
```

### Topping Matching
```typescript
ing.topping_id === tid
"extra-cheese" === "extra-cheese" → TRUE ✅
"cheese" === "extra-cheese" → FALSE ❌
```

Both use **strict equality** with **case-sensitive** string comparison.

## Next Steps

1. Test with actual order
2. Review console logs
3. Identify mismatch if any
4. Fix recipe or variant/topping IDs as needed
