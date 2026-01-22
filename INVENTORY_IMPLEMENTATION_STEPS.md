# 🛠️ Inventory Management - Step-by-Step Implementation Guide

## IMPLEMENTATION PHASES & DETAILED STEPS

---

## 📌 PHASE 1: CORE INVENTORY (Weeks 1-3)

### Step 1.1: Create InventoryItem Schema & Service
```
Files to create:
- apps/api/src/schemas/inventory-item.schema.ts
- apps/api/src/app/inventory/inventory-item.service.ts
- apps/api/src/app/inventory/dto/create-inventory-item.dto.ts
- apps/api/src/app/inventory/dto/update-inventory-item.dto.ts

What it does:
- Store master data for each inventory item
- Track current stock, reorder level, cost
- Link to supplier, storage location
```

### Step 1.2: Create InventoryTransaction (Audit Trail)
```
Files to create:
- apps/api/src/schemas/inventory-transaction.schema.ts
- apps/api/src/app/inventory/inventory-transaction.service.ts

What it does:
- Log every stock movement (purchase, usage, wastage, adjustment)
- Maintain complete audit trail
- Enable reversal/reconciliation
```

### Step 1.3: Create Stock Adjustment Endpoints
```
Files to create:
- apps/api/src/app/inventory/inventory.controller.ts

Endpoints:
POST   /api/inventory/items              - Create item
GET    /api/inventory/items              - List items
GET    /api/inventory/items/:id          - Get item details
PATCH  /api/inventory/items/:id          - Update item
POST   /api/inventory/items/:id/adjust   - Manual stock adjustment
POST   /api/inventory/items/:id/check    - Check available stock
```

### Step 1.4: Create InventoryModule
```
Files to create:
- apps/api/src/app/inventory/inventory.module.ts

What it does:
- Register all schemas (InventoryItem, InventoryTransaction)
- Provide all services
- Export for other modules to use
```

### Step 1.5: Integrate with Order System
```
Files to modify:
- apps/api/src/app/orders/orders.service.ts
- apps/api/src/app/orders/public-orders.controller.ts

What to add:
- When order created: Call InventoryItemService.deductStock()
- When order cancelled: Call InventoryItemService.refundStock()
- Check stock availability before order confirmation
```

### Step 1.6: Create Basic Dashboard
```
Files to create:
- apps/api/src/app/inventory/inventory-analytics.service.ts

Endpoints:
GET /api/inventory/dashboard/summary
- Total inventory value
- Items count
- Low stock items count
- Expiry alerts count
```

---

## 📌 PHASE 2: PROCUREMENT (Weeks 4-6)

### Step 2.1: Create Supplier Schema & Service
```
Files to create:
- apps/api/src/schemas/supplier.schema.ts
- apps/api/src/app/inventory/supplier.service.ts
- apps/api/src/app/inventory/dto/create-supplier.dto.ts

What it does:
- Store supplier details (name, contact, payment terms)
- Track supplier performance metrics
- Link suppliers to items
```

### Step 2.2: Create Purchase Order System
```
Files to create:
- apps/api/src/schemas/purchase-order.schema.ts
- apps/api/src/app/inventory/purchase-order.service.ts
- apps/api/src/app/inventory/dto/create-purchase-order.dto.ts

What it does:
- Create PO with items and supplier
- Approval workflow (pending → approved → sent)
- Track expected delivery date
```

### Step 2.3: Create Goods Receipt Note (GRN)
```
Files to create:
- apps/api/src/schemas/goods-receipt-note.schema.ts
- apps/api/src/app/inventory/goods-receipt.service.ts
- apps/api/src/app/inventory/dto/create-grn.dto.ts

What it does:
- Link GRN to PO
- Verify received items vs ordered
- Quality check (accept/reject)
- Auto-update stock on acceptance
```

### Step 2.4: Add Procurement Endpoints
```
Endpoints:
GET    /api/inventory/purchase-orders         - List POs
POST   /api/inventory/purchase-orders         - Create PO
PATCH  /api/inventory/purchase-orders/:id/approve
POST   /api/inventory/goods-receipt          - Create GRN
PATCH  /api/inventory/goods-receipt/:id/accept
GET    /api/inventory/suppliers              - List suppliers
POST   /api/inventory/suppliers              - Create supplier
```

---

## 📌 PHASE 3: ADVANCED OPERATIONS (Weeks 7-10)

### Step 3.1: Create InventoryBatch Schema (Expiry Tracking)
```
Files to create:
- apps/api/src/schemas/inventory-batch.schema.ts

What it does:
- Track batch number, expiry date per item
- FIFO enforcement (oldest first)
- Batch-level stock tracking
```

### Step 3.2: Create Expiry Management
```
Files to modify/create:
- apps/api/src/app/inventory/expiry.service.ts

Features:
- Alert for items expiring soon (7, 14, 30 days)
- Auto-remove expired items
- FIFO suggestion for usage
- Expiry report
```

### Step 3.3: Create Physical Stock Counting
```
Files to create:
- apps/api/src/schemas/stock-count-session.schema.ts
- apps/api/src/app/inventory/stock-count.service.ts

Features:
- Start counting session
- Enter physical count for items
- Calculate variance
- Generate reconciliation report
- Auto-adjust stock (with approval)
```

### Step 3.4: Create Waste Tracking
```
Files to create:
- apps/api/src/schemas/waste-log.schema.ts
- apps/api/src/app/inventory/waste.service.ts

Features:
- Log wasted items with reason
- Track cost of waste
- Generate waste analysis report
- Identify high-waste items
```

---

## 📌 PHASE 4: INTEGRATION & ANALYTICS (Weeks 11-13)

### Step 4.1: Recipe-to-Inventory Link
```
Files to create:
- apps/api/src/schemas/inventory-recipe.schema.ts
- apps/api/src/app/inventory/recipe.service.ts

What it does:
- Link each dish to its ingredients
- Auto-deduct ingredients when dish ordered
- Calculate ingredient cost per dish
- Track COGS (Cost of Goods Sold)
```

### Step 4.2: Menu Integration (Availability)
```
Files to modify:
- apps/api/src/app/menu/menu.service.ts

Features:
- Check ingredient availability before showing dish
- Mark dishes as "Out of Stock" if ingredient unavailable
- Suggest alternatives
- Show "Low Stock" badge
```

### Step 4.3: Advanced Analytics & Reports
```
Files to create:
- apps/api/src/app/inventory/reports.service.ts

Reports:
- Low stock alert report
- Expiry report
- Wastage analysis
- Supplier performance
- Inventory aging
- Variance report
- Profitability report (by dish)
```

---

## 📌 PHASE 5: AI & AUTOMATION (Weeks 14-16)

### Step 5.1: Demand Forecasting
```
Files to create:
- apps/api/src/schemas/inventory-forecast.schema.ts
- apps/api/src/app/inventory/forecast.service.ts

Algorithm:
- Analyze historical usage
- Factor in day of week, holidays, season
- Generate weekly forecast
- Display recommendations

Note: Can start simple (moving average), improve with ML later
```

### Step 5.2: Auto-Reordering Logic
```
Files to create/modify:
- apps/api/src/app/inventory/auto-reorder.service.ts

Features:
- Check forecast vs current stock
- Auto-create PO when stock below reorder level
- Smart supplier selection
- Approval workflow
```

### Step 5.3: Waste Prevention Alerts
```
Files to modify:
- apps/api/src/app/inventory/expiry.service.ts

Features:
- Alert before items expire
- Suggest dishes using expiring ingredients
- Track waste prevention wins
```

---

## 📌 PHASE 6: MOBILE & POLISH (Weeks 17-18)

### Step 6.1: Mobile Stock Count App
```
Files to create:
- apps/web/app/dashboard/inventory/stock-count.tsx
- Barcode scanning integration

Features:
- Scan items with barcode reader
- Enter physical count
- Photo capture for verification
- Offline support
```

### Step 6.2: Advanced Dashboards
```
Files to create:
- Dashboard UI components
- Charts & visualizations
- Real-time KPI display

Features:
- Inventory value chart
- Stock-out incidents
- Waste trends
- Supplier performance
```

---

## 🗂️ COMPLETE FILE STRUCTURE (End State)

```
apps/api/src/
├── schemas/
│   ├── inventory-item.schema.ts          🆕
│   ├── inventory-batch.schema.ts         🆕
│   ├── inventory-transaction.schema.ts   🆕
│   ├── purchase-order.schema.ts          🆕
│   ├── goods-receipt-note.schema.ts      🆕
│   ├── supplier.schema.ts                🆕
│   ├── inventory-forecast.schema.ts      🆕
│   ├── inventory-recipe.schema.ts        🆕
│   ├── waste-log.schema.ts               🆕
│   └── stock-count-session.schema.ts     🆕
│
├── app/
│   ├── inventory/                        🆕 (NEW FOLDER)
│   │   ├── inventory.module.ts           🆕
│   │   ├── inventory.controller.ts       🆕
│   │   ├── inventory-item.service.ts     🆕
│   │   ├── inventory-transaction.service.ts
│   │   ├── supplier.service.ts           🆕
│   │   ├── purchase-order.service.ts     🆕
│   │   ├── goods-receipt.service.ts      🆕
│   │   ├── expiry.service.ts             🆕
│   │   ├── stock-count.service.ts        🆕
│   │   ├── waste.service.ts              🆕
│   │   ├── recipe.service.ts             🆕
│   │   ├── forecast.service.ts           🆕
│   │   ├── auto-reorder.service.ts       🆕
│   │   ├── reports.service.ts            🆕
│   │   ├── inventory-analytics.service.ts
│   │   └── dto/                          🆕
│   │       ├── create-inventory-item.dto.ts
│   │       ├── create-supplier.dto.ts
│   │       ├── create-purchase-order.dto.ts
│   │       └── create-grn.dto.ts
│   │
│   ├── orders/
│   │   └── orders.service.ts             ✏️ (modify)
│   │
│   └── menu/
│       └── menu.service.ts               ✏️ (modify)

apps/web/app/
├── dashboard/
│   ├── inventory/                        🆕 (NEW FOLDER)
│   │   ├── page.tsx                      🆕
│   │   ├── stock-count.tsx               🆕
│   │   ├── suppliers.tsx                 🆕
│   │   ├── purchase-orders.tsx           🆕
│   │   ├── reports.tsx                   🆕
│   │   └── analytics.tsx                 🆕
│   │
│   └── components/
│       └── inventory/                    🆕
│           ├── InventoryDashboard.tsx    🆕
│           ├── StockAlert.tsx            🆕
│           └── InventoryChart.tsx        🆕
```

---

## 📊 TESTING CHECKLIST

### Unit Tests
- [ ] InventoryItemService.deductStock()
- [ ] InventoryItemService.refundStock()
- [ ] PurchaseOrderService.create()
- [ ] GoodsReceiptService.accept()
- [ ] StockCountService.reconcile()
- [ ] ForecastService.predict()

### Integration Tests
- [ ] Order placed → Inventory deducted
- [ ] Order cancelled → Inventory refunded
- [ ] GRN accepted → Stock updated
- [ ] Forecast → Auto-reorder created

### Manual Testing
- [ ] Create item, check stock value
- [ ] Place order, verify stock deducted
- [ ] Create PO, receive GRN, verify stock
- [ ] Physical count, check variance
- [ ] Check expiry alerts
- [ ] Verify multi-tenant isolation

---

## 🔄 DATA MIGRATION (If applicable)

```
Phase 1: Run migration script to populate InventoryItem from Dish data
Phase 2: Run script to link existing Orders to inventory transactions
Phase 3: Run script to backfill recipe costs from historical orders
Phase 4: Reconcile physical count with calculated balances
```

---

## 📝 ESTIMATED EFFORT

```
Phase 1:  30-40 hours (schemas, basic CRUD, integration)
Phase 2:  25-35 hours (PO workflow, GRN, supplier management)
Phase 3:  30-40 hours (batch tracking, expiry, counting)
Phase 4:  20-30 hours (analytics, reporting, menu integration)
Phase 5:  25-35 hours (forecasting, ML, auto-reorder)
Phase 6:  15-20 hours (mobile, UI polish, optimization)

TOTAL: ~150-200 hours (~4-5 weeks with 1 dev)
```

---

## ✅ SUCCESS CRITERIA

- [x] Stock accuracy > 95%
- [x] No stock-outs for >30 days
- [x] Waste tracking at item level
- [x] Profitability visible per dish
- [x] Suppliers tracked with performance
- [x] Zero cross-tenant data leakage
- [x] Mobile-friendly stock count
- [x] Automated alerts working
- [x] All data linked to tenant_id
- [x] Full audit trail maintained

---

## 🎯 QUICK START

When ready to start implementation:

1. **Create InventoryItem schema** (30 min)
2. **Create CRUD service & controller** (1 hour)
3. **Test with Postman** (30 min)
4. **Create InventoryTransaction** (45 min)
5. **Integrate with Order** (1 hour)
6. **Test complete order flow** (1 hour)

**Day 1 Goal**: Place order → See stock auto-deducted ✅

Then build on this foundation...

---

*Ready? Let's start building! 🚀*
