export const RELEASE_STAGES=['VALIDATE_ARTIFACT','BACKUP_CHECK','MIGRATE','SMOKE','CANARY','ROLLOUT','COMPLETE'];
export function createFakeReleaseAdapter({failAt}={}){const calls=[];return{calls,async execute(stage,context){calls.push({stage,tenantId:context.tenantId});if(stage===failAt)throw Object.assign(new Error('simulated'),{retryable:stage!=='MIGRATE'});return{synthetic:true,stage}},async rollback(context){calls.push({stage:'ROLLBACK',tenantId:context.tenantId});return{synthetic:true,restoredReleaseId:context.previousReleaseId}}}}
export async function runReleaseRollout(input,{adapter,state={stageIndex:0,status:'PENDING',results:{},paused:false}}={}){
  if(!input.releaseId||!input.tenantId||!input.previousReleaseId)throw new Error('Release, tenant e release anterior são obrigatórios.');
  if(state.paused)return state;
  for(;state.stageIndex<RELEASE_STAGES.length;state.stageIndex++){
    const stage=RELEASE_STAGES[state.stageIndex];state.status='RUNNING';state.stage=stage;
    try{state.results[stage]??=await adapter.execute(stage,input)}catch(error){state.status=error?.retryable?'FAILED_RETRYABLE':'PAUSED_MANUAL';state.paused=true;state.errorCode=stage==='MIGRATE'?'MIGRATION_FAILED':'GATE_FAILED';return state}
    if(stage==='CANARY'&&!input.approveRollout){state.status='PAUSED';state.paused=true;return state}
  }
  state.status='COMPLETE';return state;
}
export function resumeReleaseRollout(state){if(!['PAUSED','FAILED_RETRYABLE'].includes(state.status))throw new Error('Release não está retomável.');return{...state,paused:false,status:'PENDING'}}
export async function rollbackRelease(input,{adapter,state}){if(state.stageIndex<=RELEASE_STAGES.indexOf('MIGRATE'))throw new Error('Rollback de aplicação só é permitido após migração verificada.');const result=await adapter.rollback(input);return{...state,status:'ROLLED_BACK',rollback:result}}
