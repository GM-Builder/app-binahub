// Isolated test harness, never mounted as an application/Next.js route.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/app/globals.css';
import { PECommerceAdmin } from '../../../src/components/pe-commerce-admin';
createRoot(document.getElementById('root')!).render(<main className="min-h-screen bg-white p-4 sm:p-8"><PECommerceAdmin/></main>);
