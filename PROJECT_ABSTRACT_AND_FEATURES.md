# KisanConnect - Project Abstract and Features

## 🔗 GITHUB REPOSITORY

**Full Source Code (Backend + Frontend):**
- 📦 **Repository**: [https://github.com/Ajinsaji/kisanConnect](https://github.com/Ajinsaji/kisanConnect)
- 📁 **Backend**: Located in `/backend` directory (FastAPI + PostgreSQL)
- 📁 **Frontend**: Located in `/frontend` directory (React.js + Tailwind CSS)

---

## 📋 PROJECT ABSTRACT

**KisanConnect** is a comprehensive **B2C (Business-to-Consumer) e-commerce platform** designed to bridge the gap between farmers and customers in the agricultural marketplace. The platform enables farmers to directly sell their fresh produce to end consumers, eliminating intermediaries and ensuring fair pricing for both parties.

### Core Concept
KisanConnect serves as a digital marketplace where:
- **Farmers** can list, manage, and sell their agricultural products
- **Customers/Buyers** can browse, purchase, and receive fresh farm products
- **Administrators** can oversee platform operations, manage users, and maintain system integrity

### Technology Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python) with PostgreSQL database
- **Authentication**: JWT (JSON Web Tokens)
- **Architecture**: RESTful API with role-based access control

### Key Objectives
1. **Direct Farmer-Customer Connection**: Eliminate middlemen in the agricultural supply chain
2. **Transparent Pricing**: Farmers set their own prices, customers see fair market rates
3. **Order Management**: Complete order lifecycle from placement to delivery
4. **Communication**: Built-in messaging system for farmer-customer interaction
5. **Quality Assurance**: Rating system to maintain service quality
6. **Administrative Control**: Comprehensive admin panel for platform management

---

## 👤 CUSTOMER/BUYER FEATURES

### 1. **Authentication & Profile Management**
- ✅ User registration and login
- ✅ Profile management (name, email, phone, address)
- ✅ Secure JWT-based authentication
- ✅ Password protection with bcrypt hashing

### 2. **Product Browsing & Discovery**
- ✅ Browse all available products
- ✅ Search products by name or description
- ✅ Filter products by category
- ✅ View product details (price, quantity, description, images)
- ✅ Compare products from different farmers
- ✅ View farmer ratings and reviews
- ✅ See product availability and stock levels

### 3. **Shopping Cart System**
- ✅ Add products to cart
- ✅ Update item quantities
- ✅ Remove items from cart
- ✅ View cart total and item count
- ✅ Real-time cart synchronization

### 4. **Checkout & Order Placement**
- ✅ Dedicated checkout page
- ✅ Shipping address collection (required, validated)
- ✅ Payment method selection (Cash on Delivery)
- ✅ Order summary review
- ✅ Order confirmation with order ID
- ✅ Automatic email storage for order tracking

### 5. **Order Management**
- ✅ View all personal orders
- ✅ Order details with "View More" expandable section
- ✅ See ordered items with names and quantities
- ✅ View order status (Pending, Accepted, Rejected, Packed, Shipped, Delivered, Cancelled)
- ✅ Track order total amount
- ✅ View delivery address
- ✅ See payment method
- ✅ Cancel orders (before delivery)
- ✅ Order history with timestamps

### 6. **Order Notifications**
- ✅ Real-time order status notifications
- ✅ Notifications show product names (e.g., "Your ordered item guava is accepted by farmer")
- ✅ "View More" button in notifications to see:
  - Order items with quantities
  - Total amount
  - Delivery address
- ✅ Navigate to full order details
- ✅ Mark notifications as read
- ✅ Notification badge with unread count

### 7. **Rating & Review System**
- ✅ Rate orders after delivery (1-5 stars)
- ✅ Add comments/reviews
- ✅ View own ratings
- ✅ Rating prompt notification when order is delivered
- ✅ Rating modal with star selection

### 8. **Communication & Messaging**
- ✅ Chat with farmers directly
- ✅ View conversation history
- ✅ Send and receive messages
- ✅ Unread message count indicator
- ✅ Real-time message updates

### 9. **Dashboard & Statistics**
- ✅ Personal dashboard with:
  - Total orders count
  - Total amount spent
  - Items in cart count
- ✅ Recommended products
- ✅ Quick access to cart and orders

### 10. **Additional Features**
- ✅ Browse farmers by product name
- ✅ View farmer profiles and ratings
- ✅ Product comparison across farmers
- ✅ Responsive design for mobile and desktop
- ✅ Toast notifications for user feedback

---

## 🌾 FARMER FEATURES

### 1. **Authentication & Profile**
- ✅ Farmer-specific registration
- ✅ Secure login with JWT tokens
- ✅ Profile management
- ✅ Farmer ID display (FC-{id})

### 2. **Product Management (Inventory)**
- ✅ Register new products
- ✅ Add product details:
  - Product name
  - Category
  - Description
  - Price per unit
  - Quantity/Stock
  - Product images
- ✅ Edit product information
- ✅ Delete products
- ✅ View all registered products
- ✅ Low stock alerts (quantity < 10)
- ✅ Product inventory dashboard

### 3. **Order Management**
- ✅ View all orders for farmer's products
- ✅ Order details page with:
  - Buyer information
  - Order items
  - Order status
  - Total amount
  - Delivery address
- ✅ Update order status:
  - Accept orders
  - Reject orders
  - Mark as Packed
  - Mark as Shipped
  - Mark as Delivered
- ✅ Order status notifications sent to buyers
- ✅ Recent orders display on dashboard

### 4. **Dashboard & Analytics**
- ✅ Comprehensive farmer dashboard with:
  - Total products count
  - Total orders count
  - Total revenue (₹)
  - Low stock count
- ✅ Recent orders table
- ✅ Product inventory overview
- ✅ Quick access to key sections

### 5. **Earnings & Revenue Tracking**
- ✅ View total revenue from all orders
- ✅ Earnings breakdown
- ✅ Revenue calculation from order items
- ✅ Financial statistics

### 6. **Communication**
- ✅ Chat with customers (buyers)
- ✅ Receive messages from buyers
- ✅ View conversation history
- ✅ Unread message notifications
- ✅ Admin messages (policies, announcements)
- ✅ File sharing capability (images, documents)

### 7. **Notifications**
- ✅ Order notifications
- ✅ Policy notifications from admin
- ✅ Admin announcements
- ✅ Unread notification count
- ✅ Mark notifications as read

### 8. **Rating & Reviews**
- ✅ Receive ratings from customers
- ✅ View average rating
- ✅ See total number of ratings
- ✅ Ratings displayed in farmer listings

### 9. **Additional Features**
- ✅ Responsive farmer interface
- ✅ Mobile-friendly navigation
- ✅ Quick access to inventory and orders
- ✅ Real-time order updates

---

## 👨‍💼 ADMIN FEATURES

### 1. **Authentication**
- ✅ Admin login (admin@gmail.com / admin)
- ✅ Secure JWT authentication
- ✅ Admin-only access control

### 2. **Dashboard & Statistics**
- ✅ Comprehensive admin dashboard with 8 key metrics:
  - Total Users
  - Total Farmers
  - Total Buyers/Customers
  - Total Orders
  - Total Products
  - Banned Users
  - Inactive Users
  - Total Revenue (₹)
- ✅ Quick action buttons
- ✅ System overview section

### 3. **User Management**
- ✅ View all users (farmers and buyers)
- ✅ Search users by name or email
- ✅ Filter by role (All, Farmers, Buyers)
- ✅ View detailed user information:
  - Personal details (name, email, phone)
  - Address information
  - Account status (Active/Inactive)
  - Ban status
- ✅ **User Actions**:
  - Ban users (prevent platform access)
  - Unban users
  - Activate user accounts
  - Deactivate user accounts

### 4. **Farmer Management**
- ✅ View all registered farmers
- ✅ Search farmers by name or email
- ✅ View comprehensive farmer details:
  - Personal information
  - Contact details
  - Address and location
  - Product inventory list
  - Account and ban status
- ✅ **Farmer Actions**:
  - Ban/Unban farmers
  - Activate/Deactivate farmer accounts
  - View farmer's products
  - View farmer's orders

### 5. **Order Management**
- ✅ View all orders in the system
- ✅ Search orders by:
  - Order ID
  - Customer name
  - Customer email
- ✅ Filter orders by status:
  - All Status
  - Pending
  - Accepted
  - Rejected
  - Packed
  - Shipped
  - Delivered
  - Cancelled
- ✅ View detailed order information:
  - Order ID and date
  - Customer information
  - Order items with product details
  - Farmer information
  - Total amount
  - Current status
  - Shipping address
  - Payment method

### 6. **Communication (Chat)**
- ✅ Chat directly with farmers
- ✅ View list of all farmers
- ✅ Search farmers
- ✅ Send messages to farmers
- ✅ Receive messages from farmers
- ✅ View message history
- ✅ Real-time communication
- ✅ Online status indicators

### 7. **Policy & Announcement Management**
- ✅ Create and manage policies
- ✅ Send announcements to farmers
- ✅ Group messages to all farmers
- ✅ Individual messages to specific farmers
- ✅ File attachments (documents, images)
- ✅ Track read/unread status

### 8. **System Monitoring**
- ✅ Monitor platform health
- ✅ Track user activity
- ✅ View system statistics
- ✅ Revenue tracking
- ✅ Order analytics

### 9. **Additional Features**
- ✅ Comprehensive admin navigation
- ✅ Mobile-responsive admin panel
- ✅ Quick access to all management sections
- ✅ Real-time data updates

---

## 🔐 SECURITY FEATURES

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Token expiration management
- ✅ Protected routes for each user type

### Data Security
- ✅ User data isolation (users only see their own data)
- ✅ Order filtering by user ID
- ✅ Email auto-population (prevents spoofing)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (SQLAlchemy ORM)

### Access Control
- ✅ Buyers can only access buyer features
- ✅ Farmers can only access farmer features
- ✅ Admins have full system access
- ✅ Cross-role access prevention

---

## 📊 DATABASE MODELS

### Core Models
1. **User** - All platform users (farmers, buyers, admin)
2. **Product** - Agricultural products listed by farmers
3. **Order** - Customer orders with status tracking
4. **OrderItem** - Individual items within orders
5. **CartItem** - Shopping cart items
6. **Rating** - Customer ratings for orders/farmers
7. **Conversation** - Chat conversations between users
8. **Message** - Individual chat messages
9. **OrderNotification** - Order status notifications
10. **Policy** - Platform policies and announcements
11. **Notification** - General user notifications
12. **AdminMessage** - Admin-to-farmer messages

---

## 🚀 KEY TECHNICAL FEATURES

### Backend
- ✅ RESTful API architecture
- ✅ FastAPI framework with async support
- ✅ PostgreSQL database with SQLAlchemy ORM
- ✅ Automatic database migrations
- ✅ CORS configuration
- ✅ Error handling and logging
- ✅ File upload support
- ✅ Enum type handling for order status

### Frontend
- ✅ React.js with functional components
- ✅ React Router for navigation
- ✅ Context API for state management
- ✅ Tailwind CSS for styling
- ✅ Responsive design
- ✅ Real-time updates
- ✅ Toast notifications
- ✅ Modal components

### Integration
- ✅ JWT token management
- ✅ API request/response handling
- ✅ Error handling and user feedback
- ✅ Loading states
- ✅ Form validation

---

## 📈 PLATFORM STATISTICS

### User Roles
- **Admin**: 1 (hardcoded)
- **Farmers**: Multiple (can register)
- **Buyers/Customers**: Multiple (can register)

### Order Status Flow
1. **Pending** → Order placed, awaiting farmer response
2. **Accepted** → Farmer accepts the order
3. **Rejected** → Farmer rejects the order
4. **Packed** → Order is packed and ready
5. **Shipped** → Order is in transit
6. **Delivered** → Order successfully delivered
7. **Cancelled** → Order cancelled by customer or farmer

### Payment Methods
- Currently: **Cash on Delivery** only
- Extensible for future payment gateways

---

## 🎯 PLATFORM GOALS

1. **Empower Farmers**: Direct access to customers, fair pricing
2. **Serve Customers**: Fresh products, competitive prices, easy ordering
3. **Maintain Quality**: Rating system ensures service standards
4. **Platform Management**: Admin oversight for smooth operations
5. **Transparency**: Clear communication between all parties

---

## 📝 SUMMARY

KisanConnect is a **complete e-commerce solution** for the agricultural sector, providing:
- ✅ Full shopping cart and checkout system
- ✅ Comprehensive order management
- ✅ Real-time communication
- ✅ Rating and review system
- ✅ Administrative oversight
- ✅ Mobile-responsive design
- ✅ Secure authentication
- ✅ Role-based access control

The platform successfully connects farmers directly with consumers, creating a transparent and efficient marketplace for fresh agricultural products.
