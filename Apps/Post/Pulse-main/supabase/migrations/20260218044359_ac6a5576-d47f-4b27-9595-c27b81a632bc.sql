
-- Add DELETE RLS policies for all tables that need cleansing

-- ingestion_logs DELETE
CREATE POLICY "Tenant delete ingestion_logs"
ON public.ingestion_logs
FOR DELETE
USING ((dealer_id = get_my_dealership_id()) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Allow delete where dealer_id IS NULL (legacy data) for super_admin or when it matches
CREATE POLICY "Tenant delete ingestion_logs null dealer"
ON public.ingestion_logs
FOR DELETE
USING (dealer_id IS NULL AND has_role(auth.uid(), 'super_admin'::app_role));

-- sold_alerts DELETE
CREATE POLICY "Tenant delete sold_alerts"
ON public.sold_alerts
FOR DELETE
USING ((dealer_id = get_my_dealership_id()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant delete sold_alerts null dealer"
ON public.sold_alerts
FOR DELETE
USING (dealer_id IS NULL AND has_role(auth.uid(), 'super_admin'::app_role));

-- price_history DELETE
CREATE POLICY "Tenant delete price_history"
ON public.price_history
FOR DELETE
USING ((dealer_id = get_my_dealership_id()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant delete price_history null dealer"
ON public.price_history
FOR DELETE
USING (dealer_id IS NULL AND has_role(auth.uid(), 'super_admin'::app_role));

-- vehicle_performance DELETE
CREATE POLICY "Tenant delete vehicle_performance"
ON public.vehicle_performance
FOR DELETE
USING ((dealer_id = get_my_dealership_id()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant delete vehicle_performance null dealer"
ON public.vehicle_performance
FOR DELETE
USING (dealer_id IS NULL AND has_role(auth.uid(), 'super_admin'::app_role));

-- leads DELETE
CREATE POLICY "Tenant delete leads"
ON public.leads
FOR DELETE
USING ((dealer_id = get_my_dealership_id()) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Tenant delete leads null dealer"
ON public.leads
FOR DELETE
USING (dealer_id IS NULL AND has_role(auth.uid(), 'super_admin'::app_role));
