# KisanConnect - Data Flow Diagrams & ER Diagrams

## 🔗 GITHUB REPOSITORY

**Full Source Code (Backend + Frontend):**
- 📦 **Repository**: [https://github.com/Ajinsaji/kisanConnect](https://github.com/Ajinsaji/kisanConnect)
- 📁 **Backend**: Located in `/backend` directory (FastAPI + PostgreSQL)
- 📁 **Frontend**: Located in `/frontend` directory (React.js + Tailwind CSS)

> **Note**: Replace `yourusername` with your actual GitHub username and update the repository URL if different.

---

## 📊 ENTITY RELATIONSHIP (ER) DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KISANCONNECT DATABASE SCHEMA                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      USER        │
├──────────────────┤
│ PK id            │
│    name          │
│    email (UNIQUE)│
│    hashed_password│
│    role (ENUM)   │  ◄─── farmer, buyer, admin
│    phone         │
│    address       │
│    city          │
│    state         │
│    postal_code   │
│    is_active     │
│    is_banned     │
│    created_at    │
└──────────────────┘
         │
         │ 1
         │
         │ N
    ┌────┴────┬──────────────┬──────────────┬──────────────┬──────────────┐
    │         │              │              │              │              │
    │         │              │              │              │              │
┌───▼───┐ ┌──▼──────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
│PRODUCT│ │ ORDER   │  │CONVERSATION│ │NOTIFICATION│ │CART_ITEM │
├───────┤ ├─────────┤  ├───────────┤ ├────────────┤ ├──────────┤
│PK id  │ │PK id    │  │PK id      │ │PK id       │ │PK id     │
│FK     │ │FK       │  │FK buyer_id│ │FK user_id  │ │FK        │
│farmer_│ │buyer_id │  │FK         │ │FK          │ │user_id   │
│  id   │ │         │  │farmer_id  │ │policy_id   │ │FK        │
│       │ │total_   │  │           │ │            │ │product_id│
│name   │ │amount   │  │created_at │ │is_read     │ │          │
│category│ │status   │  │           │ │created_at  │ │quantity  │
│desc   │ │(ENUM)   │  │           │ │            │ │          │
│price  │ │created_ │  │           │ │            │ │created_at│
│quantity│ │at       │  │           │ │            │ │updated_at│
│image_ │ │shipping_│  │           │ │            │ │          │
│url    │ │address  │  │           │ │            │ │          │
│created│ │payment_ │  │           │ │            │ │          │
│_at    │ │method   │  │           │ │            │ │          │
└───────┘ │buyer_   │  │           │ │            │ │          │
    │     │email    │  │           │ │            │ │          │
    │     └────┬────┘  └───────┬────┘ └──────┬─────┘ └──────────┘
    │          │               │             │
    │          │ 1             │ 1           │
    │          │               │             │
    │          │ N             │ N           │
    │     ┌────▼─────┐    ┌─────▼─────┐  ┌─────▼────────┐
    │     │ORDER_ITEM│    │  MESSAGE  │  │ORDER_NOTIF   │
    │     ├──────────┤    ├───────────┤  ├──────────────┤
    │     │PK id     │    │PK id      │  │PK id         │
    │     │FK        │    │FK         │  │FK user_id    │
    │     │order_id  │    │conversation│ │FK order_id   │
    │     │FK        │    │_id        │  │              │
    │     │product_id│    │FK         │  │message       │
    │     │          │    │sender_id  │  │is_read       │
    │     │quantity  │    │           │  │created_at    │
    │     │price     │    │message_   │  │              │
    │     │          │    │text       │  │              │
    │     │          │    │file_url   │  │              │
    │     │          │    │file_type  │  │              │
    │     │          │    │file_name  │  │              │
    │     │          │    │is_read    │  │              │
    │     │          │    │created_at │  │              │
    │     │          │    │           │  │              │
    │     └──────────┘    └───────────┘  └──────────────┘
    │
    │ 1
    │
    │ N
┌───▼────────┐
│  RATING    │
├────────────┤
│PK id       │
│FK order_id │
│FK user_id  │
│FK farmer_id│
│rating (1-5)│
│comment     │
│created_at  │
└────────────┘

┌──────────────────┐
│     POLICY       │
├──────────────────┤
│PK id             │
│title             │
│description       │
│category          │
│document_url      │
│created_at        │
└──────────────────┘
         │
         │ 1
         │
         │ N
    ┌────▼──────────┐
    │ NOTIFICATION  │
    │ (Policy Notif)│
    ├──────────────┤
    │PK id         │
    │FK user_id    │
    │FK policy_id  │
    │is_read       │
    │created_at    │
    └──────────────┘

┌──────────────────┐
│  ADMIN_MESSAGE   │
├──────────────────┤
│PK id             │
│FK farmer_id      │  ◄─── NULL = group message
│message_text      │
│message_type      │
│link_url          │
│file_url          │
│file_type         │
│file_name         │
│is_read           │
│created_at        │
└──────────────────┘
```

---

## 🔄 DATA FLOW DIAGRAMS

### 1. CUSTOMER ORDER FLOW

```
┌─────────────┐
│   CUSTOMER  │
└──────┬──────┘
       │
       │ 1. Browse Products
       ▼
┌─────────────────┐
│  Product List   │
│  (GET /products)│
└──────┬──────────┘
       │
       │ 2. Add to Cart
       ▼
┌─────────────────┐
│  Shopping Cart  │
│  (POST /cart/add)│
└──────┬──────────┘
       │
       │ 3. Proceed to Checkout
       ▼
┌─────────────────┐
│  Checkout Page  │
│  - Address      │
│  - Payment (COD)│
└──────┬──────────┘
       │
       │ 4. Place Order
       ▼
┌─────────────────┐
│  Create Order   │
│  (POST /orders/)│
│  ┌─────────────┐│
│  │ Store:      ││
│  │ - items     ││
│  │ - address   ││
│  │ - payment   ││
│  │ - email     ││
│  └─────────────┘│
└──────┬──────────┘
       │
       │ 5. Order Created
       ▼
┌─────────────────┐
│  Success Page   │
│  Order #123     │
└─────────────────┘
       │
       │ 6. View Orders
       ▼
┌─────────────────┐
│  My Orders      │
│  (GET /orders/) │
│  - Filtered by  │
│    buyer_id     │
└─────────────────┘
```

### 2. FARMER ORDER MANAGEMENT FLOW

```
┌─────────────┐
│   FARMER    │
└──────┬──────┘
       │
       │ 1. View Dashboard
       ▼
┌─────────────────┐
│ Farmer Dashboard│
│ (GET /dashboard/│
│  farmer)        │
│  - Orders       │
│  - Products     │
│  - Revenue      │
└──────┬──────────┘
       │
       │ 2. View Order Details
       ▼
┌─────────────────┐
│ Order Details   │
│ (GET /orders/   │
│  {order_id})    │
│  - Buyer info   │
│  - Items        │
│  - Status       │
└──────┬──────────┘
       │
       │ 3. Update Status
       ▼
┌─────────────────┐
│ Update Status   │
│ (PUT /orders/   │
│  {id}/status)   │
│  - Accept       │
│  - Reject       │
│  - Pack         │
│  - Ship         │
│  - Deliver      │
└──────┬──────────┘
       │
       │ 4. Create Notification
       ▼
┌─────────────────┐
│OrderNotification│
│  - user_id      │
│  - order_id     │
│  - message      │
│  (with product  │
│   names)        │
└─────────────────┘
       │
       │ 5. Customer Receives
       ▼
┌─────────────────┐
│ Customer        │
│ Notification    │
│ "Your ordered   │
│  item guava is  │
│  accepted..."   │
└─────────────────┘
```

### 3. RATING SYSTEM FLOW

```
┌─────────────┐
│   CUSTOMER  │
└──────┬──────┘
       │
       │ 1. Order Delivered
       ▼
┌─────────────────┐
│ Delivery        │
│ Notification    │
│ "Please rate    │
│  your experience"│
└──────┬──────────┘
       │
       │ 2. Click Rate Button
       ▼
┌─────────────────┐
│ Rating Modal    │
│ - Select Stars  │
│ - Add Comment   │
└──────┬──────────┘
       │
       │ 3. Submit Rating
       ▼
┌─────────────────┐
│ Create Rating   │
│ (POST /ratings/)│
│  - order_id     │
│  - rating (1-5) │
│  - comment      │
│  - farmer_id    │
└──────┬──────────┘
       │
       │ 4. Store Rating
       ▼
┌─────────────────┐
│   RATING Table  │
│  - Calculates   │
│    avg rating   │
└──────┬──────────┘
       │
       │ 5. Display in Listings
       ▼
┌─────────────────┐
│ Farmer Listings │
│ Shows:          │
│ ⭐⭐⭐⭐ (4.2) │
│ (12 ratings)    │
└─────────────────┘
```

### 4. MESSAGING SYSTEM FLOW

```
┌─────────────┐         ┌─────────────┐
│   BUYER     │         │   FARMER    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ 1. Start Conversation │
       ▼                       │
┌─────────────────┐            │
│ Get/Create      │            │
│ Conversation    │            │
│ (POST /messaging│            │
│  /conversations)│            │
└──────┬──────────┘            │
       │                       │
       │ 2. Send Message        │
       ▼                       │
┌─────────────────┐            │
│ Send Message    │            │
│ (POST /messaging│            │
│  /messages)     │            │
│  - text         │            │
│  - file (opt)   │            │
└──────┬──────────┘            │
       │                       │
       │ 3. Store in DB         │
       ▼                       │
┌─────────────────┐            │
│   MESSAGE Table │            │
│  - conversation │            │
│  - sender       │            │
│  - text/file    │            │
│  - is_read      │            │
└──────┬──────────┘            │
       │                       │
       │ 4. Real-time Update    │
       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Farmer Receives │    │ Buyer Receives  │
│ Message         │    │ Response        │
└─────────────────┘    └─────────────────┘
```

### 5. ADMIN MANAGEMENT FLOW

```
┌─────────────┐
│    ADMIN    │
└──────┬──────┘
       │
       │ 1. Login
       ▼
┌─────────────────┐
│ Admin Dashboard │
│ - Stats         │
│ - Quick Actions │
└──────┬──────────┘
       │
       ├─────────────┬──────────────┬──────────────┐
       │             │              │              │
       ▼             ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│User Mgmt │  │Farmer    │  │Order     │  │Chat with │
│          │  │Mgmt      │  │Mgmt      │  │Farmers   │
├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤
│View Users│  │View      │  │View All  │  │Send      │
│Search    │  │Farmers   │  │Orders    │  │Messages  │
│Ban/Unban │  │Products  │  │Filter    │  │          │
│Activate  │  │Ban/Unban │  │Search    │  │          │
│          │  │          │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
       │             │              │              │
       │             │              │              │
       └─────────────┴──────────────┴──────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Database Updates│
              │ - User status   │
              │ - Order info    │
              │ - Messages      │
              └─────────────────┘
```

### 6. CART TO ORDER CONVERSION FLOW

```
┌─────────────────┐
│  Shopping Cart  │
│  (CartItem)     │
│  - user_id      │
│  - product_id   │
│  - quantity     │
└──────┬──────────┘
       │
       │ 1. Checkout
       ▼
┌─────────────────┐
│  Checkout Page  │
│  Validate:      │
│  - Address      │
│  - Stock        │
└──────┬──────────┘
       │
       │ 2. Create Order
       ▼
┌─────────────────┐
│  Order Creation │
│  ┌─────────────┐│
│  │ 1. Create   ││
│  │    Order    ││
│  │ 2. For each ││
│  │    cart item││
│  │    - Create ││
│  │      OrderItem│
│  │    - Update ││
│  │      Product││
│  │      quantity│
│  │ 3. Clear    ││
│  │    Cart     ││
│  │ 4. Store    ││
│  │    address  ││
│  │    & payment││
│  └─────────────┘│
└──────┬──────────┘
       │
       │ 3. Order Created
       ▼
┌─────────────────┐
│  ORDER Table    │
│  ORDER_ITEM     │
│  (Cart cleared) │
└─────────────────┘
```

---

## 📐 DETAILED ER DIAGRAM WITH RELATIONSHIPS

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        KISANCONNECT ER DIAGRAM                              │
└────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │        USER          │
                    │  (PK) id            │
                    │      name           │
                    │      email (UNIQUE) │
                    │      role (ENUM)     │
                    │      ...            │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┬──────────────┬──────────────┐
                │              │              │              │              │
         (1:N)  │        (1:N) │        (1:N) │        (1:N) │        (1:N) │
                │              │              │              │              │
    ┌───────────▼──┐  ┌────────▼──────┐  ┌───▼────────┐  ┌──▼─────────┐  ┌─▼──────────┐
    │   PRODUCT    │  │    ORDER      │  │CONVERSATION│  │NOTIFICATION│  │CART_ITEM  │
    │ (PK) id      │  │ (PK) id       │  │ (PK) id     │  │ (PK) id     │  │ (PK) id    │
    │ (FK) farmer_ │  │ (FK) buyer_id │  │ (FK) buyer_│  │ (FK) user_id│  │ (FK) user_│
    │     id       │  │               │  │     id     │  │ (FK) policy │  │     id     │
    │     name     │  │ total_amount   │  │ (FK) farmer │  │     _id     │  │ (FK)      │
    │     price    │  │ status (ENUM) │  │     _id     │  │             │  │ product_id│
    │     quantity │  │ shipping_addr │  │             │  │ is_read     │  │ quantity  │
    │     ...      │  │ payment_method│  │             │  │             │  │           │
    └──────┬───────┘  │ buyer_email   │  └──────┬──────┘  └─────────────┘  └───────────┘
           │          └───────┬────────┘         │
           │                 │                  │
      (1:N) │            (1:N) │            (1:N) │
           │                 │                  │
    ┌───────▼────────┐  ┌─────▼──────────┐  ┌─────▼────────┐
    │  ORDER_ITEM    │  │ORDER_NOTIFICATION│ │   MESSAGE    │
    │ (PK) id        │  │ (PK) id         │  │ (PK) id      │
    │ (FK) order_id  │  │ (FK) user_id    │  │ (FK)        │
    │ (FK) product_id│  │ (FK) order_id   │  │ conversation │
    │     quantity   │  │     message     │  │     _id      │
    │     price      │  │     is_read     │  │ (FK) sender_ │
    └────────────────┘  └─────────────────┘  │     id       │
                                              │ message_text │
                                              │ file_url     │
                                              │ is_read      │
                                              └──────────────┘

    ┌──────────────────┐
    │     RATING       │
    │ (PK) id          │
    │ (FK) order_id    │
    │ (FK) user_id     │
    │ (FK) farmer_id   │
    │ rating (1-5)     │
    │ comment          │
    └──────────────────┘
           │
           │ References:
           │ - Order (1:1)
           │ - User/Customer (1:N)
           │ - User/Farmer (1:N)

    ┌──────────────────┐
    │     POLICY       │
    │ (PK) id          │
    │ title            │
    │ description      │
    │ category         │
    │ document_url     │
    └────────┬─────────┘
             │
        (1:N) │
             │
    ┌────────▼─────────┐
    │  NOTIFICATION     │
    │ (PK) id          │
    │ (FK) user_id     │
    │ (FK) policy_id   │
    │ is_read          │
    └──────────────────┘

    ┌──────────────────┐
    │  ADMIN_MESSAGE   │
    │ (PK) id          │
    │ (FK) farmer_id   │ ◄── NULL = group message
    │ message_text     │
    │ message_type     │
    │ file_url         │
    │ is_read          │
    └──────────────────┘
```

---

## 🔄 COMPLETE SYSTEM DATA FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM-LEVEL DATA FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   FRONTEND   │
    │  (React.js)  │
    └──────┬───────┘
           │
           │ HTTP Requests
           │ (JSON, JWT Token)
           ▼
    ┌──────────────┐
    │   BACKEND    │
    │  (FastAPI)   │
    │  - Auth      │
    │  - Validation│
    │  - Business  │
    │    Logic     │
    └──────┬───────┘
           │
           │ SQL Queries
           │ (SQLAlchemy ORM)
           ▼
    ┌──────────────┐
    │  DATABASE    │
    │ (PostgreSQL) │
    │  - Tables    │
    │  - Relations │
    │  - Constraints│
    └──────┬───────┘
           │
           │ Query Results
           │ (ORM Objects)
           ▼
    ┌──────────────┐
    │   BACKEND    │
    │  - Serialize │
    │  - Transform │
    │  - Response  │
    └──────┬───────┘
           │
           │ JSON Response
           │ (Status, Data)
           ▼
    ┌──────────────┐
    │   FRONTEND   │
    │  - Update UI │
    │  - State     │
    │  - Render    │
    └──────────────┘
```

---

## 📋 RELATIONSHIP SUMMARY

### One-to-Many (1:N) Relationships

1. **User → Products** (1:N)
   - One farmer can have many products
   - Foreign Key: `Product.farmer_id → User.id`

2. **User → Orders** (1:N)
   - One buyer can have many orders
   - Foreign Key: `Order.buyer_id → User.id`

3. **User → CartItems** (1:N)
   - One user can have many cart items
   - Foreign Key: `CartItem.user_id → User.id`

4. **User → Messages** (1:N)
   - One user can send many messages
   - Foreign Key: `Message.sender_id → User.id`

5. **User → Notifications** (1:N)
   - One user can have many notifications
   - Foreign Key: `Notification.user_id → User.id`

6. **User → OrderNotifications** (1:N)
   - One user can have many order notifications
   - Foreign Key: `OrderNotification.user_id → User.id`

7. **User → Ratings** (1:N)
   - One user can give many ratings
   - Foreign Key: `Rating.user_id → User.id`

8. **Order → OrderItems** (1:N)
   - One order can have many items
   - Foreign Key: `OrderItem.order_id → Order.id`

9. **Product → OrderItems** (1:N)
   - One product can be in many order items
   - Foreign Key: `OrderItem.product_id → Product.id`

10. **Product → CartItems** (1:N)
    - One product can be in many carts
    - Foreign Key: `CartItem.product_id → Product.id`

11. **Conversation → Messages** (1:N)
    - One conversation can have many messages
    - Foreign Key: `Message.conversation_id → Conversation.id`

12. **Policy → Notifications** (1:N)
    - One policy can have many notifications
    - Foreign Key: `Notification.policy_id → Policy.id`

### Many-to-Many Relationships (Implemented via Junction Tables)

1. **Buyer ↔ Farmer** (via Conversation)
   - Many buyers can chat with many farmers
   - Junction: `Conversation` table
   - Unique Constraint: (buyer_id, farmer_id)

2. **User ↔ Policy** (via Notification)
   - Many users can have notifications for many policies
   - Junction: `Notification` table
   - Unique Constraint: (user_id, policy_id)

### One-to-One Relationships

1. **Order → Rating** (1:1)
   - One order can have one rating
   - Unique Constraint: (order_id, user_id)

2. **User → CartItem per Product** (1:1)
   - One user can have one cart item per product
   - Unique Constraint: (user_id, product_id)

---

## 🔑 PRIMARY KEYS & FOREIGN KEYS

### Primary Keys
- All tables have `id` as Primary Key (BigInteger)

### Foreign Keys
- **Product**: `farmer_id` → `User.id`
- **Order**: `buyer_id` → `User.id`
- **OrderItem**: `order_id` → `Order.id`, `product_id` → `Product.id`
- **CartItem**: `user_id` → `User.id`, `product_id` → `Product.id`
- **Conversation**: `buyer_id` → `User.id`, `farmer_id` → `User.id`
- **Message**: `conversation_id` → `Conversation.id`, `sender_id` → `User.id`
- **Notification**: `user_id` → `User.id`, `policy_id` → `Policy.id`
- **OrderNotification**: `user_id` → `User.id`, `order_id` → `Order.id`
- **Rating**: `order_id` → `Order.id`, `user_id` → `User.id`, `farmer_id` → `User.id`
- **AdminMessage**: `farmer_id` → `User.id` (nullable for group messages)

---

## 📊 DATA FLOW FOR KEY OPERATIONS

### Operation 1: Customer Places Order

```
Customer → Frontend → API Request → Backend → Database
   │          │           │            │          │
   │          │           │            │          │
   │    1. Add to Cart    │            │          │
   │    2. View Cart      │            │          │
   │    3. Checkout       │            │          │
   │    4. Enter Address  │            │          │
   │    5. Place Order    │            │          │
   │          │           │            │          │
   │          │           ▼            │          │
   │          │    POST /orders/       │          │
   │          │    {                  │          │
   │          │      items: [...],    │          │
   │          │      shipping_address,│         │
   │          │      payment_method   │          │
   │          │    }                  │          │
   │          │           │            │          │
   │          │           ▼            │          │
   │          │    Validate &          │          │
   │          │    Process             │          │
   │          │           │            │          │
   │          │           ▼            │          │
   │          │    INSERT INTO orders  │          │
   │          │    INSERT INTO        │          │
   │          │      order_items       │          │
   │          │    UPDATE products    │          │
   │          │      (quantity)       │          │
   │          │           │            │          │
   │          │           ▼            │          │
   │          │    Return Order       │          │
   │          │           │            │          │
   │          │           ▼            │          │
   │          │    Success Page       │          │
   │          │    Order #123         │          │
```

### Operation 2: Farmer Updates Order Status

```
Farmer → Frontend → API Request → Backend → Database → Notification
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    PUT /orders/123/    │          │           │
  │         │        status?new_      │          │           │
  │         │        status=accepted  │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    Validate Farmer      │          │           │
  │         │    Authorization        │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    UPDATE orders       │          │           │
  │         │    SET status =        │          │           │
  │         │        'accepted'      │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    Get Product Names   │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    INSERT INTO        │          │           │
  │         │      order_notifications│        │           │
  │         │    {                  │          │           │
  │         │      user_id: buyer_id,│          │           │
  │         │      order_id: 123,   │          │           │
  │         │      message: "Your   │          │           │
  │         │        ordered item    │          │           │
  │         │        guava is        │          │           │
  │         │        accepted..."    │          │           │
  │         │    }                  │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    Return Updated      │          │           │
  │         │      Order             │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    Customer Receives   │          │           │
  │         │      Notification      │          │           │
```

### Operation 3: Rating Submission

```
Customer → Frontend → API Request → Backend → Database → Display
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    POST /ratings/      │          │           │
  │         │    {                  │          │           │
  │         │      order_id: 123,   │          │           │
  │         │      rating: 5,       │          │           │
  │         │      comment: "..."   │          │           │
  │         │    }                  │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    Validate:          │          │           │
  │         │    - Order exists     │          │           │
  │         │    - Order delivered  │          │           │
  │         │    - Not already rated│          │           │
  │         │    - Get farmer_id    │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    INSERT INTO ratings│          │           │
  │         │    {                  │          │           │
  │         │      order_id,        │          │           │
  │         │      user_id,         │          │           │
  │         │      farmer_id,       │          │           │
  │         │      rating: 5,       │          │           │
  │         │      comment          │          │           │
  │         │    }                  │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    Calculate Average  │          │           │
  │         │    Rating for Farmer  │          │           │
  │         │           │            │          │           │
  │         │           ▼            │          │           │
  │         │    Display in        │          │           │
  │         │    Farmer Listings   │          │           │
```

---

## 🔐 AUTHENTICATION FLOW

```
User → Frontend → Backend → Database → Response
 │        │          │          │          │
 │        │          │          │          │
 │  1. Login Form    │          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  POST /auth/login │          │          │
 │  {email, password}│          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  Validate Creds   │          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  SELECT * FROM    │          │          │
 │    users WHERE    │          │          │
 │    email = ?      │          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  Verify Password  │          │          │
 │  (bcrypt)         │          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  Generate JWT     │          │          │
 │  Token            │          │          │
 │  {                │          │          │
 │    sub: user_id,  │          │          │
 │    role: farmer,  │          │          │
 │    exp: timestamp │          │          │
 │  }                │          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  Return Token     │          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  Store in         │          │          │
 │  localStorage     │          │          │
 │        │          │          │          │
 │        ▼          │          │          │
 │  Use Token in     │          │          │
 │  Subsequent       │          │          │
 │  Requests         │          │          │
 │  (Authorization:  │          │          │
 │   Bearer {token}) │          │          │
```

---

## 📈 DATABASE CONSTRAINTS

### Unique Constraints
1. **User.email** - Unique email per user
2. **CartItem(user_id, product_id)** - One cart item per user-product combination
3. **Conversation(buyer_id, farmer_id)** - One conversation per buyer-farmer pair
4. **Notification(user_id, policy_id)** - One notification per user-policy
5. **Rating(order_id, user_id)** - One rating per order per user

### Check Constraints
1. **Product.price** >= 0
2. **Product.quantity** >= 0
3. **Order.total_amount** >= 0
4. **OrderItem.quantity** > 0
5. **OrderItem.price** >= 0
6. **CartItem.quantity** > 0
7. **Rating.rating** >= 1 AND <= 5

### Foreign Key Constraints
- All foreign keys have `ondelete="CASCADE"` - deleting parent deletes children
- Ensures referential integrity

---

## 🎯 KEY DATA FLOWS SUMMARY

### Customer Journey
1. **Browse** → View Products → Add to Cart
2. **Cart** → Review Items → Proceed to Checkout
3. **Checkout** → Enter Address → Place Order
4. **Order** → Track Status → Receive Notifications
5. **Delivery** → Rate Order → View Rating

### Farmer Journey
1. **Register** → Login → Dashboard
2. **Products** → Add/Edit/Delete → Manage Inventory
3. **Orders** → View Orders → Update Status
4. **Notifications** → Receive Updates → Respond
5. **Ratings** → View Customer Ratings → Improve Service

### Admin Journey
1. **Login** → Dashboard → View Statistics
2. **Users** → Manage Users → Ban/Activate
3. **Farmers** → Manage Farmers → View Products
4. **Orders** → Monitor Orders → Track System
5. **Chat** → Communicate with Farmers → Send Announcements

---

This document provides a comprehensive view of the data flow and entity relationships in the KisanConnect platform.
