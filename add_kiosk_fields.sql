-- Add kiosk configuration fields to locations table
ALTER TABLE locations 
ADD COLUMN kioskEnabled INT DEFAULT 0 NOT NULL,
ADD COLUMN kioskSlug VARCHAR(255),
ADD COLUMN kioskSettings TEXT;

-- Create unique index on kioskSlug
CREATE UNIQUE INDEX idx_locations_kiosk_slug ON locations(kioskSlug);
