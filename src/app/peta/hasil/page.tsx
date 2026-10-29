import type {Metadata} from 'next';
import {PetaJourney} from '@/components/peta-journey';
export const metadata:Metadata={title:'Hasil PETA | BinaHub',robots:{index:false,follow:false}};
export default function Page(){return <PetaJourney resultOnly/>;}
