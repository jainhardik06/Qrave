# 🎯 Consumer Management System - Database Schema & Flow

## Overview
A robust customer tracking system that treats phone numbers as the primary identifier, automatically handles name updates, and maintains comprehensive order history for CRM, billing, and analytics.

---

## 📊 Database Schemas

### 1. Consumer Schema (`consumer.schema.ts`)

**Purpose**: Track end customers who order via QR menu (separate from staff/admin users)

```typescript
{
  _id: ObjectId,
  tenant_id: String (ref: Tenant),
  phone: String,              // PRIMARY IDENTIFIER per tenant
  name: String,               // Can be updated without creating new record
  email: String (optional),
  
  // Address history for delivery orders
  addresses: [{
    address_line: String,
    area: String,
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    last_used_at: Date
  }],
  
  // CRM & Analytics
  total_orders: Number,
  total_spent: Number,
  last_order_at: Date,
  first_order_at: Date,
  
  // Preferences
  dietary_preferences: [String],
  notes: String,
  is_active: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ tenant_id: 1, phone: 1 }` - Unique compound index (one consumer per phone per tenant)

---

### 2. Updated Order Schema (`order.schema.ts`)

**New Fields**:
```typescript
{
  // ... existing fields ...
  
  consumer_id: ObjectId (ref: Consumer, required),  // 🆕 Primary consumer reference
  
  // Legacy fields (kept for backwards compatibility, auto-populated)
  customer_name: String,
  customer_phone: String,
  customer_email: String,
  
  // Order type & delivery
  order_type: String (enum: 'dine-in' | 'takeaway' | 'delivery'),
  delivery_address: {                                // 🆕 Stored per order
    address_line: String,
    area: String,
    landmark: String,
    coordinates: { latitude: Number, longitude: Number }
  }
}
```

---

## 🔄 Order Placement Flow

### Step-by-Step Process

```
1. Customer submits order via QR menu
   ↓
2. PublicOrdersController receives:
   - customer_name: "Hardik Jain"
   - customer_phone: "9876543210"
   - customer_email: "hardik@example.com"
   - items, total_amount, order_type, delivery_address, etc.
   ↓
3. ConsumerService.findOrCreate()
   ├─ Phone exists in DB?
   │  ├─ YES → Retrieve existing consumer
   │  │        Check if name changed ("Hardik Jain" → "Hardik")
   │  │        └─ Update consumer.name (no new record created)
   │  └─ NO  → Create new consumer with phone + name + email
   ↓
4. Create Order with consumer_id
   - Links order to consumer via consumer_id
   - Stores customer_name/phone as legacy fields
   - Stores delivery_address if order_type = 'delivery'
   ↓
5. Update Consumer Stats
   - total_orders += 1
   - total_spent += order.total_amount
   - last_order_at = now()
   ↓
6. Save Delivery Address (if delivery order)
   - Adds to consumer.addresses[] array
   - Updates last_used_at for existing similar addresses
   ↓
7. Return Order Response
```

---

## 🎯 Key Features

### 1. **Phone as Primary Identifier**
- Phone number is unique per tenant
- Same phone across different tenants = different consumers
- `consumer.findOne({ tenant_id, phone })`

### 2. **Smart Name Updates**
```javascript
// Scenario: Customer changes name
// First order: "Hardik Jain"
// Second order: "Hardik"

// ❌ OLD BEHAVIOR: Creates 2 separate records
// ✅ NEW BEHAVIOR: Updates existing consumer's name
```

### 3. **Comprehensive Order History**
```javascript
// All orders linked via consumer_id
Order.find({ consumer_id: "abc123" })
  .sort({ createdAt: -1 })
  .populate('consumer_id')

// Get consumer with full stats
Consumer.findOne({ phone: "9876543210" })
// → { total_orders: 15, total_spent: 4850, last_order_at: ... }
```

### 4. **Address History**
```javascript
// Consumer can have multiple delivery addresses
consumer.addresses = [
  {
    area: "Koramangala",
    address_line: "123 Main St",
    last_used_at: "2026-01-20"
  },
  {
    area: "Indiranagar", 
    address_line: "456 Park Ave",
    last_used_at: "2026-01-15"
  }
]

// Auto-updates last_used_at when address reused
```

---

## 🔍 API Usage Examples

### 1. Place Order (Public Endpoint)
```bash
POST /api/public/orders
Headers: { X-Tenant: "696e0b78acfe64aa03824c94" }

Body:
{
  "customer_name": "Hardik Jain",
  "customer_phone": "9876543210",
  "customer_email": "hardik@example.com",
  "order_type": "delivery",
  "delivery_address": {
    "address_line": "123 Main St",
    "area": "Koramangala",
    "landmark": "Near Metro Station"
  },
  "items": [
    { "dish_id": "...", "quantity": 2, "price": 199 }
  ],
  "total_amount": 398
}

Response:
{
  "_id": "order_id_123",
  "consumer_id": "consumer_id_456",  // 🆕 Consumer reference
  "customer_name": "Hardik Jain",
  "customer_phone": "9876543210",
  "order_type": "delivery",
  "total_amount": 398,
  "status": "QUEUED",
  ...
}
```

### 2. Get Consumer by Phone
```javascript
const consumer = await consumerService.findByPhone("9876543210");
// Returns: { name, phone, email, total_orders, total_spent, addresses, ... }
```

### 3. Get All Consumers (CRM)
```javascript
const consumers = await consumerService.findAll({
  search: "hardik",  // Search by name or phone
  limit: 50,
  skip: 0
});
```

### 4. Get Consumer's Order History
```javascript
const orders = await orderModel.find({ consumer_id: "abc123" })
  .populate('consumer_id')
  .sort({ createdAt: -1 });
```

---

## 📈 Use Cases

### 1. **CRM Dashboard**
```javascript
// Top customers by spend
Consumer.find({ tenant_id })
  .sort({ total_spent: -1 })
  .limit(10)

// Recent orders
Consumer.find({ tenant_id })
  .sort({ last_order_at: -1 })

// Inactive customers (last order > 30 days ago)
Consumer.find({ 
  tenant_id,
  last_order_at: { $lt: new Date(Date.now() - 30*24*60*60*1000) }
})
```

### 2. **Billing System**
```javascript
// Generate invoice for consumer
const consumer = await Consumer.findById(consumerId);
const orders = await Order.find({ 
  consumer_id: consumerId,
  createdAt: { $gte: startDate, $lte: endDate }
});

// Total: consumer.total_spent
```

### 3. **Order Status Tracking**
```javascript
// Send SMS to customer
const order = await Order.findById(orderId).populate('consumer_id');
await sendSMS(order.consumer_id.phone, `Your order #${order._id} is ${order.status}`);
```

### 4. **Marketing & Personalization**
```javascript
// Customers who haven't ordered in 7 days
const inactiveConsumers = await Consumer.find({
  last_order_at: { $lt: new Date(Date.now() - 7*24*60*60*1000) }
});

// Send re-engagement campaign
```

### 5. **Delivery Optimization**
```javascript
// Get frequently used addresses
consumer.addresses
  .sort((a, b) => b.last_used_at - a.last_used_at)
  .slice(0, 3)  // Top 3 addresses
```

---

## 🔐 Data Integrity

### Multi-Tenancy
- Each consumer belongs to ONE tenant
- Phone "9876543210" in Tenant A ≠ Phone "9876543210" in Tenant B
- Enforced by compound unique index: `{ tenant_id: 1, phone: 1 }`

### Referential Integrity
- `Order.consumer_id` → `Consumer._id` (required reference)
- Deleting consumer = orphaned orders (add cascade delete logic if needed)

### Backward Compatibility
- Old orders without `consumer_id` can still work
- `customer_name` and `customer_phone` fields preserved
- Migration script can backfill `consumer_id` from phone numbers

---

## 🚀 Next Steps

### Phase 1: ✅ Complete
- [x] Consumer schema created
- [x] ConsumerService with findOrCreate logic
- [x] Order schema updated with consumer_id
- [x] PublicOrdersController integrated
- [x] Address history tracking

### Phase 2: Future Enhancements
- [ ] Admin API for consumer management
- [ ] Consumer detail page in dashboard
- [ ] Export consumer data (CSV/Excel)
- [ ] Advanced analytics (repeat rate, avg order value)
- [ ] Loyalty points system
- [ ] Push notifications for order updates
- [ ] Email marketing integration
- [ ] Consumer segmentation (VIP, regular, inactive)

---

## 📝 Migration Notes

### Backfilling Existing Orders
```javascript
// Script to add consumer_id to existing orders
const orders = await Order.find({ consumer_id: null });

for (const order of orders) {
  if (order.customer_phone) {
    let consumer = await Consumer.findOne({ 
      tenant_id: order.tenant_id, 
      phone: order.customer_phone 
    });
    
    if (!consumer) {
      consumer = await Consumer.create({
        tenant_id: order.tenant_id,
        phone: order.customer_phone,
        name: order.customer_name || 'Guest',
        first_order_at: order.createdAt
      });
    }
    
    order.consumer_id = consumer._id;
    await order.save();
  }
}
```

---

## 🧪 Testing Scenarios

### Test Case 1: New Customer
```
Input: { phone: "9999999999", name: "John Doe" }
Expected: Creates new consumer record
```

### Test Case 2: Returning Customer (Same Name)
```
Input: { phone: "9999999999", name: "John Doe" }
Expected: Retrieves existing consumer, no changes
```

### Test Case 3: Returning Customer (Name Changed)
```
First: { phone: "9999999999", name: "John Doe" }
Later: { phone: "9999999999", name: "John" }
Expected: Updates consumer.name = "John", no new record
```

### Test Case 4: Same Phone, Different Tenants
```
Tenant A: { phone: "9999999999", name: "Alice" }
Tenant B: { phone: "9999999999", name: "Bob" }
Expected: 2 separate consumer records (different tenant_id)
```

### Test Case 5: Order History
```
Customer places 3 orders
Expected: 
- consumer.total_orders = 3
- consumer.total_spent = sum of all orders
- consumer.last_order_at = latest order timestamp
```

---

## 📚 Related Files

- **Schema**: `apps/api/src/schemas/consumer.schema.ts`
- **Service**: `apps/api/src/app/orders/consumer.service.ts`
- **Order Schema**: `apps/api/src/app/schemas/order.schema.ts`
- **Controller**: `apps/api/src/app/orders/public-orders.controller.ts`
- **Module**: `apps/api/src/app/orders/orders.module.ts`
- **DTO**: `apps/api/src/app/orders/dto/create-order.dto.ts`

---

## ✅ Benefits Summary

1. **No Duplicate Customers**: Phone as unique identifier prevents duplicates
2. **Flexible Name Updates**: Name changes don't create new records
3. **Complete History**: All orders linked to consumer for CRM/analytics
4. **Address Management**: Stores and tracks delivery addresses
5. **Multi-Tenant Safe**: Proper isolation between restaurants
6. **CRM Ready**: Total orders, spend, last active date
7. **Scalable**: Indexed for performance, extensible for future features
8. **Backward Compatible**: Legacy customer fields preserved

---

*Last Updated: January 21, 2026*
