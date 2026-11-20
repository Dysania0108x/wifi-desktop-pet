export type CareKind = 'ball' | 'food' | 'water';
export type CarePhase = { phase: string; mode: string; ms: number };
export const careScenes: Record<CareKind, CarePhase[]>;
