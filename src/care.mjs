// Each scene ends when the last phase's duration expires. Elapsed time is local.
export const careScenes = {
  ball: [
    { phase: 'ready', mode: 'play', ms: 650 },
    { phase: 'chase', mode: 'walk', ms: 1080 },
    { phase: 'touch', mode: 'sniff', ms: 570 },
    { phase: 'return', mode: 'walk', ms: 720 },
    { phase: 'finish', mode: 'pet', ms: 680 },
  ],
  food: [
    { phase: 'arrive', mode: 'walk', ms: 520 },
    { phase: 'inspect', mode: 'sniff', ms: 820 },
    { phase: 'bite', mode: 'sniff', ms: 1680 },
    { phase: 'finish', mode: 'sit', ms: 850 },
  ],
  water: [
    { phase: 'arrive', mode: 'walk', ms: 520 },
    { phase: 'inspect', mode: 'sniff', ms: 670 },
    { phase: 'lap', mode: 'sniff', ms: 1750 },
    { phase: 'finish', mode: 'sit', ms: 850 },
  ],
};
