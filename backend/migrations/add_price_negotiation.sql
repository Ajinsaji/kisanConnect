-- Price negotiation (counter-offer) feature
-- Run in PostgreSQL

-- Add message_type and meta to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) NOT NULL DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS meta TEXT;

-- Counter offers: buyer's offer, farmer accepts/rejects
CREATE TABLE IF NOT EXISTS counter_offers (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    price_per_unit NUMERIC(10, 2) NOT NULL,
    original_price_per_unit NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Personal product offers: special price for a buyer (after farmer accepts)
CREATE TABLE IF NOT EXISTS personal_product_offers (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_per_unit NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(buyer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_counter_offers_message_id ON counter_offers(message_id);
CREATE INDEX IF NOT EXISTS idx_counter_offers_status ON counter_offers(status);
CREATE INDEX IF NOT EXISTS idx_personal_offers_buyer_product ON personal_product_offers(buyer_id, product_id);
