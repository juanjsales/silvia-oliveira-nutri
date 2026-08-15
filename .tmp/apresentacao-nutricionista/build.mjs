import fs from 'node:fs/promises';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const out='C:/Users/Juan Sales/OneDrive/Desktop/Nutricionista/Apresentacao-Sistema-Nutricionista.pptx';
const renderDir='C:/Users/Juan Sales/OneDrive/Desktop/Nutricionista/.tmp/apresentacao-nutricionista/rendered';
const hero='C:/Users/Juan Sales/OneDrive/Desktop/Nutricionista/assets/silvia-consultation.webp';
const bowl='C:/Users/Juan Sales/OneDrive/Desktop/Nutricionista/assets/healthy-bowl.webp';
const portrait='C:/Users/Juan Sales/OneDrive/Desktop/Nutricionista/assets/nutri-portrait.webp';
const deck=Presentation.create({slideSize:{width:1280,height:720}});
const C={ink:'#15231B',forest:'#244735',sage:'#8DA58F',mint:'#EAF1EA',cream:'#F7F3E8',gold:'#C8AA65',muted:'#637168',white:'#FFFFFF',rule:'#C9D1CA'};

async function bytes(path){const b=await fs.readFile(path);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}
function box(slide,name,left,top,width,height,fill=C.mint,line='none'){return slide.shapes.add({geometry:'rect',name,position:{left,top,width,height},fill,line:{style:'solid',fill:line,width:line==='none'?0:1}})}
function text(slide,name,value,left,top,width,height,size=26,color=C.ink,bold=false,align='left'){const s=slide.shapes.add({geometry:'textbox',name,position:{left,top,width,height},fill:'none',line:{style:'solid',fill:'none',width:0}});s.text=value;s.text.style={fontSize:size,typeface:'Arial',color,bold,alignment:align,verticalAlignment:'top'};return s}
function footer(slide,n){text(slide,`footer-${n}`,String(n).padStart(2,'0'),1190,668,42,22,14,C.muted,false,'right')}
function title(slide,value,n,sub='SISTEMA NUTRICIONAL'){text(slide,`eyebrow-${n}`,sub,54,36,420,26,15,C.forest,true);text(slide,`title-${n}`,value,54,78,1160,92,40,C.ink,true);footer(slide,n)}
function bulletBlock(slide,name,items,left,top,width,height){text(slide,name,items.map(v=>`•  ${v}`).join('\n\n'),left,top,width,height,25,C.ink,false)}
async function addImage(slide,name,path,left,top,width,height){slide.images.add({name,blob:await bytes(path),contentType:path.endsWith('.png')?'image/png':'image/webp',alt:name,fit:'cover',geometry:'rect',position:{left,top,width,height}})}

// 1 — capa (referência: cover-image-field)
{
 const s=deck.slides.add();s.background.fill=C.cream;box(s,'cover-field',720,0,560,720,C.mint);await addImage(s,'Nutricionista em atendimento',hero,720,0,560,720);
 text(s,'cover-kicker','UMA ROTINA CLÍNICA MAIS ORGANIZADA',58,58,560,30,16,C.forest,true);
 text(s,'cover-title','Mais presença no atendimento.\nMenos ruído na rotina.',58,160,600,210,56,C.ink,true);
 text(s,'cover-sub','Um sistema para acompanhar cada paciente com contexto, continuidade e segurança.',58,475,570,90,24,C.muted,false);
 text(s,'cover-close','Apresentação para uso piloto',58,625,380,30,18,C.forest,true);footer(s,1);
}

// 2 — problema / oportunidade (duas colunas)
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,'O cuidado perde fluidez quando a informação fica espalhada',2);
 text(s,'left-head','Na rotina',70,215,430,38,27,C.forest,true);bulletBlock(s,'left-list',['Agenda em um lugar','Anotações em formatos diferentes','Planos e exames difíceis de localizar','Mensagens sem contexto clínico'],70,270,470,330);
 box(s,'divider',628,205,2,395,C.rule);
 text(s,'right-head','Com o sistema',690,215,430,38,27,C.forest,true);bulletBlock(s,'right-list',['Jornada organizada por paciente','Histórico disponível no atendimento','Plano publicado diretamente no portal','Comunicação vinculada ao acompanhamento'],690,270,500,330);
}

// 3 — jornada (timeline)
{
 const s=deck.slides.add();s.background.fill=C.cream;title(s,'A jornada clínica acontece em uma sequência simples',3);
 box(s,'timeline',90,350,1090,3,C.sage);
 const steps=[['1','Agenda','Consulta organizada'],['2','Pré-check-in','Paciente atualiza o contexto'],['3','Atendimento','Decisão com histórico'],['4','Plano','Orientação publicada'],['5','Acompanhar','Evolução contínua']];
 steps.forEach((v,i)=>{const x=76+i*225;box(s,`dot-${i}`,x+10,329,40,40,C.forest);text(s,`num-${i}`,v[0],x+10,336,40,25,18,C.white,true,'center');text(s,`step-${i}`,v[1],x,405,185,35,24,C.ink,true);text(s,`desc-${i}`,v[2],x,448,185,90,19,C.muted,false)});
}

// 4 — atendimento
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,'Cada atendimento começa com o contexto essencial',4);
 box(s,'clinical-field',56,205,520,390,C.mint);text(s,'clinical-big','Antes de perguntar “o que aconteceu?”,\no sistema já mostra o que importa.',92,252,440,145,34,C.forest,true);
 text(s,'clinical-note','O pré-check-in apoia a conversa, mas a nutricionista decide o que deve ser registrado formalmente no prontuário.',92,440,430,110,22,C.muted,false);
 bulletBlock(s,'clinical-list',['Resumo clínico vivo','Histórico de consultas','Exames e medidas','Pendências para revisão'],670,228,470,330);
}

// 5 — plano e portal
{
 const s=deck.slides.add();s.background.fill=C.cream;title(s,'O plano sai do atendimento e chega ao paciente',5);
 await addImage(s,'Alimentação saudável',bowl,62,205,500,390);
 text(s,'plan-head','Para a nutricionista',630,215,500,36,26,C.forest,true);bulletBlock(s,'plan-pro',['Criar e revisar planos','Controlar versões','Registrar o motivo das alterações'],630,270,520,150);
 text(s,'patient-head','Para o paciente',630,445,500,36,26,C.forest,true);text(s,'patient-copy','Consultar o plano, acompanhar orientações e acessar documentos em um portal próprio.',630,492,520,100,24,C.ink,false);
}

// 6 — portal do paciente
{
 const s=deck.slides.add();s.background.fill=C.white;title(s,'O paciente participa sem invadir o espaço profissional',6);
 const items=[['Preparar a consulta','Responder ao pré-check-in'],['Acompanhar','Plano, metas e evolução'],['Compartilhar','Exames e diário alimentar'],['Conversar','Mensagens em canal seguro']];
 items.forEach((v,i)=>{const col=i%2,row=Math.floor(i/2);const x=70+col*590,y=225+row*185;box(s,`portal-${i}`,x,y,520,145,col===0?C.mint:C.cream);text(s,`portal-h-${i}`,v[0],x+28,y+25,450,35,26,C.forest,true);text(s,`portal-b-${i}`,v[1],x+28,y+76,450,40,22,C.ink,false)});
}

// 7 — segurança
{
 const s=deck.slides.add();s.background.fill=C.cream;title(s,'Privacidade faz parte do fluxo, não é um detalhe posterior',7);
 text(s,'security-thesis','Cada pessoa acessa somente o que pertence ao seu papel.',70,215,570,120,36,C.forest,true);
 bulletBlock(s,'security-list',['Sessões protegidas','Separação entre acesso profissional e paciente','Auditoria de ações clínicas','Backups e migrações controladas','Respostas do paciente revisadas pela profissional'],690,205,500,390);
 text(s,'security-foot','A ativação real acontece somente após validação do ambiente, migrações e teste final autenticado.',70,490,530,100,22,C.muted,false);
}

// 8 — piloto / encerramento
{
 const s=deck.slides.add();s.background.fill=C.white;await addImage(s,'Nutricionista',portrait,780,0,500,720);
 text(s,'pilot-kicker','PRÓXIMO PASSO',58,54,300,28,16,C.forest,true);
 text(s,'pilot-title','Começar pequeno,\naprender rápido.',58,155,650,150,54,C.ink,true);
 text(s,'pilot-copy','Proposta: configurar o sistema com a nutricionista, simular uma jornada completa e iniciar um piloto acompanhado.',58,345,620,110,26,C.muted,false);
 text(s,'pilot-steps','1. Configuração assistida\n2. Treinamento curto\n3. Uso piloto\n4. Ajustes com feedback real',58,505,530,145,23,C.forest,true);footer(s,8);
}

await fs.mkdir(renderDir,{recursive:true});
for(const [i,s] of deck.slides.items.entries()){
 const png=await deck.export({slide:s,format:'png',scale:1});
 await fs.writeFile(`${renderDir}/slide-${i+1}.png`,new Uint8Array(await png.arrayBuffer()));
 const layout=await s.export({format:'layout'});await fs.writeFile(`${renderDir}/slide-${i+1}.layout.json`,await layout.text());
}
const montage=await deck.export({format:'webp',montage:true,scale:1});await fs.writeFile(`${renderDir}/montage.webp`,new Uint8Array(await montage.arrayBuffer()));
const pptx=await PresentationFile.exportPptx(deck);await pptx.save(out);
