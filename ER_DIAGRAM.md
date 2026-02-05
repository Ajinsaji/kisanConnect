# Entity Relationship (ER) Diagram - KisanConnect

## Entities and Attributes

### 1. USER
- **Primary Key**: id (BigInteger)
- **Attributes**:
  - name (String 255, NOT NULL)
  - email (String 255, UNIQUE, NOT NULL)
  - hashed_password (Text, NOT NULL)
  - role (Enum: farmer, buyer, admin, NOT NULL)
  - phone (String 20, NULLABLE)
  - address (Text, NULLABLE)
  - city (String 100, NULLABLE)
  - state (String 100, NULLABLE)
  - postal_code (String 20, NULLABLE)
  - is_active (Boolean, DEFAULT true, NOT NULL)
  - is_banned (Boolean, DEFAULT false, NOT NULL)
  - created_at (DateTime, NOT NULL)

### 2. PRODUCT
- **Primary Key**: id (BigInteger)
- **Foreign Key**: farmer_id → USER.id (CASCADE DELETE)
- **Attributes**:
  - farmer_id (BigInteger, NOT NULL)
  - name (String 255, NOT NULL)
  - category (String 100, NULLABLE)
  - description (Text, NULLABLE)
  - price (Numeric 10,2, CHECK >= 0, NOT NULL)
  - quantity (Integer, CHECK >= 0, NOT NULL)
  - image_url (Text, NULLABLE)
  - created_at (DateTime, NOT NULL)

### 3. ORDER
- **Primary Key**: id (BigInteger)
- **Foreign Key**: buyer_id → USER.id (CASCADE DELETE)
- **Attributes**:
  - buyer_id (BigInteger, NOT NULL)
  - total_amount (Numeric 10,2, CHECK >= 0, NOT NULL)
  - status (Enum: pending, accepted, rejected, packed, shipped, delivered, cancelled, NOT NULL)
  - created_at (DateTime, NOT NULL)
  - shipping_address (Text, NULLABLE)
  - payment_method (String 50, DEFAULT 'cash', NULLABLE)
  - buyer_email (String 255, NULLABLE)
  - cancellation_reason (Text, NULLABLE)

### 4. ORDER_ITEM
- **Primary Key**: id (BigInteger)
- **Foreign Keys**: 
  - order_id → ORDER.id (CASCADE DELETE)
  - product_id → PRODUCT.id
- **Attributes**:
  - order_id (BigInteger, NOT NULL)
  - product_id (BigInteger, NOT NULL)
  - quantity (Integer, CHECK > 0, NOT NULL)
  - price (Numeric 10,2, CHECK >= 0, NOT NULL)

### 5. CART_ITEM
- **Primary Key**: id (BigInteger)
- **Foreign Keys**:
  - user_id → USER.id (CASCADE DELETE)
  - product_id → PRODUCT.id (CASCADE DELETE)
- **Unique Constraint**: (user_id, product_id)
- **Attributes**:
  - user_id (BigInteger, NOT NULL)
  - product_id (BigInteger, NOT NULL)
  - quantity (Integer, CHECK > 0, NOT NULL)
  - created_at (DateTime, NOT NULL)
  - updated_at (DateTime, NOT NULL)

### 6. CONVERSATION
- **Primary Key**: id (BigInteger)
- **Foreign Keys**:
  - buyer_id → USER.id (CASCADE DELETE)
  - farmer_id → USER.id (CASCADE DELETE)
- **Unique Constraint**: (buyer_id, farmer_id)
- **Attributes**:
  - buyer_id (BigInteger, NOT NULL)
  - farmer_id (BigInteger, NOT NULL)
  - created_at (DateTime, NOT NULL)

### 7. MESSAGE
- **Primary Key**: id (BigInteger)
- **Foreign Keys**:
  - conversation_id → CONVERSATION.id (CASCADE DELETE)
  - sender_id → USER.id (CASCADE DELETE)
- **Attributes**:
  - conversation_id (BigInteger, NOT NULL)
  - sender_id (BigInteger, NOT NULL)
  - message_text (Text, NOT NULL)
  - file_url (Text, NULLABLE)
  - file_type (String 50, NULLABLE)
  - file_name (String 255, NULLABLE)
  - is_read (Boolean, DEFAULT false, NOT NULL)
  - created_at (DateTime, NOT NULL)

### 8. POLICY
- **Primary Key**: id (BigInteger)
- **Attributes**:
  - title (String 255, NOT NULL)
  - description (Text, NOT NULL)
  - category (String 100, NULLABLE)
  - document_url (Text, NULLABLE)
  - created_at (DateTime, NOT NULL)

### 9. NOTIFICATION
- **Primary Key**: id (BigInteger)
- **Foreign Keys**:
  - user_id → USER.id (CASCADE DELETE)
  - policy_id → POLICY.id (CASCADE DELETE)
- **Unique Constraint**: (user_id, policy_id)
- **Attributes**:
  - user_id (BigInteger, NOT NULL)
  - policy_id (BigInteger, NOT NULL)
  - is_read (Boolean, DEFAULT false, NOT NULL)
  - created_at (DateTime, NOT NULL)

### 10. ORDER_NOTIFICATION
- **Primary Key**: id (BigInteger)
- **Foreign Keys**:
  - user_id → USER.id (CASCADE DELETE)
  - order_id → ORDER.id (CASCADE DELETE)
- **Attributes**:
  - user_id (BigInteger, NOT NULL)
  - order_id (BigInteger, NOT NULL)
  - message (Text, NOT NULL)
  - is_read (Boolean, DEFAULT false, NOT NULL)
  - created_at (DateTime, NOT NULL)

### 11. ADMIN_MESSAGE
- **Primary Key**: id (BigInteger)
- **Foreign Key**: farmer_id → USER.id (CASCADE DELETE, NULLABLE - NULL means group message)
- **Attributes**:
  - farmer_id (BigInteger, NULLABLE)
  - message_text (Text, NULLABLE)
  - message_type (String 20, DEFAULT 'info', NOT NULL)
  - link_url (Text, NULLABLE)
  - file_url (Text, NULLABLE)
  - file_type (String 50, NULLABLE)
  - file_name (String 255, NULLABLE)
  - is_read (Boolean, DEFAULT false, NOT NULL)
  - created_at (DateTime, NOT NULL)

### 12. RATING
- **Primary Key**: id (BigInteger)
- **Foreign Keys**:
  - order_id → ORDER.id (CASCADE DELETE)
  - user_id → USER.id (CASCADE DELETE) - Buyer who rates
  - farmer_id → USER.id (CASCADE DELETE) - Farmer being rated
- **Unique Constraint**: (order_id, user_id)
- **Attributes**:
  - order_id (BigInteger, NOT NULL)
  - user_id (BigInteger, NOT NULL)
  - farmer_id (BigInteger, NOT NULL)
  - rating (Integer, CHECK 1-5, NOT NULL)
  - comment (Text, NULLABLE)
  - created_at (DateTime, NOT NULL)

## Relationships

```
USER (1) ────< (N) PRODUCT
  │              (farmer_id)
  │
  ├───< (N) ORDER (buyer_id)
  │       │
  │       └───< (N) ORDER_ITEM
  │               │
  │               └───> (1) PRODUCT
  │
  ├───< (N) CART_ITEM (user_id)
  │       │
  │       └───> (1) PRODUCT
  │
  ├───< (N) CONVERSATION (buyer_id)
  ├───< (N) CONVERSATION (farmer_id)
  │       │
  │       └───< (N) MESSAGE
  │               │
  │               └───> (1) USER (sender_id)
  │
  ├───< (N) NOTIFICATION (user_id)
  │       │
  │       └───> (1) POLICY
  │
  ├───< (N) ORDER_NOTIFICATION (user_id)
  │       │
  │       └───> (1) ORDER
  │
  ├───< (N) ADMIN_MESSAGE (farmer_id, nullable)
  │
  └───< (N) RATING (user_id - buyer)
      │
      ├───> (1) ORDER
      └───> (1) USER (farmer_id - farmer being rated)
```

## Relationship Cardinalities

1. **USER → PRODUCT**: One-to-Many (1:N)
   - One farmer can have many products
   - Each product belongs to one farmer

2. **USER → ORDER**: One-to-Many (1:N)
   - One buyer can have many orders
   - Each order belongs to one buyer

3. **ORDER → ORDER_ITEM**: One-to-Many (1:N)
   - One order can have many order items
   - Each order item belongs to one order

4. **PRODUCT → ORDER_ITEM**: One-to-Many (1:N)
   - One product can be in many order items
   - Each order item references one product

5. **USER → CART_ITEM**: One-to-Many (1:N)
   - One user can have many cart items
   - Each cart item belongs to one user

6. **PRODUCT → CART_ITEM**: One-to-Many (1:N)
   - One product can be in many carts
   - Each cart item references one product

7. **USER → CONVERSATION**: Many-to-Many (M:N) via CONVERSATION
   - One buyer can have conversations with many farmers
   - One farmer can have conversations with many buyers
   - Each conversation links one buyer and one farmer

8. **CONVERSATION → MESSAGE**: One-to-Many (1:N)
   - One conversation can have many messages
   - Each message belongs to one conversation

9. **USER → MESSAGE**: One-to-Many (1:N)
   - One user can send many messages
   - Each message has one sender

10. **USER → NOTIFICATION**: One-to-Many (1:N)
    - One user can have many notifications
    - Each notification belongs to one user

11. **POLICY → NOTIFICATION**: One-to-Many (1:N)
    - One policy can generate many notifications
    - Each notification references one policy

12. **USER → ORDER_NOTIFICATION**: One-to-Many (1:N)
    - One user can have many order notifications
    - Each order notification belongs to one user

13. **ORDER → ORDER_NOTIFICATION**: One-to-Many (1:N)
    - One order can generate many notifications
    - Each order notification references one order

14. **USER → ADMIN_MESSAGE**: One-to-Many (1:N, optional)
    - One farmer can receive many admin messages
    - NULL farmer_id means group message to all farmers

15. **ORDER → RATING**: One-to-One (1:1)
    - One order can have one rating
    - Each rating references one order

16. **USER → RATING**: Many-to-Many (M:N) via RATING
    - One buyer can rate many farmers
    - One farmer can receive many ratings
    - Each rating links one buyer, one farmer, and one order

## Enumerations

### UserRole
- FARMER
- BUYER
- ADMIN

### OrderStatus
- PENDING
- ACCEPTED
- REJECTED
- PACKED
- SHIPPED
- DELIVERED
- CANCELLED
