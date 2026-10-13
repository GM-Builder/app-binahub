import type { Metadata } from 'next';
import { IndividualAssessment } from '@/components/individual-assessment';
export const metadata:Metadata={title:'Diagnosis Individu | BinaHub',robots:{index:false,follow:false}};
export default function IndividualAssessmentPage(){return <IndividualAssessment/>;}
