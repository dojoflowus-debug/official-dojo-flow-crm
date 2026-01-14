-- Update existing plans with new pricing and credit allocations
UPDATE subscription_plans SET monthlyPrice = 4900, monthlyCredits = 500 WHERE slug = 'starter';
UPDATE subscription_plans SET monthlyPrice = 9900, monthlyCredits = 1500 WHERE slug = 'growth';
UPDATE subscription_plans SET monthlyPrice = 19900, monthlyCredits = 4000 WHERE slug = 'pro';

-- Rename Enterprise to Elite and update pricing
UPDATE subscription_plans 
SET 
  name = 'Elite',
  slug = 'elite',
  monthlyPrice = 49900,
  monthlyCredits = 10000,
  displayOrder = 4
WHERE slug = 'enterprise';

-- Update features for Elite plan
UPDATE subscription_plans 
SET features = JSON_ARRAY(
  'Predictive analytics & forecasting',
  'Advanced AI decision support',
  'Multi-location dashboards',
  'Role-based permissions',
  'White-label ready',
  'Priority AI + human support',
  'Custom automations',
  'Advanced reporting'
)
WHERE slug = 'elite';
