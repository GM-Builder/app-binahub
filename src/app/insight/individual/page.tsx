import type { Metadata } from 'next';
import { IndividualEntry } from '@/components/individual-entry';
import { Suspense } from 'react';
export const metadata:Metadata={title:'Diagnosis Individu | BinaHub',robots:{index:false,follow:false}};
export default function IndividualAssessmentPage(){return <Suspense fallback={<main role="status" className="p-8">Menyiapkan diagnosis…</main>}><IndividualEntry/></Suspense>;}
