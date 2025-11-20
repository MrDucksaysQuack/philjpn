-- Fix function search_path to prevent security issues
-- This sets a fixed search_path for functions to prevent search_path injection attacks
-- Run this SQL in Supabase SQL Editor

-- Fix generate_slug function
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  RETURN lower(
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(input_text, '[^\w\s-]', '', 'g'),
          '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
      )
    )
  );
END;
$$;

-- Fix auto_generate_category_slug function
CREATE OR REPLACE FUNCTION auto_generate_category_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  -- Only generate slug if it's not provided or is empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := public.generate_slug(NEW.name);
    final_slug := base_slug;
    counter := 1;
    
    -- Check for uniqueness (excluding current record on update)
    WHILE EXISTS (
      SELECT 1 FROM public.categories 
      WHERE slug = final_slug 
      AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$;

