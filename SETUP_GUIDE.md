# Kisan Connect - Setup Guide

This guide will help you set up and run the Kisan Connect application with the frontend, backend, and PostgreSQL database.

## Prerequisites

1. **Python 3.8+** - For the backend
2. **Node.js 14+** - For the frontend
3. **PostgreSQL** - Database server
4. **npm** or **yarn** - Package manager for frontend

## Database Setup

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql` (Ubuntu/Debian)

### 2. Create Database

1. Start PostgreSQL service
2. Open PostgreSQL command line or pgAdmin
3. Run the following SQL command:

```sql
CREATE DATABASE kissanconnect;
```

### 3. Verify Database Connection

The backend is configured to connect to:
- **Host**: localhost
- **Port**: 5432
- **Database**: kissanconnect
- **User**: postgres
- **Password**: admin1969

**Note**: If your PostgreSQL setup uses different credentials, update `backend/core/config.py`:

```python
database_url: str = "postgresql+psycopg2://YOUR_USER:YOUR_PASSWORD@localhost:5432/kissanconnect"
```

Or create a `.env` file in the `backend/` directory:

```
DATABASE_URL=postgresql+psycopg2://YOUR_USER:YOUR_PASSWORD@localhost:5432/kissanconnect
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Backend Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at: `http://localhost:8000`

### 5. Verify Backend is Running

- Open `http://localhost:8000/docs` in your browser to see the API documentation
- Or check `http://localhost:8000/health` for health status

**Note**: The backend will automatically create database tables on first startup.

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Frontend Development Server

```bash
npm start
```

The frontend will be available at: `http://localhost:3000`

The frontend is configured to connect to the backend API at `http://localhost:8000`.

## Application Features

### Backend API Endpoints

All endpoints are documented at `http://localhost:8000/docs` when the backend is running.

**Key Endpoints:**
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /products/` - List products (with search & filter)
- `GET /cart/` - Get cart
- `POST /cart/add` - Add to cart
- `POST /cart/checkout` - Checkout cart
- `GET /dashboard/farmer` - Farmer dashboard
- `GET /dashboard/buyer` - Buyer dashboard
- `GET /messaging/conversations` - List conversations
- `POST /messaging/messages` - Send message

### Frontend Pages

- `/login` - Login page
- `/signup` - Customer signup
- `/farmer-signup` - Farmer signup
- `/dashboard` - Farmer dashboard (requires farmer role)
- `/customer-dashboard` - Customer/Buyer dashboard (requires buyer role)
- `/` - Product listing/home page
- `/products/:id` - Product details
- `/Cart` - Shopping cart
- `/Chat` - Messaging
- `/register-product` - Register new product (farmer only)
- `/success` - Order success page

## User Roles

1. **Buyer/Customer** (`buyer`): Can browse products, add to cart, place orders
2. **Farmer** (`farmer`): Can register products, manage inventory, view orders
3. **Admin** (`admin`): Full access

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   # Windows (PowerShell)
   Get-Service postgresql*

   # macOS/Linux
   sudo service postgresql status
   ```

2. Verify database exists:
   ```sql
   \l  -- List databases in psql
   ```

3. Check credentials in `backend/core/config.py`

### Backend Issues

1. **Port 8000 already in use**:
   - Change port in `main.py` or use `--port` flag with uvicorn

2. **Module not found errors**:
   - Ensure virtual environment is activated
   - Reinstall dependencies: `pip install -r requirements.txt`

3. **Database table errors**:
   - Check database connection
   - Delete tables manually and restart backend to recreate them

### Frontend Issues

1. **Cannot connect to backend**:
   - Verify backend is running on `http://localhost:8000`
   - Check `frontend/src/services/api.js` for correct API_BASE_URL

2. **Port 3000 already in use**:
   - React will automatically try another port
   - Or stop the other process using port 3000

3. **Module not found errors**:
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

## Default Configuration

- **Backend Port**: 8000
- **Frontend Port**: 3000
- **Database**: PostgreSQL on localhost:5432
- **Database Name**: kissanconnect

## Security Notes

⚠️ **For Production:**
- Change the `secret_key` in `backend/core/config.py`
- Use environment variables for sensitive data
- Configure CORS properly (currently allows all origins)
- Use HTTPS
- Store database credentials securely

## Next Steps

1. Create a user account (Buyer or Farmer)
2. Explore the features based on your role
3. Check API documentation at `http://localhost:8000/docs`

## Support

For issues or questions, refer to:
- Backend API docs: `http://localhost:8000/docs`
- Project checklist: `PROJECT_CHECKLIST.md`
