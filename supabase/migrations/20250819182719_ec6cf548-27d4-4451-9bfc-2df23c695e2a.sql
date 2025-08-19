-- First, let's update appointments to use the oldest service for each duplicate name
-- then we can safely delete the duplicate services

-- Update appointments that reference duplicate "Blood Pressure Check" services
UPDATE public.appointments 
SET service_id = 'f001b9a3-f9f1-4b8e-9867-dddd89b6890d'  -- Keep the first one
WHERE service_id = 'a5436814-30a7-459e-8b46-a2af6db42356';

-- Update appointments that reference duplicate "General Consultation" services  
UPDATE public.appointments 
SET service_id = '970cf630-4285-48e1-9c7a-7f829eda44a8'  -- Keep the first one
WHERE service_id IN ('25adec29-c9a5-4e9d-bbaa-e8bad75ac320', '4fa95587-b82c-4dfa-bda7-2fe2f48ba30a');

-- Update appointments that reference duplicate "Lab Results Review" services
UPDATE public.appointments 
SET service_id = '791b6222-8257-48e3-a12e-b4881f93e8aa'  -- Keep the first one  
WHERE service_id = '1d3056b9-030b-4e50-9f42-9784b54dcbb2';

-- Update appointments that reference duplicate "Physical Therapy Session" services
UPDATE public.appointments 
SET service_id = '48275967-2117-4e33-bf8d-4c061fe72676'  -- Keep the first one
WHERE service_id = '4dc7dee1-06b6-4016-9546-d5ee6a922dea';

-- Update appointments that reference duplicate "Vaccination" services  
UPDATE public.appointments 
SET service_id = '6dc2612b-d572-4d93-9c70-8d8e18ef02aa'  -- Keep the first one
WHERE service_id = '900a948d-28d7-4f72-a100-918df68fe215';

-- Now delete the duplicate services
DELETE FROM public.services WHERE id IN (
  'a5436814-30a7-459e-8b46-a2af6db42356',  -- Duplicate Blood Pressure Check
  '25adec29-c9a5-4e9d-bbaa-e8bad75ac320',  -- Duplicate General Consultation  
  '4fa95587-b82c-4dfa-bda7-2fe2f48ba30a',  -- Duplicate General Consultation
  '1d3056b9-030b-4e50-9f42-9784b54dcbb2',  -- Duplicate Lab Results Review
  '4dc7dee1-06b6-4016-9546-d5ee6a922dea',  -- Duplicate Physical Therapy Session
  '900a948d-28d7-4f72-a100-918df68fe215'   -- Duplicate Vaccination  
);