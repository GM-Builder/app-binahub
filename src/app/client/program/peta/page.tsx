import {ClientAuthGate} from '@/components/client-auth-gate';
import {PetaJourney} from '@/components/peta-journey';
export default function Page(){return <ClientAuthGate><PetaJourney programMode/></ClientAuthGate>;}
