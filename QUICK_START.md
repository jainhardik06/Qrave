# 🚀 Quick Start & Commands Reference

## Server Status

✅ **API Server**: Running on http://localhost:3001
✅ **Web App**: Running on http://localhost:3000
✅ **Database**: MongoDB Atlas connected

---

## 🎯 Quick Test (Copy-Paste Ready)

### 1. Open the Application
```
Frontend: http://localhost:3000/dashboard/menu
API Health: http://localhost:3001/api
```

### 2. Create Your First Category
```
Button: "+ New Category" (Red, top right)

Fill in:
Name: Burgers
Description: Our signature burgers
Icon: 🍔 (Beef icon)
Color: Red (#ef4444)

Click: Create
```

### 3. Create Your First Dish with Multiple Categories
```
Button: "+ Add Dish" (Red, top right)

STEP 1 - Basic Info:
  Name: Classic Burger
  Price: ₹249
  Description: Juicy beef patty with lettuce, tomato, onion
  Categories: ✓ Burgers (check it)
  Click: Next Step

STEP 2 - Variants & Details:
  Toggle: Add Variants
    Small: ₹199
    Medium: ₹249
    Large: ₹299
  Prep Time: 10 minutes
  Mark as NEW: Toggle ON ✅
  Click: Next Step

STEP 3 - Review:
  Review all information
  Click: Save Dish
```

### 4. Verify Data Display
```
Expected Result:
✅ "Burgers" category shows "(1)"
✅ "Classic Burger" card appears in grid
✅ Shows "NEW" badge
✅ Shows "₹249 onwards"
✅ Shows "⏱ 10 min"
✅ Shows "🔀 3 variants"
```

---

## 🔧 Development Commands

### Start Both Servers (From Project Root)
```bash
# Terminal 1 - Start API
npm run dev:api

# Terminal 2 - Start Web App
npm run dev:web
```

### Build Production
```bash
# Build both projects
npm run build

# Build API only
npm run build:api

# Build Web only
npm run build:web
```

### Run Tests
```bash
# All tests
npm test

# API tests only
npm run test:api

# Watch mode
npm test -- --watch
```

### Linting
```bash
# Lint all
npm run lint

# Fix linting issues
npm run lint -- --fix
```

---

## 🔍 Debugging

### Browser DevTools Console
```javascript
// Check your JWT token and tenant_id
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Your tenant_id:', payload.tenant_id);
console.log('Your email:', payload.email);
```

### API Logs (Check Terminal Running `npm run dev:api`)
```
Look for these success logs:
✅ TenancyMiddleware - Setting tenant_id: 6950d1b4...
✅ CategoryService.findAll - tenant_id: 6950d1b4...
✅ DishService.findAll - found dishes: 3
```

### MongoDB Verification
```
Use MongoDB Compass:
1. Connect: mongo url
2. Database: qrave_db
3. Collections: categories, dishes
4. Filter: { tenant_id: ObjectId("your-tenant-id") }
```

---

## 📋 Feature Checklist

After completing quick test, verify these features work:

### Categories
- [ ] Create category with custom color and icon
- [ ] Edit category name/color/icon
- [ ] Delete category
- [ ] Category appears in filter chips
- [ ] Shows count of dishes in category

### Dishes
- [ ] Add new dish with name and price
- [ ] Add multiple variants (Small/Medium/Large)
- [ ] Select multiple categories for one dish
- [ ] Mark as NEW or Bestseller
- [ ] Set preparation time
- [ ] Upload image (optional)
- [ ] Edit dish details
- [ ] Delete dish
- [ ] Dish appears in correct categories

### Searching & Filtering
- [ ] Search by dish name updates list in real-time
- [ ] Click category chip filters to that category only
- [ ] "All Items" shows everything
- [ ] Category counts update correctly
- [ ] Search + category filter work together

### Multi-Tenancy (Data Isolation)
- [ ] Each restaurant only sees their own categories
- [ ] Each restaurant only sees their own dishes
- [ ] Categories don't mix between restaurants
- [ ] Dishes don't mix between restaurants

### UI/UX
- [ ] Menu page loads without errors
- [ ] Cards have hover effects (lift up)
- [ ] Grid is responsive (4 cols desktop, 2 tablet, 1 mobile)
- [ ] Search bar appears and works
- [ ] Category filter chips appear and work
- [ ] Category edit/delete buttons appear
- [ ] Prices display with "onwards" for variants
- [ ] NEW and Bestseller badges show

---

## 🐛 Troubleshooting

### Problem: "All Items (0)" - No data showing
**Solution 1: Refresh Page**
```
Press F5 or Cmd+R
```

**Solution 2: Clear Cache & Cookies**
```
DevTools → Application → Clear Site Data
Log out and log back in
```

**Solution 3: Check Token**
```javascript
// In browser console
const token = localStorage.getItem('token');
if (!token) console.log('❌ No token!');
else console.log('✅ Token exists');
```

**Solution 4: Check API Connection**
```
Visit: http://localhost:3001/api
Should return: {"message":"Qrave API","version":"0.1.0"}
```

### Problem: Can't add category
**Solution:**
1. Check browser console for errors (F12)
2. Check API is running (http://localhost:3001)
3. Verify token is valid (console: localStorage.getItem('token'))

### Problem: Category appears but dishes don't
**Solution:**
1. You may not have created any dishes yet
2. Try adding a dish with "+ Add Dish" button
3. Check MongoDB to verify dishes are saved

### Problem: "At least one category required" error
**Solution:**
When adding a dish, you MUST select at least one category
- Check at least one checkbox
- Categories shown as checkboxes in Step 1

---

## 📊 System Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                  FRONTEND                             │
│            (Next.js 14 - React)                      │
│  http://localhost:3000/dashboard/menu                │
│  • Pinterest-style grid UI                           │
│  • Real-time search & filtering                      │
│  • Category management modal                         │
│  • Multi-step dish form editor                       │
└──────────────────────────────────────────────────────┘
              ↓ (Axios HTTP Requests)
         (JWT Token in Header)
              ↓
┌──────────────────────────────────────────────────────┐
│                    BACKEND                            │
│          (NestJS + Mongoose)                         │
│  http://localhost:3001/api                           │
│  • JWT Authentication                                │
│  • TenancyMiddleware (tenant isolation)              │
│  • CategoryController & CategoryService              │
│  • DishController & DishService                      │
│  • RequestContext (AsyncLocalStorage)                │
│  • MongoDB Query Building & Validation               │
└──────────────────────────────────────────────────────┘
              ↓ (Mongoose Operations)
         (Tenant-filtered queries)
              ↓
┌──────────────────────────────────────────────────────┐
│                   DATABASE                            │
│            (MongoDB Atlas - Remote)                  │
│  mongodb+srv://qrave_admin:***@qravecluster...      │
│  • collections.categories (tenant_id indexed)       │
│  • collections.dishes (tenant_id indexed)           │
│  • collections.users (for multi-tenancy)            │
│  • All data isolated by tenant_id                    │
└──────────────────────────────────────────────────────┘
```

---

## 📚 File Structure (Key Files)

```
Qrave/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── app/
│   │       │   └── menu/
│   │       │       ├── category.controller.ts    ← Category routes
│   │       │       ├── category.service.ts       ← Category logic
│   │       │       ├── dish.controller.ts        ← Dish routes
│   │       │       └── dish.service.ts           ← Dish logic
│   │       ├── common/
│   │       │   └── context/
│   │       │       └── request-context.ts        ← Tenant context
│   │       ├── middleware/
│   │       │   └── tenancy.middleware.ts         ← JWT extraction
│   │       └── schemas/
│   │           ├── category.schema.ts            ← Category model
│   │           └── dish.schema.ts                ← Dish model (category_ids array)
│   │
│   └── web/
│       └── app/
│           └── dashboard/
│               └── menu/
│                   ├── page.tsx                  ← Menu management page (Pinterest UI)
│                   └── dishes/
│                       └── [id]/page.tsx         ← Dish editor form
│
├── TESTING_GUIDE.md       ← Step-by-step testing
├── RESOLUTION_SUMMARY.md  ← What was fixed
├── API_CONTRACT.md        ← API documentation
└── QUICK_START.md         ← This file
```

---

## 🎓 Learning Resources

### Understanding the Flow
1. Read **TESTING_GUIDE.md** → "Data Flow Verification"
2. Check **API_CONTRACT.md** → "Complete Data Flow - Real Example"
3. Review code comments in services

### API Documentation
- See **API_CONTRACT.md** for all endpoints
- All endpoints require `Authorization: Bearer <token>` header
- Base URL: `http://localhost:3001/api`

### Component Structure
- See **API_CONTRACT.md** → "Component Structure"
- Frontend components in `apps/web/app/dashboard/menu/`
- Backend services in `apps/api/src/app/menu/`

---

## 🎉 You're All Set!

Everything is configured and running:
✅ API Server active
✅ Web App active  
✅ Database connected
✅ Multi-tenancy working
✅ Multi-category support ready

**Next Steps:**
1. Create a category using the "+ New Category" button
2. Add a dish using the "+ Add Dish" button
3. Test multi-category assignment
4. Verify data persistence and display

**Questions?** Check the relevant guide:
- **How to use?** → TESTING_GUIDE.md
- **How to debug?** → API_CONTRACT.md (Error Handling section)
- **What changed?** → RESOLUTION_SUMMARY.md

---

**Last Updated**: January 20, 2026
**Status**: ✅ READY FOR TESTING
