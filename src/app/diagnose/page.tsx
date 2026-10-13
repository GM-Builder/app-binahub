import { DiagnosisChoice, DiagnosisChoiceLoading } from '@/components/diagnosis-choice';
import { Suspense } from 'react';

export default function DiagnosisChoicePage() {
  return <Suspense fallback={<DiagnosisChoiceLoading />}><DiagnosisChoice /></Suspense>;
}
