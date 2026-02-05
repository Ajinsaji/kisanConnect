-- Allow deleting products that have been used in orders.
-- Order items keep quantity/price; product_id becomes NULL (order history preserved).
-- Run in PostgreSQL.

-- 1. Drop existing foreign key (default name in PostgreSQL)
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- 2. Allow NULL so ON DELETE SET NULL can work
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;

-- 3. Re-add foreign key with ON DELETE SET NULL
ALTER TABLE order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
