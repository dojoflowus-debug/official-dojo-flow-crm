ALTER TABLE merchandise_items 
ADD COLUMN stockQuantity INT NULL COMMENT 'Current stock quantity (null = unlimited/not tracked)',
ADD COLUMN lowStockThreshold INT NULL COMMENT 'Low stock alert threshold (null = no alerts)';
