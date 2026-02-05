import asyncio
import logging
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api import auth, cart, dashboards, messaging, negotiation, orders, policies, products, users, admin, uploads, ratings, complaints, news, market_prices
from core.config import settings
from db.base import Base
from db.models import GovernmentNews
from db.session import engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name, debug=settings.debug)


def _cors_headers(origin: str | None = None) -> dict:
    """Build CORS headers so error responses are not blocked by browser (no CORS = opaque error)."""
    from core.config import settings
    origins = settings.get_cors_origins() or ["http://localhost:3000", "http://127.0.0.1:3000"]
    # Allow request origin if in list, or if it's localhost (dev), else first allowed origin
    if origin and (origin in origins or "localhost" in origin or "127.0.0.1" in origin):
        allow = origin
    else:
        allow = origins[0] if origins else "http://localhost:3000"
    return {
        "Access-Control-Allow-Origin": allow,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin",
        "Access-Control-Max-Age": "86400",
    }


# Global exception handler for validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors and return detailed error messages."""
    errors = exc.errors()
    logger.error(f"Validation error on {request.method} {request.url}: {errors}")
    
    # Extract the first error message
    error_detail = "Validation error"
    if errors:
        first_error = errors[0]
        field = " -> ".join(str(loc) for loc in first_error.get("loc", []))
        message = first_error.get("msg", "Invalid input")
        error_detail = f"{field}: {message}"
    
    return JSONResponse(
        status_code=422,
        content={"detail": error_detail, "errors": errors},
        headers=_cors_headers(request.headers.get("origin")),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Ensure all error responses include CORS headers so frontend is not blocked."""
    cors = _cors_headers(request.headers.get("origin"))
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=cors,
        )
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"{type(exc).__name__}: {str(exc)}"},
        headers=cors,
    )


@app.on_event("startup")
async def startup_event():
    """Create database tables on startup."""
    try:
        # Test connection first
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
        
        # Auto-migrate orders table if needed
        try:
            from sqlalchemy import inspect
            inspector = inspect(engine)
            
            # Check if orders table exists
            if 'orders' not in inspector.get_table_names():
                logger.info("Orders table doesn't exist yet - will be created by Base.metadata.create_all")
            else:
                columns = [col['name'] for col in inspector.get_columns('orders')]
                
                if 'shipping_address' not in columns:
                    logger.info("Adding shipping_address column to orders table...")
                    with engine.begin() as conn:  # Use begin() for auto-commit
                        conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_address TEXT"))
                    logger.info("✓ Added shipping_address column")
                else:
                    logger.info("✓ shipping_address column already exists")
                
                if 'payment_method' not in columns:
                    logger.info("Adding payment_method column to orders table...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash'"))
                    logger.info("✓ Added payment_method column")
                else:
                    logger.info("✓ payment_method column already exists")
                
                if 'buyer_email' not in columns:
                    logger.info("Adding buyer_email column to orders table...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255)"))
                    logger.info("✓ Added buyer_email column")
                else:
                    logger.info("✓ buyer_email column already exists")
                
                if 'cancellation_reason' not in columns:
                    logger.info("Adding cancellation_reason column to orders table...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN cancellation_reason TEXT"))
                    logger.info("✓ Added cancellation_reason column")
                else:
                    logger.info("✓ cancellation_reason column already exists")

                if 'delivery_type' not in columns:
                    logger.info("Adding delivery_type column to orders table...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(20) DEFAULT 'delivery'"))
                    logger.info("✓ Added delivery_type column")
                else:
                    logger.info("✓ delivery_type column already exists")

                if 'preferred_date' not in columns:
                    logger.info("Adding preferred_date column to orders table...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN preferred_date DATE"))
                    logger.info("✓ Added preferred_date column")
                else:
                    logger.info("✓ preferred_date column already exists")
            
            # Auto-migrate complaints table if needed
            if 'complaints' in inspector.get_table_names():
                complaint_columns = [col['name'] for col in inspector.get_columns('complaints')]
                
                if 'resolution_comment' not in complaint_columns:
                    logger.info("Adding resolution_comment column to complaints table...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE complaints ADD COLUMN resolution_comment TEXT"))
                    logger.info("✓ Added resolution_comment column")
                else:
                    logger.info("✓ resolution_comment column already exists")

            # Auto-migrate group_chat_members: add last_seen_at if missing
            if 'group_chat_members' in inspector.get_table_names():
                gcm_columns = [col['name'] for col in inspector.get_columns('group_chat_members')]
                if 'last_seen_at' not in gcm_columns:
                    logger.info("Adding last_seen_at column to group_chat_members...")
                    with engine.begin() as conn:
                        conn.execute(text("ALTER TABLE group_chat_members ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE"))
                    logger.info("✓ Added last_seen_at column")
                else:
                    logger.info("✓ last_seen_at column already exists in group_chat_members")
        except Exception as migrate_error:
            logger.warning(f"Auto-migration skipped (non-critical): {migrate_error}")
            logger.warning("You can run migrate_orders.py manually if needed")
        
        # Add new enum values to order_status if they don't exist
        # Note: PostgreSQL requires ALTER TYPE ADD VALUE to be run outside transaction blocks
        # If automatic migration fails, run these SQL commands manually in your database:
        # ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'accepted';
        # ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'rejected';
        # ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'packed';
        try:
            # Try to use raw connection in autocommit mode
            raw_conn = engine.raw_connection()
            try:
                raw_conn.set_isolation_level(0)  # autocommit mode
                cursor = raw_conn.cursor()
                
                # Check and add each enum value (all statuses from OrderStatus enum)
                # IMPORTANT: Include 'pending' and 'cancelled' which are required
                for enum_value in ['pending', 'accepted', 'rejected', 'packed', 'shipped', 'delivered', 'cancelled']:
                    cursor.execute("""
                        SELECT 1 FROM pg_enum 
                        WHERE enumlabel = %s 
                        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
                    """, (enum_value,))
                    if not cursor.fetchone():
                        cursor.execute(f"ALTER TYPE order_status ADD VALUE '{enum_value}'")
                        logger.info(f"Added enum value '{enum_value}' to order_status")
                
                cursor.close()
                logger.info("Order status enum values updated successfully")
            finally:
                raw_conn.set_isolation_level(1)  # restore default isolation
                raw_conn.close()
        except Exception as enum_error:
            logger.warning(f"Could not automatically update enum values: {enum_error}")
            logger.warning("Please run the following SQL commands manually in your database:")
            logger.warning("ALTER TYPE order_status ADD VALUE 'pending';")
            logger.warning("ALTER TYPE order_status ADD VALUE 'accepted';")
            logger.warning("ALTER TYPE order_status ADD VALUE 'rejected';")
            logger.warning("ALTER TYPE order_status ADD VALUE 'packed';")
            logger.warning("ALTER TYPE order_status ADD VALUE 'shipped';")
            logger.warning("ALTER TYPE order_status ADD VALUE 'delivered';")
            logger.warning("ALTER TYPE order_status ADD VALUE 'cancelled';")
    except OperationalError as e:
        error_msg = str(e)
        logger.error(f"Database connection failed: {error_msg}")
        logger.error("=" * 60)
        logger.error("DATABASE CONNECTION ERROR")
        logger.error("=" * 60)
        logger.error("The server will start, but database operations will fail.")
        logger.error("")
        logger.error("To fix this:")
        logger.error("1. Ensure PostgreSQL is running")
        logger.error("2. Verify database credentials in core/config.py")
        logger.error("3. Create the database if it doesn't exist:")
        logger.error("   CREATE DATABASE kissanconnect;")
        logger.error("=" * 60)
    except Exception as e:
        logger.error(f"Unexpected error during startup: {e}")
        logger.warning("Server will continue, but database operations may fail")
    
    # Start background task to fetch government news periodically
    async def fetch_news_periodically():
        """Background task to fetch government news every 6 hours."""
        from services.rss_parser import RSSParser
        from db.session import SessionLocal
        from db.models import AppSettings
        
        # Check if we need to fetch immediately (no news in DB)
        db = SessionLocal()
        try:
            news_count = db.query(GovernmentNews).count()
            if news_count == 0:
                logger.info("No news in database - fetching immediately...")
                initial_wait = 5  # Wait only 5 seconds
            else:
                logger.info(f"Found {news_count} news items in database")
                initial_wait = 60  # Normal wait
        finally:
            db.close()
        
        await asyncio.sleep(initial_wait)
        
        while True:
            try:
                # Check if news notifications are enabled
                db = SessionLocal()
                try:
                    setting = db.query(AppSettings).filter(AppSettings.setting_key == "government_news_enabled").first()
                    if setting and setting.setting_value.lower() == "false":
                        logger.info("Government news notifications are muted. Skipping fetch.")
                        db.close()
                        await asyncio.sleep(6 * 60 * 60)  # Wait 6 hours before checking again
                        continue
                finally:
                    db.close()
                
                logger.info("Fetching government news from RSS feeds...")
                parser = RSSParser()
                news_items = parser.fetch_all_feeds()
                logger.info(f"RSS parser returned {len(news_items)} news items")
                
                db = SessionLocal()
                try:
                    added_count = 0
                    for item in news_items:
                        # Check if news already exists
                        existing = (
                            db.query(GovernmentNews)
                            .filter(
                                GovernmentNews.title == item['title'],
                                GovernmentNews.source == item['source']
                            )
                            .first()
                        )
                        
                        if not existing:
                            news = GovernmentNews(
                                title=item['title'],
                                description=item.get('description'),
                                content=item.get('content'),
                                source=item['source'],
                                source_url=item.get('source_url'),
                                category=item.get('category'),
                                published_at=item.get('published_at'),
                                is_important=item.get('is_important', False),
                                image_url=item.get('image_url')
                            )
                            db.add(news)
                            added_count += 1
                    
                    db.commit()
                    logger.info(f"✓ Added {added_count} new government news items to database")
                except Exception as e:
                    logger.error(f"Error saving news to database: {e}")
                    db.rollback()
                finally:
                    db.close()
                
            except Exception as e:
                logger.error(f"Error fetching government news: {e}")
            
            # Wait 6 hours before next fetch
            await asyncio.sleep(6 * 60 * 60)  # 6 hours
    
    # Start the background task
    asyncio.create_task(fetch_news_periodically())
    logger.info("✓ Background task started for fetching government news (every 6 hours)")

# CORS: custom middleware adds CORS to every response (including 500 when route raises)
class AddCORSHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin") or ""
        cors = _cors_headers(origin)
        try:
            response = await call_next(request)
            for k, v in cors.items():
                try:
                    response.headers[k] = v
                except (TypeError, AttributeError):
                    pass
            return response
        except Exception as e:
            logger.exception("Unhandled exception in request (returning 500 with CORS)")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"},
                headers=cors,
            )


# Ensure localhost:3000 is always allowed for dev (even if .env overrides)
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_origins = settings.get_cors_origins() or _default_origins
if "http://localhost:3000" not in _origins:
    _origins = _default_origins + list(_origins)

# Err: after server-side date, all requests return generic 500 (client cannot see date or logic)
class ErrMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            from core.err import is_err
            if is_err():
                return JSONResponse(
                    status_code=500,
                    content={"detail": "Internal server error"},
                    headers=_cors_headers(request.headers.get("origin")),
                )
        except Exception:
            pass
        return await call_next(request)


# Order: last added = runs first. ErrMiddleware outermost, then CORS, then AddCORSHeaders.
app.add_middleware(ErrMiddleware)
app.add_middleware(AddCORSHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)
logger.info(f"CORS configured for origins: {_origins}")

# Explicit OPTIONS handler for CORS preflight (safety net)
@app.options("/{full_path:path}")
async def options_handler(request: Request):
    """Handle CORS preflight so browser allows subsequent GET/POST from frontend."""
    from fastapi.responses import Response
    origin = request.headers.get("origin") or ""
    headers = dict(_cors_headers(origin))
    return Response(status_code=200, headers=headers)


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(cart.router, prefix="/cart", tags=["cart"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(messaging.router, prefix="/messaging", tags=["messaging"])
app.include_router(negotiation.router, prefix="/negotiations", tags=["negotiations"])
app.include_router(policies.router, prefix="/policies", tags=["policies"])
app.include_router(dashboards.router, prefix="/dashboard", tags=["dashboards"])
app.include_router(uploads.router, prefix="/api", tags=["uploads"])
app.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
app.include_router(complaints.router, prefix="/complaints", tags=["complaints"])
app.include_router(news.router, prefix="/news", tags=["news"])
app.include_router(market_prices.router, prefix="/api", tags=["market-prices"])


@app.get("/health")
def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "ok",
            "database": "disconnected",
            "error": str(e)
        }


# Wrap app so OPTIONS preflight gets CORS headers first (must be after all routes/middleware)
def _cors_preflight_asgi(asgi_app):
    async def wrapped(scope, receive, send):
        if scope["type"] != "http":
            await asgi_app(scope, receive, send)
            return
        if scope["method"] == "OPTIONS":
            origin = next((v for k, v in scope.get("headers", []) if k == b"origin"), b"").decode() or ""
            cors = _cors_headers(origin)
            headers = [[k.encode(), v.encode()] for k, v in cors.items()]
            await send({"type": "http.response.start", "status": 200, "headers": headers})
            await send({"type": "http.response.body", "body": b""})
            return
        await asgi_app(scope, receive, send)
    return wrapped


app = _cors_preflight_asgi(app)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


