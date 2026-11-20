import React from 'react';
import type { CareKind } from './care.mjs';

export function CareProp({ kind }: { kind: CareKind }) {
  if (kind === 'ball') return <span className="care-prop tennis" aria-hidden="true">
    <svg viewBox="0 0 30 30">
      <circle cx="15" cy="15" r="12" fill="#b1c64d" stroke="#788b38" strokeWidth="1.2" />
      <path d="M9 5c9 4 3 13 13 19M6 20c2.8-2.5 3.3-5.2 3.7-7" stroke="#f5f8d4" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M7 11a8 8 0 0 1 5-4" stroke="#d9e895" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  </span>;
  return <span className={'care-prop dish '+kind} aria-hidden="true">
    <svg viewBox="0 0 52 32">
      <ellipse cx="26" cy="27" rx="22" ry="3" fill="#282019" opacity=".14" />
      <path d="M7 12l3 13q16 7 32 0l3-13z" fill={kind === 'water' ? '#708ba0' : '#ad7564'} />
      <ellipse cx="26" cy="12" rx="20" ry="7" fill={kind === 'water' ? '#d8e6ea' : '#e2b2a2'} />
      <ellipse cx="26" cy="13" rx="15.7" ry="4.5" fill={kind === 'water' ? '#92bfcc' : '#955e4d'} />
      {kind === 'water' ? <g className="water-rings" fill="none" stroke="#eefbfd" strokeWidth="1.1">
        <ellipse cx="26" cy="12.8" rx="6" ry="1.8" />
        <ellipse cx="26" cy="12.8" rx="11" ry="3" />
      </g> : <g className="kibble" fill="#5a392a" stroke="#c79969" strokeWidth=".6">
        <circle cx="16" cy="12" r="2" /><circle cx="20" cy="14" r="2" /><circle cx="23.5" cy="10.2" r="2.1" />
        <circle cx="27" cy="13.4" r="2.2" /><circle cx="31" cy="11" r="2" /><circle cx="35" cy="13" r="2.1" />
      </g>}
      <path d="M14 24c5 1.5 13 2.1 19 1.2" stroke="#fff" opacity=".26" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  </span>;
}
