#!/usr/bin/env python3
"""
Migration script to add city, state, and postal_code columns to users table.
Uses psycopg (v3) to connect to the database.
"""

import psycopg
from psycopg import sql
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection parameters
DB_HOST = "localhost"
DB_NAME = "kissanconnect"
DB_USER = "postgres"
DB_PASSWORD = "admin1969"
DB_PORT = 5432

def add_farmer_fields():
    """Add city, state, and postal_code columns to users table"""
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
        logger.info(f"✓ Connected to database '{DB_NAME}'")
        
        # Check if columns exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' 
            AND column_name IN ('city', 'state', 'postal_code')
        """)
        existing_cols = {row[0] for row in cursor.fetchall()}
        
        # Add missing columns
        if 'city' not in existing_cols:
            logger.info("Adding 'city' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN city VARCHAR(100)")
            logger.info("✓ Added 'city' column")
        else:
            logger.info("✓ 'city' column already exists")
        
        if 'state' not in existing_cols:
            logger.info("Adding 'state' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN state VARCHAR(100)")
            logger.info("✓ Added 'state' column")
        else:
            logger.info("✓ 'state' column already exists")
        
        if 'postal_code' not in existing_cols:
            logger.info("Adding 'postal_code' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN postal_code VARCHAR(20)")
            logger.info("✓ Added 'postal_code' column")
        else:
            logger.info("✓ 'postal_code' column already exists")
        
        conn.commit()
        logger.info("✓ Migration completed successfully!")
        
        cursor.close()
        conn.close()
            
    except psycopg.OperationalError as e:
        logger.error(f"✗ Database connection failed: {e}")
        logger.error("Make sure PostgreSQL is running and credentials are correct")
        raise
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        raise

if __name__ == "__main__":
    add_farmer_fields()
