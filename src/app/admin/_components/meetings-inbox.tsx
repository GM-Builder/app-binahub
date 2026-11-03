'use client';
import { AdminAuthGate } from '@/components/admin-auth-gate';
import { AdminShell } from '@/components/admin-shell';
import { TAB_META } from '../_lib/constants';
import { MeetingsPanel } from './meetings-panel';

export function MeetingsInbox() {
  return <AdminAuthGate><AdminShell {...TAB_META.Meeting}><MeetingsPanel serverMode /></AdminShell></AdminAuthGate>;
}
