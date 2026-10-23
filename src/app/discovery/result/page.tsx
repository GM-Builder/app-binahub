import { Suspense } from 'react';
import { SpinResult } from '@/components/spin-result';
export default function DiscoveryResultPage(){return <Suspense fallback={<p role="status" className="p-8">Menyiapkan laporan…</p>}><SpinResult/></Suspense>;}
