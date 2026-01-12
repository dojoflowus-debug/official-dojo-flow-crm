-- Insert test location for organization 120001
INSERT INTO locations (name, address, city, state, zipCode, organizationId, isActive, kioskEnabled, createdAt, updatedAt)
VALUES ('Test Dojo', '123 Main St', 'Springfield', 'IL', '62701', 120001, 1, 1, NOW(), NOW());
