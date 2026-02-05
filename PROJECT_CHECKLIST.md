# Kisan Connect - Project Checklist

## ✅ Backend API Endpoints (Implemented)

### Authentication
- ✅ **Login** - `POST /auth/login`
- ✅ **Signup/Register** - `POST /auth/register`

### Products
- ✅ **Product List** - `GET /products/` (with optional category filter)
- ✅ **Product Details** - `GET /products/{product_id}`
- ✅ **Register Product** - `POST /products/` (Farmer only)
- ✅ **Edit Product Detail** - `PUT /products/{product_id}` (Farmer only)
- ✅ **Delete Product** - `DELETE /products/{product_id}` (Farmer only)

### Orders
- ✅ **Create Order** - `POST /orders/` (Buyer only)
- ✅ **List My Orders** - `GET /orders/` (Buyer only)

### Messaging/Chats
- ✅ **Get/Create Conversation** - `POST /messaging/conversations`
- ✅ **Send Message** - `POST /messaging/messages`
- ✅ **Get Messages** - `GET /messaging/conversations/{conv_id}/messages`

### Policies/Notifications
- ✅ **List Policies** - `GET /policies/`
- ✅ **List Notifications** - `GET /policies/notifications` (Farmer only)
- ✅ **Mark Notification Read** - `POST /policies/notifications/{notification_id}/read`

### Health Check
- ✅ **Health Endpoint** - `GET /health`

---

## ❌ Missing Backend Endpoints

### Dashboards
- ❌ **Farmer Dashboard** - No dedicated endpoint
  - *Could use: GET /products/ (filtered by farmer), GET /orders/ (orders for farmer's products)*
- ❌ **Customer/Buyer Dashboard** - No dedicated endpoint
  - *Could use: GET /orders/ (buyer's orders), GET /products/ (all products)*

### Cart
- ❌ **Cart Management** - No cart endpoints
  - *Currently, orders are created directly without a cart system*
  - *Need: GET /cart, POST /cart/add, PUT /cart/update, DELETE /cart/remove*

### Success Page
- ❌ **Order Success/Confirmation** - No dedicated endpoint
  - *Could use: GET /orders/{order_id} after order creation*

### Additional Missing Features
- ❌ **User Profile Management** - No endpoints to get/update user profile
- ❌ **Order Status Updates** - No endpoint to update order status (shipped/delivered)
- ❌ **Get User's Conversations List** - No endpoint to list all conversations for a user
- ❌ **Product Search** - No search functionality (only category filter)

---

## 📋 Frontend Status

**Status: ❌ NO FRONTEND FOUND**

The project currently only has a backend API. The menu items you see are likely from a CMS/form builder tool, but there's no actual frontend implementation in this project.

### What You Need to Build:

1. **Login Page** (`/login`)
   - Form with email/password
   - Call `POST /auth/login`
   - Store JWT token

2. **Signup Page** (`/signup`)
   - Form with name, email, password, role, phone, address
   - Call `POST /auth/register`

3. **Farmer Dashboard** (`/farmer-dashboard`)
   - Show farmer's products
   - Show orders for farmer's products
   - Link to register product

4. **Customer Dashboard** (`/customer-dashboard`)
   - Show all products
   - Show customer's orders
   - Link to cart

5. **Register Product** (`/register-product`)
   - Form to create new product
   - Call `POST /products/`

6. **Product List** (`/products`)
   - Display all products
   - Call `GET /products/`

7. **Product Details** (`/products/{id}`)
   - Show single product details
   - Call `GET /products/{product_id}`

8. **Edit Product Detail** (`/products/{id}/edit`)
   - Form to update product
   - Call `PUT /products/{product_id}`

9. **Cart** (`/cart`)
   - Display cart items
   - Add/remove items
   - Proceed to checkout

10. **Chats** (`/chats`)
    - List conversations
    - Display messages
    - Send messages
    - Call messaging endpoints

11. **Success Page** (`/success`)
    - Order confirmation page
    - Show order details

---

## 🔧 Recommended Backend Additions

To fully support the frontend, consider adding:

1. **Cart Endpoints** (`/api/cart`)
   - `GET /cart` - Get current user's cart
   - `POST /cart/add` - Add item to cart
   - `PUT /cart/update` - Update cart item quantity
   - `DELETE /cart/remove/{item_id}` - Remove item from cart
   - `POST /cart/checkout` - Convert cart to order

2. **Dashboard Endpoints**
   - `GET /dashboard/farmer` - Farmer dashboard data
   - `GET /dashboard/buyer` - Buyer dashboard data

3. **User Profile**
   - `GET /users/me` - Get current user profile
   - `PUT /users/me` - Update user profile

4. **Conversations List**
   - `GET /messaging/conversations` - List all user's conversations

5. **Order Status Update**
   - `PUT /orders/{order_id}/status` - Update order status (for farmers/admins)

6. **Product Search**
   - `GET /products/search?q={query}` - Search products by name/description

---

## 📊 Summary

### Backend Coverage: ~70%
- ✅ Core authentication
- ✅ Product CRUD operations
- ✅ Order creation and listing
- ✅ Messaging system
- ✅ Policies/notifications
- ❌ Cart system
- ❌ Dashboard endpoints
- ❌ User profile management

### Frontend Coverage: 0%
- ❌ No frontend implementation found
- All pages need to be built

---

## 🚀 Next Steps

1. **Decide on Frontend Framework**
   - React, Vue, Angular, or plain HTML/JS
   - Consider using the form builder you're using

2. **Build Missing Backend Endpoints**
   - Cart system
   - Dashboard endpoints
   - User profile endpoints

3. **Build Frontend Pages**
   - Start with authentication (Login/Signup)
   - Then dashboards
   - Then product management
   - Finally cart and checkout

4. **Connect Frontend to Backend**
   - Set up API client
   - Handle authentication tokens
   - Error handling

