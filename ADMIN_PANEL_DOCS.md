# KisanConnect Admin Panel Documentation

## Overview
The Admin Panel is a comprehensive management system for KisanConnect administrators to manage users, farmers, orders, and maintain communication with farmers.

## Admin Credentials
- **Email:** `admin@gmail.com`
- **Password:** `admin`

## Features

### 1. Admin Dashboard
The main dashboard provides:
- **Key Statistics:**
  - Total Users
  - Total Farmers
  - Total Buyers/Customers
  - Total Orders
  - Total Products
  - Banned Users Count
  - Inactive Users Count
  - Total Revenue (₹)

- **Quick Actions:**
  - Manage Users
  - Manage Farmers
  - View Orders
  - Chat with Farmers

### 2. User Management
Located at: `/admin-users`

**Features:**
- View all users and farmers
- Search users by name or email
- Filter by role (All, Farmers, Buyers)
- View detailed user information including:
  - Name, Email, Phone
  - Address, City, State, Postal Code
  - Account status (Active/Inactive)
  - Ban status
- Ban users (prevent them from using the platform)
- Unban users
- Activate/Deactivate user accounts

### 3. Farmer Management
Located at: `/admin-farmers`

**Features:**
- View all registered farmers
- Search farmers by name or email
- View comprehensive farmer details:
  - Personal information (Name, Email, Phone)
  - Address and location details
  - List of products they're selling
  - Account and ban status
- Ban/Unban farmers
- Activate/Deactivate farmer accounts
- View farmer's product inventory

### 4. Order Management
Located at: `/admin-orders`

**Features:**
- View all orders in the system
- Search orders by:
  - Order ID
  - Customer name
  - Customer email
- Filter orders by status:
  - All Status
  - Pending
  - Shipped
  - Delivered
  - Cancelled
- View detailed order information:
  - Order ID and date
  - Customer information
  - Order items with farmer details
  - Product information
  - Total amount
  - Current status

### 5. Farmer Communication (Chat)
Located at: `/admin-chat`

**Features:**
- View list of all farmers with online status
- Search farmers
- Send direct messages to farmers
- Receive messages from farmers
- View message history
- Real-time communication indicator

## User Status Management

### Active/Inactive Status
- **Active:** User can access the platform normally
- **Inactive:** User's account is temporarily disabled but data is preserved

### Ban Status
- **Active:** User can access the platform
- **Banned:** User cannot access the platform at all
- Banning prevents:
  - Login to the account
  - Browsing products
  - Making orders (for buyers)
  - Listing products (for farmers)

## Navigation
The admin navbar provides quick navigation to:
- Dashboard
- Users
- Farmers
- Orders
- Chat
- Logout

## API Endpoints

### Authentication
```
POST /admin/login
Content-Type: application/json

{
  "email": "admin@gmail.com",
  "password": "admin"
}

Response:
{
  "access_token": "token_string",
  "token_type": "bearer"
}
```

### User Management
```
GET /admin/users                    - Get all users
GET /admin/users/{user_id}         - Get specific user details
POST /admin/users/{user_id}/ban    - Ban a user
POST /admin/users/{user_id}/unban  - Unban a user
POST /admin/users/{user_id}/activate   - Activate user
POST /admin/users/{user_id}/deactivate - Deactivate user
```

### Farmer Management
```
GET /admin/users/farmers           - Get all farmers
GET /admin/users/{farmer_id}       - Get farmer details
GET /admin/users/{farmer_id}/products - Get farmer's products
POST /admin/users/{farmer_id}/ban  - Ban farmer
POST /admin/users/{farmer_id}/unban - Unban farmer
```

### Order Management
```
GET /admin/orders                  - Get all orders
GET /admin/orders/{order_id}      - Get order details
```

### Statistics
```
GET /admin/stats                   - Get dashboard statistics
```

## Security Notes

1. **Hardcoded Credentials:** Currently uses hardcoded credentials. In production:
   - Use environment variables for credentials
   - Implement proper authentication
   - Add role-based access control
   - Use secure password hashing

2. **Token Management:**
   - Admin tokens are stored in localStorage
   - In production, use secure HTTP-only cookies
   - Implement token expiration and refresh

3. **Permissions:**
   - Only admins should be able to access admin endpoints
   - Implement JWT verification on backend
   - Add request signing/validation

## Setup Instructions

### Backend Setup
1. Update the User model (already done)
2. Run the migration:
   ```bash
   python migrate_add_admin_status.py
   ```

3. The admin API will be automatically registered

### Frontend Setup
1. Import admin pages in App.js (already done)
2. Add routes (already done)
3. No additional configuration needed

## Usage Workflow

### Banning a User
1. Go to User Management (`/admin-users`)
2. Search for the user
3. Click "View" to see details
4. Click "Ban" button
5. Confirm the action
6. User will be banned immediately

### Checking Order Details
1. Go to Order Management (`/admin-orders`)
2. Filter by status if needed
3. Search for specific order
4. Click "View Details"
5. See all items, farmers, and customer information

### Communicating with Farmers
1. Go to Chat (`/admin-chat`)
2. Select a farmer from the list
3. Type message and click Send
4. Farmer will receive notification

## Dashboard Widgets

### Statistics Cards
Each card shows:
- Category name
- Current count/value
- Visual icon
- Color-coded border

### Quick Actions
Buttons for fast navigation to main management sections

### System Overview
Information about:
- User Management capabilities
- Order Tracking features
- Communication tools

## Error Handling

The system handles:
- User not found errors
- Failed API requests
- Network connectivity issues
- Permission errors

Error messages are displayed in red notification boxes.

## Best Practices

1. **Regular Audits:** Regularly review user activity and orders
2. **Ban Responsibly:** Only ban users after investigation
3. **Communication:** Use chat for clear communication with farmers
4. **Monitoring:** Check dashboard statistics regularly
5. **Data Safety:** Keep admin credentials secure

## Troubleshooting

### Cannot Login
- Verify credentials are correct
- Email: `admin@gmail.com`
- Password: `admin`
- Clear browser cache and try again

### User/Farmer Not Appearing
- Refresh the page
- Check internet connection
- Verify backend is running

### Messages Not Sending
- Check internet connection
- Verify farmer is online
- Refresh the chat page

## Future Enhancements

Potential features for improvement:
1. Real-time notifications
2. Message encryption
3. Admin activity logs
4. Advanced analytics
5. Bulk user operations
6. User suspension timeline
7. Automated reports
8. Role-based admin access levels
9. Admin audit trail
10. Advanced search and filters

## Support

For issues or questions:
1. Check this documentation
2. Review error messages
3. Verify API connectivity
4. Check backend logs
