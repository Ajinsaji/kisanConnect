"""Run migration: products.min_negotiable_price, negotiations, negotiation_messages."""
import psycopg
import sys

DB_NAME = "kissanconnect"
DB_USER = "postgres"
DB_PASSWORD = "admin1969"
DB_HOST = "localhost"
DB_PORT = "5432"

def run():
    try:
        conn = psycopg.connect(dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS min_negotiable_price NUMERIC(10, 2) NULL")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS negotiations (
                id BIGSERIAL PRIMARY KEY,
                buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                farmer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                UNIQUE(buyer_id, product_id)
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS negotiation_messages (
                id BIGSERIAL PRIMARY KEY,
                negotiation_id BIGINT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
                sender_type VARCHAR(20) NOT NULL,
                message_text TEXT NOT NULL,
                offer_amount NUMERIC(10, 2) NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_negotiation_messages_negotiation_id ON negotiation_messages(negotiation_id)")
        cur.execute("CREATE INDEX IF NOT EXISTS idx_negotiations_buyer_product ON negotiations(buyer_id, product_id)")
        cur.close()
        conn.close()
        print("[SUCCESS] Negotiation migration completed.")
        return True
    except Exception as e:
        print(f"[ERROR] {e}")
        return False

if __name__ == "__main__":
    sys.exit(0 if run() else 1)
