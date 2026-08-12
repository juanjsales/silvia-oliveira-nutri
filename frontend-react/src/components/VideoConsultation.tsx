import { Maximize2, Minimize2, PhoneOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export function VideoConsultation({roomToken,patientName,onClose}:{roomToken:string;patientName:string;onClose:()=>void}){
 const[expanded,setExpanded]=useState(false);const[startedAt]=useState(Date.now());const[elapsed,setElapsed]=useState('00:00');
 useEffect(()=>{const timer=setInterval(()=>{const seconds=Math.floor((Date.now()-startedAt)/1000);setElapsed(`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`)},1000);return()=>clearInterval(timer)},[startedAt]);
 const source=useMemo(()=>{const room=`nutri-${roomToken}`;return `https://meet.element.io/${encodeURIComponent(room)}#config.prejoinPageEnabled=false&config.disableDeepLinking=true`},[roomToken]);
 return <aside className={`video-consultation ${expanded?'expanded':''}`}><header><div><span className="live-dot"/><strong>Teleconsulta</strong><small>{patientName}</small></div><time>{elapsed}</time><button className="icon-button video-expand" onClick={()=>setExpanded(!expanded)} aria-label={expanded?'Reduzir vídeo':'Ampliar vídeo'}>{expanded?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button></header><div className="video-frame"><iframe src={source} title={`Teleconsulta com ${patientName}`} allow="camera; microphone; fullscreen; display-capture; autoplay"/></div><footer><small>Microfone e câmera são controlados dentro da chamada.</small><button className="hangup" onClick={onClose}><PhoneOff size={18}/><span>Encerrar painel</span></button></footer></aside>
}
