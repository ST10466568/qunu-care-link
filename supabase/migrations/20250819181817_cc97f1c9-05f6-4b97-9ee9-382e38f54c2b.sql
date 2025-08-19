
-- Check for duplicate services by name
SELECT name, COUNT(*) as count
FROM public.services 
GROUP BY name 
HAVING COUNT(*) > 1;

-- If duplicates exist, we'll keep the earliest created one and remove the rest
-- This query will show us what duplicates exist first
SELECT id, name, created_at, is_active
FROM public.services 
WHERE name IN (
  SELECT name 
  FROM public.services 
  GROUP BY name 
  HAVING COUNT(*) > 1
)
ORDER BY name, created_at;
