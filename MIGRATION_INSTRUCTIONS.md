# Database Migration SQL Scripts

## ⚠️ IMPORTANT: Apply One of These Before Testing

Choose the migration method based on your database type.

---

## Option 1: SQLite (Most Common for Development)

If you're using SQLite (which creates a `.db` file):

### Method A: Clean Restart (Easiest)
```bash
# Stop the backend server
# Delete the database file
rm backend/kisanconnect.db
# OR on Windows:
del backend\kisanconnect.db

# Restart the backend - it auto-creates with new schema
```

### Method B: Manual Migration
```sql
-- Connect to your SQLite database first
-- Then run these SQL commands:

ALTER TABLE orders ADD COLUMN shipping_address TEXT;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);

-- Verify columns were added:
PRAGMA table_info(orders);
```

---

## Option 2: PostgreSQL

### Method A: Using Alembic (Recommended)
```bash
cd backend

# Create migration
alembic revision --autogenerate -m "Add checkout fields to orders table"

# Run migration
alembic upgrade head

# Verify
alembic current
```

### Method B: Manual SQL
```sql
-- Connect to your PostgreSQL database
-- Then run:

ALTER TABLE orders ADD COLUMN shipping_address TEXT;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);

-- Verify columns exist:
\d orders
```

---

## Option 3: MySQL/MariaDB

```sql
ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255) NULL;

-- Verify
DESCRIBE orders;
```

---

## Step-by-Step Instructions

### 1. **Stop the Backend Server**
```bash
# In your backend terminal, press Ctrl+C
# This ensures no active database connections
```

### 2. **Choose Your Method Above**
- **Recommended for development**: Clean Restart (Option 1A)
- **Recommended for production**: Alembic (Option 2A)
- **If you must keep data**: Manual Migration (Option 1B, 2B, or 3)

### 3. **Restart Backend**
```bash
cd backend
python main.py
# or
uvicorn main:app --reload
```

### 4. **Verify Changes in Frontend**
1. Open http://localhost:3000
2. Login as a buyer
3. Add items to cart
4. Click "Proceed to Checkout"
5. You should see the checkout form

---

## Verification Queries

After migration, verify the columns exist:

### SQLite
```sql
PRAGMA table_info(orders);
-- Look for columns: shipping_address, payment_method, buyer_email
```

### PostgreSQL
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
```

### MySQL
```sql
DESCRIBE orders;
-- or
SHOW COLUMNS FROM orders;
```

---

## What Each Column Stores

| Column | Type | Purpose | Example |
|--------|------|---------|---------|
| `shipping_address` | TEXT | Customer's delivery address | "123 Main St, Apt 4B, Delhi 110001" |
| `payment_method` | VARCHAR(50) | Payment type (currently 'cash') | "cash" |
| `buyer_email` | VARCHAR(255) | Email of who placed order | "farmer@example.com" |

---

## Rollback Instructions (If Needed)

### SQLite
```sql
-- Note: SQLite doesn't support DROP COLUMN easily
-- Option 1: Create new table without columns, copy data
-- Option 2: Just delete the .db file and restart

-- Easiest: Stop backend, delete file, restart
rm backend/kisanconnect.db
```

### PostgreSQL
```sql
ALTER TABLE orders DROP COLUMN shipping_address;
ALTER TABLE orders DROP COLUMN payment_method;
ALTER TABLE orders DROP COLUMN buyer_email;
```

### MySQL
```sql
ALTER TABLE orders DROP COLUMN shipping_address;
ALTER TABLE orders DROP COLUMN payment_method;
ALTER TABLE orders DROP COLUMN buyer_email;
```

---

## Troubleshooting

### Problem: "Column already exists"
**Solution**: The migration was already applied. You can proceed to testing.

### Problem: "Table 'orders' doesn't exist"
**Solution**: Your backend didn't initialize the database yet. Restart the backend:
```bash
cd backend
python main.py
```

### Problem: Checkout page shows blank/errors
**Solution**: 
1. Check browser console for error messages
2. Check backend console for SQL errors
3. Run migration again
4. Clear browser cache (Ctrl+Shift+Delete)

### Problem: Cannot add NULL column to non-null table
**Solution**: Some databases require DEFAULT or NOT NULL. Use:
```sql
ALTER TABLE orders 
ADD COLUMN shipping_address TEXT DEFAULT '';
```

---

## Testing the Migration

After applying migration, test with this flow:

1. **Backend Ready Check**
   ```bash
   # Terminal 1 - Backend running
   # See "Application startup complete" message
   ```

2. **Frontend Test**
   ```bash
   # Terminal 2 - Frontend running
   npm start
   ```

3. **Browser Test**
   - Go to http://localhost:3000
   - Login as buyer
   - Add to cart → Proceed to Checkout
   - Fill address → Place Order
   - Should succeed with no errors

4. **Order Check**
   - Go to "My Orders"
   - Expand an order
   - Should see address, payment method, email

---

## Database Diagram (After Migration)

```
orders table
├── id (PK)
├── buyer_id (FK → users.id)
├── total_amount (Numeric)
├── status (Enum: pending, shipped, delivered, cancelled)
├── shipping_address ← NEW
├── payment_method ← NEW  
├── buyer_email ← NEW
├── created_at
└── items (Relationship → order_items)
```

---

## Command Reference

### Quick Start (Recommended)
```bash
# Stop backend
# Delete database
rm backend/kisanconnect.db

# Restart backend (auto-creates with new schema)
cd backend
python main.py
```

### Using Alembic
```bash
cd backend
alembic revision --autogenerate -m "Add checkout fields"
alembic upgrade head
alembic current
```

### Manual Check (Any DB)
```sql
SELECT * FROM orders LIMIT 1;
-- Should show: shipping_address, payment_method, buyer_email columns
```

---

**Status**: Ready to migrate
**Date**: January 21, 2026
**Tested With**: SQLite, PostgreSQL
