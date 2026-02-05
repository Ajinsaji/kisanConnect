# KisanConnect – Full Features and Options

## User Roles

| Role | Description |
|------|-------------|
| **Buyer (Customer)** | Browse, order, negotiate, chat with farmers |
| **Farmer** | Sell products, manage orders, chat with buyers |
| **Admin** | Manage users, orders, farmers, policies, complaints |

---

## Authentication & Access

### All Users
- **Login** – Email + password (separate messages: "User not found" / "Invalid password")
- **Token migration** – Old `access_token` auto-migrated to `token` on app load
- **Protected routes** – Redirect by role (buyer → login, admin → admin-login)

### Buyer
- **Signup** – Customer registration
- **Farmer signup** – Separate farmer registration (Become a Farmer)

### Admin
- **Admin login** – Dedicated admin login page

---

## Customer / Buyer Features

### Dashboard
- **Customer Dashboard** – Total orders, cart count, recommended products
- **Browse Products** – View all products (public)
- **Product details** – Name, price, description, category, images, farmer info
- **Farmers by product** – List of farmers selling a product (`/farmers/:productName`)

### Shopping & Cart
- **Add to cart** – From product details or farmers list
- **Cart page** – View items, update quantity, remove, see total
- **Cart refetch** – On navigate to cart and on tab focus (e.g. after negotiation confirm)
- **Checkout** – Required for buyer role

### Checkout & Orders
- **Delivery or Pickup** – Choose delivery (to address) or pickup (collect from farmer)
- **Preferred date** – Schedule delivery date or pickup date (required, min = today)
- **Shipping address** – Required only for delivery (street, state, district, pincode)
- **Payment** – Cash on Delivery
- **Place order** – Creates order; farmer(s) get notification (delivery/pickup + date + total)
- **Order success** – Redirect to success page with order ID
- **My Orders** – List of orders with status, view details
- **Order status** – Pending, Accepted, Rejected, Packed, Shipped, Delivered, Cancelled
- **Cancel order** – Only pending; reason required; farmer notified

### Price Negotiation
- **Negotiate** – From product page → `/negotiate/:productId`
- **Chat-style UI** – Conversation + input bar at bottom (offer in ₹/kg)
- **Farmer replies** – Varied natural messages (no single “No, I can’t”)
- **Typing indicator** – “Farmer is typing...” for 1.5–2.5 s before reply
- **Clear chat** – Reset conversation (ongoing/accepted only)
- **Confirm offer** – When farmer accepts, “Yes, add to cart” → add to cart at agreed price
- **Negotiate again** – Same product after confirm: opening Negotiate resets to ongoing, empty chat
- **Messages link** – “Messages” button on Negotiation page → Chat
- **Personal price** – Negotiated price stored (PersonalProductOffer) and used in cart/checkout

### Notifications
- **Order notifications** – New order, accepted, rejected, packed, shipped, delivered
- **Badge** – Unread count in navbar
- **Mark read** – From notification dropdown
- **View order** – From notification

### Chat / Messages
- **Chat page** – Conversations with farmers
- **Send/receive messages** – Text (and file if supported)
- **Unread count** – In navbar and profile menu

### Ratings & Complaints
- **Rate order** – After delivery (e.g. 1–5 stars + comment)
- **Complaints** – Report issue on delivered orders (admin handles)

### Other
- **Profile** – View/edit name, email, phone, address
- **FAQ** – How KisanConnect works
- **Government News** – Government news page (authenticated)
- **Location** – Link in navbar

---

## Farmer Features

### Dashboard
- **Farmer Dashboard** – Total products, total orders, total revenue, low stock
- **Farmer ID** – Display (e.g. FC-30)
- **Recent orders** – Quick access to orders

### Products (Inventory)
- **Add product** – Name, category, description, price, quantity, images
- **Edit / Delete product** – From inventory
- **Inventory page** – All products, low stock highlight
- **Market Prices** – View market prices (with admin)

### Orders
- **Farmer Orders** – Orders containing farmer’s products
- **Filter** – By status, search by buyer name/email/phone
- **Order details** – Full order view
- **Delivery / Pickup** – Type and preferred date shown on order
- **Delivery flow** – Accept → Packed → Shipped → Delivered
- **Pickup flow** – Accept → **Mark as Completed** only (no Packed/Shipped)
- **Accept / Reject** – For pending orders
- **Mark as Packed** – Delivery only
- **Mark as Shipped** – Delivery only
- **Mark as Delivered** – Delivery
- **Mark as Completed** – Pickup (sets status to delivered)
- **Order notification counter** – Badge on “Orders” in navbar (new/unread order notifications)
- **Notifications** – New order (delivery/pickup + date), cancellations; mark read, view order

### Earnings
- **Earnings page** – Revenue from orders

### Chat & Notifications
- **Chat** – With buyers
- **Admin messages** – Policies, announcements, files
- **Order notifications** – Badge + dropdown; clear, mark read

### Other
- **Profile** – Farmer profile
- **Farmer FAQ** – Selling on KisanConnect
- **Add Product** – Button in navbar

---

## Admin Features

### Dashboard
- **Admin Dashboard** – Total users, farmers, buyers, orders, products, revenue, banned, inactive
- **Charts** – Growth/trends (e.g. orders, users)
- **Quick links** – Users, Farmers, Orders

### User Management
- **Admin Users** – List all users
- **Search** – By name, email
- **Filter** – By role (All, Farmers, Buyers)
- **Ban / Unban** – Block or restore access
- **Activate / Deactivate** – Account status
- **View details** – Profile, orders (for user)

### Farmer Management
- **Admin Farmers** – List farmers
- **Search** – Name, email
- **View farmer** – Details, products, orders, stats
- **Ban / Unban, Activate / Deactivate**

### Order Management
- **Admin Orders** – All orders
- **Search** – Order ID, customer name, email
- **Filter** – By status
- **Order details** – Customer, items, farmers, amount, address, payment, delivery type, preferred date

### Communication
- **Admin Chat** – Chat with farmers (list, search, send/receive)
- **Policies / Announcements** – Send to all or individual farmers, with optional file

### Complaints
- **Admin Complaints** – List complaints (e.g. from buyers)
- **Filter** – Pending, resolved, dismissed
- **View complaint** – Order, buyer, farmer, description
- **Resolve** – Add resolution, change status
- **Farmer details** – Stats, products, orders in complaint view

### Other
- **Admin login** – Separate login
- **Navigation** – Dashboard, Users, Farmers, Orders, Chat, Complaints

---

## Backend API Overview

| Prefix | Purpose |
|--------|---------|
| `/auth` | Login, register |
| `/admin` | Admin login, users, farmers, orders, chat, complaints, settings |
| `/users` | User profile, update |
| `/products` | List, get, create, update, delete (with effective price for buyer) |
| `/cart` | Get, add, update, remove cart items; checkout (create order) |
| `/orders` | Create order, list my orders, get order, update status, cancel, notifications |
| `/messaging` | Conversations, messages, unread count, admin messages |
| `/negotiations` | Start, get, send offer, confirm, clear chat |
| `/policies` | Policies (e.g. for farmers) |
| `/dashboard` | Farmer dashboard, buyer dashboard |
| `/api` | File uploads, market prices |
| `/ratings` | Submit rating for delivered order |
| `/complaints` | Create complaint, list (admin) |
| `/news` | Government/news |

---

## Key Options and Settings

- **Delivery type** – `delivery` | `pickup` (stored on order)
- **Preferred date** – Stored on order (delivery or pickup date)
- **Order status** – pending, accepted, rejected, packed, shipped, delivered, cancelled
- **Negotiation status** – ongoing, accepted, confirmed
- **Payment method** – Cash on Delivery (default)
- **Product** – price, min_negotiable_price (for negotiation), category, quantity
- **PersonalProductOffer** – Buyer-specific negotiated price per product (used in cart)
- **JWT** – Stored as `token` in localStorage; sent in Authorization header

---

## Pages and Routes (Summary)

| Route | Page | Access |
|-------|------|--------|
| `/` | Redirect by role | All |
| `/login` | Login | Guest |
| `/admin-login` | Admin login | Guest |
| `/signup` | Customer signup | Guest |
| `/farmer-signup` | Farmer signup | Guest |
| `/customer-dashboard` | Customer dashboard | Public / Buyer |
| `/farmer-dashboard` | Farmer dashboard | Farmer |
| `/admin-dashboard` | Admin dashboard | Admin |
| `/products/:id` | Product details | Public |
| `/farmers/:productName` | Farmers selling product | Public |
| `/negotiate/:productId` | Price negotiation | Buyer |
| `/cart` | Cart | Buyer |
| `/checkout` | Checkout | Buyer |
| `/orders` | My orders | Buyer |
| `/chat` | Messages | Authenticated |
| `/profile` | Profile | Authenticated |
| `/inventory` | Farmer products | Farmer |
| `/register-product` | Add product | Farmer |
| `/farmer-orders` | Farmer orders | Farmer |
| `/farmer-order/:orderId` | Order details | Farmer |
| `/earnings` | Farmer earnings | Farmer |
| `/market-prices` | Market prices | Admin, Farmer |
| `/government-news` | Government news | Authenticated |
| `/faq` | FAQ | Public |
| `/farmer-faq` | Farmer FAQ | Farmer |
| `/success` | Order success | Authenticated |
| `/admin-users` | User management | Admin |
| `/admin-farmers` | Farmer management | Admin |
| `/admin-orders` | Order management | Admin |
| `/admin-chat` | Admin chat | Admin |
| `/admin-complaints` | Complaints | Admin |

---

## Technology Stack

- **Frontend:** React, React Router, Tailwind CSS, Heroicons
- **Backend:** FastAPI, SQLAlchemy, Pydantic
- **Database:** SQLite/PostgreSQL (configurable)
- **Auth:** JWT (Bearer token)
- **File uploads:** Multipart/form-data; stored under backend uploads

This document reflects the current KisanConnect codebase and includes negotiation, delivery/pickup, schedule date, farmer order badge, and related options.
