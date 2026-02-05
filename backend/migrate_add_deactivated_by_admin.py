#!/usr/bin/env python3
"""
Migration: add deactivated_by_admin to users table.
When True, farmer cannot log in or self-reactivate (super inactive).
"""

import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    try:
        import psycopg2
    except ImportError:
        logger.error("psycopg2 required. Install with: pip install psycopg2-binary")
        return
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_NAME = os.environ.get("DB_NAME", "kissanconnect")
    DB_USER = os.environ.get("DB_USER", "postgres")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "admin1969")
    DB_PORT = int(os.environ.get("DB_PORT", "5432"))
    try:
        conn = psycopg2.connect(
            host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASSWORD, port=DB_PORT
        )
        cursor = conn.cursor()
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'deactivated_by_admin'
        """)
        if cursor.fetchone():
            logger.info("deactivated_by_admin column already exists")
        else:
            cursor.execute(
                "ALTER TABLE users ADD COLUMN deactivated_by_admin BOOLEAN DEFAULT false NOT NULL"
            )
            conn.commit()
            logger.info("Added deactivated_by_admin column")
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error("Migration failed: %s", e)
        raise

if __name__ == "__main__":
    run_migration()
