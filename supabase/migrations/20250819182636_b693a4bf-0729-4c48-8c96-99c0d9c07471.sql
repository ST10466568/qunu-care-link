-- Remove duplicate services, keeping the oldest one for each service name
-- This will clean up the duplicate services in the database

WITH duplicates AS (
  SELECT id, name, 
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
  FROM public.services
  WHERE is_active = true
),
services_to_delete AS (
  SELECT id FROM duplicates WHERE rn > 1
)
DELETE FROM public.services 
WHERE id IN (SELECT id FROM services_to_delete);

-- Verify the cleanup worked
SELECT name, COUNT(*) as count
FROM public.services 
WHERE is_active = true
GROUP BY name 
HAVING COUNT(*) > 1;