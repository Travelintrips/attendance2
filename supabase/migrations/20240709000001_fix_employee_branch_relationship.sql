-- Add foreign key constraint between employees and branches if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_branch_id_fkey' AND table_name = 'employees'
  ) THEN
    ALTER TABLE employees ADD CONSTRAINT employees_branch_id_fkey 
    FOREIGN KEY (branch_id) REFERENCES branches(id);
  END IF;
END $$;

-- Update the realtime publication to include employees table
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
