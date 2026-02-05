"""
Run the order_items product_id SET NULL migration.
Allows deleting products that have been used in orders (order lines keep quantity/price).
"""
import psycopg
import sys

DB_NAME = "kissanconnect"
DB_USER = "postgres"
DB_PASSWORD = "admin1969"
DB_HOST = "localhost"
DB_PORT = "5432"

def run_migration():
    try:
        print(f"Connecting to database '{DB_NAME}'...")
        conn = psycopg.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD,
            host=DB_HOST, port=DB_PORT
        )
        conn.autocommit = True
        cursor = conn.cursor()
        print("Executing migration...")
        cursor.execute("ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey")
        cursor.execute("ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL")
        cursor.execute("""
            ALTER TABLE order_items
            ADD CONSTRAINT order_items_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        """)
        cursor.execute("""
            SELECT is_nullable FROM information_schema.columns
            WHERE table_name = 'order_items' AND column_name = 'product_id'
        """)
        row = cursor.fetchone()
        print("\n[SUCCESS] Migration completed.")
        print(f"order_items.product_id nullable: {row[0] if row else 'YES'}")
        cursor.close()
        conn.close()
        return True
    except psycopg.Error as e:
        print(f"\n[ERROR] Database error: {e}")
        return False
    except Exception as e:
        print(f"\n[ERROR] {e}")
        return False

if __name__ == "__main__":
    print("Order items product_id -> ON DELETE SET NULL")
    success = run_migration()
    sys.exit(0 if success else 1)
