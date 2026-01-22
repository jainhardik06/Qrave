/**
 * Unit conversion utilities for inventory management
 * Supports: kg, g, L, ml, pieces, boxes, bags, etc.
 */

export enum UnitType {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  QUANTITY = 'quantity',
}

export interface UnitInfo {
  symbol: string;
  name: string;
  type: UnitType;
  toBaseUnit: number; // Conversion factor to base unit
  baseUnit: string; // kg, L, or piece
}

// Define all supported units
export const UNITS: Record<string, UnitInfo> = {
  // Weight units (base: kg)
  kg: { symbol: 'kg', name: 'Kilogram', type: UnitType.WEIGHT, toBaseUnit: 1, baseUnit: 'kg' },
  g: { symbol: 'g', name: 'Gram', type: UnitType.WEIGHT, toBaseUnit: 0.001, baseUnit: 'kg' },
  mg: { symbol: 'mg', name: 'Milligram', type: UnitType.WEIGHT, toBaseUnit: 0.000001, baseUnit: 'kg' },
  lb: { symbol: 'lb', name: 'Pound', type: UnitType.WEIGHT, toBaseUnit: 0.453592, baseUnit: 'kg' },
  oz: { symbol: 'oz', name: 'Ounce', type: UnitType.WEIGHT, toBaseUnit: 0.0283495, baseUnit: 'kg' },

  // Volume units (base: L)
  L: { symbol: 'L', name: 'Liter', type: UnitType.VOLUME, toBaseUnit: 1, baseUnit: 'L' },
  ml: { symbol: 'ml', name: 'Milliliter', type: UnitType.VOLUME, toBaseUnit: 0.001, baseUnit: 'L' },
  gallon: { symbol: 'gal', name: 'Gallon (US)', type: UnitType.VOLUME, toBaseUnit: 3.78541, baseUnit: 'L' },
  pint: { symbol: 'pt', name: 'Pint', type: UnitType.VOLUME, toBaseUnit: 0.473176, baseUnit: 'L' },
  cup: { symbol: 'cup', name: 'Cup', type: UnitType.VOLUME, toBaseUnit: 0.236588, baseUnit: 'L' },
  tbsp: { symbol: 'tbsp', name: 'Tablespoon', type: UnitType.VOLUME, toBaseUnit: 0.0147868, baseUnit: 'L' },
  tsp: { symbol: 'tsp', name: 'Teaspoon', type: UnitType.VOLUME, toBaseUnit: 0.00492892, baseUnit: 'L' },

  // Quantity units (base: piece)
  piece: { symbol: 'pc', name: 'Piece', type: UnitType.QUANTITY, toBaseUnit: 1, baseUnit: 'piece' },
  box: { symbol: 'box', name: 'Box', type: UnitType.QUANTITY, toBaseUnit: 1, baseUnit: 'piece' },
  bag: { symbol: 'bag', name: 'Bag', type: UnitType.QUANTITY, toBaseUnit: 1, baseUnit: 'piece' },
  dozen: { symbol: 'dz', name: 'Dozen', type: UnitType.QUANTITY, toBaseUnit: 12, baseUnit: 'piece' },
  bundle: { symbol: 'bnd', name: 'Bundle', type: UnitType.QUANTITY, toBaseUnit: 1, baseUnit: 'piece' },
};

/**
 * Convert quantity from one unit to another
 * @param quantity The quantity value
 * @param fromUnit The source unit (e.g., 'kg', 'g')
 * @param toUnit The target unit (e.g., 'g', 'kg')
 * @returns The converted quantity
 */
export function convertUnit(quantity: number, fromUnit: string, toUnit: string): number {
  const from = UNITS[fromUnit];
  const to = UNITS[toUnit];

  if (!from || !to) {
    throw new Error(`Invalid unit: ${!from ? fromUnit : toUnit}`);
  }

  // Check if units are compatible (same type or base unit)
  if (from.baseUnit !== to.baseUnit) {
    throw new Error(`Cannot convert between ${from.baseUnit} and ${to.baseUnit}`);
  }

  // Convert to base unit first, then to target unit
  const inBaseUnit = quantity * from.toBaseUnit;
  return inBaseUnit / to.toBaseUnit;
}

/**
 * Convert quantity to base unit (kg, L, or piece)
 * @param quantity The quantity value
 * @param unit The unit to convert from
 * @returns Quantity in base unit
 */
export function toBaseUnit(quantity: number, unit: string): number {
  const unitInfo = UNITS[unit];
  if (!unitInfo) {
    throw new Error(`Invalid unit: ${unit}`);
  }
  return quantity * unitInfo.toBaseUnit;
}

/**
 * Convert from base unit to specified unit
 * @param baseQuantity Quantity in base unit
 * @param toUnit The target unit
 * @param baseUnit The current base unit (kg, L, or piece)
 * @returns Quantity in target unit
 */
export function fromBaseUnit(baseQuantity: number, toUnit: string, baseUnit: string): number {
  const unitInfo = UNITS[toUnit];
  if (!unitInfo) {
    throw new Error(`Invalid unit: ${toUnit}`);
  }
  if (unitInfo.baseUnit !== baseUnit) {
    throw new Error(`Cannot convert from base unit ${baseUnit} to ${toUnit}`);
  }
  return baseQuantity / unitInfo.toBaseUnit;
}

/**
 * Get compatible units for a given unit
 * @param unit The reference unit
 * @returns Array of compatible units
 */
export function getCompatibleUnits(unit: string): UnitInfo[] {
  const unitInfo = UNITS[unit];
  if (!unitInfo) {
    throw new Error(`Invalid unit: ${unit}`);
  }
  return Object.values(UNITS).filter((u) => u.baseUnit === unitInfo.baseUnit);
}

/**
 * Get all available units grouped by type
 */
export function getUnitsByType(): Record<UnitType, UnitInfo[]> {
  return {
    [UnitType.WEIGHT]: Object.values(UNITS).filter((u) => u.type === UnitType.WEIGHT),
    [UnitType.VOLUME]: Object.values(UNITS).filter((u) => u.type === UnitType.VOLUME),
    [UnitType.QUANTITY]: Object.values(UNITS).filter((u) => u.type === UnitType.QUANTITY),
  };
}
