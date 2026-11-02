import type { AssessmentRecord } from './types';
import { z } from 'zod';

export type AssessmentListRow = Pick<AssessmentRecord,
  'id' | 'name' | 'email' | 'company' | 'role' | 'employees' | 'category' | 'overallScore' |
  'assessmentStatus' | 'proposalStatus' | 'proposalGateStatus' | 'proposalDraft' | 'proposalSentAt' |
  'resultEmailSentAt' | 'resultFollowUpLevel' | 'proposalFollowUpLevel' | 'followUpPaused' | 'createdAt'>;
const count = z.number().int().nonnegative();
export const AssessmentInboxSchema = z.object({
  success: z.literal(true), version: z.literal(1), page: count, pageSize: z.literal(20), total: count,
  counts: z.object({ all: count, attention: count, processing: count, sent: count }),
  facets: z.object({ categories: z.array(z.string()), employees: z.array(z.string()) }),
  records: z.array(z.object({
    id: z.string(), name: z.string(), email: z.string(), company: z.string(), role: z.string(),
    employees: z.string(), category: z.string(), overallScore: z.number(), assessmentStatus: z.string(),
    proposalStatus: z.string(), proposalGateStatus: z.string(),
    proposalDraft: z.object({ proposal: z.object({}), automatic: z.boolean() }).nullable(),
    proposalSentAt: z.string().nullable(), resultEmailSentAt: z.string().nullable(),
    resultFollowUpLevel: z.number(), proposalFollowUpLevel: z.number(), followUpPaused: z.boolean(), createdAt: z.string(),
  })).max(20),
});
export type AssessmentInbox = z.infer<typeof AssessmentInboxSchema>;
