-- =============================================================================
-- 004_shared_rpc.sql
-- SHARED: Remote Procedure Calls used by multiple Pulse apps
--
-- Depends on: 002_shared_core.sql (profiles, user_roles, dealerships)
-- =============================================================================


-- ------------------------------------------------
-- RPC: get_user_context
-- Returns profile + role flags for the authenticated user.
-- Called by client AuthContext on mount.
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_context(
    _user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile         JSONB;
    v_is_super_admin  BOOLEAN := FALSE;
    v_is_dealer_admin BOOLEAN := FALSE;
BEGIN
    -- 1. Fetch the profile row
    SELECT jsonb_build_object(
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

    -- 2. Check role assignments (TEXT-based roles, no enum cast)
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

    -- 3. Return the composite result
    RETURN jsonb_build_object(
        'profile',         v_profile,
        'is_super_admin',  v_is_super_admin,
        'is_dealer_admin', v_is_dealer_admin
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error',  SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_context(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_context(UUID) IS
    'Returns profile row and role flags (is_super_admin, is_dealer_admin) '
    'for the given user_id. Used by client AuthContext on session restore.';


-- ------------------------------------------------
-- RPC: setup_dealership
-- Called during onboarding step 2 to create the dealership,
-- link the user, and create initial dealer_settings row.
-- ------------------------------------------------
CREATE OR REPLACE FUNCTION public.setup_dealership(
    _biz_name    TEXT,
    _biz_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id     UUID;
    v_user_email  TEXT;
    v_dealer_id   UUID;
    v_slug        TEXT;
BEGIN
    -- 1. Get the calling user's ID and email
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;

    -- 2. Check if user already has a dealership
    PERFORM 1 FROM public.profiles
    WHERE user_id = v_user_id AND dealership_id IS NOT NULL;
    IF FOUND THEN
        RETURN jsonb_build_object('error', 'User already has a dealership');
    END IF;

    -- 3. Generate a URL-safe slug
    v_slug := lower(regexp_replace(trim(_biz_name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(BOTH '-' FROM v_slug);
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);

    -- 4. Create dealership (status = 'active' to match CHECK constraint)
    INSERT INTO public.dealerships (name, slug, address, owner_email, status)
    VALUES (_biz_name, v_slug, _biz_address, v_user_email, 'active')
    RETURNING id INTO v_dealer_id;

    -- 5. Link profile to dealership and advance onboarding
    UPDATE public.profiles
    SET dealership_id   = v_dealer_id,
        dealership_name = _biz_name,
        onboarding_step = 3,
        updated_at      = now()
    WHERE user_id = v_user_id;

    -- 6. Grant dealer_admin role (SECURITY DEFINER bypasses RLS)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'dealer_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 7. Create a default dealer_settings row for this dealership
    INSERT INTO public.dealer_settings (dealership_id, dealership_name)
    VALUES (v_dealer_id, _biz_name)
    ON CONFLICT (dealership_id) DO NOTHING;

    -- 8. Return success
    RETURN jsonb_build_object('dealership_id', v_dealer_id);

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'error',  SQLERRM,
            'detail', SQLSTATE
        );
END;
$$;

REVOKE ALL ON FUNCTION public.setup_dealership(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.setup_dealership(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.setup_dealership(TEXT, TEXT) IS
    'Creates a dealership during onboarding, links it to the calling user, '
    'assigns dealer_admin role, and creates default dealer_settings row.';


-- ------------------------------------------------
-- RPC: check_subscription (stub)
-- Returns static "not subscribed". Replace with Stripe later.
-- ------------------------------------------------
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
    'Stub: always returns subscribed=false. Replace with Stripe logic.';


-- ------------------------------------------------
-- RPC: accept_invite
-- Accepts a dealership invitation token.
-- ------------------------------------------------
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
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    -- Look up the invite
    SELECT * INTO v_invite
    FROM public.invitation_links
    WHERE token = _token
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Invite token not found');
    END IF;

    IF v_invite.used_at IS NOT NULL THEN
        RETURN jsonb_build_object('error', 'This invite has already been used');
    END IF;

    IF v_invite.expires_at < NOW() THEN
        RETURN jsonb_build_object('error', 'This invite has expired');
    END IF;

    -- Look up the dealership
    SELECT id, name INTO v_dealership
    FROM public.dealerships
    WHERE id = v_invite.dealership_id
    LIMIT 1;

    -- Link the user to the dealership
    UPDATE public.profiles
    SET dealership_id   = v_invite.dealership_id,
        dealership_name = COALESCE(v_dealership.name, v_invite.dealership_name),
        updated_at      = NOW()
    WHERE user_id = v_caller_id;

    -- Grant dealer_user role (team member, not admin)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_caller_id, 'dealer_user')
    ON CONFLICT DO NOTHING;

    -- Mark the invite as used
    UPDATE public.invitation_links
    SET used_by = v_caller_id,
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
