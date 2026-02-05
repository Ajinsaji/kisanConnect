"""
Migration script to add file attachment fields to messages and admin_messages tables.
Run this script once to update existing database tables.
"""
import sys
from sqlalchemy import text
from db.session import engine

def migrate():
    """Add file attachment columns to messages and admin_messages tables."""
    try:
        with engine.connect() as conn:
            # Start a transaction
            trans = conn.begin()
            
            try:
                # Add columns to messages table
                print("Adding file columns to messages table...")
                conn.execute(text("""
                    ALTER TABLE messages 
                    ADD COLUMN IF NOT EXISTS file_url TEXT,
                    ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
                """))
                
                # Make message_text nullable in messages table
                print("Making message_text nullable in messages table...")
                conn.execute(text("""
                    ALTER TABLE messages 
                    ALTER COLUMN message_text DROP NOT NULL;
                """))
                
                # Add columns to admin_messages table
                print("Adding file columns to admin_messages table...")
                conn.execute(text("""
                    ALTER TABLE admin_messages 
                    ADD COLUMN IF NOT EXISTS file_url TEXT,
                    ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
                    ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
                """))
                
                # Make message_text nullable in admin_messages table
                print("Making message_text nullable in admin_messages table...")
                conn.execute(text("""
                    ALTER TABLE admin_messages 
                    ALTER COLUMN message_text DROP NOT NULL;
                """))
                
                # Commit the transaction
                trans.commit()
                print("[SUCCESS] Migration completed successfully!")
                
            except Exception as e:
                trans.rollback()
                print(f"[ERROR] Migration failed: {e}")
                raise
                
    except Exception as e:
        print(f"[ERROR] Database connection error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("Starting database migration for file attachment fields...")
    migrate()
    print("Migration script completed.")
