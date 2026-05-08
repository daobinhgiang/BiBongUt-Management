-- Add UNIQUE constraint on family_invites.token
-- The index already exists (from migration 120000), so replace it with a unique index
DROP INDEX IF EXISTS idx_family_invites_token;
ALTER TABLE public.family_invites ADD CONSTRAINT family_invites_token_unique UNIQUE (token);
