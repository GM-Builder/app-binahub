import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PEEmailResult } from '@/components/pe-email-result';
export const metadata:Metadata={title:'Hasil Diagnosis Individu | BinaHub',robots:{index:false,follow:false}};
export default function Page(){return <Suspense fallback={<main role="status" className="p-8">Menyiapkan hasil…</main>}><PEEmailResult/></Suspense>;}
