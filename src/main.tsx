import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
type PetApi={load:()=>Promise<{pets?:number;paused?:boolean}>,save:(data:{pets:number})=>Promise<boolean>,menu:()=>void,onPause:(callback:(value:boolean)=>void)=>()=>void};
declare global{interface Window{wifi?:PetApi}}
function Dog({sleep,happy,step}:{sleep:boolean,happy:boolean,step:number}){
 return <svg className={'dog '+(sleep?'sleep ':'')+(happy?'happy ':'')} viewBox="0 0 160 130" role="img" aria-label="Pixel illustration of WiFi the black and white fluffy dog" shapeRendering="crispEdges">
 <g className="tail"><path d="M35 73H20V65H12V50H19V40H28V35H40V43H47V54H42V65H36Z" fill="#f2eee6" stroke="#333038" strokeWidth="4"/><path d="M21 59H30V67H39V76H29V69H20Z" fill="#333038"/></g>
 <path d="M42 64H108V106H100V118H86V107H67V118H51V104H42Z" fill="#f4f0e8" stroke="#343039" strokeWidth="4"/>
 <path d="M49 70H72V89H62V97H48Z" fill="#343039"/><path d="M83 77H101V93H92V99H83Z" fill="#343039"/>
 <path d="M93 53H127V69H137V98H122V110H104V103H91V90H86V69Z" fill="#f4f0e8" stroke="#343039" strokeWidth="4"/>
 <path d="M92 55H111V84H98V94H89V73Z" fill="#29262d"/><path d="M119 52H137V82H128V93H117V75Z" fill="#29262d"/>
 <path d="M111 53H119V78H112V88H106V74Z" fill="#f4f0e8"/>
 <rect x="110" y="80" width="6" height="6" fill="#79523b"/><rect x="126" y="79" width="6" height="6" fill="#79523b"/>
 <rect x="112" y="81" width="4" height="4" fill="#211d20"/><rect x="127" y="80" width="4" height="4" fill="#211d20"/>
 <path d="M116 90H128V98H121V101H117Z" fill="#f8f5ef"/><path d="M119 91H128V96H123V99H120Z" fill="#252129"/>
 <path d="M92 70H99V100H94Z" fill="#37363b"/><path d="M70 76H91V81H70Z" fill="#37363b"/>
 <path d="M51 105H66V119H50Z" fill="#f4f0e8" stroke="#343039" strokeWidth="3"/><path d="M87 104H101V118H86Z" fill="#f4f0e8" stroke="#343039" strokeWidth="3"/>
 {happy&&<g fill="#e78b9b"><rect x="124" y="100" width="8" height="7"/><rect x="131" y="96" width="5" height="5"/></g>}
 {sleep&&<g fill="#8b75a9"><text x="115" y="43" fontSize="16">z</text><text x="132" y="28" fontSize="22">Z</text></g>}
 <g transform={step%2===0?'translate(0 0)':'translate(0 -1)'}><rect x="58" y="115" width="9" height="3" fill="#fffaf4"/></g>
 </svg>
}
function App(){
 const [pets,setPets]=useState(0),[paused,setPaused]=useState(false),[mode,setMode]=useState<'idle'|'walk'|'sleep'>('idle'),[happy,setHappy]=useState(false),[step,setStep]=useState(0);
 useEffect(()=>{window.wifi?.load().then(s=>{setPets(s.pets||0);setPaused(!!s.paused)});return window.wifi?.onPause(setPaused)},[]);
 useEffect(()=>{if(paused)return;const id=window.setInterval(()=>{setStep(n=>n+1);setMode(m=>Math.random()<0.15?(m==='sleep'?'idle':Math.random()<0.35?'sleep':'walk'):m)},1100);return()=>clearInterval(id)},[paused]);
 function pet(){setPets(n=>{const next=n+1;void window.wifi?.save({pets:next});return next});setHappy(true);setMode('idle');window.setTimeout(()=>setHappy(false),850)}
 return <main className="pet-shell">
 <div className="drag-handle" title="Drag WiFi to move">⋮⋮</div>
 <button className="menu" aria-label="WiFi menu" onClick={()=>window.wifi?.menu()}>•••</button>
 <button className={'pet '+(mode==='walk'&&!paused?'walking':'')} onClick={pet} title="Pet WiFi!"><Dog sleep={mode==='sleep'} happy={happy} step={step}/></button>
 <div className="status">{happy?'♥ Woof!':paused?'Paused':mode==='sleep'?'zzz':mode==='walk'?'Exploring…':'WiFi'} <span>♥ {pets}</span></div>
 </main>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
