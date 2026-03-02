-- =============================================================================
-- Function: get_user_context
-- Schema:   public
-- Purpose:  Returns the authenticated user's profile and role flags in a single
--           RPC call, used by the client-side AuthContext on mount.
--
-- Usage (JS):
--   const { data, error } = await supabase.rpc("get_user_context", {
--     _user_id: userId
--   });
--   // data => { profile: {...}, is_super_admin: bool, is_dealer_admin: bool }
--
-- Notes:
--   - SECURITY DEFINER bypasses RLS so the function can read profiles and
--     user_roles regardless of the caller's row-level policies.
--   - search_path is pinned to 'public' to prevent search-path injection.
--   - Returns NULL for profile (and false for role flags) when the user_id
--     does not exist, letting the caller decide how to handle missing records.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_context(
    _user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile       JSONB;
    v_is_super_admin BOOLEAN := FALSE;
    v_is_dealer_admin BOOLEAN := FALSE;
BEGIN
    -- 1. Fetch the profile row for this user.
    SELECT
        jsonb_build_object(
            'id',                  p.id,
            'user_id',             p.user_id,
            'dealership_id',       p.dealership_id,
            'full_name',           p.full_name,
            'avatar_url',          p.avatar_url,
            'onboarding_step',     p.onboarding_step,
            'onboarding_complete', p.onboarding_complete,
            'dealership_name',     p.dealership_name,
            'phone',               p.phone,
            'created_at',          p.created_at,
            'updated_at',          p.updated_at
        )
    INTO v_profile
    FROM public.profiles p
    WHERE p.user_id = _user_id
    LIMIT 1;

    -- 2. Check role assignments.
    SELECT
        BOOL_OR(r.role = 'super_admin'),
        BOOL_OR(r.role = 'dealer_admin')
    INTO
        v_is_super_admin,
        v_is_dealer_admin
    FROM public.user_roles r
    WHERE r.user_id = _user_id;

    v_is_super_admin  := COALESCE(v_is_super_admin,  FALSE);
    v_is_dealer_admin := COALESCE(v_is_dealer_admin, FALSE);

    -- 3. Return the composite result.
    RETURN jsonb_build_object(
        'profile',         v_profile,
        'is_super_admin',  v_is_super_admin,
        'is_dealer_admin', v_is_dealer_admin
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error',   SQLERRM,
            'detail',  SQLSTATE
        );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_context(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_context(UUID) IS
    'Returns profile row and role flags (is_super_admin, is_dealer_admin) '
    'for the given user_id. Used by client AuthContext on session restore.';
