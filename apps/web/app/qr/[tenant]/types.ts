// Type definitions for QR Menu

export interface Category {
  _id: string;
  tenant_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DishVariant {
  _id?: string;
  name: string;
  price: number;
}

export interface Topping {
  _id?: string;
  name: string;
  price: number;
}

export interface Dish {
  _id: string;
  tenant_id: string;
  category_ids: string[];
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  variants?: DishVariant[];
  toppings?: Topping[];
  allergens?: string[];
  dietary_tags?: string[];
  preparation_time_minutes?: number;
  is_bestseller?: boolean;
  is_new?: boolean;
  is_available?: boolean;
  calories?: number;
  is_vegetarian?: boolean;
  is_vegan?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DishWithCategories extends Dish {
  // Used internally for rendering; tracks which category this card is being rendered in
  displayCategoryId?: string;
}

export interface FilterState {
  searchQuery: string;
  vegetarianOnly: boolean;
  nonVegOnly: boolean;
  allergenExclusions: string[]; // e.g., ['milk', 'gluten']
  availableOnly: boolean;
  sortBy: 'price-low' | 'price-high' | null;
  bestsellerOnly?: boolean;
}

export interface CartItem {
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice?: number; // per-unit price to support quantity edits
  selectedVariant?: DishVariant;
  selectedToppings?: Topping[];
  price: number; // final price per item (with variant/topping modifiers)
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}
