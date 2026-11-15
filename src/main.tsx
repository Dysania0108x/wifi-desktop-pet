import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
type PetApi={load:()=>Promise<{pets?:number;paused?:boolean}>,save:(data:{pets:number})=>Promise<boolean>,menu:()=>void,onPause:(callback:(value:boolean)=>void)=>()=>void};
declare global{interface Window{wifi?:PetApi}}
function Dog({sleep,happy,step,mode}:{sleep:boolean,happy:boolean,step:number,mode:'idle'|'walk'|'sleep'|'sit'}){
 const action=happy?'happy':sleep?'sleep':mode;
 const frame=step%2;
 return <img className={'dog '+(sleep?'sleep ':'')+(happy?'happy ':'')} src={`./sprites/wifi/${action}-${frame}.svg`} draggable={false} alt={`WiFi the pixel dog: ${action}`}/>;
}
function App(){
 const [pets,setPets]=useState(0),[paused,setPaused]=useState(false),[mode,setMode]=useState<'idle'|'walk'|'sleep'|'sit'>('idle'),[happy,setHappy]=useState(false),[step,setStep]=useState(0);
 useEffect(()=>{window.wifi?.load().then(s=>{setPets(s.pets||0);setPaused(!!s.paused)});return window.wifi?.onPause(setPaused)},[]);
 useEffect(()=>{if(paused)return;const id=window.setInterval(()=>{setStep(n=>n+1);setMode(m=>Math.random()<0.15?(m==='sleep'?'idle':Math.random()<0.35?'sleep':Math.random()<0.4?'sit':'walk'):m)},1100);return()=>clearInterval(id)},[paused]);
 function pet(){setPets(n=>{const next=n+1;void window.wifi?.save({pets:next});return next});setHappy(true);setMode('idle');window.setTimeout(()=>setHappy(false),850)}
 return <main className="pet-shell">
 <div className="drag-handle" title="Drag WiFi to move">⋮⋮</div>
 <button className="menu" aria-label="WiFi menu" onClick={()=>window.wifi?.menu()}>•••</button>
 <button className={'pet '+(mode==='walk'&&!paused?'walking':'')} onClick={pet} title="Pet WiFi!"><Dog sleep={mode==='sleep'} happy={happy} step={step} mode={mode}/></button>
 <div className="status">{happy?'♥ Woof!':paused?'Paused':mode==='sleep'?'zzz':mode==='walk'?'Exploring…':'WiFi'} <span>♥ {pets}</span></div>
 </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
