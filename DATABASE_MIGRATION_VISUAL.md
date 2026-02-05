# 🗄️ Database Migration - Visual Guide

## Before You Start

Choose ONE method and follow it. Don't do multiple methods!

---

## ⚡ EASIEST METHOD (Recommended for Development)

### Delete & Restart
**Best for:** Fresh development, no existing data to keep

**Steps:**

```bash
# Step 1: Stop the backend server
# (In your backend terminal, press Ctrl+C)

# Step 2: Find and delete the database file
# Windows:
del backend\kisanconnect.db

# OR Mac/Linux:
rm backend/kisanconnect.db

# Step 3: Restart the backend
cd backend
python main.py
# OR
uvicorn main:app --reload

# Wait for: "Application startup complete"
# ✅ Done! Database recreated with new schema
```

**Visual:**
```
BEFORE                  ACTION              AFTER
────────                ──────              ─────
kisanconnect.db    +  Delete       →    (no file)
                   +  Restart      →    kisanconnect.db ✨
                                       (new schema!)
```

---

## 📝 MANUAL SQL METHOD

**Best for:** You want to keep existing data

### Choose Your Database Type

---

### SQLite
**File-based database (most common for dev)**

```bash
# Step 1: Open SQLite
sqlite3 backend/kisanconnect.db

# Step 2: Copy-paste these 3 commands
ALTER TABLE orders ADD COLUMN shipping_address TEXT;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);

# Step 3: Verify (copy-paste this)
PRAGMA table_info(orders);

# Look for these columns in the output:
# ... id, buyer_id, total_amount, status, created_at,
# shipping_address, payment_method, buyer_email

# Step 4: Exit
.exit

# ✅ Done!
```

**Verification output should show:**
```
cid  name               type        notnull  dflt_value
─────────────────────────────────────────────────────
0    id                 BIGINT      1        
1    buyer_id           BIGINT      1        
2    total_amount       NUMERIC     1        
3    status             VARCHAR     1        pending
4    created_at         DATETIME    1        
5    shipping_address   TEXT        0                    ← NEW
6    payment_method     VARCHAR(50) 0        'cash'     ← NEW
7    buyer_email        VARCHAR(255) 0                   ← NEW
```

---

### PostgreSQL
**Enterprise database**

```bash
# Step 1: Connect to PostgreSQL
psql -U postgres -d kisanconnect_db

# Step 2: Run these 3 commands
ALTER TABLE orders ADD COLUMN shipping_address TEXT;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);

# Step 3: Verify
\d orders

# Look for the new columns in the output

# Step 4: Exit
\q

# ✅ Done!
```

**Alternative using pgAdmin:**
1. Right-click on `orders` table
2. Select "Query Tool"
3. Copy-paste the 3 ALTER commands
4. Execute
5. Refresh table structure

---

### MySQL / MariaDB
**Another enterprise option**

```bash
# Step 1: Connect to MySQL
mysql -u root -p kisanconnect_db

# Step 2: Run these 3 commands
ALTER TABLE orders ADD COLUMN shipping_address TEXT NULL;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255) NULL;

# Step 3: Verify
DESCRIBE orders;
# OR
SHOW COLUMNS FROM orders;

# Look for new columns in output

# Step 4: Exit
exit;

# ✅ Done!
```

---

## 🐍 ALEMBIC METHOD (Best for Production)

**Best for:** Tracking database versions, team development

```bash
# Step 1: Navigate to backend
cd backend

# Step 2: Create migration
alembic revision --autogenerate -m "Add checkout fields to orders"

# Step 3: Review the created migration file
# Look for file in: alembic/versions/XXXXXXX_add_checkout_fields.py
# Make sure it has the 3 ALTER statements

# Step 4: Apply migration
alembic upgrade head

# Step 5: Verify
alembic current

# Should show your migration version
# ✅ Done!
```

---

## ✅ Verification Steps (All Methods)

### After running ANY migration method:

**Step 1: Verify in Database (Pick YOUR DB Type)**

**SQLite:**
```sql
sqlite3 backend/kisanconnect.db
SELECT sql FROM sqlite_master WHERE type='table' AND name='orders';
```

**PostgreSQL:**
```sql
psql -U postgres -d kisanconnect_db
SELECT * FROM information_schema.columns WHERE table_name = 'orders';
```

**MySQL:**
```sql
mysql -u root -p kisanconnect_db
SHOW COLUMNS FROM orders;
```

**Step 2: Restart Backend**
```bash
# If still running, press Ctrl+C
# Restart:
cd backend
python main.py
```

**Step 3: Test in Browser**
1. Go to http://localhost:3000
2. Login as buyer
3. Add item to cart
4. Click "Proceed to Checkout"
5. Form should appear with address field
6. ✅ If it works → migration successful!

---

## 🚨 If Something Goes Wrong

### Problem: "Column already exists"
```
✅ This means migration was already done!
→ You can proceed to testing
→ No action needed
```

### Problem: "Table doesn't exist"
```
❌ Database doesn't have orders table
→ Backend initialization failed
→ Solution: Restart backend
   cd backend && python main.py
→ Wait for "Application startup complete"
→ Try migration again
```

### Problem: "Access denied" (PostgreSQL/MySQL)
```
❌ Wrong username or password
→ Solution: Check your credentials
→ Example: mysql -u username -p database_name
→ Try: mysql -u root -p (then enter password)
→ Or use pgAdmin GUI instead
```

### Problem: "Cannot add NOT NULL column"
```
❌ Some DBs require DEFAULT for existing tables
→ Solution: Add DEFAULT clause
ALTER TABLE orders ADD COLUMN shipping_address TEXT DEFAULT '';
```

### Problem: "Command not found: sqlite3"
```
❌ SQLite3 CLI not installed
→ Solution 1: Install it (Google: install sqlite3 your_OS)
→ Solution 2: Use easiest method (delete & restart)
```

---

## 📊 Migration Status Checker

### Check if Migration Was Applied

**SQLite:**
```sql
sqlite3 backend/kisanconnect.db "PRAGMA table_info(orders);"
# If output shows shipping_address, payment_method, buyer_email → ✅ Done
# If not shown → ❌ Migration needed
```

**PostgreSQL:**
```sql
psql -U postgres -d kisanconnect_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='orders';"
# Look for: shipping_address, payment_method, buyer_email
```

**MySQL:**
```sql
mysql -u root -p kisanconnect_db -e "SHOW COLUMNS FROM orders;" | grep -E "shipping_address|payment_method|buyer_email"
# Should show all 3 columns
```

---

## 🔄 Migration Rollback (If Needed)

### SQLite (Not Recommended)
SQLite doesn't support DROP COLUMN easily
```sql
# Option 1: Just delete database and restart
rm backend/kisanconnect.db
# Then restart backend

# Option 2: Create new table without columns
# This is complex - better to just delete
```

### PostgreSQL
```sql
psql -U postgres -d kisanconnect_db
ALTER TABLE orders DROP COLUMN shipping_address;
ALTER TABLE orders DROP COLUMN payment_method;
ALTER TABLE orders DROP COLUMN buyer_email;
```

### MySQL
```sql
mysql -u root -p kisanconnect_db
ALTER TABLE orders DROP COLUMN shipping_address;
ALTER TABLE orders DROP COLUMN payment_method;
ALTER TABLE orders DROP COLUMN buyer_email;
```

### Alembic
```bash
# Go back to previous version
cd backend
alembic downgrade -1  # Reverses last migration
```

---

## 📋 Migration Checklist

- [ ] Chose your database type (SQLite/PostgreSQL/MySQL)
- [ ] Chose a migration method (Easiest/Manual/Alembic)
- [ ] Applied migration (no errors)
- [ ] Verified columns exist
- [ ] Restarted backend
- [ ] Tested "Proceed to Checkout" button
- [ ] Address field appeared
- [ ] Form validated correctly
- [ ] Order created with address
- [ ] Order appeared in "My Orders"
- [ ] Address visible in order details

---

## 🎓 Quick Decision Tree

```
Do you have existing data to keep?
│
├─ NO  → Use EASIEST METHOD (delete & restart)
│        ✅ Fastest, simplest
│
└─ YES → Use MANUAL SQL METHOD
         ├─ SQLite? → sqlite3 command
         ├─ PostgreSQL? → psql command
         └─ MySQL? → mysql command
```

---

## 💡 Pro Tips

1. **Always backup before migration** (if using manual SQL)
   ```bash
   # SQLite: Copy the file
   cp backend/kisanconnect.db backend/kisanconnect.db.backup
   ```

2. **Test migration in fresh environment first**
   ```bash
   # Delete db and test with fresh start
   rm backend/kisanconnect.db
   python main.py
   ```

3. **Keep terminal open to see errors**
   ```bash
   # Don't close terminal after migration
   # Watch for: "Application startup complete"
   ```

4. **Clear browser cache after migration**
   ```
   Ctrl+Shift+Delete (most browsers)
   Then refresh page
   ```

---

## 📞 Troubleshooting Contacts

**For SQLite issues:**
- Google: "sqlite3 ALTER TABLE help"
- Doc: https://www.sqlite.org/lang_altertable.html

**For PostgreSQL issues:**
- Google: "postgresql ALTER TABLE help"
- Doc: https://www.postgresql.org/docs/current/sql-altertable.html

**For MySQL issues:**
- Google: "mysql ALTER TABLE help"
- Doc: https://dev.mysql.com/doc/refman/8.0/en/alter-table.html

**For Alembic issues:**
- Docs: https://alembic.sqlalchemy.org/

---

## ✨ Done!

After completing migration:
1. Backend will automatically recognize new fields
2. Frontend checkout page will work
3. Orders will store address and email
4. All features ready to use

**Next:** Follow testing steps in QUICK_START.md

---

**Date:** January 21, 2026
**Status:** Ready to Migrate
**Duration:** 2-5 minutes
