import type {FastifyInstance}from'fastify';
import{z}from'zod';
import{audit}from'../../shared/audit.js';
import{loadLicenseState,validateInstalledLicense}from'./service.js';

export async function licenseRoutes(app:FastifyInstance){
  app.addHook('preHandler',app.authenticate);
  app.get('/status',async()=>({data:await loadLicenseState(app.db,app.env.LICENSE_PUBLIC_KEY,app.env.INSTALLATION_ID)}));
  app.put('/install',async(request,reply)=>{
    if(request.auth!.role!=='ADMIN')return reply.code(403).send({error:'Acesso restrito.'});
    if(!app.env.LICENSE_PUBLIC_KEY||!app.env.INSTALLATION_ID)return reply.code(409).send({error:'Licenciamento não configurado nesta instalação.'});
    const{token}=z.object({token:z.string().min(40).max(20000)}).parse(request.body);
    const state=validateInstalledLicense(token,app.env.LICENSE_PUBLIC_KEY,app.env.INSTALLATION_ID);
    if(state.state==='INVALID')return reply.code(422).send({error:'Licença inválida para esta instalação.'});
    await app.db.query(`INSERT INTO installation_license(singleton,token,installed_by,installed_at) VALUES(true,$1,$2,now()) ON CONFLICT(singleton) DO UPDATE SET token=EXCLUDED.token,installed_by=EXCLUDED.installed_by,installed_at=now()`,[token,request.auth!.userId]);
    await audit(app.db,'LICENSE_INSTALLED','installation_license',{actorUserId:request.auth!.userId,entityId:'singleton',metadata:{state:state.state,expiresAt:state.expiresAt}});
    return{data:state};
  });
}
