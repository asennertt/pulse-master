
-- Add dealership_id to invitation_links so invites link to a specific dealership
ALTER TABLE public.invitation_links ADD COLUMN dealership_id uuid REFERENCES public.dealerships(id);

-- Allow dealer_admin users to create and view their own invitations
CREATE POLICY "Dealer admins can create invitations"
ON public.invitation_links
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'dealer_admin'::app_role)
  AND created_by = auth.uid()
);

CREATE POLICY "Dealer admins can view their invitations"
ON public.invitation_links
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);
