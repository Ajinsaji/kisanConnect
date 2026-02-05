# Data Flow Diagram (DFD) - KisanConnect

## Level 0 - Context Diagram

```
                    ┌─────────────┐
                    │   Farmer    │
                    └──────┬──────┘
                           │
                           │ Product Data, Orders, Messages
                           │
                    ┌──────▼──────────────────────────────┐
                    │                                     │
                    │      KisanConnect System           │
                    │                                     │
                    │  ┌──────────────────────────────┐  │
                    │  │   Database (PostgreSQL)      │  │
                    │  └──────────────────────────────┘  │
                    │                                     │
                    └──────┬──────────────────────────────┘
                           │
                           │ Orders, Products, Messages
                           │
                    ┌──────▼──────┐
                    │   Buyer     │
                    └─────────────┘
                           │
                           │ Orders, Cart, Messages
                           │
                    ┌──────▼──────┐
                    │   Admin     │
                    └─────────────┘
```

## Level 1 - Major Processes

### Process 1: User Management
```
┌─────────────┐
│   Users     │
└──────┬──────┘
       │
       ├───> [1.1] Register User ────> USER Table
       ├───> [1.2] Login/Authenticate ────> USER Table
       ├───> [1.3] Update Profile ────> USER Table
       └───> [1.4] View Profile ────> USER Table
```

### Process 2: Product Management
```
┌─────────────┐
│  Products   │
└──────┬──────┘
       │
       ├───> [2.1] Create Product ────> PRODUCT Table
       ├───> [2.2] Update Product ────> PRODUCT Table
       ├───> [2.3] Delete Product ────> PRODUCT Table
       ├───> [2.4] List Products ────> PRODUCT Table
       └───> [2.5] Search Products ────> PRODUCT Table
```

### Process 3: Shopping Cart Management
```
┌─────────────┐
│    Cart     │
└──────┬──────┘
       │
       ├───> [3.1] Add to Cart ────> CART_ITEM Table
       │                            └───> PRODUCT Table (check stock)
       ├───> [3.2] Update Cart ────> CART_ITEM Table
       ├───> [3.3] Remove from Cart ────> CART_ITEM Table
       └───> [3.4] View Cart ────> CART_ITEM Table
                                      └───> PRODUCT Table
```

### Process 4: Order Management
```
┌─────────────┐
│   Orders    │
└──────┬──────┘
       │
       ├───> [4.1] Create Order ────> ORDER Table
       │                            ├───> ORDER_ITEM Table
       │                            ├───> PRODUCT Table (update quantity)
       │                            └───> CART_ITEM Table (clear cart)
       │
       ├───> [4.2] Update Order Status ────> ORDER Table
       │                                     └───> ORDER_NOTIFICATION Table
       │
       ├───> [4.3] Cancel Order ────> ORDER Table
       │                            ├───> PRODUCT Table (restore quantity)
       │                            └───> ORDER_NOTIFICATION Table
       │
       ├───> [4.4] View Orders ────> ORDER Table
       │                            └───> ORDER_ITEM Table
       │
       └───> [4.5] Rate Order ────> RATING Table
                                    └───> ORDER Table (check if delivered)
```

### Process 5: Messaging System
```
┌─────────────┐
│  Messages   │
└──────┬──────┘
       │
       ├───> [5.1] Create Conversation ────> CONVERSATION Table
       ├───> [5.2] Send Message ────> MESSAGE Table
       │                            └───> CONVERSATION Table
       ├───> [5.3] View Messages ────> MESSAGE Table
       │                            └───> CONVERSATION Table
       └───> [5.4] Mark as Read ────> MESSAGE Table
```

### Process 6: Policy & Notification Management
```
┌─────────────┐
│  Policies   │
└──────┬──────┘
       │
       ├───> [6.1] Create Policy ────> POLICY Table
       │                            └───> NOTIFICATION Table (for all users)
       ├───> [6.2] View Policies ────> POLICY Table
       ├───> [6.3] View Notifications ────> NOTIFICATION Table
       │                                  └───> ORDER_NOTIFICATION Table
       └───> [6.4] Mark Notification Read ────> NOTIFICATION Table
                                                 └───> ORDER_NOTIFICATION Table
```

### Process 7: Admin Management
```
┌─────────────┐
│    Admin    │
└──────┬──────┘
       │
       ├───> [7.1] Manage Users ────> USER Table
       ├───> [7.2] Manage Orders ────> ORDER Table
       ├───> [7.3] Send Admin Message ────> ADMIN_MESSAGE Table
       │                                     └───> USER Table (farmers)
       └───> [7.4] View Statistics ────> All Tables
```

### Process 8: File Upload Management
```
┌─────────────┐
│   Uploads   │
└──────┬──────┘
       │
       ├───> [8.1] Upload File ────> File System
       │                            └───> MESSAGE Table (if message file)
       └───> [8.2] Serve File ────> File System
```

## Level 2 - Detailed Data Flows

### Order Creation Flow (Process 4.1)
```
Buyer
  │
  ├─> [4.1.1] Validate Cart Items
  │   └───> CART_ITEM Table
  │       └───> PRODUCT Table (check availability)
  │
  ├─> [4.1.2] Create Order Record
  │   └───> ORDER Table
  │
  ├─> [4.1.3] Create Order Items
  │   └───> ORDER_ITEM Table
  │       └───> PRODUCT Table (reduce quantity)
  │
  ├─> [4.1.4] Calculate Total
  │   └───> ORDER Table (update total_amount)
  │
  ├─> [4.1.5] Clear Cart
  │   └───> CART_ITEM Table (delete items)
  │
  └─> [4.1.6] Create Notification
      └───> ORDER_NOTIFICATION Table
```

### Order Status Update Flow (Process 4.2)
```
Farmer/Admin
  │
  ├─> [4.2.1] Validate Order Status
  │   └───> ORDER Table
  │
  ├─> [4.2.2] Update Order Status
  │   └───> ORDER Table
  │
  └─> [4.2.3] Create Notification
      └───> ORDER_NOTIFICATION Table
          └───> USER Table (buyer)
```

### Messaging Flow (Process 5.2)
```
User (Buyer/Farmer)
  │
  ├─> [5.2.1] Get or Create Conversation
  │   └───> CONVERSATION Table
  │
  ├─> [5.2.2] Upload File (if any)
  │   └───> File System
  │
  ├─> [5.2.3] Create Message
  │   └───> MESSAGE Table
  │       ├───> CONVERSATION Table
  │       └───> USER Table (sender)
  │
  └─> [5.2.4] Update Conversation
      └───> CONVERSATION Table
```

## Data Stores (D)

- **D1**: USER Table
- **D2**: PRODUCT Table
- **D3**: ORDER Table
- **D4**: ORDER_ITEM Table
- **D5**: CART_ITEM Table
- **D6**: CONVERSATION Table
- **D7**: MESSAGE Table
- **D8**: POLICY Table
- **D9**: NOTIFICATION Table
- **D10**: ORDER_NOTIFICATION Table
- **D11**: ADMIN_MESSAGE Table
- **D12**: RATING Table
- **D13**: File System (uploads/images, uploads/documents)

## External Entities

- **E1**: Farmer
- **E2**: Buyer
- **E3**: Admin

## Data Flow Summary

### Input Flows:
1. User Registration/Login Data → Process 1
2. Product Information → Process 2
3. Cart Operations → Process 3
4. Order Creation/Update → Process 4
5. Messages → Process 5
6. Policy Creation → Process 6
7. Admin Operations → Process 7
8. File Uploads → Process 8

### Output Flows:
1. User Data → Users
2. Product Listings → Buyers/Farmers
3. Cart Contents → Buyers
4. Order Details → Buyers/Farmers/Admin
5. Messages → Users
6. Notifications → Users
7. Statistics → Admin
8. Files → Users
