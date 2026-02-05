# Admin Panel Quick Start Guide

## 🚀 Getting Started

### Step 1: Access Admin Login
Navigate to: `http://localhost:3000/admin-login`

### Step 2: Login with Demo Credentials
- **Email:** `admin@gmail.com`
- **Password:** `admin`

Click "Login as Admin" button.

## 📊 Dashboard Overview

After login, you'll see the admin dashboard with:
- **👥 Total Users:** All registered users count
- **🌾 Total Farmers:** Number of farmers registered
- **🛒 Total Buyers:** Number of customers
- **📦 Total Orders:** All orders in system
- **📦 Total Products:** Products listed by farmers
- **🚫 Banned Users:** Currently banned accounts
- **⏸️ Inactive Users:** Deactivated accounts
- **💰 Total Revenue:** Sum of all orders

## 🎯 Main Features

### 1. Manage Users
**Path:** `/admin-users`

What you can do:
- ✅ Search users by name or email
- ✅ Filter by role (Farmers, Buyers)
- ✅ View user details (contact info, address)
- ✅ Ban/Unban users
- ✅ Activate/Deactivate accounts
- ✅ Check user status

### 2. Manage Farmers
**Path:** `/admin-farmers`

What you can do:
- ✅ View all farmers
- ✅ See their location details
- ✅ Check product inventory
- ✅ Ban/Unban farmers
- ✅ Activate/Deactivate accounts
- ✅ Monitor farmer status

### 3. View Orders
**Path:** `/admin-orders`

What you can do:
- ✅ See all orders with status
- ✅ Search by order ID or customer
- ✅ Filter by status (Pending, Shipped, Delivered, Cancelled)
- ✅ View order details and items
- ✅ See which farmer supplied which item
- ✅ Check total amount and dates

### 4. Chat with Farmers
**Path:** `/admin-chat`

What you can do:
- ✅ See list of all farmers
- ✅ Send direct messages
- ✅ Receive messages from farmers
- ✅ View conversation history
- ✅ Check farmer online status

## 📋 Common Tasks

### Task 1: Ban a User
1. Go to **Users** page
2. Search for the user
3. Click **View** button
4. Click **Ban** button
5. Confirm when prompted

### Task 2: Check Farmer's Products
1. Go to **Farmers** page
2. Click **View** on a farmer
3. Scroll down to see their products
4. See product name, price, and quantity

### Task 3: Track an Order
1. Go to **Orders** page
2. Search by order ID or customer name
3. Click **View Details**
4. See:
   - All items in order
   - Which farmer supplied each item
   - Customer information
   - Order status and date

### Task 4: Send Message to Farmer
1. Go to **Chat** page
2. Select farmer from left list
3. Type message in text box
4. Click **Send** button
5. Farmer receives message

### Task 5: Check Dashboard Stats
1. Click **Dashboard** in navbar
2. See all statistics at a glance
3. Click quick action buttons to go to specific sections

## 🔑 Key Status Indicators

### User Status Colors
- 🟢 **Active/Online** - User can access platform
- ⚫ **Offline/Inactive** - Account is inactive
- 🔴 **Banned** - User cannot access platform

### Order Status
- 🟡 **Pending** - Order received, awaiting processing
- 🔵 **Shipped** - Order sent to customer
- 🟢 **Delivered** - Order delivered
- 🔴 **Cancelled** - Order cancelled

## 💡 Tips & Tricks

1. **Quick Navigation:** Use navbar buttons at top for fast switching
2. **Search Function:** Use search to quickly find users/orders
3. **Filters:** Apply filters to narrow down results
4. **Batch Actions:** Select multiple users from table
5. **Export Data:** Statistics can be noted for reports

## ⚙️ Admin Features

### Activate/Deactivate
- Deactivate: Temporarily disable user (data preserved)
- Activate: Re-enable user account

### Ban/Unban
- Ban: Prevent user from accessing platform
- Unban: Restore access to banned user

### View Details
- See full user profile
- Check order items and farmers
- View product inventory

## 🔐 Security Notes

- Keep your login credentials safe
- Current: `admin@gmail.com` / `admin`
- Don't share login credentials
- Token is stored in browser (logout to clear)

## 🆘 Troubleshooting

### Can't Login?
- Check email: `admin@gmail.com`
- Check password: `admin`
- Clear browser cache
- Try incognito mode

### Page Not Loading?
- Check if backend is running
- Verify internet connection
- Reload page (F5)

### Actions Not Working?
- Ensure you're logged in
- Check admin token is valid
- Try logging out and back in

## 📱 Responsive Design

Admin panel works on:
- ✅ Desktop (full features)
- ✅ Tablet (responsive layout)
- ✅ Mobile (collapsible menu)

## 🎨 User Interface

### Navbar
- Logo (click to go to dashboard)
- Navigation buttons
- Logout button

### Tables
- Sortable columns
- Search integration
- Action buttons
- Status indicators

### Modals
- Detailed information
- Action confirmations
- Full records view

## 📈 Dashboard Metrics

Track:
- User growth
- Order volume
- Revenue trends
- Platform activity
- Ban/Inactive rates

## 🔄 Workflow

```
Login → Dashboard → 
  ├─ Users/Farmers Management
  ├─ Order Tracking
  └─ Farmer Communication
```

## 📞 Support Features

In modal/detail views:
- Full user information
- Contact details
- Action history
- Current status

## ✨ Next Steps

1. Log in to admin panel
2. Explore dashboard statistics
3. Visit Users section
4. Try managing a user
5. Check Orders section
6. Send a test message in Chat

---

**Happy Admin Managing! 🎉**

For detailed information, see ADMIN_PANEL_DOCS.md
