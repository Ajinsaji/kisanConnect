"""
Run the price negotiation migration.
"""
import psycopg
import sys
from pathlib import Path

# Database connection details from config.py
DB_NAME = "kissanconnect"
DB_USER = "postgres"
DB_PASSWORD = "admin1969"
DB_HOST = "localhost"
DB_PORT = "5432"

def run_migration():
    """Execute the price negotiation migration SQL script."""
    migration_file = Path(__file__).parent / "migrations" / "add_price_negotiation.sql"
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    try:
        # Connect to PostgreSQL
        print(f"Connecting to database '{DB_NAME}'...")
        conn = psycopg.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Read and execute migration
        print(f"Reading migration file: {migration_file}")
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql = f.read()
        
        print("Executing migration...")
        cursor.execute(sql)
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('counter_offers', 'personal_product_offers')
            ORDER BY table_name
        """)
        tables = cursor.fetchall()
        
        print("\n[SUCCESS] Migration completed successfully!")
        print(f"Created tables: {[t[0] for t in tables]}")
        
        # Verify columns were added to messages
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'messages' 
            AND column_name IN ('message_type', 'meta')
            ORDER BY column_name
        """)
        columns = cursor.fetchall()
        print(f"Added columns to 'messages': {[c[0] for c in columns]}")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg.Error as e:
        print(f"\n[ERROR] Database error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print(f"2. Verify database '{DB_NAME}' exists")
        print(f"3. Check credentials: user='{DB_USER}', password='***'")
        return False
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Price Negotiation Feature - Database Migration")
    print("=" * 60)
    print()
    
    success = run_migration()
    
    print()
    print("=" * 60)
    if success:
        print("[SUCCESS] MIGRATION SUCCESSFUL")
        print()
        print("Next steps:")
        print("1. Restart your backend server (Ctrl+C and restart)")
        print("2. The chat page should now work without 500 errors")
        print("3. Test the counter-offer feature in the chat")
    else:
        print("[ERROR] MIGRATION FAILED")
        print()
        print("Please fix the errors above and try again")
    print("=" * 60)
    
    sys.exit(0 if success else 1)
