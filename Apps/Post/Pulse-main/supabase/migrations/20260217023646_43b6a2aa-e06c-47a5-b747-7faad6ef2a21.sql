
-- DMS field mappings table
CREATE TABLE public.dms_field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dms_source TEXT NOT NULL DEFAULT 'default',
  dms_field TEXT NOT NULL,
  app_field TEXT NOT NULL,
  transform TEXT, -- optional transform like 'uppercase', 'parseInt', etc.
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(dms_source, dms_field)
);

ALTER TABLE public.dms_field_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on dms_field_mappings" ON public.dms_field_mappings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on dms_field_mappings" ON public.dms_field_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on dms_field_mappings" ON public.dms_field_mappings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on dms_field_mappings" ON public.dms_field_mappings FOR DELETE USING (true);

-- Ingestion log table
CREATE TABLE public.ingestion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  feed_type TEXT NOT NULL DEFAULT 'XML',
  vehicles_scanned INTEGER NOT NULL DEFAULT 0,
  new_vehicles INTEGER NOT NULL DEFAULT 0,
  marked_sold INTEGER NOT NULL DEFAULT 0,
  images_fetched INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ingestion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on ingestion_logs" ON public.ingestion_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ingestion_logs" ON public.ingestion_logs FOR INSERT WITH CHECK (true);

-- Seed default field mappings
INSERT INTO public.dms_field_mappings (dms_source, dms_field, app_field) VALUES
  ('default', 'Stock_Number', 'vin'),
  ('default', 'VIN', 'vin'),
  ('default', 'Retail_Price', 'price'),
  ('default', 'MSRP', 'price'),
  ('default', 'Vehicle_Make', 'make'),
  ('default', 'Vehicle_Model', 'model'),
  ('default', 'Model_Year', 'year'),
  ('default', 'Trim_Level', 'trim'),
  ('default', 'Odometer', 'mileage'),
  ('default', 'Ext_Color', 'exterior_color'),
  ('default', 'Photo_URLs', 'images'),
  ('default', 'Days_In_Stock', 'days_on_lot');
