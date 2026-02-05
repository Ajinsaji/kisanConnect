# Database Migration Guide

## Changes Made to Database Schema

The Order model has been updated with the following new fields:

### New Columns in `orders` table:
1. **shipping_address** (TEXT, nullable)
   - Stores the complete shipping address provided by the customer at checkout
   
2. **payment_method** (VARCHAR(50), default='cash')
   - Stores the payment method selected (currently only 'cash' is supported)
   
3. **buyer_email** (VARCHAR(255), nullable)
   - Stores the email of the buyer for order tracking and filtering

## How to Apply Migrations

### Option 1: Using Alembic (Recommended for Production)

If you have Alembic set up:

```bash
cd backend
alembic revision --autogenerate -m "Add shipping address, payment method, and buyer email to orders"
alembic upgrade head
```

### Option 2: Manual Migration (For SQLite/Development)

If using SQLite and want to manually migrate:

```sql
-- Add new columns to orders table
ALTER TABLE orders ADD COLUMN shipping_address TEXT;
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);
```

### Option 3: Drop and Recreate (Clean Database)

If you're in development and can lose the existing data:

1. Delete the existing database file (usually `kisanconnect.db`)
2. Restart the application - it will create a new database with the updated schema

## Implementation Details

### Backend Changes:

**File: `backend/db/models.py`**
- Updated `Order` class with 3 new mapped columns

**File: `backend/schemas/order.py`**
- Updated `OrderCreate` schema to accept `shipping_address` and `payment_method`
- Updated `OrderRead` schema to include the new fields in responses

**File: `backend/api/orders.py`**
- Updated `create_order()` endpoint to store shipping address, payment method, and buyer email
- Orders are automatically filtered by `buyer_id` in the list endpoint
- Orders can be filtered by `buyer_email` if needed

### Frontend Changes:

**New File: `frontend/src/pages/Checkout.jsx`**
- New checkout page for collecting shipping address and payment method
- Form validation for address completeness
- Displays order summary before placing order
- Shows user information confirming the order is placed by their account

**Updated File: `frontend/src/pages/Cartpage.jsx`**
- "Proceed to Checkout" button now navigates to `/checkout` instead of directly creating order

**Updated File: `frontend/src/pages/Orders.jsx`**
- Displays shipping address in expandable order details
- Shows payment method and confirmation message
- Shows buyer email to identify who placed the order

**Updated File: `frontend/src/App.js`**
- Added `/checkout` route protected for 'buyer' role

## Order Flow (Updated)

1. Customer adds items to cart
2. Customer clicks "Cart" → views items
3. Customer clicks "Proceed to Checkout" → navigates to `/checkout`
4. On Checkout page:
   - Fills shipping address (required)
   - Selects payment method (cash on delivery)
   - Reviews order summary
   - Clicks "Place Order"
5. Order is created with:
   - All cart items
   - Shipping address
   - Payment method
   - Buyer email
6. Customer redirected to success page
7. Order appears in "My Orders" with all details

## Testing the Feature

### Test Scenario:
1. Login as a buyer
2. Add products to cart
3. Go to cart, click "Proceed to Checkout"
4. Enter shipping address
5. Select payment method (Cash on Delivery)
6. Click "Place Order"
7. Verify success page shows
8. Go to "My Orders"
9. Expand an order
10. Verify shipping address and payment method are displayed
11. Verify buyer email is shown

## Data Security

- Buyer email is automatically populated from authenticated user (cannot be changed)
- Shipping address is validated for minimum length
- Only the order creator (buyer) can view their own orders
- Payment method is restricted to predefined values

## Future Enhancements

1. **Add Multiple Payment Methods**: Extend payment_method to support:
   - UPI
   - Card Payment
   - Net Banking
   
2. **Address Management**: Store multiple addresses:
   - Save address for future orders
   - Select from saved addresses
   
3. **Order Tracking**: Add tracking number field
   - Farmers can update shipping status
   - Customers receive real-time notifications
   
4. **Returns/Exchanges**: Add return address and reason fields
