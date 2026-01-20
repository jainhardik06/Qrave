# 📋 Component Structure & API Contract

## Frontend Components

### Menu Management Page
**File**: `apps/web/app/dashboard/menu/page.tsx`
**Route**: `/dashboard/menu`

#### UI Sections:
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Menu Management                                       │  │
│  │ Organize your dishes and categories                  │  │
│  │                                                      │  │
│  │ [+ New Category]        [+ Add Dish]   (Red buttons) │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🔍 Search dishes...                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  FILTER BY CATEGORY (Horizontal scroll)                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │[All Items (0)] [Burgers (0) X ✎] [Pizzas (0) X ✎] │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  DISHES GRID (Pinterest-style, 4 columns)                 │
│  ┌────────────────┐ ┌────────────────┐ ...                │
│  │ Classic Burger │ │ Veggie Burger  │                    │
│  │ ═════════════  │ │ ══════════════ │                    │
│  │      [IMG]     │ │      [IMG]     │                    │
│  │  NEW ⭐        │ │ VEGETARIAN     │                    │
│  │                │ │                │                    │
│  │ ₹249 onwards   │ │ ₹199 onwards   │                    │
│  │ ⏱ 10 min      │ │ ⏱ 8 min       │                    │
│  │ 🔀 3 variants  │ │ 🔀 2 variants  │                    │
│  └────────────────┘ └────────────────┘                    │
│                                                              │
│ (4 columns on desktop, responsive on tablet/mobile)        │
└─────────────────────────────────────────────────────────────┘
```

#### State Management:
```typescript
const [categories, setCategories] = useState<Category[]>([]);
const [allDishes, setAllDishes] = useState<Dish[]>([]);
const [filteredDishes, setFilteredDishes] = useState<Dish[]>([]);
const [loading, setLoading] = useState(boolean);
const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [searchQuery, setSearchQuery] = useState<string>('');
const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
const [newCategory, setNewCategory] = useState<CategoryForm>({...});
```

#### Key Functions:
- `fetchData()` - Load categories and dishes from API
- `filterDishes()` - Filter based on category & search
- `handleAddCategory()` - Create/update category
- `handleDeleteCategory()` - Delete category
- `handleEditCategory()` - Open edit modal
- `getDishPrice()` - Get price (base_price or price)

---

### Dish Editor Form
**File**: `apps/web/app/dashboard/menu/dishes/[id]/page.tsx`
**Route**: `/dashboard/menu/dishes/new` or `/dashboard/menu/dishes/:id`

#### Multi-Step Form:
```
Step 1: Basic Information
├─ Dish Name (text input, required)
├─ Description (textarea, optional)
├─ Base Price (number, required, step=10)
├─ Image URL (text input, optional)
└─ Categories (checkbox list)
   ├─ ☑ Burgers
   ├─ ☐ Pizzas
   ├─ ☑ Fast Food
   └─ ☐ Vegetarian
   
Step 2: Variants & Details
├─ Variants (add/remove)
│  ├─ Small: ₹199
│  ├─ Medium: ₹249
│  └─ Large: ₹299
├─ Toppings (add/remove)
├─ Allergens (checkboxes)
├─ Dietary Tags (checkboxes)
├─ Prep Time (minutes)
├─ Calories (number)
├─ NEW Badge? (toggle)
├─ Bestseller? (toggle)
└─ Available? (toggle)

Step 3: Review & Save
├─ Display all information
└─ [Save Dish] button
```

#### State Structure:
```typescript
interface Dish {
  _id: string;
  category_ids: string[];      // ARRAY - Multiple categories
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  variants: Variant[];
  toppings: Topping[];
  allergens: string[];
  dietary_tags: string[];
  preparation_time_minutes: number;
  is_bestseller: boolean;
  is_new: boolean;
  is_available: boolean;
  calories: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
}

interface Category {
  _id: string;
  name: string;
  icon: string;
  color: string;
}
```

---

## Backend API Contracts

### Authentication Required
All endpoints require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

The JWT token contains:
```json
{
  "sub": "user_id",
  "email": "user@restaurant.com",
  "tenant_id": "restaurant_id",
  "roles": ["admin", "manager"],
  "iat": 1234567890
}
```

---

## Category API Endpoints

### 1. Get All Categories
```
GET /api/categories

Response:
[
  {
    "_id": "ObjectId",
    "tenant_id": "ObjectId",
    "name": "Burgers",
    "description": "Our delicious burgers",
    "icon": "beef",
    "color": "#ef4444",
    "order": 1,
    "is_active": true,
    "created_at": "2026-01-20T11:21:29Z",
    "updated_at": "2026-01-20T11:21:29Z"
  },
  ...
]

Status Codes:
200 OK - Success
401 Unauthorized - Invalid/missing token
500 Internal Server Error - Server issue
```

### 2. Create Category
```
POST /api/categories

Body:
{
  "name": "Burgers",
  "description": "Our delicious burgers",
  "icon": "beef",
  "color": "#ef4444"
}

Response: Created category object

Status Codes:
201 Created - Success
400 Bad Request - Invalid data
401 Unauthorized - Token issue
403 Forbidden - No permission (menu.write)
```

### 3. Update Category
```
PATCH /api/categories/:id

Body: Partial category object
{
  "name": "Premium Burgers",
  "color": "#dc2626"
}

Response: Updated category object
```

### 4. Delete Category
```
DELETE /api/categories/:id

Response: 200 OK

⚠️ Note: Consider soft delete or archive pattern
```

---

## Dish API Endpoints

### 1. Get All Dishes
```
GET /api/dishes

Query Parameters:
?categoryId=<categoryId>  - Filter by category (optional)
?allergen=<allergen>     - Filter by allergen (optional)

Response:
[
  {
    "_id": "ObjectId",
    "tenant_id": "ObjectId",
    "category_ids": [
      "ObjectId_1",
      "ObjectId_2"
    ],
    "name": "Classic Burger",
    "description": "Juicy beef patty with lettuce",
    "image_url": "https://...",
    "base_price": 249,
    "variants": [
      { "name": "Small", "price": 199 },
      { "name": "Medium", "price": 249 },
      { "name": "Large", "price": 299 }
    ],
    "toppings": [
      { "name": "Extra Cheese", "price": 50 },
      { "name": "Bacon", "price": 80 }
    ],
    "allergens": ["wheat", "milk"],
    "dietary_tags": [],
    "preparation_time_minutes": 10,
    "is_bestseller": false,
    "is_new": true,
    "is_available": true,
    "calories": 500,
    "is_vegetarian": false,
    "is_vegan": false,
    "created_at": "2026-01-20T11:21:29Z",
    "updated_at": "2026-01-20T11:21:29Z"
  },
  ...
]

Status Codes: 200, 401, 500
```

### 2. Create Dish
```
POST /api/dishes

Body:
{
  "category_ids": ["ObjectId_1", "ObjectId_2"],  // REQUIRED - Array!
  "name": "Classic Burger",
  "description": "Juicy beef patty",
  "image_url": "https://...",
  "base_price": 249,
  "variants": [
    { "name": "Small", "price": 199 },
    { "name": "Medium", "price": 249 }
  ],
  "toppings": [],
  "allergens": ["wheat", "milk"],
  "dietary_tags": [],
  "preparation_time_minutes": 10,
  "is_bestseller": false,
  "is_new": true,
  "is_available": true,
  "calories": 500,
  "is_vegetarian": false,
  "is_vegan": false
}

Response: Created dish object
Status Codes: 201, 400, 401, 403
```

### 3. Get Single Dish
```
GET /api/dishes/:id

Response: Dish object
```

### 4. Update Dish
```
PATCH /api/dishes/:id

Body: Partial dish object (any fields can be updated)

Important:
- category_ids is always an array
- Must include at least one category_id
```

### 5. Delete Dish
```
DELETE /api/dishes/:id

Response: 200 OK
```

---

## Data Flow - Real Example

### Creating a Burger with 2 Categories

#### Step 1: Frontend Form Submission
```typescript
const dishData = {
  category_ids: ["id_burgers", "id_fast_food"],  // ← Array of IDs
  name: "Classic Burger",
  base_price: 249,
  description: "Juicy beef...",
  variants: [
    { name: "Small", price: 199 },
    { name: "Medium", price: 249 }
  ],
  preparation_time_minutes: 10,
  is_new: true,
  // ... other fields
};

axios.post('/api/dishes', dishData, {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### Step 2: JWT Token Processing
```javascript
Token Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Decoded Token:
{
  "sub": "user_123",
  "email": "manager@restaurant.com",
  "tenant_id": "restaurant_456",
  "roles": ["restaurant_admin"],
  "iat": 1705757289
}
```

#### Step 3: TenancyMiddleware
```typescript
TenancyMiddleware receives request
├─ Extract token from Authorization header
├─ Verify JWT signature (secret: process.env.JWT_SECRET)
├─ Extract tenant_id = "restaurant_456"
├─ RequestContext.run(() => {
│  ├─ RequestContext.set({ tenantId: "restaurant_456", ... })
│  └─ next() → Route Handler
└─ RequestContext now available in service
```

#### Step 4: DishService.create()
```typescript
async create(createDishDto) {
  const tenant_id = RequestContext.getTenantId();
  console.log('tenant_id:', tenant_id); // "restaurant_456"
  
  const dish = new this.dishModel({
    tenant_id: tenant_id,
    category_ids: [ObjectId("id_burgers"), ObjectId("id_fast_food")],
    name: "Classic Burger",
    // ... all other fields
  });
  
  return dish.save(); // Saves to MongoDB with tenant_id
}
```

#### Step 5: MongoDB Document
```json
{
  "_id": ObjectId("6950d1b4..."),
  "tenant_id": ObjectId("restaurant_456"),
  "name": "Classic Burger",
  "category_ids": [
    ObjectId("id_burgers"),
    ObjectId("id_fast_food")
  ],
  "base_price": 249,
  "variants": [
    { "name": "Small", "price": 199 },
    { "name": "Medium", "price": 249 }
  ],
  "is_new": true,
  "created_at": ISODate("2026-01-20T11:21:29Z")
}
```

#### Step 6: Response & UI Update
```typescript
// API returns created dish
Response: { _id: "...", name: "Classic Burger", ... }

// Frontend updates state
setAllDishes([...allDishes, newDish]);

// useEffect triggers
filterDishes(); // Filters and displays

// User sees:
- "Burgers" category chip: (1) ← count updated
- "Fast Food" category chip: (1) ← count updated
- Classic Burger card in grid with "NEW" badge
```

---

## Error Handling Examples

### Missing Token
```
Request: GET /api/categories
Header: (no Authorization)

Response:
401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Invalid Token
```
Request: GET /api/categories
Header: Authorization: Bearer invalid_token_xyz

Response:
401 Unauthorized
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

### No Permission
```
Request: POST /api/categories
(User has no menu.write permission)

Response:
403 Forbidden
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

### Missing Category in Dish
```
Request: POST /api/dishes
Body: { name: "Burger", category_ids: [] }

Response:
400 Bad Request
{
  "statusCode": 400,
  "message": "At least one category_id is required"
}
```

---

## Performance Considerations

### Caching Recommendations
- Cache categories (changes infrequently)
- Cache category counts per restaurant
- Invalidate cache on create/update/delete

### Pagination for Large Restaurants
Consider adding for dishes:
```
GET /api/dishes?page=1&limit=20&sort=-created_at
```

### Indexing
MongoDB should index:
```javascript
db.dishes.createIndex({ tenant_id: 1 })
db.dishes.createIndex({ tenant_id: 1, created_at: -1 })
db.categories.createIndex({ tenant_id: 1, order: 1 })
```

---

## Type Definitions Summary

```typescript
// Frontend Types
type Category = {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  order?: number;
  is_active?: boolean;
};

type Dish = {
  _id: string;
  category_ids: string[];  // ← Multiple categories!
  name: string;
  description?: string;
  image_url?: string;
  base_price: number;
  variants?: Variant[];
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
};

type Variant = {
  name: string;
  price: number;
};

type Topping = {
  name: string;
  price: number;
};
```

---

**Last Updated**: January 20, 2026
**Version**: 1.0 - Multi-Category Support
