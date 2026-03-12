-- =============================================================================
-- Migration: Staff Dashboard support
-- Date: 2026-03-12
-- 
-- Adds RLS policy so dealer_admin can see all profiles in their dealership.
-- This powers the Staff tab showing team members.
-- =============================================================================

-- Dealer admins can read all profiles in their dealership
CREATE POLICY "Dealer admin reads dealership profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    dealership_id = get_my_dealership_id()
    AND has_role(auth.uid(), 'dealer_admin')
  );
