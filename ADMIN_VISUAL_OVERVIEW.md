# Admin Panel - Visual Overview & File Structure

## 🎯 Admin Panel Architecture

```
┌─────────────────────────────────────────────────────┐
│              ADMIN LOGIN PAGE                        │
│  (http://localhost:3000/admin-login)                │
│  Credentials: admin@gmail.com / admin               │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD                         │
│  (http://localhost:3000/admin-dashboard)            │
│  ┌─────────────────────────────────────────────┐   │
│  │ Statistics: Users, Farmers, Orders, Revenue │   │
│  │ Quick Action Buttons                        │   │
│  └─────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────┘
             │
     ┌───────┴──────────┬──────────────┬──────────┐
     ▼                  ▼              ▼          ▼
  USERS             FARMERS          ORDERS     CHAT
  ──────────────────────────────────────────────────
  • View All         • View All      • View All  • List
  • Search           • Search        • Search    • Search
  • Filter by        • View Details  • Filter    • Send
    Role             • Products      • Details   • Message
  • View Details     • Ban/Unban     • Customer  • History
  • Ban/Unban        • Active/       • Items     
  • Active/            Inactive
    Inactive
```

## 📁 File Structure

### Backend Files

```
backend/
├── main.py                          [MODIFIED]
│   └── Added admin router import and registration
│
├── api/
│   └── admin.py                     [NEW] 
│       ├── POST /admin/login        - Hardcoded admin login
│       ├── GET /admin/users         - Get all users
│       ├── GET /admin/users/{id}    - Get user details
│       ├── POST .../ban             - Ban user
│       ├── POST .../unban           - Unban user
│       ├── GET /admin/users/farmers - Get all farmers
│       ├── GET /admin/orders        - Get all orders
│       ├── GET /admin/orders/{id}   - Get order details
│       └── GET /admin/stats         - Get statistics
│
├── db/
│   └── models.py                    [MODIFIED]
│       └── Added to User model:
│           - is_active: Boolean
│           - is_banned: Boolean
│
└── migrate_add_admin_status.py       [NEW]
    └── Database migration script
        - Add is_active column
        - Add is_banned column
```

### Frontend Files

```
frontend/src/
├── pages/
│   ├── AdminLogin.jsx               [NEW]
│   │   └── Admin login form
│   │
│   ├── AdminDashboard.jsx           [NEW]
│   │   ├── Statistics cards (8)
│   │   ├── Quick action buttons
│   │   └── System overview
│   │
│   ├── AdminUsers.jsx               [NEW]
│   │   ├── User table with search
│   │   ├── Filter by role
│   │   ├── Ban/Unban buttons
│   │   └── User details modal
│   │
│   ├── AdminFarmers.jsx             [NEW]
│   │   ├── Farmer list
│   │   ├── Search functionality
│   │   ├── View farmer details
│   │   ├── Ban/Unban options
│   │   └── Product inventory
│   │
│   ├── AdminOrders.jsx              [NEW]
│   │   ├── Order table
│   │   ├── Search by ID/customer
│   │   ├── Filter by status
│   │   └── Order details modal
│   │
│   └── AdminChat.jsx                [NEW]
│       ├── Farmer list (online status)
│       ├── Direct messaging
│       ├── Message history
│       └── Search farmers
│
├── components/
│   └── AdminNavbar.js               [NEW]
│       ├── Navigation buttons
│       ├── Responsive mobile menu
│       ├── Logout button
│       └── Active page highlight
│
└── App.js                           [MODIFIED]
    ├── Import admin pages
    └── Add 6 admin routes
```

### Documentation Files

```
├── ADMIN_IMPLEMENTATION_SUMMARY.md   [NEW]
│   └── Complete implementation overview
│
├── ADMIN_PANEL_DOCS.md              [NEW]
│   └── Detailed documentation
│
└── ADMIN_QUICKSTART.md              [NEW]
    └── Quick start guide
```

## 🔄 Data Flow Diagram

```
┌──────────────────┐
│  Admin Login     │
│  Form Submit     │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ POST /admin/login                │
│ {email, password}                │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend Validation               │
│ Check: admin@gmail.com / admin   │
└────────┬─────────────────────────┘
         │
         ├─ Success ─────────────┐
         │                       ▼
         │         ┌─────────────────────────┐
         │         │ Return JWT Token        │
         │         └────────┬────────────────┘
         │                  │
         │                  ▼
         │         ┌─────────────────────────┐
         │         │ Store Token in          │
         │         │ localStorage            │
         │         └────────┬────────────────┘
         │                  │
         │                  ▼
         │         ┌─────────────────────────┐
         │         │ Redirect to Dashboard   │
         │         └─────────────────────────┘
         │
         └─ Failure ──────────────┐
                                  ▼
                         ┌─────────────────────────┐
                         │ Show Error Message      │
                         │ "Invalid Credentials"   │
                         └─────────────────────────┘
```

## 🎨 UI Component Hierarchy

```
AdminNavbar
├── Dashboard Button
├── Users Button
├── Farmers Button
├── Orders Button
├── Chat Button
├── Logout Button
└── Mobile Menu Toggle

AdminDashboard
├── StatCard (Total Users)
├── StatCard (Total Farmers)
├── StatCard (Total Buyers)
├── StatCard (Total Orders)
├── StatCard (Total Products)
├── StatCard (Banned Users)
├── StatCard (Inactive Users)
├── StatCard (Total Revenue)
├── QuickActionButton (Manage Users)
├── QuickActionButton (Manage Farmers)
├── QuickActionButton (View Orders)
└── QuickActionButton (Chat)

AdminUsers
├── SearchInput
├── FilterSelect
├── UsersTable
│   ├── TableHeader
│   └── TableRow (multiple)
│       ├── ViewButton
│       ├── BanButton / UnbanButton
│       └── StatusBadges
└── UserDetailsModal
    ├── UserInfo
    ├── ActionButtons
    └── CloseButton

AdminFarmers
├── SearchInput
├── FarmersTable
│   ├── TableHeader
│   └── TableRow (multiple)
│       ├── ViewButton
│       ├── BanButton / UnbanButton
│       └── StatusBadges
└── FarmerDetailsModal
    ├── FarmerInfo
    ├── ProductsList
    ├── ActionButtons
    └── CloseButton

AdminOrders
├── SearchInput
├── FilterSelect (Status)
├── OrdersTable
│   ├── TableHeader
│   └── TableRow (multiple)
│       ├── OrderInfo
│       ├── StatusBadge
│       └── ViewDetailsButton
└── OrderDetailsModal
    ├── OrderSummary
    ├── CustomerInfo
    ├── ItemsList
    └── CloseButton

AdminChat
├── FarmersList
│   ├── SearchInput
│   └── FarmerItem (multiple)
│       ├── Name
│       ├── Email
│       ├── Location
│       └── OnlineStatus
└── ChatArea
    ├── ChatHeader (selected farmer)
    ├── MessagesList
    │   ├── AdminMessage (right)
    │   └── FarmerMessage (left)
    └── InputArea
        ├── MessageInput
        └── SendButton
```

## 📊 State Management

### AdminLogin Component
```javascript
State:
- email: "admin@gmail.com" (pre-filled)
- password: "admin" (pre-filled)
- error: "" (error message)
- loading: false (button state)
```

### AdminDashboard Component
```javascript
State:
- stats: { ... } (dashboard statistics)
- loading: true (initial load)
- error: "" (error message)
```

### AdminUsers Component
```javascript
State:
- users: [] (all users)
- filteredUsers: [] (filtered results)
- loading: true (initial load)
- error: "" (error message)
- searchTerm: "" (search input)
- filterRole: "all" (role filter)
- selectedUser: null (modal user)
- actionInProgress: false (action state)
```

### Similar pattern for AdminFarmers, AdminOrders, AdminChat

## 🎯 API Endpoints Mapping

```
ADMIN LOGIN
├── POST /admin/login
│   └── Input: {email, password}
│   └── Output: {access_token, token_type}

USERS MANAGEMENT
├── GET /admin/users
├── GET /admin/users/{user_id}
├── POST /admin/users/{user_id}/ban
├── POST /admin/users/{user_id}/unban
├── POST /admin/users/{user_id}/activate
└── POST /admin/users/{user_id}/deactivate

FARMERS MANAGEMENT
├── GET /admin/users/farmers
├── GET /admin/users/{farmer_id}
├── GET /admin/users/{farmer_id}/products
├── GET /admin/users/{farmer_id}/orders
├── POST /admin/users/{farmer_id}/ban
├── POST /admin/users/{farmer_id}/unban
├── POST /admin/users/{farmer_id}/activate
└── POST /admin/users/{farmer_id}/deactivate

ORDERS MANAGEMENT
├── GET /admin/orders
└── GET /admin/orders/{order_id}

STATISTICS
└── GET /admin/stats
```

## 🔐 Security Flow

```
1. User enters credentials
   ↓
2. Frontend validates input
   ↓
3. POST to /admin/login
   ↓
4. Backend checks: admin@gmail.com / admin
   ↓
5. If valid → Generate JWT token
   ↓
6. Return token to frontend
   ↓
7. Store in localStorage as 'admin_token'
   ↓
8. Include in all subsequent requests:
   Authorization: Bearer {token}
   ↓
9. Backend validates token on each request
   ↓
10. Return data or error (401 Unauthorized)
```

## 📱 Responsive Design

### Desktop (> 1024px)
- Full table view
- Side-by-side layouts
- All columns visible

### Tablet (768px - 1024px)
- Adjusted table columns
- Responsive grid
- Simplified modals

### Mobile (< 768px)
- Collapsible navbar
- Vertical tables
- Full-width inputs
- Stacked modals

## 🎨 Color Scheme

```
Primary Green: #16a34a (used for buttons, active states)
Dark Green: #15803d (hover states)
Light Green: #dcfce7 (backgrounds)

Secondary Colors:
- Blue: #3b82f6 (users, information)
- Red: #ef4444 (ban, delete, danger)
- Yellow: #eab308 (pending, warning)
- Green: #22c55e (active, success, delivered)
- Purple: #a855f7 (chat, communication)
- Orange: #f97316 (deactivate)
```

## 📈 Features per Page

| Page | Features | Count |
|------|----------|-------|
| AdminLogin | Login form, Credential display | 3 |
| AdminDashboard | Statistics, Quick actions | 12 |
| AdminUsers | Search, Filter, View, Ban, Activate | 5 |
| AdminFarmers | Search, View, Products, Ban, Activate | 5 |
| AdminOrders | Search, Filter, View details, Items | 4 |
| AdminChat | Farmer list, Messaging, History | 3 |

## 🚀 Getting Started Steps

1. **Run Backend Migration**
   ```bash
   python migrate_add_admin_status.py
   ```

2. **Start Backend Server**
   ```bash
   python main.py
   ```

3. **Start Frontend**
   ```bash
   npm start
   ```

4. **Access Admin Panel**
   - URL: `http://localhost:3000/admin-login`
   - Email: `admin@gmail.com`
   - Password: `admin`

5. **Explore Features**
   - Go to Dashboard
   - Try managing users
   - View orders
   - Chat with farmers

---

**Complete Admin Panel Implementation Ready! 🎉**
