-- Add address column to geofence_locations table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'geofence_locations' AND column_name = 'address'
  ) THEN
    ALTER TABLE geofence_locations ADD COLUMN address TEXT;
  END IF;
END $$;
