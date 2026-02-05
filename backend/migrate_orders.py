"""
Database Migration Script for Orders Table
Run this script to add the new columns to the orders table.
"""
import sys
from sqlalchemy import text
from db.session import engine

def migrate_orders_table():
    """Add new columns to orders table if they don't exist."""
    try:
        with engine.connect() as conn:
            # Check database type
            db_type = engine.url.get_backend_name()
            print(f"Database type: {db_type}")
            
            if db_type == 'sqlite':
                # SQLite migration
                print("Applying SQLite migration...")
                
                # Check if columns exist
                result = conn.execute(text("PRAGMA table_info(orders)"))
                existing_columns = [row[1] for row in result.fetchall()]
                
                if 'shipping_address' not in existing_columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN shipping_address TEXT"))
                    conn.commit()
                    print("✓ Added shipping_address column")
                else:
                    print("✓ shipping_address column already exists")
                
                if 'payment_method' not in existing_columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash'"))
                    conn.commit()
                    print("✓ Added payment_method column")
                else:
                    print("✓ payment_method column already exists")
                
                if 'buyer_email' not in existing_columns:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255)"))
                    conn.commit()
                    print("✓ Added buyer_email column")
                else:
                    print("✓ buyer_email column already exists")
                    
            elif db_type == 'postgresql':
                # PostgreSQL migration
                print("Applying PostgreSQL migration...")
                
                # Check and add columns
                conn.execute(text("""
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='orders' AND column_name='shipping_address'
                        ) THEN
                            ALTER TABLE orders ADD COLUMN shipping_address TEXT;
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='orders' AND column_name='payment_method'
                        ) THEN
                            ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';
                        END IF;
                        
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name='orders' AND column_name='buyer_email'
                        ) THEN
                            ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);
                        END IF;
                    END $$;
                """))
                conn.commit()
                print("✓ Migration completed for PostgreSQL")
                
            elif db_type == 'mysql':
                # MySQL migration
                print("Applying MySQL migration...")
                
                conn.execute(text("""
                    ALTER TABLE orders 
                    ADD COLUMN IF NOT EXISTS shipping_address TEXT NULL,
                    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash',
                    ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255) NULL;
                """))
                conn.commit()
                print("✓ Migration completed for MySQL")
                
            else:
                print(f"⚠️  Unsupported database type: {db_type}")
                print("Please run the SQL commands manually:")
                print("  ALTER TABLE orders ADD COLUMN shipping_address TEXT;")
                print("  ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';")
                print("  ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);")
                return False
            
            print("\n✅ Migration completed successfully!")
            return True
            
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("\nYou may need to run the SQL commands manually:")
        print("  ALTER TABLE orders ADD COLUMN shipping_address TEXT;")
        print("  ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash';")
        print("  ALTER TABLE orders ADD COLUMN buyer_email VARCHAR(255);")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Orders Table Migration Script")
    print("=" * 60)
    print()
    
    success = migrate_orders_table()
    
    if success:
        print("\n🎉 Database migration successful!")
        print("You can now restart your backend server.")
    else:
        print("\n⚠️  Migration had issues. Please check the error messages above.")
        sys.exit(1)
