import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

export type ClinicIdentity = { clinicName:string; professionalName:string; specialty:string; logoUrl?:string|null; primaryColor:string; secondaryColor:string };
const fallback:ClinicIdentity={clinicName:'Consultório de Nutrição',professionalName:'Nutricionista',specialty:'Nutrição clínica',logoUrl:null,primaryColor:'#203528',secondaryColor:'#8ca481'};
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
export function useClinic(){const context=useContext(ClinicContext);if(!context)throw new Error('useClinic precisa estar dentro de ClinicProvider.');return context}
export function ClinicMark({className='brand-mark'}:{className?:string}){const clinic=useClinic();return clinic.logoUrl?<div className={`${className} has-logo`}><img src={clinic.logoUrl} alt={`Logotipo ${clinic.clinicName}`}/></div>:<div className={className}>{clinic.clinicName.trim().charAt(0).toUpperCase()||'N'}</div>}
