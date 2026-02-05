# KisanConnect - ER & DFD Diagrams

This document contains Entity Relationship (ER) and Data Flow Diagram (DFD) documentation for the KisanConnect project.

## Files

1. **ER_DIAGRAM.md** - Complete Entity Relationship Diagram with all entities, attributes, and relationships
2. **DFD_DIAGRAM.md** - Data Flow Diagrams showing system processes and data flows

## Quick Reference

### Main Entities
- **USER** - Farmers, Buyers, and Admins
- **PRODUCT** - Agricultural products listed by farmers
- **ORDER** - Purchase orders placed by buyers
- **ORDER_ITEM** - Individual items in an order
- **CART_ITEM** - Items in shopping cart
- **CONVERSATION** - Chat conversations between buyers and farmers
- **MESSAGE** - Individual messages in conversations
- **POLICY** - Government policies and announcements
- **NOTIFICATION** - Policy notifications for users
- **ORDER_NOTIFICATION** - Order status notifications
- **ADMIN_MESSAGE** - Admin messages to farmers
- **RATING** - Product/farmer ratings by buyers

### Key Relationships
- One Farmer → Many Products
- One Buyer → Many Orders
- One Order → Many Order Items
- One Product → Many Order Items
- One Buyer + One Farmer → One Conversation
- One Conversation → Many Messages
- One Order → One Rating (after delivery)

### Main Processes
1. User Management (Registration, Login, Profile)
2. Product Management (CRUD operations)
3. Shopping Cart Management
4. Order Management (Create, Update, Cancel, Rate)
5. Messaging System
6. Policy & Notification Management
7. Admin Management
8. File Upload Management

## Visual Diagram Tools

To create visual diagrams from these specifications, you can use:

1. **Online Tools**:
   - [draw.io](https://app.diagrams.net/) - Free, supports ER and DFD
   - [Lucidchart](https://www.lucidchart.com/) - Professional diagramming
   - [dbdiagram.io](https://dbdiagram.io/) - ER diagrams specifically

2. **Desktop Tools**:
   - MySQL Workbench (for ER diagrams)
   - Microsoft Visio
   - StarUML

3. **Code-based Tools**:
   - PlantUML (text-based diagramming)
   - Mermaid (markdown-based diagrams)

## Example: Creating Visual ER Diagram

### Using dbdiagram.io

Copy the following to dbdiagram.io:

```sql
Table users {
  id bigint [pk]
  name varchar(255) [not null]
  email varchar(255) [unique, not null]
  hashed_password text [not null]
  role enum [not null] // farmer, buyer, admin
  phone varchar(20)
  address text
  city varchar(100)
  state varchar(100)
  postal_code varchar(20)
  is_active boolean [default: true]
  is_banned boolean [default: false]
  created_at timestamp [not null]
}

Table products {
  id bigint [pk]
  farmer_id bigint [ref: > users.id, not null]
  name varchar(255) [not null]
  category varchar(100)
  description text
  price decimal(10,2) [not null]
  quantity integer [not null]
  image_url text
  created_at timestamp [not null]
}

Table orders {
  id bigint [pk]
  buyer_id bigint [ref: > users.id, not null]
  total_amount decimal(10,2) [not null]
  status enum [not null] // pending, accepted, rejected, packed, shipped, delivered, cancelled
  created_at timestamp [not null]
  shipping_address text
  payment_method varchar(50)
  buyer_email varchar(255)
  cancellation_reason text
}

Table order_items {
  id bigint [pk]
  order_id bigint [ref: > orders.id, not null]
  product_id bigint [ref: > products.id, not null]
  quantity integer [not null]
  price decimal(10,2) [not null]
}

Table cart_items {
  id bigint [pk]
  user_id bigint [ref: > users.id, not null]
  product_id bigint [ref: > products.id, not null]
  quantity integer [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  
  indexes {
    (user_id, product_id) [unique]
  }
}

Table conversations {
  id bigint [pk]
  buyer_id bigint [ref: > users.id, not null]
  farmer_id bigint [ref: > users.id, not null]
  created_at timestamp [not null]
  
  indexes {
    (buyer_id, farmer_id) [unique]
  }
}

Table messages {
  id bigint [pk]
  conversation_id bigint [ref: > conversations.id, not null]
  sender_id bigint [ref: > users.id, not null]
  message_text text [not null]
  file_url text
  file_type varchar(50)
  file_name varchar(255)
  is_read boolean [default: false]
  created_at timestamp [not null]
}

Table policies {
  id bigint [pk]
  title varchar(255) [not null]
  description text [not null]
  category varchar(100)
  document_url text
  created_at timestamp [not null]
}

Table notifications {
  id bigint [pk]
  user_id bigint [ref: > users.id, not null]
  policy_id bigint [ref: > policies.id, not null]
  is_read boolean [default: false]
  created_at timestamp [not null]
  
  indexes {
    (user_id, policy_id) [unique]
  }
}

Table order_notifications {
  id bigint [pk]
  user_id bigint [ref: > users.id, not null]
  order_id bigint [ref: > orders.id, not null]
  message text [not null]
  is_read boolean [default: false]
  created_at timestamp [not null]
}

Table admin_messages {
  id bigint [pk]
  farmer_id bigint [ref: > users.id]
  message_text text
  message_type varchar(20) [default: 'info']
  link_url text
  file_url text
  file_type varchar(50)
  file_name varchar(255)
  is_read boolean [default: false]
  created_at timestamp [not null]
}

Table ratings {
  id bigint [pk]
  order_id bigint [ref: > orders.id, not null]
  user_id bigint [ref: > users.id, not null]
  farmer_id bigint [ref: > users.id, not null]
  rating integer [not null] // 1-5
  comment text
  created_at timestamp [not null]
  
  indexes {
    (order_id, user_id) [unique]
  }
}
```

## Notes

- All foreign keys have CASCADE DELETE where specified
- Timestamps are timezone-aware (UTC)
- Enums are stored as strings in the database
- Unique constraints prevent duplicate entries where specified
- Check constraints ensure data integrity (e.g., price >= 0, quantity > 0)
