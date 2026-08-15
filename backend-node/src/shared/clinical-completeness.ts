export function missingClinicalCore(savedKeys:Iterable<string>){
  const saved=new Set(savedKeys);const missing:string[]=[];
  if(!saved.has('context'))missing.push('Contexto');
  if(!saved.has('anamnesis')&&!saved.has('followup'))missing.push('Anamnese ou Retorno');
  if(!saved.has('conduct'))missing.push('Conduta');
  return missing;
}
