/** Display formula approved by owner 28 Oct 2026, pending final CEO weights.
 * Does not replace stored method scores, response credits or priority rules.
 */
export const PE_COMBINED_DISPLAY_VERSION='pe-display-equal-methods-v1';
export function peCombinedScore(selfReport:number|null,sjt:number|null):number|null {
 if(selfReport===null||sjt===null||!Number.isFinite(selfReport)||!Number.isFinite(sjt))return null;
 return Math.round((selfReport*.5+sjt*.5)*100)/100;
}
