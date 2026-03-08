-- =============================================================================
-- Function: check_subscription
-- Schema:   public
-- Purpose:  Stub for Stripe subscription status. Returns a static "not
--           subscribed" payload so the app can be wired up and tested
--           before Stripe is integrated.
--
-- TODO: Replace this stub with real Stripe logic once billing is integrated.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_subscription(
    _user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'subscribed',        FALSE,
        'product_id',        NULL::TEXT,
        'subscription_end',  NULL::TIMESTAMPTZ
    );
$$;

REVOKE ALL ON FUNCTION public.check_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_subscription(UUID) TO authenticated;

COMMENT ON FUNCTION public.check_subscription(UUID) IS
    'Stub: always returns subscribed=false. Replace with real Stripe logic '
    'once billing is integrated.';
