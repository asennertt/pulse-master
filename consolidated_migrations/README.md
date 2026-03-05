# Consolidated Migrations

This folder is the **single source of truth** for the Pulse database schema.

Run these files in order against a fresh Supabase project:

| File | What it does |
|---|---|
| `001_extensions.sql` | Enables `pg_cron` and `pg_net` extensions |
| `002_shared_core.sql` | Creates shared tables (profiles, user_roles, dealerships, etc.), signup trigger, helper functions |
| `003_post_tables.sql` | Creates all Pulse Post-specific tables (vehicles, leads, staff, dealer_settings, etc.) |
| `004_shared_rpc.sql` | Creates shared RPCs (get_user_context, setup_dealership, check_subscription, accept_invite) |
| `005_rls_policies.sql` | Applies all Row Level Security policies (tenant-aware, TEXT-based roles) |

## Design Principles

- **Multi-tenancy**: Every Post table has a `dealership_id` FK for data isolation
- **TEXT roles**: Roles are plain TEXT strings (`dealer_admin`, `dealer_user`, `super_admin`) — no enum, so Post and Value can define their own roles without conflicts
- **Single signup trigger**: One `on_auth_user_created` trigger handles both profile creation and role assignment
- **Super admin bypass**: `super_admin` role can read across all dealerships
- **Anon policies**: Webhook/cron endpoints can insert via anon role where needed

## Superseded Locations

These older migration locations are **deprecated** and should not be modified:

- `sql/001_unified_auth_migration.sql` (Value-origin auth)
- `supabase/migrations/` (hand-written shared RPCs)
- `Apps/Post/Pulse-main/supabase/migrations/` (Lovable-generated Post migrations)
- `Apps/Landing/lotly-pulse-landing-main/supabase/migrations/` (Landing duplicate)

## Adding Pulse Value Tables (Future)

When ready to launch Pulse Value:
1. Create `006_value_tables.sql` with Value-specific tables
2. Add Value RLS policies to `005_rls_policies.sql` or a new `007_value_rls.sql`
3. The shared core (002) and RPCs (004) already support both apps
