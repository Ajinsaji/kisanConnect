# New Backend Endpoints Added

## ✅ Cart System (`/cart`)

### GET `/cart/`
- **Description**: Get current user's cart with all items
- **Auth**: Buyer only
- **Response**: Cart with items, total_items, total_amount

### POST `/cart/add`
- **Description**: Add item to cart or update quantity if already exists
- **Auth**: Buyer only
- **Body**: `{product_id: int, quantity: int}`
- **Response**: CartItemDetail with product info

### PUT `/cart/update/{item_id}`
- **Description**: Update quantity of a cart item
- **Auth**: Buyer only
- **Body**: `{quantity: int}`
- **Response**: Updated CartItemDetail

### DELETE `/cart/remove/{item_id}`
- **Description**: Remove item from cart
- **Auth**: Buyer only
- **Response**: 204 No Content

### POST `/cart/checkout`
- **Description**: Convert cart items to an order and clear the cart
- **Auth**: Buyer only
- **Response**: `{message: str, order_id: int, total_amount: float}`

---

## ✅ Dashboard Endpoints (`/dashboard`)

### GET `/dashboard/farmer`
- **Description**: Get farmer dashboard data
- **Auth**: Farmer only
- **Response**: 
  - User info
  - Statistics (total_products, total_orders, total_revenue, low_stock_count)
  - Products list
  - Recent orders
  - Low stock products

### GET `/dashboard/buyer`
- **Description**: Get buyer/customer dashboard data
- **Auth**: Buyer only
- **Response**:
  - User info
  - Statistics (total_orders, total_spent, cart_items)
  - Featured products
  - Recent orders

---

## ✅ User Profile Endpoints (`/users`)

### GET `/users/me`
- **Description**: Get current user's profile
- **Auth**: Required
- **Response**: UserRead (id, name, email, role, phone, address, created_at)

### PUT `/users/me`
- **Description**: Update current user's profile
- **Auth**: Required
- **Body**: `{name: str, email: str, phone: str | None, address: str | None}`
- **Response**: Updated UserRead

---

## ✅ Enhanced Messaging (`/messaging`)

### GET `/messaging/conversations` (NEW)
- **Description**: List all conversations for the current user
- **Auth**: Required
- **Response**: List of ConversationRead

---

## ✅ Enhanced Orders (`/orders`)

### GET `/orders/{order_id}` (NEW)
- **Description**: Get order details by ID
- **Auth**: Required
- **Response**: OrderRead
- **Note**: Buyers can only see their own orders. Farmers can see orders for their products.

### PUT `/orders/{order_id}/status` (NEW)
- **Description**: Update order status (pending/shipped/delivered)
- **Auth**: Farmer or Admin only
- **Query Param**: `new_status: str` (pending, shipped, delivered)
- **Response**: Updated OrderRead
- **Note**: Farmers can only update orders for their products.

---

## ✅ Enhanced Products (`/products`)

### GET `/products/` (Enhanced)
- **Description**: List products with optional category filter and search
- **Auth**: Public
- **Query Params**:
  - `category: str | None` - Filter by category
  - `q: str | None` - Search query for product name or description
- **Response**: List of ProductRead

---

## 📊 Database Changes

### New Model: `CartItem`
- `id`: BigInteger (Primary Key)
- `user_id`: BigInteger (Foreign Key to users)
- `product_id`: BigInteger (Foreign Key to products)
- `quantity`: Integer (must be > 0)
- `created_at`: DateTime
- `updated_at`: DateTime
- **Unique Constraint**: (user_id, product_id) - One cart item per user-product combination

### Updated Models:
- `User`: Added `cart_items` relationship
- `Product`: Added `cart_items` relationship

---

## 🚀 Usage Examples

### Add to Cart
```bash
POST /cart/add
{
  "product_id": 1,
  "quantity": 2
}
```

### Get Dashboard
```bash
GET /dashboard/farmer
# or
GET /dashboard/buyer
```

### Search Products
```bash
GET /products/?q=apple
GET /products/?category=vegetables&q=organic
```

### Update Order Status
```bash
PUT /orders/1/status?new_status=shipped
```

### Get User Profile
```bash
GET /users/me
PUT /users/me
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "phone": "+1234567890",
  "address": "New Address"
}
```

---

## 📝 Notes

- All new endpoints follow the same authentication pattern as existing endpoints
- Cart system automatically handles stock validation
- Dashboard endpoints provide aggregated statistics for quick overview
- Product search is case-insensitive and searches both name and description
- Order status updates are restricted to farmers (for their products) and admins

