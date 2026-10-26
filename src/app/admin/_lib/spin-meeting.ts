import { spinSanitize, spinVisible, spinErrors, spinStage, type SpinAnswers, type SpinDefinition, type SpinField } from '@/lib/spin-form';

export type MeetingChecklist = {
  id: string; source_id: string | null; contact: { name: string; company: string; email: string };
  answers: SpinAnswers; notes: string; status: 'in_progress' | 'completed'; revision: number; updated_at: string | null;
};
export type MeetingContext = { checklist: MeetingChecklist; original: SpinAnswers; definition: SpinDefinition };
export function hasMeetingAnswer(value: SpinAnswers[string] | undefined) {
  return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0);
}
export function meetingFields(definition: SpinDefinition, answers: SpinAnswers, group?: number) {
  return definition.fields.filter(field => spinVisible(field, answers) && (group === undefined || meetingGroup(definition, field) === group));
}
export function meetingGroup(definition: SpinDefinition, field: SpinField) {
  const screen = definition.screens.findIndex(questions => questions.includes(field.questionId));
  return screen < 0 ? 4 : spinStage(screen);
}
export function meetingProgress(definition: SpinDefinition, answers: SpinAnswers, group?: number) {
  const fields = meetingFields(definition, answers, group), errors = spinErrors(definition, answers, false);
  return { total: fields.length, answered: fields.filter(field => hasMeetingAnswer(answers[field.key]) && !errors[field.key]).length };
}
export function meetingEffective(context: MeetingContext, additions: SpinAnswers) {
  return spinSanitize(context.definition, { ...context.original, ...additions });
}
