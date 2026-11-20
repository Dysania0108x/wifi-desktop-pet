import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { careScenes, type CareKind } from './care.mjs';
import { CareProp } from './CareProp';

type Behavior = 'idle' | 'walk' | 'sniff' | 'sit' | 'sleep';
type Action = 'pet' | 'play' | 'call' | 'rest';
type Roam = { walking: boolean; facing: 'left' | 'right'; behavior: Behavior };
type CareStart = { id: number; action: CareKind };
type SceneState = CareStart & { step: number; facing: 'left' | 'right' };
type PetApi = {
  load: () => Promise<{ pets?: number; paused?: boolean }>;
  save: (data: { pets: number }) => Promise<boolean>;
  menu: () => void;
  play: () => void;
  callPet: () => void;
  rest: () => void;
  care: (action: CareKind) => void;
  finishCare: (id: number) => void;
  onCare: (callback: (value: CareStart) => void) => () => void;
  onCareStop: (callback: (id: number) => void) => () => void;
  onPetAction: (callback: (action: Action) => void) => () => void;
  setRoamingEnabled: (enabled: boolean) => void;
  onRoam: (callback: (value: Roam) => void) => () => void;
  setPointerOver: (over: boolean) => void;
  beginDrag: (point: { x: number; y: number }) => void;
  moveDrag: () => void;
  endDrag: () => void;
  onPause: (callback: (value: boolean) => void) => () => void;
};
declare global { interface Window { wifi?: PetApi } }

const sprites = './sprites/wifi-v3';
const animation: Record<string, { frames: string[]; ms: number }> = {
  idle: { frames: ['stand'], ms: 0 },
  blink: { frames: ['blink'], ms: 0 },
  walk: { frames: ['walk-0', 'walk-1', 'walk-2', 'walk-3'], ms: 155 },
  sniff: { frames: ['sniff-0', 'sniff-1', 'sniff-2', 'sniff-1'], ms: 380 },
  sit: { frames: ['sit'], ms: 0 },
  sleep: { frames: ['sleep'], ms: 0 },
  pet: { frames: ['petted', 'pet-0', 'pet-1', 'pet-2'], ms: 265 },
  play: { frames: ['play-0', 'play-1', 'play-2'], ms: 215 },
  call: { frames: ['pet-0', 'pet-1'], ms: 230 }
};
const art = new Set(Object.values(animation).flatMap(a => a.frames));
const announcements: Record<Action, string> = {
  pet: 'WiFi 眯起了眼睛。', play: 'WiFi 弯下身，准备玩。', call: 'WiFi 听见你在叫它。', rest: 'WiFi 躺下休息了。'
};
const fallback: Record<string, string> = {
  'play-0': 'stand', 'play-1': 'stand', 'play-2': 'stand', 'sniff-0': 'stand', 'sniff-1': 'stand', 'sniff-2': 'stand',
  'pet-0': 'sit', 'pet-1': 'petted', 'pet-2': 'petted'
};

const careAnnouncements: Record<CareKind, string> = {
  ball: 'WiFi 追着网球跑。', food: 'WiFi 闻了闻碗里的食物。', water: 'WiFi 低头喝水。'
};
function App() {
  const api = window.wifi;
  const [paused, setPaused] = useState(false);
  const [roam, setRoam] = useState<Roam>({ walking: false, facing: 'right', behavior: 'idle' });
  const [reaction, setReaction] = useState<Action | null>(null);
  const [status, setStatus] = useState('');
  const [scene, setScene] = useState<SceneState | null>(null);
  const facingRef = useRef<'left' | 'right'>('right');
  const localCareId = useRef(0);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [keyboard, setKeyboard] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [blink, setBlink] = useState(false);
  const [artCursor, setArtCursor] = useState({ key: '', tick: 0 });
  const pets = useRef(0);
  const reactTimer = useRef(0);
  const clickTimer = useRef(0);
  const phase = scene ? careScenes[scene.action][scene.step] : null;
  const mode = phase && !dragging ? phase.mode : !dragging && !paused && !reduced && roam.walking
    ? 'walk' : reaction === 'rest' ? 'sleep' : reaction
    ? reaction : dragging || paused ? 'idle' : roam.behavior;
  const pointer = useRef<{ id: number; x: number; y: number; moved: boolean }>();

  function react(kind: Action) {
    window.clearTimeout(reactTimer.current);
    setReaction(kind);
    setStatus(announcements[kind]);
    reactTimer.current = window.setTimeout(() => setReaction(null), kind === 'play' ? 790 : kind === 'call' ? 700 : kind === 'rest' ? 1200 : 1300);
  }
  function beginCare(value: CareStart) {
    window.clearTimeout(reactTimer.current);
    window.clearTimeout(clickTimer.current);
    clickTimer.current = 0;
    setReaction(null);
    setScene({ ...value, step: 0, facing: facingRef.current });
    setStatus(careAnnouncements[value.action]);
  }
  function chooseCare(action: CareKind) {
    if (api) api.care(action);
    else beginCare({ id: --localCareId.current, action });
  }
  function cancelScene() {
    if (scene && scene.id > 0) api?.finishCare(scene.id);
    setScene(null);
  }
  function pet() {
    cancelScene();
    pets.current += 1;
    void api?.save({ pets: pets.current }).catch(() => undefined);
    react('pet');
  }

  useEffect(() => {
    let active = true;
    void api?.load().then(data => {
      if (!active) return;
      pets.current = Math.max(pets.current, data.pets ?? 0);
      setPaused(Boolean(data.paused));
    }).catch(() => undefined);
    const offPause = api?.onPause(setPaused);
    const offRoam = api?.onRoam(value => {
      facingRef.current = value.facing;
      setRoam({ ...value, behavior: value.behavior || (value.walking ? 'walk' : 'idle') });
    });
    const offCare = api?.onCare(beginCare);
    const offCareStop = api?.onCareStop(id => setScene(current => current?.id === id ? null : current));
    const offAction = api?.onPetAction(action => {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = 0;
      if (action === 'pet') pet();
      else react(action);
    });
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    function syncMotion() { setReduced(mq.matches); api?.setRoamingEnabled(!mq.matches); }
    const pointerMode = () => setKeyboard(false);
    const keyboardMode = (e: KeyboardEvent) => { if (['Tab', 'Enter', ' ', 'F10', 'ContextMenu'].includes(e.key)) setKeyboard(true); };
    syncMotion();
    mq.addEventListener('change', syncMotion);
    window.addEventListener('pointerdown', pointerMode, true);
    window.addEventListener('keydown', keyboardMode, true);
    for (const frame of art) { const img = new Image(); img.src = `${sprites}/${frame}.png`; }
    return () => {
      active = false;
      offPause?.(); offRoam?.(); offAction?.(); offCare?.(); offCareStop?.();
      mq.removeEventListener('change', syncMotion);
      window.removeEventListener('pointerdown', pointerMode, true);
      window.removeEventListener('keydown', keyboardMode, true);
      window.clearTimeout(reactTimer.current);
      window.clearTimeout(clickTimer.current);
    };
  }, [api]);

  useEffect(() => {
    if (!scene || !phase) return;
    const timer = window.setTimeout(() => {
      const next = scene.step + 1;
      if (next >= careScenes[scene.action].length) {
        if (scene.id > 0) api?.finishCare(scene.id);
        setScene(current => current?.id === scene.id ? null : current);
      } else {
        setScene(current => current?.id === scene.id ? { ...current, step: next } : current);
      }
    }, phase.ms);
    return () => window.clearTimeout(timer);
  }, [api, scene, phase]);

  useEffect(() => {
    const a = animation[mode] ?? animation.idle;
    setArtCursor({ key: mode, tick: 0 });
    if (!a.ms || reduced) return;
    const id = window.setInterval(() => {
      setArtCursor(p => ({ key: mode, tick: mode === 'play' || mode === 'pet' || mode === 'call'
        ? Math.min(p.tick + 1, a.frames.length - 1) : (p.tick + 1) % a.frames.length }));
    }, a.ms);
    return () => window.clearInterval(id);
  }, [mode, reduced]);

  useEffect(() => {
    setBlink(false);
    if (mode !== 'idle' || paused || reduced || dragging) return;
    let next = 0;
    let open = 0;
    const queue = () => {
      next = window.setTimeout(() => {
        setBlink(true);
        open = window.setTimeout(() => { setBlink(false); queue(); }, 135);
      }, 1400 + Math.random() * 2400);
    };
    queue();
    return () => { window.clearTimeout(next); window.clearTimeout(open); };
  }, [mode, paused, reduced, dragging]);

  function beginPointer(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    pointer.current = { id: event.pointerId, x: event.screenX, y: event.screenY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePointer(event: React.PointerEvent<HTMLButtonElement>) {
    const gesture = pointer.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    if (!gesture.moved && Math.hypot(event.screenX - gesture.x, event.screenY - gesture.y) >= 5) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = 0;
      gesture.moved = true;
      cancelScene();
      setDragging(true);
      api?.beginDrag(gesture);
    }
    if (gesture.moved) api?.moveDrag();
  }
  function endPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const gesture = pointer.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    pointer.current = undefined;
    if (gesture.moved) {
      if (event.type === 'pointerup') api?.moveDrag();
      api?.endDrag();
      setDragging(false);
      return;
    }
    if (event.type !== 'pointerup') return;
    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = 0;
      chooseCare('ball');
    } else {
      clickTimer.current = window.setTimeout(() => { clickTimer.current = 0; pet(); }, 260);
    }
  }
  function openMenu() { window.clearTimeout(clickTimer.current); clickTimer.current = 0; cancelScene(); api?.menu(); }

  const active = animation[mode] ?? animation.idle;
  const reducedFrame = mode === 'play' ? 'play-1' : mode === 'pet' ? 'petted' : mode === 'call' ? 'pet-1' : active.frames[0];
  const frame = reduced ? reducedFrame : mode === 'idle' && blink ? 'blink' : active.frames[artCursor.key === mode ? artCursor.tick : 0];
  const facing = scene
    ? (scene.action === 'ball' && phase?.phase === 'return' ? (scene.facing === 'left' ? 'right' : 'left') : scene.facing)
    : roam.facing;
  return <main className="pet-shell" data-care={scene?.action} data-phase={phase?.phase} data-direction={scene?.facing}
    onPointerEnter={() => api?.setPointerOver(true)} onPointerLeave={() => api?.setPointerOver(false)}>
    <button className={['pet', dragging && 'dragging', keyboard && 'keyboard'].filter(Boolean).join(' ')}
      aria-label="摸摸 WiFi" aria-keyshortcuts="Shift+F10 T F W"
      onPointerDown={beginPointer} onPointerMove={movePointer} onPointerUp={endPointer}
      onPointerCancel={endPointer} onLostPointerCapture={endPointer}
      onClick={event => { if (event.detail === 0) pet(); }}
      onContextMenu={event => { event.preventDefault(); openMenu(); }}
      onKeyDown={event => {
        if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
          event.preventDefault(); openMenu();
        } else if (!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const action = ({ t: 'ball', f: 'food', w: 'water' } as Record<string, CareKind>)[event.key.toLowerCase()];
          if (action) { event.preventDefault(); chooseCare(action); }
        }
      }}>
      <span className={['orientation', facing === 'left' && 'faces-left'].filter(Boolean).join(' ')}>
        <img className={['dog', !paused && !dragging && (mode === 'sleep' ? 'breathing' : mode === 'sit' ? 'settled' : '')].filter(Boolean).join(' ')}
          src={`${sprites}/${frame}.png`} draggable={false} alt=""
          onError={event => {
            const alternative = fallback[frame];
            if (alternative && !event.currentTarget.src.endsWith('/' + alternative + '.png')) {
              event.currentTarget.src = `${sprites}/${alternative}.png`;
            }
          }} />
      </span>
    </button>
    {scene && <CareProp key={scene.id} kind={scene.action} />}
    <span className="sr-only" aria-live="polite">{status}</span>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
