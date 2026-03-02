-- =============================================================================
-- Function: accept_invite
-- Schema:   public
-- Purpose:  Accepts a dealership invite token — links the calling user to the
--           dealership and marks the token as used.
--
-- Usage (JS):
--   const { data, error } = await supabase.rpc("accept_invite", {
--     _token: "abc-123-def"
--   });
--   // data => { dealership_name: "Lotly Motors" }  or  { error: "..." }
-- =============================================================================

CREATE OR REPLACE FUNCTION public.accept_invite(
    _token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invite       RECORD;
    v_caller_id    UUID;
    v_dealership   RECORD;
BEGIN
    -- Get the authenticated caller
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    -- Look up the invite
    SELECT *
    INTO v_invite
    FROM public.invitation_links
    WHERE token = _token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Invite token not found');
    END IF;

    -- Check if already used
    IF v_invite.used_at IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'This invite has already been used');
    END IF;

    -- Check expiry
    IF v_invite.expires_at < NOW() THEN
        RETURN jsonb_build_object('error', 'This invite has expired');
    END IF;

    -- Look up the dealership
    SELECT id, name
    INTO v_dealership
    FROM public.dealerships
    WHERE id = v_invite.dealership_id
    LIMIT 1;

    -- Link the user to the dealership
    UPDATE public.profiles
    SET
        dealership_id   = v_invite.dealership_id,
        dealership_name = COALESCE(v_dealership.name, v_invite.dealership_name),
        updated_at      = NOW()
    WHERE user_id = v_caller_id;

    -- Grant dealer_user role if not already present
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_caller_id, 'dealer_user')
    ON CONFLICT DO NOTHING;

    -- Mark the invite as used
    UPDATE public.invitation_links
    SET
        used_by = v_caller_id,
        used_at = NOW()
    WHERE token = _token;

    RETURN jsonb_build_object(
        'dealership_name', COALESCE(v_dealership.name, v_invite.dealership_name)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error',  SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invite(TEXT) TO authenticated;

COMMENT ON FUNCTION public.accept_invite(TEXT) IS
    'Accepts a dealership invitation token, linking the caller to the '
    'dealership and marking the token as used.';
