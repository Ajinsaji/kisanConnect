# Visual Diagrams - KisanConnect

## ER Diagram (Mermaid Syntax)

```mermaid
erDiagram
    USER ||--o{ PRODUCT : "creates"
    USER ||--o{ ORDER : "places"
    USER ||--o{ CART_ITEM : "has"
    USER ||--o{ CONVERSATION : "buyer"
    USER ||--o{ CONVERSATION : "farmer"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ ORDER_NOTIFICATION : "receives"
    USER ||--o{ ADMIN_MESSAGE : "receives"
    USER ||--o{ RATING : "gives"
    USER ||--o{ RATING : "receives"
    
    PRODUCT ||--o{ ORDER_ITEM : "included_in"
    PRODUCT ||--o{ CART_ITEM : "added_to"
    
    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER ||--o{ ORDER_NOTIFICATION : "generates"
    ORDER ||--|| RATING : "rated"
    
    CONVERSATION ||--o{ MESSAGE : "contains"
    
    POLICY ||--o{ NOTIFICATION : "generates"
    
    USER {
        bigint id PK
        string name
        string email UK
        string hashed_password
        enum role
        string phone
        text address
        string city
        string state
        string postal_code
        boolean is_active
        boolean is_banned
        datetime created_at
    }
    
    PRODUCT {
        bigint id PK
        bigint farmer_id FK
        string name
        string category
        text description
        decimal price
        integer quantity
        text image_url
        datetime created_at
    }
    
    ORDER {
        bigint id PK
        bigint buyer_id FK
        decimal total_amount
        enum status
        datetime created_at
        text shipping_address
        string payment_method
        string buyer_email
        text cancellation_reason
    }
    
    ORDER_ITEM {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        integer quantity
        decimal price
    }
    
    CART_ITEM {
        bigint id PK
        bigint user_id FK
        bigint product_id FK
        integer quantity
        datetime created_at
        datetime updated_at
    }
    
    CONVERSATION {
        bigint id PK
        bigint buyer_id FK
        bigint farmer_id FK
        datetime created_at
    }
    
    MESSAGE {
        bigint id PK
        bigint conversation_id FK
        bigint sender_id FK
        text message_text
        text file_url
        string file_type
        string file_name
        boolean is_read
        datetime created_at
    }
    
    POLICY {
        bigint id PK
        string title
        text description
        string category
        text document_url
        datetime created_at
    }
    
    NOTIFICATION {
        bigint id PK
        bigint user_id FK
        bigint policy_id FK
        boolean is_read
        datetime created_at
    }
    
    ORDER_NOTIFICATION {
        bigint id PK
        bigint user_id FK
        bigint order_id FK
        text message
        boolean is_read
        datetime created_at
    }
    
    ADMIN_MESSAGE {
        bigint id PK
        bigint farmer_id FK
        text message_text
        string message_type
        text link_url
        text file_url
        string file_type
        string file_name
        boolean is_read
        datetime created_at
    }
    
    RATING {
        bigint id PK
        bigint order_id FK
        bigint user_id FK
        bigint farmer_id FK
        integer rating
        text comment
        datetime created_at
    }
```

## DFD Level 0 - Context Diagram

```mermaid
flowchart TD
    Farmer[Farmer] -->|Product Data, Orders, Messages| System[KisanConnect System]
    Buyer[Buyer] -->|Orders, Cart, Messages| System
    Admin[Admin] -->|Management Operations| System
    System -->|Orders, Products, Messages| Farmer
    System -->|Orders, Products, Messages| Buyer
    System -->|Statistics, Reports| Admin
    System --> Database[(PostgreSQL Database)]
```

## DFD Level 1 - Major Processes

```mermaid
flowchart TD
    Start([User Request]) --> P1[1. User Management]
    Start --> P2[2. Product Management]
    Start --> P3[3. Cart Management]
    Start --> P4[4. Order Management]
    Start --> P5[5. Messaging]
    Start --> P6[6. Policy & Notifications]
    Start --> P7[7. Admin Management]
    Start --> P8[8. File Upload]
    
    P1 --> D1[(USER)]
    P2 --> D2[(PRODUCT)]
    P2 --> D1
    P3 --> D5[(CART_ITEM)]
    P3 --> D2
    P4 --> D3[(ORDER)]
    P4 --> D4[(ORDER_ITEM)]
    P4 --> D2
    P4 --> D5
    P4 --> D10[(ORDER_NOTIFICATION)]
    P4 --> D12[(RATING)]
    P5 --> D6[(CONVERSATION)]
    P5 --> D7[(MESSAGE)]
    P5 --> D1
    P6 --> D8[(POLICY)]
    P6 --> D9[(NOTIFICATION)]
    P6 --> D10
    P7 --> D1
    P7 --> D3
    P7 --> D11[(ADMIN_MESSAGE)]
    P8 --> FS[(File System)]
    P8 --> D7
```

## Order Processing Flow

```mermaid
sequenceDiagram
    participant B as Buyer
    participant S as System
    participant C as Cart
    participant O as Order
    participant P as Product
    participant N as Notification
    
    B->>S: Add to Cart
    S->>C: Store Item
    C->>P: Check Stock
    
    B->>S: Place Order
    S->>O: Create Order
    S->>O: Create Order Items
    S->>P: Reduce Quantity
    S->>C: Clear Cart
    S->>N: Create Notification
    N->>B: Notify Buyer
    
    S->>B: Order Confirmation
```

## User Roles and Permissions

```mermaid
graph TD
    USER[USER Entity]
    USER -->|role: farmer| FARMER[Farmer]
    USER -->|role: buyer| BUYER[Buyer]
    USER -->|role: admin| ADMIN[Admin]
    
    FARMER -->|can| F1[Create Products]
    FARMER -->|can| F2[Update Products]
    FARMER -->|can| F3[View Orders]
    FARMER -->|can| F4[Update Order Status]
    FARMER -->|can| F5[Send Messages]
    FARMER -->|can| F6[View Ratings]
    
    BUYER -->|can| B1[Browse Products]
    BUYER -->|can| B2[Add to Cart]
    BUYER -->|can| B3[Place Orders]
    BUYER -->|can| B4[Cancel Orders]
    BUYER -->|can| B5[Rate Orders]
    BUYER -->|can| B6[Send Messages]
    
    ADMIN -->|can| A1[Manage Users]
    ADMIN -->|can| A2[View All Orders]
    ADMIN -->|can| A3[Send Admin Messages]
    ADMIN -->|can| A4[Create Policies]
    ADMIN -->|can| A5[View Statistics]
```

## Order Status Flow

```mermaid
stateDiagram-v2
    [*] --> PENDING: Order Created
    PENDING --> ACCEPTED: Farmer Accepts
    PENDING --> CANCELLED: Buyer Cancels
    PENDING --> REJECTED: Farmer Rejects
    ACCEPTED --> PACKED: Farmer Packs
    PACKED --> SHIPPED: Farmer Ships
    SHIPPED --> DELIVERED: Order Delivered
    DELIVERED --> [*]: Can be Rated
    CANCELLED --> [*]: Order Closed
    REJECTED --> [*]: Order Closed
```

## Data Flow - Order Creation

```mermaid
flowchart LR
    A[Buyer] -->|1. Add to Cart| B[Cart System]
    B -->|2. Validate Stock| C[Product DB]
    A -->|3. Place Order| D[Order System]
    D -->|4. Create Order| E[Order DB]
    D -->|5. Create Items| F[Order Item DB]
    D -->|6. Update Stock| C
    D -->|7. Clear Cart| B
    D -->|8. Create Notification| G[Notification DB]
    G -->|9. Notify| A
    D -->|10. Confirm| A
```

## System Architecture Overview

```mermaid
graph TB
    subgraph "Frontend (React)"
        UI[User Interface]
    end
    
    subgraph "Backend (FastAPI)"
        API[API Endpoints]
        AUTH[Authentication]
        BL[Business Logic]
    end
    
    subgraph "Database (PostgreSQL)"
        DB[(PostgreSQL)]
    end
    
    subgraph "File Storage"
        FS[File System]
    end
    
    UI -->|HTTP Requests| API
    API --> AUTH
    AUTH --> BL
    BL --> DB
    BL --> FS
    DB -->|Query Results| BL
    BL -->|Response| API
    API -->|JSON Response| UI
```

## Notes

- These diagrams use Mermaid syntax and can be rendered in:
  - GitHub/GitLab markdown
  - VS Code with Mermaid extension
  - Online tools like mermaid.live
  - Documentation sites like GitBook, Notion

- For professional diagrams, use the specifications in ER_DIAGRAM.md and DFD_DIAGRAM.md with tools like:
  - draw.io
  - Lucidchart
  - dbdiagram.io
