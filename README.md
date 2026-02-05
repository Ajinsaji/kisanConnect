# 🌾 KisanConnect - Agricultural E-Commerce Platform

> **Direct marketplace connecting farmers with customers for fresh agricultural products**

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/Ajinsaji/kisanConnect)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-green)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)

---

## 🔗 GitHub Repository

**📦 Full Source Code (Backend + Frontend):**
- **Repository**: [https://github.com/Ajinsaji/kisanConnect](https://github.com/Ajinsaji/kisanConnect)
- **Backend**: Located in `/backend` directory (FastAPI + PostgreSQL)
- **Frontend**: Located in `/frontend` directory (React.js + Tailwind CSS)

> **Note**: Replace `yourusername` with your actual GitHub username and update the repository URL if different.

---

## 📋 Project Overview

**KisanConnect** is a comprehensive **B2C (Business-to-Consumer) e-commerce platform** designed to bridge the gap between farmers and customers in the agricultural marketplace. The platform enables farmers to directly sell their fresh produce to end consumers, eliminating intermediaries and ensuring fair pricing for both parties.

### Core Concept
- **Farmers** can list, manage, and sell their agricultural products
- **Customers/Buyers** can browse, purchase, and receive fresh farm products
- **Administrators** can oversee platform operations, manage users, and maintain system integrity

---

## 🚀 Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Architecture**: RESTful API with role-based access control

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Routing**: React Router
- **HTTP Client**: Fetch API

---

## 📁 Project Structure

```
KisanConnect/
├── backend/                 # FastAPI Backend
│   ├── api/                # API endpoints
│   │   ├── auth.py        # Authentication
│   │   ├── products.py    # Product management
│   │   ├── orders.py      # Order management
│   │   ├── cart.py        # Shopping cart
│   │   ├── ratings.py     # Rating system
│   │   ├── messaging.py   # Chat system
│   │   ├── admin.py       # Admin panel
│   │   └── dashboards.py  # Dashboard data
│   ├── db/                # Database models
│   │   ├── models.py      # SQLAlchemy models
│   │   └── session.py     # Database session
│   ├── core/              # Core utilities
│   │   ├── security.py    # JWT & password hashing
│   │   └── config.py      # Configuration
│   └── main.py            # FastAPI application
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── context/       # Context providers
│   └── public/            # Static assets
│
└── Documentation/          # Project documentation
    ├── PROJECT_ABSTRACT_AND_FEATURES.md
    ├── DATA_FLOW_AND_ER_DIAGRAMS.md
    └── README_START_HERE.md
```

---

## 🎯 Key Features

### 👤 Customer/Buyer Features
- ✅ User registration and authentication
- ✅ Product browsing and search
- ✅ Shopping cart system
- ✅ Checkout with address collection
- ✅ Order management and tracking
- ✅ Real-time order notifications
- ✅ Rating and review system
- ✅ Direct messaging with farmers

### 🌾 Farmer Features
- ✅ Product inventory management
- ✅ Order management and status updates
- ✅ Dashboard with analytics
- ✅ Revenue tracking
- ✅ Customer communication
- ✅ Rating display

### 👨‍💼 Admin Features
- ✅ Comprehensive dashboard
- ✅ User management (ban/activate)
- ✅ Farmer management
- ✅ Order monitoring
- ✅ System statistics
- ✅ Policy and announcement management

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- PostgreSQL database
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create .env file with:
# DATABASE_URL=postgresql://user:password@localhost/kisanconnect
# SECRET_KEY=your-secret-key

# Run database migrations (if needed)
# Start the server
python main.py
```

Backend will run on `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

---

## 📚 Documentation

### Main Documentation Files
- **[PROJECT_ABSTRACT_AND_FEATURES.md](./PROJECT_ABSTRACT_AND_FEATURES.md)** - Complete project overview and feature list
- **[DATA_FLOW_AND_ER_DIAGRAMS.md](./DATA_FLOW_AND_ER_DIAGRAMS.md)** - Database schema and data flow diagrams
- **[README_START_HERE.md](./README_START_HERE.md)** - Quick start guide

### Additional Documentation
- `QUICK_START.md` - Setup instructions
- `FILE_STRUCTURE.md` - Project structure details
- `DOCUMENTATION_INDEX.md` - Complete documentation index

---

## 🔐 Default Credentials

### Admin
- **Email**: admin@gmail.com
- **Password**: admin

### Test Users
Create accounts through the registration pages:
- Customer registration: `/signup`
- Farmer registration: `/farmer-signup`

---

## 📊 Database Schema

The platform uses PostgreSQL with the following main entities:
- **User** - All platform users (farmers, buyers, admin)
- **Product** - Agricultural products
- **Order** - Customer orders
- **OrderItem** - Items within orders
- **CartItem** - Shopping cart items
- **Rating** - Customer ratings
- **Conversation** - Chat conversations
- **Message** - Chat messages
- **Notification** - User notifications

See [DATA_FLOW_AND_ER_DIAGRAMS.md](./DATA_FLOW_AND_ER_DIAGRAMS.md) for detailed ER diagrams.

---

## 🛠️ Development

### Backend API Endpoints

- **Authentication**: `/auth/login`, `/auth/register`
- **Products**: `/products/`, `/products/{id}`
- **Orders**: `/orders/`, `/orders/{id}`
- **Cart**: `/cart/`, `/cart/add`, `/cart/remove`
- **Ratings**: `/ratings/`, `/ratings/farmer/{id}`
- **Messaging**: `/messaging/conversations`, `/messaging/messages`
- **Admin**: `/admin/stats`, `/admin/users`, `/admin/farmers`

### Frontend Routes

- `/` - Home/Product listing
- `/login` - User login
- `/signup` - Customer registration
- `/farmer-signup` - Farmer registration
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/orders` - My orders
- `/dashboard` - Customer dashboard
- `/farmer-dashboard` - Farmer dashboard
- `/admin-dashboard` - Admin dashboard

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
python test_backend.py
```

### Frontend Testing
```bash
cd frontend
npm test
```

---

## 📝 License

This project is open source and available for educational purposes.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

## 🎉 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Made with ❤️ for connecting farmers and customers**
