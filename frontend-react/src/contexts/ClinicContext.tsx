import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

export type ClinicIdentity = { clinicName:string; professionalName:string; crn?:string|null; specialty:string; phone?:string|null; email?:string|null; city?:string|null; logoUrl?:string|null; primaryColor:string; secondaryColor:string };
const fallback:ClinicIdentity={clinicName:'Dra. Silvia Oliveira Lemos',professionalName:'Dra. Silvia Oliveira Lemos',crn:'CRN-4 25104731',specialty:'Nutrição Clínica & Esportiva',phone:'5521987385146',email:null,city:'Rio de Janeiro',logoUrl:null,primaryColor:'#203528',secondaryColor:'#8ca481'};
type Value=ClinicIdentity&{refresh:()=>Promise<void>};
const ClinicContext=createContext<Value|null>(null);

export function ClinicProvider({children}:{children:ReactNode}){
  const[identity,setIdentity]=useState(fallback);
  const refresh=useCallback(async()=>{try{const response=await api<{data?:Partial<ClinicIdentity>}>('/api/settings/public');if(response.data)setIdentity(current=>({...current,...response.data}))}catch(error){console.error('Não foi possível carregar a identidade do consultório.',error)}},[]);
  useEffect(()=>{void refresh()},[refresh]);
  useEffect(()=>{const update=()=>{void refresh()};window.addEventListener('clinic-settings-updated',update);return()=>window.removeEventListener('clinic-settings-updated',update)},[refresh]);
  useEffect(()=>{document.title=identity.clinicName;document.documentElement.style.setProperty('--brand-primary',identity.primaryColor);document.documentElement.style.setProperty('--brand-secondary',identity.secondaryColor)},[identity]);
  const value=useMemo(()=>({...identity,refresh}),[identity,refresh]);
  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>
}
export function useClinic(){
  const context=useContext(ClinicContext);
  if(!context)throw new Error('useClinic precisa estar dentro de ClinicProvider.');
  return context;
}
export function ClinicMark({className='brand-mark'}:{className?:string}){
  const clinic=useClinic();
  return clinic.logoUrl ? (
    <div className={`${className} has-logo`}>
      <img src={clinic.logoUrl} alt={`Logotipo ${clinic.clinicName}`}/>
    </div>
  ) : (
    <div className={`${className} brand-mark-svg`} title={clinic.clinicName}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
        <circle cx="50" cy="50" r="48" fill="#203528" stroke="#8ca481" strokeWidth="3"/>
        <path d="M 50 18 Q 72 40 50 82 Q 28 40 50 18 Z" fill="#8ca481" />
        <path d="M 50 18 L 50 82" stroke="#203528" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 50 42 Q 62 34 68 32" stroke="#203528" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M 50 55 Q 38 47 32 45" stroke="#203528" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="68" cy="32" r="2.5" fill="#203528" />
        <circle cx="32" cy="45" r="2.5" fill="#203528" />
      </svg>
    </div>
  );
}
