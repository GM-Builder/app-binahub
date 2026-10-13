import { DiagnosisChoice } from '@/components/diagnosis-choice';
import { Suspense } from 'react';
export default function DiagnosisChoicePage(){return <Suspense fallback={<main role="status" className="p-8">Menyiapkan pilihan diagnosis…</main>}><DiagnosisChoice/></Suspense>;}
