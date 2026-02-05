-- Dedicated negotiation system: min_negotiable_price on products, negotiations + messages tables.
-- Run in PostgreSQL.

ALTER TABLE products ADD COLUMN IF NOT EXISTS min_negotiable_price NUMERIC(10, 2) NULL;

CREATE TABLE IF NOT EXISTS negotiations (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    farmer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(buyer_id, product_id)
);

CREATE TABLE IF NOT EXISTS negotiation_messages (
    id BIGSERIAL PRIMARY KEY,
    negotiation_id BIGINT NOT NULL REFERENCES negotiations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    offer_amount NUMERIC(10, 2) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_messages_negotiation_id ON negotiation_messages(negotiation_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_buyer_product ON negotiations(buyer_id, product_id);
