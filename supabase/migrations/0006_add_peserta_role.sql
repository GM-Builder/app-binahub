-- ============================================================
-- Migration 0006 — Add 'peserta' role to profiles check constraint
-- Source: ADR-009, DATA-MODEL.md §1
-- ============================================================

-- Drop old constraint and add new one with 'peserta' role
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles drop constraint if exists profiles_role_check1;

alter table profiles
  add constraint profiles_role_check
  check (role in ('admin', 'facilitator', 'client', 'peserta'));

-- Update default role to 'peserta' for new signups
alter table profiles alter column role set default 'peserta';

-- Add role_updated_at for force-logout mechanism (ADR-009)
alter table profiles add column if not exists role_updated_at timestamptz default now();
