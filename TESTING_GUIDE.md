# Qrave Menu Management - Complete Testing Guide

## System Status ✅

Both servers are now running:
- **API Server**: http://localhost:3001 (NestJS + MongoDB)
- **Web App**: http://localhost:3000 (Next.js)
- **Database**: MongoDB Atlas (Remote)

---

## Step 1: Create a Category (e.g., "Burgers")

### Flow Diagram
```
User Dashboard Menu Page
    ↓
Click "+ New Category" Button
    ↓
Modal Opens with:
  - Category Name: "Burgers" 🍔
  - Icon Picker: Select 🍔
  - Color Picker: Select Red
  - Description (optional)
    ↓
Click "Create"
    ↓
Frontend → API POST /api/categories
    ↓
TenancyMiddleware Extracts JWT token
    ↓
Sets tenant_id in RequestContext
    ↓
CategoryService.create() runs
    ↓
MongoDB Insert with tenant_id isolation
    ↓
Response returned to frontend
    ↓
Category appears in filter chips with count
```

### Steps to Test:
1. Go to http://localhost:3000/dashboard/menu
2. Click the red **"+ New Category"** button (top right)
3. Enter:
   - **Name**: "Burgers"
   - **Description**: "Delicious burger selections"
   - **Icon**: 🍔 (select burger icon)
   - **Color**: Red (#ef4444)
4. Click **"Create"** button
5. **Expected Result**: 
   - Modal closes
   - New "Burgers" category appears in filter chips below search bar
   - Shows count like "Burgers (0)" until you add dishes

**Debug Console Logs** (Open browser DevTools → Console):
```
🔄 Fetching menu data from: http://localhost:3001/api
📌 Token available: true
✅ Categories fetched: [{ _id: '...', name: 'Burgers', icon: 'beef', color: '#ef4444', ... }]
✅ Dishes fetched: []
```

**Backend Console** (Check your API terminal):
```
TenancyMiddleware - Setting tenant_id: 6950d1b4...
CategoryService.create - tenant_id: 6950d1b4...
```

---

## Step 2: Add a Burger Dish with Multiple Categories

### Flow Diagram
```
Menu Page
    ↓
Click Red "+ Add Dish" Button (top right)
    ↓
Redirect to /dashboard/menu/dishes/new
    ↓
Dish Editor Form Loads
    ↓
Step 1: Basic Information
  - Name: "Classic Burger"
  - Description: "Juicy beef patty with lettuce and tomato"
  - Price: ₹249 (use 10-rupee increments)
  - Select Multiple Categories:
    ✓ Burgers
    ✓ Bestsellers (if you create one)
    
Step 2: Additional Details
  - Variants: Small (₹199), Medium (₹249), Large (₹299)
  - Prep Time: 10 minutes
  - Dietary Tags: Select "vegetarian" if applicable
  - Calories: 500
    
Step 3: Review & Save
    ↓
Click "Save Dish"
    ↓
Frontend validates: category_ids.length > 0
    ↓
Converts category_ids to ObjectIds
    ↓
API POST /api/dishes
    ↓
TenancyMiddleware sets tenant_id
    ↓
DishService.create():
  - Validates tenant_id exists
  - Creates dish with category_ids array
  - Saves to MongoDB
    ↓
Returns dish with _id
    ↓
Redirect to menu page
    ↓
Page fetches updated dishes
    ↓
Dish appears in grid under selected categories
```

### Steps to Test:
1. Click **"+ Add Dish"** button (red, top right)
2. **Step 1 - Basic Info**:
   - **Name**: "Classic Burger"
   - **Description**: "Juicy beef patty with lettuce, tomato, and special sauce"
   - **Base Price**: ₹249
   - **Categories**: Check "Burgers" ✓
   - Click "Next Step →"

3. **Step 2 - Variants & Details**:
   - **Variants**: Toggle "Add Variants"
     - Small: ₹199
     - Medium: ₹249
     - Large: ₹299
   - **Preparation Time**: 10 minutes
   - **Dietary Tags**: Select "vegetarian" if applicable
   - **Calories**: 500
   - **Mark as New**: Toggle ON ✅
   - Click "Next Step →"

4. **Step 3 - Review**:
   - Review all information
   - Click **"Save Dish"** button
   - **Expected Result**: 
     - Redirects to menu page
     - "Classic Burger" appears in grid
     - Shows under "Burgers" category filter
     - Displays price ₹249 with "onwards" text (because of variants)
     - Shows "NEW" badge (green)

**Debug Console Logs** (Browser DevTools):
```
✅ Categories fetched: [{ name: 'Burgers', _id: '...', ... }]
```

**Backend Logs** (API Terminal):
```
TenancyMiddleware - Setting tenant_id: 6950d1b4...
DishService.create - tenant_id: 6950d1b4...
DishService.create - saving dish: { tenant_id: '6950d1b4...', category_ids: ['...'], name: 'Classic Burger' }
CategoryService.findAll - tenant_id: 6950d1b4...
```

---

## Step 3: Add Another Category & Assign to Same Dish

### Steps:
1. Click **"+ New Category"** to add "Fast Food" category
2. Click on your "Classic Burger" dish card to edit it
3. **In the editor**, under "Categories" section:
   - Check **both** "Burgers" ✓ and "Fast Food" ✓
4. **Save Dish**
5. **Expected Result**:
   - Dish now appears in both category filters
   - Click "Burgers" → sees the burger
   - Click "Fast Food" → sees the burger
   - Click "All Items" → sees the burger

---

## Step 4: Create 2-3 More Sample Dishes

### Burger Variations:
- **Veggie Burger** (Vegetarian, Vegan tags)
  - ₹199
  - Categories: Burgers, Vegetarian Options
  
- **Chicken Burger** 
  - ₹279
  - Categories: Burgers, Bestsellers (if created)
  - Mark as Bestseller ✅
  - Mark as Popular ✅

---

## Data Flow Verification Checklist

### ✅ Tenant Isolation is Working When:
- [ ] Categories created by Restaurant A don't appear for Restaurant B
- [ ] Each restaurant has separate category counts
- [ ] Dishes are filtered by logged-in user's tenant_id
- **Check**: Console logs show `tenant_id` matching your JWT

### ✅ Multi-Category Support is Working When:
- [ ] A dish can be assigned to 2+ categories
- [ ] Edit a dish → categories appear as checked checkboxes
- [ ] All selected categories are saved
- [ ] Dish appears in filter for all selected categories

### ✅ Search is Working When:
- [ ] Type "burger" in search bar → filters to burger dishes
- [ ] Type "veggie" → shows Veggie Burger only
- [ ] Clear search → shows all dishes again

### ✅ Category Filtering is Working When:
- [ ] "All Items (3)" shows all 3 dishes
- [ ] Click "Burgers" → shows only burgers
- [ ] Shows count per category "Burgers (2)"
- [ ] Category edit/delete buttons work

### ✅ UI/UX is Working When:
- [ ] Pinterest-style grid shows 4 columns on desktop
- [ ] Cards have hover lift effect
- [ ] Prices show with "onwards" for variants
- [ ] NEW and Bestseller badges display correctly
- [ ] "No dishes found" message appears when appropriate

---

## Debugging - If Data Doesn't Show

### Check 1: API Connection
```
Open Browser DevTools → Console
You should see:
✅ Categories fetched: Array
✅ Dishes fetched: Array
```

If you see errors:
```
❌ Error fetching data: Network Error
```

**Solution**: 
- Verify API is running: http://localhost:3001/api (should return JSON)
- Check token in localStorage

### Check 2: MongoDB Data
Use MongoDB Compass:
1. Connect to: `Mongo url/`
2. Navigate to: `qrave_db` → `categories` collection
3. Check filter: `{ tenant_id: ObjectId("your-tenant-id") }`
4. Should see your categories

### Check 3: Tenant ID Mismatch
```
In Browser Console, run:
const token = localStorage.getItem('token');
// Decode JWT:
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Your tenant_id:', payload.tenant_id);
```

In API Server logs:
```
Look for: "TenancyMiddleware - Setting tenant_id: ..."
Should match the tenant_id above
```

### Check 4: Token Issues
If no tenant_id in API logs:
1. Log out from http://localhost:3000
2. Log back in
3. Refresh page
4. Try fetching categories again

---

## Complete Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Browser (Frontend)                      │
│  http://localhost:3000/dashboard/menu                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Menu Page Component                                     │   │
│  │ ├─ State: categories, allDishes, filteredDishes        │   │
│  │ ├─ useEffect: fetchData() on mount                     │   │
│  │ └─ useEffect: filterDishes() when deps change          │   │
│  └────────────────────────────────────────────────────────┘   │
│         ↓                                      ↓                │
│    axios.get                              axios.get            │
│    /categories                            /dishes              │
│         ↓                                      ↓                │
└─────────────────────────────────────────────────────────────────┘
         ↓                                      ↓
   HTTP Request with Bearer Token
         ↓                                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API Server (Backend)                        │
│  http://localhost:3001/api                                     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ TenancyMiddleware                                       │   │
│  │ ├─ Extract JWT from Authorization header              │   │
│  │ ├─ Decode JWT: { tenant_id, sub, email, roles }       │   │
│  │ ├─ RequestContext.run(() => {                          │   │
│  │ │   RequestContext.set({ tenantId, userId, ... })     │   │
│  │ │   next() → Route Handler                             │   │
│  │ └─ })                                                  │   │
│  └────────────────────────────────────────────────────────┘   │
│         ↓                                      ↓                │
│  CategoryController                      DishController        │
│      findAll()                               findAll()         │
│         ↓                                      ↓                │
│  CategoryService                         DishService          │
│  ├─ const tenant_id = RequestContext       ├─ const tenant_id │
│  │   .getTenantId()                        │   .getTenantId()  │
│  ├─ return categoryModel.find({            ├─ return dishModel │
│  │   tenant_id, ...                        │   .find({         │
│  │ })                                       │   tenant_id, ...  │
│  └────────────────────────────────────────┘ └────────────────┘
│         ↓                                      ↓                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ MongoDB Atlas                                           │   │
│  │ Database: qrave_db                                     │   │
│  │                                                        │   │
│  │ Collections:                                           │   │
│  │ ├─ categories                                          │   │
│  │ │  [{ _id, name, icon, color, tenant_id, ... }]      │   │
│  │ └─ dishes                                              │   │
│  │    [{ _id, name, base_price, category_ids[],           │   │
│  │       tenant_id, ... }]                                │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         ↑                                      ↑
    JSON Response (filtered by tenant_id)
         ↑                                      ↑
┌─────────────────────────────────────────────────────────────────┐
│  Browser: setCategories(data), setAllDishes(data)               │
│  ↓                                                               │
│  filterDishes() based on selectedCategory & searchQuery         │
│  ↓                                                               │
│  Render: Grid of dishes in Pinterest style                      │
│  - Category filter chips with counts                            │
│  - Search bar for filtering                                     │
│  - 4-column masonry grid with dish cards                        │
│  - Edit/Delete buttons for categories                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Scenarios & Solutions

### ❌ "All Items (0)" - No categories or dishes appear

**Causes & Solutions**:

1. **Token Expired**
   - Open DevTools → Application → Cookies
   - Clear all cookies
   - Log out and log in again

2. **API Not Running**
   - Check if `http://localhost:3001/api` returns data
   - Restart API: `npm run dev:api`

3. **Tenant ID Mismatch**
   - Check browser console logs during page load
   - Verify `TenancyMiddleware - Setting tenant_id` in API logs
   - Must match JWT payload

4. **MongoDB Connection Issue**
   - Check API logs for connection errors
   - Verify `.env` has correct `MONGODB_URI`

### ❌ Can't add category - Button not working

**Solution**:
- Open DevTools → Console
- Check for JavaScript errors
- Verify `NEXT_PUBLIC_API_BASE_URL` environment variable

### ❌ Category appears but dishes don't

**Possible Reasons**:
- Dishes not yet created for this restaurant
- Tenant ID mismatch between dishes and categories
- Check MongoDB: `db.dishes.find({ tenant_id: ObjectId(...) })`

---

## Files Modified for Multi-Category Support

### Backend (NestJS API)
- `apps/api/src/schemas/dish.schema.ts` - Changed `category_id` → `category_ids[]`
- `apps/api/src/app/menu/dish.service.ts` - Updated to handle array of categories
- `apps/api/src/app/menu/dish.controller.ts` - Updated DTO
- `apps/api/src/middleware/tenancy.middleware.ts` - Fixed context wrapping
- `apps/api/src/app/menu/category.service.ts` - Added debug logging

### Frontend (Next.js)
- `apps/web/app/dashboard/menu/page.tsx` - New Pinterest-style UI with search/filter
- `apps/web/app/dashboard/menu/dishes/[id]/page.tsx` - Multi-category checkboxes in editor

---

## Summary

✅ **All Problems Resolved**:
1. ✅ API connection working (MongoDB Atlas)
2. ✅ Multi-category support implemented (category_ids array)
3. ✅ Tenant isolation fixed (TenancyMiddleware context wrapping)
4. ✅ Pinterest-style UI created with search and filtering
5. ✅ Category multi-select in dish editor with checkboxes
6. ✅ Complete data flow from frontend → API → MongoDB → Frontend

🚀 **Ready to Test**: Follow the steps above to create categories and dishes!
