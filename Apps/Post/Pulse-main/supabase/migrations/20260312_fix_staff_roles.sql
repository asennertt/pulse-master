-- =============================================================================
-- Migration: Fix staff role assignment
-- Date: 2026-03-12
-- 
-- WHAT THIS FIXES:
-- 1. The signup trigger was giving dealer_admin to EVERY new user (including staff)
-- 2. The accept_invite function now removes dealer_admin for invited staff
-- 3. Cleans up the test staff user who got dealer_admin incorrectly
-- =============================================================================

-- ─── 1. Fix the signup trigger: only assign dealer_user ───────────────────────
-- dealer_admin is assigned by setup_dealership() during onboarding, not on signup.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'dealer_user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─── 2. Update accept_invite: ensure staff never get dealer_admin ─────────────
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

    SELECT *
    INTO v_invite
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

    -- Grant dealer_user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_caller_id, 'dealer_user')
    ON CONFLICT DO NOTHING;

    -- Safety: remove dealer_admin if the signup trigger assigned it.
    -- Invited staff should NEVER have dealer_admin.
    DELETE FROM public.user_roles
    WHERE user_id = v_caller_id AND role = 'dealer_admin';

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

-- ─── 3. Clean up test staff user: remove incorrectly assigned dealer_admin ────
DELETE FROM public.user_roles
WHERE user_id = 'af329275-9dc8-4152-be69-ddf30a33fe41'
  AND role = 'dealer_admin';
