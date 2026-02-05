#!/usr/bin/env python3
"""
Migration script to add is_active and is_banned columns to users table.
This uses psycopg2 directly to connect to the database.
"""

import psycopg2
from psycopg2 import sql
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection parameters
DB_HOST = "localhost"
DB_NAME = "kissanconnect"
DB_USER = "postgres"
DB_PASSWORD = "admin1969"
DB_PORT = 5432

def add_admin_status_columns():
    """Add is_active and is_banned columns to users table"""
    try:
        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cursor = conn.cursor()
        logger.info("✓ Connected to database")

        # Check if columns exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' 
            AND column_name IN ('is_active', 'is_banned')
        """)
        existing_cols = {row[0] for row in cursor.fetchall()}

        # Add missing columns
        if 'is_active' not in existing_cols:
            logger.info("Adding 'is_active' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL")
            logger.info("✓ Added 'is_active' column")
        else:
            logger.info("✓ 'is_active' column already exists")

        if 'is_banned' not in existing_cols:
            logger.info("Adding 'is_banned' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT false NOT NULL")
            logger.info("✓ Added 'is_banned' column")
        else:
            logger.info("✓ 'is_banned' column already exists")

        conn.commit()
        logger.info("✓ Migration completed successfully!")

        cursor.close()
        conn.close()

    except psycopg2.OperationalError as e:
        logger.error(f"✗ Database connection failed: {e}")
        logger.error("Make sure PostgreSQL is running and credentials are correct")
        raise
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        raise

if __name__ == "__main__":
    add_admin_status_columns()
