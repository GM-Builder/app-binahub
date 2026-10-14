"use client";
import { useSearchParams } from 'next/navigation';
import { IndividualAssessment } from './individual-assessment';
import { PEGuestAssessment } from './pe-guest-assessment';
export function IndividualEntry() {
  const query=useSearchParams();
  // History links continue using verified account ownership. New participants don't register.
  return query.has('attempt') || query.get('legacy')==='1' ? <IndividualAssessment/> : <PEGuestAssessment/>;
}
