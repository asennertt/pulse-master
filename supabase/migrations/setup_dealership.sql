-- =============================================================================
-- Function: setup_dealership
-- Schema:   public
-- Purpose:  Called during onboarding step 2 to create the dealership and link
--           the user to it. Runs as SECURITY DEFINER so it can write to
--           user_roles (which is restricted to service_role by RLS).
--
-- Usage (JS):
--   const { data, error } = await supabase.rpc("setup_dealership", {
--     _biz_name:    "Sunshine Motors",
--     _biz_address: "1234 Auto Blvd, Dallas, TX 75201"
--   });
--   // data => { dealership_id: uuid } on success
--   // data => { error: "..." } on failure
-- =============================================================================

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
    -- 1. Get the calling user's ID and email from the JWT
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Not authenticated');
    END IF;

    -- Get email from auth.users
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;

    -- 2. Check if user already has a dealership
    PERFORM 1 FROM public.profiles
    WHERE user_id = v_user_id AND dealership_id IS NOT NULL;
    IF FOUND THEN
        RETURN jsonb_build_object('error', 'User already has a dealership');
    END IF;

    -- 3. Generate a URL-safe slug from the business name
    v_slug := lower(regexp_replace(trim(_biz_name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(BOTH '-' FROM v_slug);
    -- Append a short random suffix to guarantee uniqueness
    v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);

    -- 4. Create the dealership row
    INSERT INTO public.dealerships (name, slug, address, owner_email, status)
    VALUES (_biz_name, v_slug, _biz_address, v_user_email, 'pending')
    RETURNING id INTO v_dealer_id;

    -- 5. Link the profile to the new dealership and advance onboarding
    UPDATE public.profiles
    SET dealership_id   = v_dealer_id,
        dealership_name = _biz_name,
        onboarding_step = 3,
        updated_at      = now()
    WHERE user_id = v_user_id;

    -- 6. Grant the dealer_admin role (SECURITY DEFINER bypasses RLS)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'dealer_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 7. Return success with the new dealership ID
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
    'Creates a dealership during onboarding, links it to the calling user profile, '
    'and assigns the dealer_admin role. Called from Onboarding step 2.';
