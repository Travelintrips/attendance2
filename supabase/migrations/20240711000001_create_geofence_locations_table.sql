-- Create geofence_locations table if it doesn't exist
CREATE TABLE IF NOT EXISTS geofence_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add geofence_id column to employees table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'geofence_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN geofence_id UUID REFERENCES geofence_locations(id);
  END IF;
END $$;

-- Enable realtime for geofence_locations table
ALTER PUBLICATION supabase_realtime ADD TABLE geofence_locations;
