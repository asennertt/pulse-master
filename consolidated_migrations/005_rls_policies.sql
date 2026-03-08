-- =============================================================================
-- 005_rls_policies.sql
-- ALL Row Level Security policies, organized by table.
--
-- DESIGN PRINCIPLES:
--   1. Every multi-tenant table filters by dealership_id = get_my_dealership_id()
--   2. super_admin bypasses tenant filter (they see all dealerships)
--   3. Roles are TEXT strings (no app_role enum casts)
--   4. Service-role (edge functions, cron) bypasses RLS automatically
-- =============================================================================


-- ================================================
-- SHARED TABLES
-- ================================================

-- ------------------------------------------------
-- profiles
-- ------------------------------------------------
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin reads all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin updates any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));


-- ------------------------------------------------
-- user_roles
-- ------------------------------------------------
CREATE POLICY "Users read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin reads all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role manages roles"
  ON public.user_roles FOR ALL
  USING (auth.role() = 'service_role');


-- ------------------------------------------------
-- dealerships
-- ------------------------------------------------
CREATE POLICY "Tenant reads own dealership"
  ON public.dealerships FOR SELECT
  TO authenticated
  USING (
    id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts dealership"
  ON public.dealerships FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- setup_dealership RPC handles creation via SECURITY DEFINER

CREATE POLICY "Tenant updates own dealership"
  ON public.dealerships FOR UPDATE
  TO authenticated
  USING (
    id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Super admin deletes dealership"
  ON public.dealerships FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));


-- ------------------------------------------------
-- invitation_links
-- ------------------------------------------------
CREATE POLICY "Admins read own invitations"
  ON public.invitation_links FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins create invitations"
  ON public.invitation_links FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'dealer_admin')
    AND created_by = auth.uid()
  );

CREATE POLICY "Anon can read invites for token lookup"
  ON public.invitation_links FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Super admin reads all invitations"
  ON public.invitation_links FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));


-- ------------------------------------------------
-- activation_queue
-- ------------------------------------------------
CREATE POLICY "Tenant reads own activation requests"
  ON public.activation_queue FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant creates activation request"
  ON public.activation_queue FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Super admin manages activation queue"
  ON public.activation_queue FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));


-- ------------------------------------------------
-- usage_tracking
-- ------------------------------------------------
CREATE POLICY "Tenant reads own usage"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own usage"
  ON public.usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Service role inserts usage"
  ON public.usage_tracking FOR INSERT
  WITH CHECK (true);  -- for edge functions / cron jobs


-- ================================================
-- POST-SPECIFIC TABLES
-- ================================================

-- ------------------------------------------------
-- vehicles
-- ------------------------------------------------
CREATE POLICY "Tenant reads own vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant updates own vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant deletes own vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

-- Allow service role / anon for webhook/cron ingestion
CREATE POLICY "Anon insert vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon update vehicles"
  ON public.vehicles FOR UPDATE
  USING (true);


-- ------------------------------------------------
-- staff
-- ------------------------------------------------
CREATE POLICY "Tenant reads own staff"
  ON public.staff FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own staff"
  ON public.staff FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant updates own staff"
  ON public.staff FOR UPDATE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );


-- ------------------------------------------------
-- leads
-- ------------------------------------------------
CREATE POLICY "Tenant reads own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant updates own leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant deletes own leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

-- Allow webhook inserts (anon)
CREATE POLICY "Anon insert leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);


-- ------------------------------------------------
-- vehicle_performance
-- ------------------------------------------------
CREATE POLICY "Tenant reads own performance"
  ON public.vehicle_performance FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own performance"
  ON public.vehicle_performance FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant updates own performance"
  ON public.vehicle_performance FOR UPDATE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant deletes own performance"
  ON public.vehicle_performance FOR DELETE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

-- Anon for cron/webhook
CREATE POLICY "Anon insert performance"
  ON public.vehicle_performance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon update performance"
  ON public.vehicle_performance FOR UPDATE
  USING (true);


-- ------------------------------------------------
-- sold_alerts
-- ------------------------------------------------
CREATE POLICY "Tenant reads own sold alerts"
  ON public.sold_alerts FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own sold alerts"
  ON public.sold_alerts FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant updates own sold alerts"
  ON public.sold_alerts FOR UPDATE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant deletes own sold alerts"
  ON public.sold_alerts FOR DELETE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

-- Anon for cron
CREATE POLICY "Anon insert sold alerts"
  ON public.sold_alerts FOR INSERT
  WITH CHECK (true);


-- ------------------------------------------------
-- dealer_settings
-- ------------------------------------------------
CREATE POLICY "Tenant reads own settings"
  ON public.dealer_settings FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own settings"
  ON public.dealer_settings FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant updates own settings"
  ON public.dealer_settings FOR UPDATE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );


-- ------------------------------------------------
-- dms_field_mappings
-- ------------------------------------------------
CREATE POLICY "Tenant reads own field mappings"
  ON public.dms_field_mappings FOR SELECT
  TO authenticated
  USING (
    dealership_id IS NULL  -- global defaults readable by all
    OR dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own field mappings"
  ON public.dms_field_mappings FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant updates own field mappings"
  ON public.dms_field_mappings FOR UPDATE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant deletes own field mappings"
  ON public.dms_field_mappings FOR DELETE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );


-- ------------------------------------------------
-- ingestion_logs
-- ------------------------------------------------
CREATE POLICY "Tenant reads own ingestion logs"
  ON public.ingestion_logs FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own ingestion logs"
  ON public.ingestion_logs FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant deletes own ingestion logs"
  ON public.ingestion_logs FOR DELETE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

-- Anon for cron
CREATE POLICY "Anon insert ingestion logs"
  ON public.ingestion_logs FOR INSERT
  WITH CHECK (true);


-- ------------------------------------------------
-- price_history
-- ------------------------------------------------
CREATE POLICY "Tenant reads own price history"
  ON public.price_history FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Tenant inserts own price history"
  ON public.price_history FOR INSERT
  TO authenticated
  WITH CHECK (dealership_id = get_my_dealership_id());

CREATE POLICY "Tenant deletes own price history"
  ON public.price_history FOR DELETE
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    OR has_role(auth.uid(), 'super_admin')
  );

-- Anon for webhook/cron
CREATE POLICY "Anon insert price history"
  ON public.price_history FOR INSERT
  WITH CHECK (true);


-- ------------------------------------------------
-- user_vehicle_postings
-- ------------------------------------------------
CREATE POLICY "Users read own postings"
  ON public.user_vehicle_postings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users insert own postings"
  ON public.user_vehicle_postings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own postings"
  ON public.user_vehicle_postings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users delete own postings"
  ON public.user_vehicle_postings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admin reads all postings"
  ON public.user_vehicle_postings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Dealer admin reads team postings"
  ON public.user_vehicle_postings FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'dealer_admin')
    AND dealer_id = get_my_dealership_id()
  );
