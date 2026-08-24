import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarDays,
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Clock3,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  HeartPulse,
  LockKeyhole,
  Mail,
  MessageCircle,
  Pill,
  Play,
  Plus,
  Printer,
  Save,
  Scale,
  Search,
  Send,
  Sparkles,
  Stethoscope,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  UtensilsCrossed,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { VideoConsultation } from '../components/VideoConsultation';
import { LaminasModal } from '../components/LaminasModal';
import { LabsList, SupplementsList, type Lab, type Supplement } from '../components/ClinicalLists';
import { PatientHistory } from '../components/PatientHistory';
import { EnergyCalculatorModal } from '../components/EnergyCalculatorModal';
import { FinishEncounterModal, type FinishEncounterData } from '../components/FinishEncounterModal';
import { api } from '../lib/api';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { formatAppointmentSchedule, getEndTime } from '../lib/formatters';
import { useConfirm } from '../components/ConfirmDialog';

type SectionKey='context'|'anamnesis'|'recall24h'|'followup'|'assessment'|'exams'|'conduct'|'plan'|'supplements'|'notes';
type Value=string|number|boolean|null;
type SectionData=Record<string,Value>;
type Patient={id:string;name:string;objective?:string|null;email?:string|null;whatsapp?:string|null};
type Checkin={id:string;answers:Record<string,unknown>;status:'PENDING_REVIEW'|'REVIEWED';submittedAt:string;reviewedAt?:string|null};
type Encounter={id:string;patientId:string;patientName:string;patientEmail?:string|null;objective?:string|null;appointmentId?:string|null;videoRoomToken?:string|null;appointmentDate?:string|null;appointmentTime?:string|null;durationMinutes?:number|null;appointmentType?:string|null;status:'IN_PROGRESS'|'COMPLETED';correctionOpen?:boolean;revisionCount?:number;startedAt:string;sections:Partial<Record<SectionKey,{data:SectionData;savedAt:string;version:number}>>;labs:Lab[];supplements:Supplement[];checkins:Checkin[]};
type Field={key:string;label:string;type?:'text'|'textarea'|'number'|'select'|'date'|'time';placeholder?:string;options?:string[];suffix?:string;profiles?:string[];group?:string;groupDescription?:string};
type Step={key:SectionKey|'review';label:string;description:string;fields?:Field[]};

type EncounterListItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string | null;
  objective?: string | null;
  appointmentId?: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED';
  startedAt: string;
  completedAt?: string | null;
  appointmentDate?: string | null;
  appointmentTime?: string | null;
  durationMinutes?: number | null;
  appointmentType?: string | null;
};

type AppointmentStatus = 'CONFIRMED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

type CalendarAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  whatsapp?: string | null;
  date: string;
  time: string;
  durationMinutes: number;
  type: string;
  price?: number | null;
  status: AppointmentStatus;
  notes?: string | null;
  meetingUrl?: string | null;
  patientResponse: 'PENDING' | 'CONFIRMED' | 'RESCHEDULE_REQUESTED';
  patientResponseNote?: string | null;
  encounterId?: string | null;
  encounterStatus?: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | null;
};

type AppointmentFormState = {
  patientId: string;
  date: string;
  time: string;
  durationMinutes: string;
  type: string;
  price: string;
  status: AppointmentStatus;
  notes: string;
  meetingUrl: string;
};

type AppointmentRequest = {
  id: string;
  patientId: string;
  patientName: string;
  preferredDate: string;
  preferredPeriod: 'MORNING' | 'AFTERNOON' | 'EVENING';
  appointmentType: string;
  notes?: string | null;
  status: 'PENDING';
};

const statusLabels: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmado',
  WAITING: 'Aguardando',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não compareceu',
};

const statusTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  CONFIRMED: ['CONFIRMED', 'WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  WAITING: ['WAITING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['IN_PROGRESS', 'COMPLETED'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
  NO_SHOW: ['NO_SHOW'],
};

const newAppointmentStatuses: AppointmentStatus[] = ['CONFIRMED', 'WAITING'];
const appointmentTypes = ['Avaliação Inicial', 'Presencial', 'Online (Teleconsulta)', 'Retorno de Avaliação', 'Retorno Online'];
const pad = (value: number) => String(value).padStart(2, '0');
const isoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayIso = isoDate(new Date());
const initialAppointmentForm = (date = todayIso): AppointmentFormState => ({
  patientId: '',
  date,
  time: '09:00',
  durationMinutes: '60',
  type: appointmentTypes[0],
  price: '250',
  status: 'CONFIRMED',
  notes: '',
  meetingUrl: '',
});

const yesNo=['Não','Sim'];
const steps:Step[]=[
 {key:'context',label:'Contexto',description:'Identificação social e motivo da consulta',fields:[
  {key:'mainComplaint',label:'Queixa principal',type:'textarea',placeholder:'O que trouxe o paciente à consulta?'},{key:'expectations',label:'Expectativas',type:'textarea'},{key:'consultationType',label:'Tipo de atendimento',type:'select',options:['Primeira consulta','Retorno','Reavaliação','Intercorrência']},
  {key:'education',label:'Escolaridade',type:'select',options:['Ensino Fundamental Incompleto','Ensino Fundamental Completo','Ensino Médio Incompleto','Ensino Médio Completo','Ensino Superior Incompleto','Ensino Superior Completo','Pós-graduação / Especialização','Mestrado / Doutorado']},{key:'profession',label:'Profissão'},{key:'maritalStatus',label:'Estado civil',type:'select',options:['Solteiro(a)','Casado(a) / União Estável','Divorciado(a)','Viúvo(a)','Outro']},{key:'income',label:'Renda familiar'},{key:'dependents',label:'Dependentes',type:'number'}]},
 {key:'anamnesis',label:'Anamnese',description:'História clínica, hábitos e alimentação',fields:[
  {key:'clinicalHistory',label:'Histórico de saúde e sintomas clínicos',type:'textarea',group:'História clínica',groupDescription:'Antecedentes, tratamentos e condições atuais.'},{key:'previousDietTreatment',label:'Tratamento dietético anterior',type:'textarea',group:'História clínica'},{key:'medications',label:'Medicamentos e suplementos em uso',type:'textarea',placeholder:'Nome, fabricante, dose, frequência, tempo de uso e motivo',group:'História clínica'},{key:'familyHistory',label:'Doenças na família e grau de parentesco',type:'textarea',placeholder:'Diabetes tipo 1/2, doenças cardiovasculares, hipertensão, doenças renais ou hepáticas, câncer, obesidade, tireoide, colesterol e outras',group:'História clínica'},{key:'vitaminDeficiency',label:'Carência de vitaminas diagnosticada',type:'textarea',group:'História clínica'},{key:'menopausePregnancies',label:'Menopausa, gestações e partos',type:'textarea',group:'História clínica'},
  {key:'allergies',label:'Alergias alimentares',type:'textarea',group:'Sinais, sintomas e tolerâncias',groupDescription:'Investigação digestiva e manifestações associadas.'},{key:'lactoseIntolerance',label:'Intolerância à lactose',type:'select',options:yesNo,group:'Sinais, sintomas e tolerâncias'},{key:'glutenIntolerance',label:'Intolerância ao glúten',type:'select',options:yesNo,group:'Sinais, sintomas e tolerâncias'},{key:'otherIntolerances',label:'Outras intolerâncias',type:'textarea',group:'Sinais, sintomas e tolerâncias'},{key:'clinicalSymptoms',label:'Sintomas associados',type:'textarea',placeholder:'Flatulência, aftas, bruxismo, azia, gastrite, úlcera, eructação, vômitos, enjoo, gases, diarreia ou outros',group:'Sinais, sintomas e tolerâncias'},{key:'chewing',label:'Mastigação',type:'select',options:['Lenta','Adequada','Rápida'],group:'Sinais, sintomas e tolerâncias'},{key:'digestionDifficulty',label:'Dificuldade de digestão',type:'select',options:yesNo,group:'Sinais, sintomas e tolerâncias'},{key:'digestionTriggerFoods',label:'Alimentos associados à dificuldade digestiva',type:'textarea',group:'Sinais, sintomas e tolerâncias'},{key:'bowelFunction',label:'Função intestinal',type:'select',options:['Regular','Constipação','Diarreia','Alternado'],group:'Sinais, sintomas e tolerâncias'},{key:'bowelFrequency',label:'Evacuações por dia e horário habitual',group:'Sinais, sintomas e tolerâncias'},{key:'edema',label:'Edema',type:'select',options:yesNo,group:'Sinais, sintomas e tolerâncias'},{key:'edemaLocation',label:'Local do edema',group:'Sinais, sintomas e tolerâncias'},
  {key:'smoking',label:'Tabagismo',type:'select',options:yesNo,group:'Hábitos e rotina',groupDescription:'Sono, substâncias, hidratação e movimento.'},{key:'alcohol',label:'Consumo de álcool',type:'select',options:['Não','Socialmente','Frequentemente'],group:'Hábitos e rotina'},{key:'waterIntake',label:'Ingestão hídrica diária',placeholder:'Ex.: 2 litros/dia',group:'Hábitos e rotina'},{key:'sleep',label:'Sono',type:'select',options:['Excelente / Reparador (7 a 9h)','Bom (6 a 8h)','Irregular / Acorda à noite','Insônia inicial (demora a dormir)','Insônia terminal (acorda cedo)','Menos de 6h por noite','Uso contínuo de indutores/fitoterápicos'],group:'Hábitos e rotina'},{key:'emotionalSymptoms',label:'Sintomas emocionais',type:'select',options:['Nenhum sintoma relevante','Ansiedade leve','Ansiedade moderada a alta','Estresse frequente / Sobrecarga','Compulsão por doces ou momentos de estresse','Oscilações frequentes de humor','Cansaço mental / Esgotamento','Outro'],group:'Hábitos e rotina'},{key:'physicalActivity',label:'Atividade física praticada',type:'textarea',placeholder:'Tipo, duração, horário e frequência semanal',group:'Hábitos e rotina'},
  {key:'foodRoutine',label:'Rotina alimentar atual',type:'textarea',group:'Inquérito alimentar',groupDescription:'Organização, comportamento e relação com os alimentos.'},{key:'whoCooks',label:'Quem cozinha?',group:'Inquérito alimentar'},{key:'whoShops',label:'Quem faz as compras?',group:'Inquérito alimentar'},{key:'mealLocations',label:'Local das refeições durante a semana e no fim de semana',type:'textarea',group:'Inquérito alimentar'},{key:'previousDiet',label:'Já seguiu alguma dieta? Como foi?',type:'textarea',group:'Inquérito alimentar'},{key:'recentWeightChange',label:'Alteração recente de peso e motivo',type:'textarea',group:'Inquérito alimentar'},{key:'liquidsWithMeals',label:'Consome líquidos nas refeições? Quais e quanto?',group:'Inquérito alimentar'},{key:'anxietyEating',label:'Quando fica ansioso(a), como muda sua alimentação?',type:'select',options:['Come mais','Come menos','Sem alteração','Não se aplica'],group:'Inquérito alimentar'},{key:'sweetenerUse',label:'Uso de adoçante: tipo e quantidade',group:'Inquérito alimentar'},{key:'hungerTime',label:'Horário do dia em que sente mais fome',group:'Inquérito alimentar'},{key:'flavorPreference',label:'Preferência de sabor',type:'select',options:['Doce','Salgado','Ambos','Sem preferência'],group:'Inquérito alimentar'},{key:'foodPreferences',label:'Preferências alimentares',type:'textarea',group:'Inquérito alimentar'},{key:'foodAversions',label:'Aversões alimentares',type:'textarea',group:'Inquérito alimentar'},{key:'bingeEatingHistory',label:'Compulsão alimentar: frequência, gatilhos e contexto',type:'textarea',group:'Inquérito alimentar'},
  {key:'physicalExamGeneral',label:'Impressão geral do exame físico',type:'textarea',group:'Avaliação Física',groupDescription:'Registre a condição observada e os achados relevantes em cada região.'},{key:'physicalFace',label:'Face',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalEyes',label:'Olhos',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalOralCavity',label:'Cavidade oral e dentes',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalTongue',label:'Língua',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalHair',label:'Cabelos',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalSkin',label:'Pele',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalNails',label:'Unhas',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalMusculoskeletal',label:'Sistema musculoesquelético',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalAbdomen',label:'Abdômen',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalLowerLimbs',label:'Membros inferiores',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalIntestinalNoises',label:'Ruídos intestinais',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalUrinary',label:'Aspectos urinários',type:'select',options:['Normal','Alterado','Não avaliado'],group:'Avaliação Física'},{key:'physicalExamNotes',label:'Observações do exame físico',type:'textarea',placeholder:'Descreva alterações, localização, intensidade e conduta relacionada',group:'Avaliação Física'},
  {key:'objective',label:'Objetivo do acompanhamento',type:'textarea',group:'Síntese clínica',groupDescription:'Conclusão profissional após a coleta.'},{key:'diagnosticSummary',label:'Diagnóstico e conduta inicial',type:'textarea',group:'Síntese clínica'}]},
 {key:'recall24h',label:'Recordatório 24h',description:'Consumo alimentar do dia anterior',fields:[
  {key:'wakeTime',label:'Horário que acordou',type:'time'},{key:'breakfast',label:'Café da manhã',type:'textarea',placeholder:'Horário, alimentos e quantidades'},{key:'morningSnack',label:'Lanche da manhã',type:'textarea'},{key:'lunch',label:'Almoço',type:'textarea'},{key:'afternoonSnack',label:'Lanche da tarde',type:'textarea'},{key:'dinner',label:'Jantar',type:'textarea'},{key:'supper',label:'Ceia',type:'textarea'},{key:'otherIntake',label:'Outros consumos e observações',type:'textarea'}]},
 {key:'assessment',label:'Avaliação corporal',description:'Antropometria, bioimpedância e energia',fields:[
  {key:'clinicalProfile',label:'Perfil de avaliação',type:'select',options:['Adulto','Gestante','Pediatria']},{key:'assessmentDate',label:'Data da avaliação',type:'date'},{key:'sex',label:'Sexo para cálculo energético',type:'select',options:['Feminino','Masculino']},{key:'age',label:'Idade',type:'number',suffix:'anos'},{key:'weight',label:'Peso',type:'number',suffix:'kg'},{key:'height',label:'Altura',type:'number',suffix:'cm'},
  {key:'prePregnancyWeight',label:'Peso pré-gestacional',type:'number',suffix:'kg',profiles:['Gestante']},{key:'gestationalWeek',label:'Semana gestacional',type:'number',suffix:'sem',profiles:['Gestante']},{key:'pregnancyNumber',label:'Número de gestações',type:'number',profiles:['Gestante']},{key:'pregnancySymptoms',label:'Sintomas e intercorrências gestacionais',type:'textarea',profiles:['Gestante']},
  {key:'birthWeight',label:'Peso ao nascer',type:'number',suffix:'kg',profiles:['Pediatria']},{key:'gestationalAgeAtBirth',label:'Idade gestacional ao nascer',type:'number',suffix:'sem',profiles:['Pediatria']},{key:'headCircumference',label:'Perímetro cefálico',type:'number',suffix:'cm',profiles:['Pediatria']},{key:'caregiver',label:'Responsável e vínculo',profiles:['Pediatria']},{key:'breastfeeding',label:'Aleitamento',type:'select',options:['Exclusivo','Misto','Encerrado','Não realizado'],profiles:['Pediatria']},{key:'foodIntroduction',label:'Introdução alimentar e desenvolvimento',type:'textarea',profiles:['Pediatria']},
  {key:'bodyFat',label:'Gordura corporal',type:'number',suffix:'%'},{key:'leanMass',label:'Massa magra',type:'number',suffix:'kg'},{key:'muscleMass',label:'Massa muscular',type:'number',suffix:'kg'},{key:'visceralFat',label:'Gordura visceral',type:'number'},{key:'bodyWater',label:'Água corporal',type:'number',suffix:'%'},{key:'metabolicAge',label:'Idade metabólica',type:'number'},
  {key:'neck',label:'Pescoço',type:'number',suffix:'cm'},{key:'arm',label:'Braço',type:'number',suffix:'cm'},{key:'chest',label:'Tórax',type:'number',suffix:'cm'},{key:'waist',label:'Cintura',type:'number',suffix:'cm'},{key:'abdomen',label:'Abdômen',type:'number',suffix:'cm'},{key:'hip',label:'Quadril',type:'number',suffix:'cm'},{key:'calf',label:'Panturrilha',type:'number',suffix:'cm'},
  {key:'activityFactor',label:'Fator de atividade',type:'select',options:['1.2 - Sedentário','1.375 - Leve','1.55 - Moderado','1.725 - Intenso','1.9 - Extremamente ativo']},{key:'bicipitalFold',label:'Dobra bicipital',type:'number',suffix:'mm'},{key:'tricipitalFold',label:'Dobra tricipital',type:'number',suffix:'mm'},{key:'suprailiacFold',label:'Dobra suprailíaca',type:'number',suffix:'mm'},{key:'subscapularFold',label:'Dobra subescapular',type:'number',suffix:'mm'},{key:'assessmentNotes',label:'Observações da avaliação',type:'textarea'}]},
 {key:'exams',label:'Exames',description:'Resultados e interpretação laboratorial',fields:[{key:'examDate',label:'Data dos exames',type:'date'},{key:'markers',label:'Marcadores e resultados',type:'textarea',placeholder:'Ex.: Glicemia 92 mg/dL; Ferritina 45 ng/mL'},{key:'referenceRanges',label:'Valores de referência',type:'textarea'},{key:'interpretation',label:'Interpretação clínica',type:'textarea'},{key:'pendingExams',label:'Exames a solicitar ou acompanhar',type:'textarea'}]},
 {key:'conduct',label:'Conduta',description:'Diagnóstico nutricional e próximos passos',fields:[{key:'diagnosticImpression',label:'Impressão diagnóstica nutricional',type:'textarea'},{key:'goals',label:'Metas acordadas',type:'textarea'},{key:'guidance',label:'Orientações e estratégia alimentar',type:'textarea'},{key:'followUp',label:'Prazo e plano de acompanhamento',type:'textarea'}]},
 {key:'plan',label:'Plano alimentar',description:'Refeições, TACO, receitas e macros'},
 {key:'supplements',label:'Suplementação',description:'Prescrição e orientações',fields:[{key:'prescription',label:'Suplementos e fitoterápicos',type:'textarea',placeholder:'Nome, dose, forma e posologia'},{key:'supplementGuidance',label:'Orientações adicionais',type:'textarea'}]},
 {key:'notes',label:'Anotações',description:'Evolução e registro clínico livre',fields:[{key:'evolution',label:'Evolução e conduta',type:'textarea'},{key:'privateNotes',label:'Anotações profissionais',type:'textarea'}]},
 {key:'followup',label:'Retorno',description:'Adesão, evolução e dificuldades',fields:[
  {key:'dietRating',label:'Avaliação da alimentação',type:'select',options:['Muito boa','Boa','Regular','Ruim']},{key:'planAdherence',label:'Seguimento do plano',type:'select',options:['Integral','Parcial','Não seguiu']},{key:'routineChanged',label:'Mudança de rotina',type:'select',options:yesNo},{key:'routineChangeDetails',label:'Qual mudança?'},
  {key:'difficultMeals',label:'Refeições com maior dificuldade'},{key:'hungerLevel',label:'Fome e saciedade',type:'select',options:['Normal / Equilibrada','Fome constante / Baixa saciedade','Fome emocional / Ansiedade','Pouca fome / Saciedade precoce','Fome noturna']},{key:'bingeEating',label:'Compulsão ou exageros',type:'select',options:yesNo},{key:'bingeContext',label:'Situações de compulsão'},{key:'dailyWater',label:'Água diária'},{key:'alcoholUse',label:'Consumo de álcool',type:'select',options:yesNo},{key:'alcoholFrequency',label:'Frequência do álcool',type:'select',options:['Não consome','Ocasional (1 a 2x/mês)','Finais de semana (1 a 2 doses)','Finais de semana (> 3 doses)','3 a 4 vezes por semana','Diário']},
  {key:'energy',label:'Energia e disposição',type:'select',options:['Excelente o dia todo','Boa com queda à tarde','Cansaço matinal','Fadiga constante / Falta de energia','Varia com o treino']},{key:'sleepChanges',label:'Alterações no sono',type:'select',options:['Nenhuma / Sono estável','Melhorou a qualidade','Dificuldade para dormir','Acorda cansado(a)','Sono mais leve']},{key:'newMedication',label:'Novo medicamento',type:'select',options:yesNo},{key:'newMedicationDetails',label:'Qual medicamento?'},{key:'activityStatus',label:'Atividade física',type:'select',options:['Não pratica','Iniciou','Manteve','Aumentou','Reduziu']},{key:'activityFrequency',label:'Frequência de atividade',type:'select',options:['Não pratica no momento','1 a 2 vezes por semana','3 a 4 vezes por semana','5 a 6 vezes por semana','Todos os dias (7x/semana)']},{key:'trainingPerformance',label:'Desempenho no treino',type:'select',options:['Excelente / Evoluindo cargas','Bom / Estável','Queda de rendimento / Cansaço','Iniciando / Em adaptação','Não se aplica']},
  {key:'perceivedWeightChange',label:'Mudança corporal percebida',type:'select',options:['Perda de peso visível / Roupas mais folgadas','Manutenção com melhora na composição','Aumento de massa muscular','Ganho de peso indesejado','Sem mudanças perceptíveis']},
  {key:'positiveResults',label:'Resultados positivos',type:'textarea'},{key:'mainDifficulties',label:'Maiores dificuldades',type:'textarea'},{key:'nextGoal',label:'Meta para o próximo período',type:'textarea'},{key:'desiredPlanAdjustment',label:'Ajustes desejados no plano',type:'textarea'},{key:'additionalNotes',label:'Observações do retorno',type:'textarea'}]},
 {key:'review',label:'Revisão',description:'Conferência e finalização'}
];

function missingClinicalCore(sections:Encounter['sections']){
 const missing:string[]=[];
 if(!sections.context)missing.push('Contexto');
 if(!sections.anamnesis&&!sections.followup)missing.push('Anamnese ou Retorno');
 if(!sections.conduct)missing.push('Conduta');
 return missing;
}

export function EncounterPage(){
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { endCall, minimizeCall, restoreCall, activeCall } = useTeleconsultation();
  const[params,setParams]=useSearchParams();const patientParam=params.get('paciente')||'';const appointmentParam=params.get('agendamento')||'';const videoParam=params.get('video')==='true';
  const[encounter,setEncounter]=useState<Encounter|null>(null);const[active,setActive]=useState(0);const[drafts,setDrafts]=useState<Partial<Record<SectionKey,SectionData>>>({});const[dirtyKeys,setDirtyKeys]=useState<Set<SectionKey>>(new Set());const[loading,setLoading]=useState(false);const[saving,setSaving]=useState(false);const[error,setError]=useState('');const[notice,setNotice]=useState('');const[videoOpen,setVideoOpen]=useState(videoParam);const[calcOpen,setCalcOpen]=useState(false);
  const[finishModalOpen,setFinishModalOpen]=useState(false);
  const[laminasOpen,setLaminasOpen]=useState(false);
  const loadEncounter=useCallback(async(id:string)=>{setLoading(true);try{const r=await api<{data:Encounter}>(`/api/encounters/${id}`);setEncounter(r.data);const loaded:Partial<Record<SectionKey,SectionData>>={};for(const key of steps.map(s=>s.key).filter(k=>k!=='review') as SectionKey[])loaded[key]=r.data.sections[key]?.data||{};setDrafts(loaded);setDirtyKeys(new Set())}catch(c){setError(c instanceof Error?c.message:'Erro ao abrir atendimento.')}finally{setLoading(false)}},[]);
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirtyKeys.size){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)},[dirtyKeys]);
  useEffect(()=>{const id=params.get('id');if(id){void loadEncounter(id)}else{setEncounter(null)}},[params,loadEncounter]);
  useEffect(()=>{
   window.scrollTo({ top: 0, behavior: 'smooth' });
   const stepper = document.querySelector('.clinical-stepper') || document.querySelector('.encounter-page');
   if (stepper) {
     stepper.scrollIntoView({ behavior: 'smooth', block: 'start' });
   }
  },[active]);
  useEffect(()=>{
    setVideoOpen(videoParam);
  },[videoParam]);
  const setSplitVisible=useCallback((visible:boolean)=>{
    setVideoOpen(visible);
    if(visible)restoreCall();else minimizeCall();
    setParams((prev)=>{
      const updated=new URLSearchParams(prev);
      if(visible)updated.set('video','true');else updated.delete('video');
      return updated;
    });
  },[minimizeCall,restoreCall,setParams]);
  useEffect(()=>{if(!patientParam||params.get('id'))return;let cancelled=false;setLoading(true);api<{data:{id:string}}>('/api/encounters',{method:'POST',body:JSON.stringify({patientId:patientParam,...(appointmentParam?{appointmentId:appointmentParam}:{})})}).then(r=>{if(!cancelled){setParams({id:r.data.id,...(videoParam?{video:'true'}:{})});void loadEncounter(r.data.id)}}).catch(c=>setError(c instanceof Error?c.message:'Erro ao iniciar atendimento.')).finally(()=>setLoading(false));return()=>{cancelled=true}},[patientParam,appointmentParam,videoParam,params,setParams,loadEncounter]);

  const current=steps[active];const savedKeys=useMemo(()=>new Set(Object.keys(encounter?.sections||{})),[encounter]);
  function change(key:SectionKey,field:string,value:string){setDrafts(d=>({...d,[key]:{...(d[key]||{}),[field]:value}}));setDirtyKeys(keys=>new Set(keys).add(key));setNotice('')}
  async function saveSection(){if(!encounter||current.key==='review')return;setSaving(true);setError('');try{const loadedSection=encounter.sections[current.key];await api(`/api/encounters/${encounter.id}/sections/${current.key}`,{method:'PUT',body:JSON.stringify({data:drafts[current.key]||{},expectedVersion:loadedSection?.version??null,...(loadedSection?.version===undefined?{expectedSavedAt:loadedSection?.savedAt||null}:{})})});await loadEncounter(encounter.id);setNotice('Etapa salva com segurança.');if(active<steps.length-1)setActive(active+1)}catch(c){setError(c instanceof Error?c.message:'Não foi possível salvar a etapa.')}finally{setSaving(false)}}
  function requestFinalize() {
    if (!encounter) return;
    setFinishModalOpen(true);
  }

  async function handleDiscardEncounter() {
    if (!encounter) return;
    if (await confirm({title:'Descartar atendimento?',message:'O atendimento em andamento será cancelado e a sala de vídeo será fechada imediatamente.',confirmLabel:'Descartar atendimento',tone:'destructive'})) {
      setSaving(true);
      setError('');
      try {
        await api(`/api/encounters/${encounter.id}`, { method: 'DELETE' });
        endCall();
        setVideoOpen(false);
        sessionStorage.removeItem(`in_call_${encounter.id}`);
        if (encounter.appointmentId) sessionStorage.removeItem(`in_call_${encounter.appointmentId}`);
        navigate('/agenda');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível descartar o atendimento.');
      } finally {
        setSaving(false);
      }
    }
  }

  async function handleQuickClose() {
    if (!encounter) return;
    if (await confirm({title:'Encerrar atendimento?',message:'O atendimento será marcado como concluído imediatamente. Confira se os registros necessários já foram salvos.',confirmLabel:'Encerrar atendimento',tone:'warning'})) {
      setSaving(true);
      setError('');
      try {
        await api(`/api/encounters/${encounter.id}/quick-close`, { method: 'PATCH' });
        endCall();
        setVideoOpen(false);
        sessionStorage.removeItem(`in_call_${encounter.id}`);
        if (encounter.appointmentId) sessionStorage.removeItem(`in_call_${encounter.appointmentId}`);
        await loadEncounter(encounter.id);
        setNotice('Atendimento concluído com sucesso.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao encerrar atendimento.');
      } finally {
        setSaving(false);
      }
    }
  }

  async function handleConfirmFinalize(data: FinishEncounterData) {
    if (!encounter) return;
    setSaving(true);
    setError('');
    try {
      const response = await api<{ data: { id: string; emailSent?: boolean; emailWarning?: string | null } }>(`/api/encounters/${encounter.id}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ ...data, force: true }),
      });
      endCall();
      setVideoOpen(false);
      sessionStorage.removeItem(`in_call_${encounter.id}`);
      if (encounter.appointmentId) sessionStorage.removeItem(`in_call_${encounter.appointmentId}`);
      await loadEncounter(encounter.id);
      setFinishModalOpen(false);
      if (response.data.emailSent) {
        setNotice('✨ Atendimento finalizado com sucesso! E-mail com orientações, plano alimentar e lâminas nutricionais enviado ao paciente.');
      } else {
        setNotice(response.data.emailWarning || 'Atendimento finalizado com sucesso.');
      }
    } catch (c) {
      setError(c instanceof Error ? c.message : 'Não foi possível finalizar o atendimento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReopenEncounter() {
    if (!encounter || !(await confirm({title:'Abrir modo de correção?',message:'O prontuário continuará finalizado, mas seus campos poderão ser corrigidos. A ação ficará registrada no histórico de auditoria.',confirmLabel:'Abrir correção'}))) return;
    setSaving(true);
    setError('');
    try {
      await api(`/api/encounters/${encounter.id}/reopen`, { method: 'POST' });
      await loadEncounter(encounter.id);
      setNotice('Modo de correção aberto. O prontuário continua arquivado como finalizado e a consulta não foi reativada.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível reabrir o prontuário.');
    } finally {
      setSaving(false);
    }
  }

 if (loading && !encounter) {
    return (
      <div
        className="panel empty-state"
        style={{
          minHeight: '420px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: '#ffffff',
          borderRadius: '16px',
        }}
      >
        <span className="spinner" style={{ width: '38px', height: '38px', borderWidth: '3.5px' }} />
        <strong style={{ fontSize: '1.05rem', color: 'var(--forest)' }}>
          Carregando atendimento clínico...
        </strong>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
          Sincronizando prontuário, etapas e dados da teleconsulta.
        </p>
      </div>
    );
  }

  if(!encounter) {
   return (
     <EncounterHub
       onSelectEncounter={(id, openVideo) => {
         setParams({ id, ...(openVideo ? { video: 'true' } : {}) });
         void loadEncounter(id);
         if (openVideo) setVideoOpen(true);
       }}
     />
   );
 }

 const key=current.key as SectionKey;const assessment=drafts.assessment||{};const profile=String(assessment.clinicalProfile||'Adulto');const weight=Number(assessment.weight);const height=Number(assessment.height);const age=Number(assessment.age);const bmi=weight>0&&height>0?(weight/(height/100)**2).toFixed(1):null;const whr=Number(assessment.waist)>0&&Number(assessment.hip)>0?(Number(assessment.waist)/Number(assessment.hip)).toFixed(2):null;const activityFactor=parseFloat(String(assessment.activityFactor||'1.375'))||1.375;const bmr=weight>0&&height>0&&age>0?10*weight+6.25*height-5*age+(assessment.sex==='Masculino'?5:-161):null;const totalEnergy=bmr?Math.round(bmr*activityFactor):null;const gestationalGain=profile==='Gestante'&&Number(assessment.prePregnancyWeight)>0?(weight-Number(assessment.prePregnancyWeight)).toFixed(1):null;
 const visibleFields=current.fields?.filter(field=>!field.profiles||field.profiles.includes(profile))||[];
 const fieldGroups=visibleFields.reduce<Array<{name:string;description?:string;fields:Field[]}>>((groups,field)=>{
  const name=field.group||'';
  const existing=groups.find(group=>group.name===name);
  if(existing)existing.fields.push(field);else groups.push({name,description:field.groupDescription,fields:[field]});
  return groups;
 },[]);
 const roomToken=encounter.videoRoomToken||encounter.id;

 function handleApplyEnergy(results: { tmb: number; vet: number; targetKcal: number; proteinGrams: number; carbsGrams: number; fatGrams: number }) {
    setDrafts(d => ({
      ...d,
      assessment: {
        ...(d.assessment || {}),
        assessmentNotes: d.assessment?.assessmentNotes ? `${d.assessment.assessmentNotes}\n\nMeta Calórica: ${results.targetKcal} kcal/dia | VET: ${results.vet} kcal | TMB: ${results.tmb} kcal\nDistribuição: Proteínas: ${results.proteinGrams}g | Carboidratos: ${results.carbsGrams}g | Gorduras: ${results.fatGrams}g` : `Meta Calórica: ${results.targetKcal} kcal/dia | VET: ${results.vet} kcal | TMB: ${results.tmb} kcal\nDistribuição: Proteínas: ${results.proteinGrams}g | Carboidratos: ${results.carbsGrams}g | Gorduras: ${results.fatGrams}g`,
      },
      conduct: {
        ...(d.conduct || {}),
        guidance: d.conduct?.guidance ? `${d.conduct.guidance}\n\nPrescrição: ${results.targetKcal} kcal/dia (${results.proteinGrams}g Prot / ${results.carbsGrams}g Carb / ${results.fatGrams}g Gord)` : `Prescrição: ${results.targetKcal} kcal/dia (${results.proteinGrams}g Prot / ${results.carbsGrams}g Carb / ${results.fatGrams}g Gord)`,
      }
    }));
    setDirtyKeys(k => new Set(k).add('assessment').add('conduct'));
    setNotice('Meta calórica e macronutrientes aplicados com sucesso à Avaliação e Conduta!');
  }

  const correctionOpen=encounter.status==='COMPLETED'&&Boolean(encounter.correctionOpen);
  const canEdit=encounter.status==='IN_PROGRESS'||correctionOpen;
  return (
    <div className={`virtual-office ${videoOpen?'with-video':''}`}>
      {videoOpen && (
        <VideoConsultation
          encounterId={encounter.id}
          appointmentId={encounter.appointmentId}
          roomToken={roomToken}
          patientName={encounter.patientName}
          appointmentTime={encounter.appointmentTime}
          durationMinutes={encounter.durationMinutes}
          sections={drafts}
          onClose={()=>setSplitVisible(false)}
        />
      )}
      <div className="encounter-page">
        <button
          type="button"
          className="encounter-return-link"
          onClick={async () => {
            if (dirtyKeys.size > 0 && !(await confirm({title:'Descartar alterações não salvas?',message:'Existem alterações nesta etapa que ainda não foram salvas. Ao voltar, elas serão perdidas.',confirmLabel:'Voltar sem salvar',tone:'warning'}))) {
              return;
            }
            setParams({});
            setEncounter(null);
          }}
        >
          <ArrowLeft size={14} /> Voltar para a Central de Atendimentos
        </button>

        <section className="encounter-header">
          <div className="encounter-header-main">
            <div className="patient-avatar large">{encounter.patientName.charAt(0)}</div>
            <div className="encounter-patient-meta">
              <div className="encounter-title-row">
                <span className="eyebrow">Atendimento Clínico</span>
                <span className={`encounter-state ${encounter.status==='COMPLETED'?'done':''}`}>
                  {correctionOpen?<><Edit3 size={13}/> Em correção</>:encounter.status==='COMPLETED'?<><CheckCircle2 size={13}/> Finalizado</>:'Em andamento'}
                </span>
                {!encounter.appointmentId && (
                  <span className="walkin-pill-tag">Consulta Avulsa / Imediata</span>
                )}
              </div>
              <h2>{encounter.patientName}</h2>
              <p>{encounter.objective||'Objetivo não informado'}{encounter.appointmentTime ? ` · Consulta: ${formatAppointmentSchedule(encounter.appointmentTime, encounter.durationMinutes || 60)}` : ` · Iniciado em ${new Date(encounter.startedAt).toLocaleDateString('pt-BR')}`}</p>
            </div>
          </div>

          <div className="encounter-header-actions">
            <button type="button" className="secondary-button" onClick={()=>setLaminasOpen(true)} title="Abrir Lâminas Educativas A4 para o paciente">
              <BookOpen size={15}/> <span>Lâminas A4</span>
            </button>
            <button type="button" className="secondary-button" onClick={()=>setCalcOpen(true)} title="Calcular Gasto Energético (VET & TMB)">
              <Calculator size={15}/> <span>VET / TMB</span>
            </button>
            {encounter.status !== 'COMPLETED' && (
              <button
                className={`secondary-button video-toggle-btn ${videoOpen ? 'active' : ''}`}
                onClick={() => setSplitVisible(!videoOpen)}
                title={videoOpen ? 'Recolher para miniplayer flutuante' : 'Abrir teleconsulta lado a lado'}
              >
                <Video size={15} /> <span>{videoOpen ? 'Minimizar (Split)' : 'Teleconsulta (Split)'}</span>
              </button>
            )}
            {canEdit ? (
              <>
                <button
                  type="button"
                  className="primary-button finish-top-btn"
                  onClick={requestFinalize}
                  title="Concluir este atendimento clínico e liberar orientações"
                  style={{ background: '#1b4332', color: '#ffffff' }}
                >
                  <CheckCircle2 size={15} /> <span>{correctionOpen?'Concluir correção':'Encerrar Atendimento'}</span>
                </button>
                {!correctionOpen&&<button
                  type="button"
                  className="secondary-button discard-top-btn"
                  onClick={handleDiscardEncounter}
                  title="Cancelar ou descartar este atendimento"
                  style={{ color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  <Trash2 size={15} /> <span>Descartar</span>
                </button>}
              </>
            ) : (
              <>
                <button type="button" className="secondary-button" onClick={handleReopenEncounter} disabled={saving}>
                  <Edit3 size={15} /> <span>Reabrir para editar</span>
                </button>
                <button type="button" className="primary-button" disabled title="Atendimento já encerrado">
                  <CheckCircle2 size={15} /> <span>Atendimento encerrado</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* ── BANNER DE NOTIFICAÇÃO: ATENDIMENTO SEM CONSULTA AGENDADA ── */}
        {!encounter.appointmentId && (
          <div className="walkin-notification-banner">
            <div className="walkin-banner-info">
              <div className="walkin-badge">
                <Sparkles size={14} /> Atendimento sem agendamento prévio
              </div>
              <p>
                Este atendimento foi iniciado de forma direta para <strong>{encounter.patientName}</strong>. A sala de teleconsulta, transmissão de lâminas e o prontuário clínico estão sincronizados em tempo real.
              </p>
            </div>
            <div className="walkin-banner-actions">
              <button
                type="button"
                className="walkin-copy-btn"
                onClick={() => {
                  const directLink = `${window.location.origin}/videocall.html?room=${encodeURIComponent('nutri-' + roomToken)}&name=${encodeURIComponent(encounter.patientName)}&role=participant`;
                  navigator.clipboard.writeText(directLink).then(() => {
                    setNotice('Link da teleconsulta copiado! Você pode enviar no WhatsApp do paciente.');
                  });
                }}
              >
                <Copy size={14} /> Copiar link de teleconsulta
              </button>
            </div>
          </div>
        )}

        <nav className="clinical-stepper" aria-label="Etapas do atendimento">
          {steps.map((step,index)=>(
            <button
              key={step.key}
              type="button"
              className={`${active===index?'active ':''}${step.key!=='review'&&savedKeys.has(step.key)?'saved':''}`}
              onClick={()=>setActive(index)}
              title={`${step.label}: ${step.description}`}
            >
              <span>{step.key!=='review'&&savedKeys.has(step.key)?<Check size={15}/>:index+1}</span>
              <div>
                <strong>{step.label}</strong>
                <small>{step.description}</small>
              </div>
            </button>
          ))}
        </nav>

        {error&&<div className="form-error">{error}</div>}
        {notice&&<div className="form-success"><CheckCircle2 size={17}/>{notice}</div>}
        
        <ClinicalSnapshot encounter={encounter} reload={()=>void loadEncounter(encounter.id)}/>
        <details className="history-drawer"><summary>Histórico e evolução do paciente</summary><PatientHistory patientId={encounter.patientId}/></details>
        
        <section className="panel clinical-workspace">
          <div className="clinical-title">
            <div>
              <span className="eyebrow">Etapa {active+1} de {steps.length}</span>
              <h2>{current.label}</h2>
              <p>{current.description}</p>
            </div>
            {current.key!=='review'&& (
              <span className={`save-indicator ${savedKeys.has(current.key)&&!dirtyKeys.has(current.key)?'saved':''}`}>
                {dirtyKeys.has(current.key)?'Alterações não salvas':savedKeys.has(current.key)?<><Check size={14}/> Salvo</>:'Ainda não salvo'}
              </span>
            )}
          </div>
          
          {current.key==='review' ? (
            <Review encounter={encounter} dirty={dirtyKeys.size>0} onFinalize={requestFinalize} saving={saving} onNavigateStep={(index)=>setActive(index)}/>
          ) : current.key==='plan' ? (
            <EncounterPlan encounterId={encounter.id} planId={String(encounter.sections.plan?.data.planId||'')} onCreated={()=>void loadEncounter(encounter.id)}/>
          ) : current.key==='exams' ? (
            <LabsList encounterId={encounter.id} initial={encounter.labs||[]} locked={encounter.status==='COMPLETED'} reload={()=>void loadEncounter(encounter.id)}/>
          ) : current.key==='supplements' ? (
            <SupplementsList encounterId={encounter.id} initial={encounter.supplements||[]} locked={encounter.status==='COMPLETED'} reload={()=>void loadEncounter(encounter.id)}/>
          ) : (
            <>
              <div className={`clinical-form${fieldGroups.some(group=>group.name)?' grouped':''}`}>
                {fieldGroups.map(group=>(
                  <section className="clinical-field-group" key={group.name||'default'}>
                    {group.name&&<header><h3>{group.name}</h3>{group.description&&<p>{group.description}</p>}</header>}
                    <div className="clinical-field-grid">
                      {group.fields.map(field=>(
                        <label key={field.key} className={field.type==='textarea'?'wide':''}>
                          {field.label}
                          <div className={field.suffix?'field-suffix':''}>
                            {field.type==='textarea'? (
                              <textarea rows={4} value={String(drafts[key]?.[field.key]||'')} onChange={e=>change(key,field.key,e.target.value)} placeholder={field.placeholder} disabled={!canEdit}/>
                            ) : field.type==='select'? (
                              <select value={String(drafts[key]?.[field.key]||'')} onChange={e=>change(key,field.key,e.target.value)} disabled={!canEdit}>
                                <option value="">Selecione</option>
                                {field.options?.map(option=><option key={option}>{option}</option>)}
                              </select>
                            ) : (
                              <input type={field.type||'text'} step={field.type==='number'?'0.1':undefined} value={String(drafts[key]?.[field.key]||'')} onChange={e=>change(key,field.key,e.target.value)} placeholder={field.placeholder} disabled={!canEdit}/>
                            )}
                            {field.suffix&&<span>{field.suffix}</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              {current.key==='assessment'&&(bmi||whr||bmr)&& (
                <div className="bmi-result assessment-results">
                  <span>Indicadores calculados · {profile}</span>
                  <div>
                    {bmi&&<strong>IMC {bmi}</strong>}
                    {whr&&<strong>RCQ {whr}</strong>}
                    {bmr&&<strong>TMB {Math.round(bmr)} kcal</strong>}
                    {totalEnergy&&<strong>VET {totalEnergy} kcal</strong>}
                    {gestationalGain&&<strong>Ganho gestacional {gestationalGain} kg</strong>}
                  </div>
                  <small>Indicadores de apoio; a interpretação depende do perfil, idade e contexto clínico.</small>
                </div>
              )}
            </>
          )}

          <div className="clinical-footer">
            <button className="secondary-button" onClick={()=>setActive(Math.max(0,active-1))} disabled={active===0}>
              <ChevronLeft size={17}/> Anterior
            </button>
            {current.key!=='review'&&current.key!=='plan'&& (
              <div>
                <button className="ghost-button" onClick={()=>setActive(Math.min(steps.length-1,active+1))} disabled={!canEdit}>
                  Avançar sem salvar
                </button>
                <button className="primary-button" onClick={()=>void saveSection()} disabled={saving||!canEdit}>
                  <Save size={17}/>{saving?'Salvando...':'Salvar e continuar'}<ChevronRight size={16}/>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <EnergyCalculatorModal
        isOpen={calcOpen}
        onClose={()=>setCalcOpen(false)}
        initialWeight={weight||70}
        initialHeight={height||165}
        initialAge={age||30}
        initialGender={assessment.sex==='Masculino'?'MALE':'FEMALE'}
        onApplyResults={handleApplyEnergy}
      />

      <LaminasModal
        isOpen={laminasOpen}
        onClose={()=>setLaminasOpen(false)}
        patientName={encounter?.patientName}
        onBroadcast={encounter ? async (lamina) => {
          const targetId = encounter.appointmentId || encounter.id;
          try {
            await api(`/api/video/appointments/${targetId}/broadcast`, {
              method: 'POST',
              body: JSON.stringify({
                activeTab: 'lamina',
                customTitle: lamina.title,
                customNote: lamina.summary,
                laminaData: {
                  id: lamina.id,
                  title: lamina.title,
                  summary: lamina.summary,
                  tips: lamina.tips,
                  categoryLabel: lamina.categoryLabel,
                  icon: lamina.icon,
                },
              }),
            });
            setNotice(`Lâmina "${lamina.title}" transmitida na tela do paciente!`);
          } catch {}
        } : undefined}
      />

      {finishModalOpen && encounter && (
        <FinishEncounterModal
          patientName={encounter.patientName}
          patientEmail={encounter.patientEmail}
          loading={saving}
          onClose={()=>setFinishModalOpen(false)}
          onConfirm={handleConfirmFinalize}
        />
      )}
    </div>
  );
}

function EncounterHub({
  onSelectEncounter,
}: {
  onSelectEncounter: (id: string, openVideo?: boolean) => void;
}) {
  const confirm = useConfirm();
  const location = useLocation();
  const [encounters, setEncounters] = useState<EncounterListItem[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<CalendarAppointment[]>([]);
  const [monthAppointments, setMonthAppointments] = useState<CalendarAppointment[]>([]);
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [activeTab, setActiveTab] = useState<'calendar' | 'today' | 'in_progress' | 'completed'>('calendar');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(() => initialAppointmentForm());
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isRebooking, setIsRebooking] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInPatientId, setWalkInPatientId] = useState('');
  const [startingWalkIn, setStartingWalkIn] = useState(false);

  const range = useMemo(
    () => ({
      from: isoDate(new Date(month.getFullYear(), month.getMonth(), 1)),
      to: isoDate(new Date(month.getFullYear(), month.getMonth() + 1, 0)),
    }),
    [month]
  );

  const calendarCells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [month]);

  const loadHubData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [encRes, todayAppRes, monthAppRes, reqRes, patRes] = await Promise.all([
        api<{ data: EncounterListItem[] }>('/api/encounters'),
        api<{ data: CalendarAppointment[] }>(`/api/appointments?from=${todayIso}&to=${todayIso}`),
        api<{ data: CalendarAppointment[] }>(`/api/appointments?from=${range.from}&to=${range.to}`),
        api<{ data: AppointmentRequest[] }>('/api/appointments/requests').catch(() => ({ data: [] as AppointmentRequest[] })),
        api<{ data: Patient[] }>('/api/patients'),
      ]);

      setEncounters(encRes.data || []);
      setTodayAppointments(todayAppRes.data || []);
      setMonthAppointments(monthAppRes.data || []);
      setRequests(reqRes.data || []);
      setPatients(patRes.data || []);

      if (location.pathname === '/atendimentos') {
        const inProg = encRes.data?.filter((e) => e.status === 'IN_PROGRESS') || [];
        if (inProg.length > 0) {
          setActiveTab('in_progress');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agenda e atendimentos.');
    } finally {
      setLoading(false);
    }
  }, [range, location.pathname]);

  useEffect(() => {
    void loadHubData();
  }, [loadHubData]);

  async function handleStartAppointment(appointment: CalendarAppointment | { id: string; patientId: string }) {
    try {
      const res = await api<{ data: { id: string } }>('/api/encounters', {
        method: 'POST',
        body: JSON.stringify({
          patientId: appointment.patientId,
          appointmentId: appointment.id,
        }),
      });
      onSelectEncounter(res.data.id, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar a consulta.');
    }
  }

  async function handleStartWalkIn() {
    if (!walkInPatientId) return;
    setStartingWalkIn(true);
    setError('');
    try {
      const res = await api<{ data: { id: string } }>('/api/encounters', {
        method: 'POST',
        body: JSON.stringify({ patientId: walkInPatientId }),
      });
      setWalkInOpen(false);
      onSelectEncounter(res.data.id, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o atendimento avulso.');
    } finally {
      setStartingWalkIn(false);
    }
  }

  function showCreateAppointment(date = selectedDate) {
    setRequestId(null);
    setEditingAppointmentId(null);
    setIsRebooking(false);
    setAppointmentForm(initialAppointmentForm(date));
    setAppointmentModalOpen(true);
  }

  function showEditAppointment(item: CalendarAppointment) {
    setRequestId(null);
    setEditingAppointmentId(item.id);
    setIsRebooking(item.patientResponse === 'RESCHEDULE_REQUESTED');
    setAppointmentForm({
      patientId: item.patientId,
      date: item.date.slice(0, 10),
      time: item.time.slice(0, 5),
      durationMinutes: String(item.durationMinutes),
      type: item.type,
      price: item.price == null ? '' : String(item.price),
      status: item.status,
      notes: item.notes || '',
      meetingUrl: item.meetingUrl || '',
    });
    setAppointmentModalOpen(true);
  }

  function approveRequest(item: AppointmentRequest) {
    const time = { MORNING: '09:00', AFTERNOON: '14:00', EVENING: '18:00' }[item.preferredPeriod];
    setRequestId(item.id);
    setEditingAppointmentId(null);
    setIsRebooking(false);
    setAppointmentForm({
      ...initialAppointmentForm(item.preferredDate),
      patientId: item.patientId,
      time,
      type: item.appointmentType,
      notes: item.notes || '',
    });
    setSelectedDate(item.preferredDate);
    setMonth(new Date(`${item.preferredDate}T12:00:00`));
    setAppointmentModalOpen(true);
  }

  async function declineRequest(item: AppointmentRequest) {
    if (!(await confirm({title:'Recusar solicitação?',message:`A solicitação de ${item.patientName} será recusada e o paciente será avisado no portal.`,confirmLabel:'Recusar',tone:'warning'}))) return;
    try {
      await api(`/api/appointments/requests/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DECLINED' }),
      });
      setNotice('Solicitação atualizada e paciente notificado no portal.');
      await loadHubData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a solicitação.');
    }
  }

  async function saveAppointment(event: FormEvent) {
    event.preventDefault();
    setSavingAppointment(true);
    setError('');
    setNotice('');

    const now = new Date();
    const currentHourMin = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const isPastDate = appointmentForm.date < todayIso;
    const isPastTimeToday = appointmentForm.date === todayIso && appointmentForm.time < currentHourMin;

    if (!editingAppointmentId && (isPastDate || isPastTimeToday)) {
      if (
        !(await confirm({title:'Registrar consulta retroativa?',message:`O horário selecionado (${appointmentForm.time} em ${appointmentForm.date.split('-').reverse().join('/')}) já passou. Confirme apenas se esse registro for intencional.`,confirmLabel:'Registrar mesmo assim',tone:'warning'}))
      ) {
        setSavingAppointment(false);
        return;
      }
    }

    try {
      const payload = {
        patientId: appointmentForm.patientId,
        date: appointmentForm.date,
        time: appointmentForm.time,
        durationMinutes: Number(appointmentForm.durationMinutes),
        type: appointmentForm.type,
        price: appointmentForm.price ? Number(appointmentForm.price) : undefined,
        status: appointmentForm.status,
        notes: appointmentForm.notes || undefined,
        meetingUrl: appointmentForm.meetingUrl || undefined,
        ...(!editingAppointmentId && requestId ? { requestId } : {}),
      };

      if (editingAppointmentId) {
        const result = await api<{ data: { emailSent: boolean | null; warning?: string | null } }>(
          `/api/appointments/${editingAppointmentId}`,
          { method: 'PATCH', body: JSON.stringify(payload) }
        );
        setNotice(
          result.data.emailSent
            ? 'Consulta atualizada e paciente avisado por e-mail e no portal.'
            : result.data.warning || 'Consulta atualizada e paciente notificado no portal.'
        );
      } else {
        const result = await api<{ data: { emailSent: boolean; warning?: string | null } }>(
          '/api/appointments',
          { method: 'POST', body: JSON.stringify(payload) }
        );
        setNotice(
          result.data.emailSent
            ? 'Consulta criada e confirmação enviada por e-mail.'
            : result.data.warning || 'Consulta criada.'
        );
      }

      setAppointmentModalOpen(false);
      setRequestId(null);
      setEditingAppointmentId(null);
      setSelectedDate(appointmentForm.date);
      await loadHubData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a consulta.');
    } finally {
      setSavingAppointment(false);
    }
  }

  async function updateAppointmentStatus(item: CalendarAppointment, status: AppointmentStatus) {
    try {
      const result = await api<{ data: { emailSent: boolean | null; warning?: string | null } }>(
        `/api/appointments/${item.id}`,
        { method: 'PATCH', body: JSON.stringify({ status }) }
      );
      if (status === 'CANCELLED') {
        setNotice(
          result.data.emailSent
            ? 'Consulta cancelada e paciente avisado por e-mail e no portal.'
            : result.data.warning || 'Consulta cancelada e paciente notificado no portal.'
        );
      }
      await loadHubData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível alterar o status.');
    }
  }

  async function discardAppointment(id: string) {
    if (!(await confirm({title:'Descartar agendamento?',message:'O agendamento será removido definitivamente. A ação só é permitida quando não existe prontuário vinculado.',confirmLabel:'Descartar agendamento',tone:'destructive'}))) return;
    setSavingAppointment(true);
    setError('');
    try {
      await api(`/api/appointments/${id}`, { method: 'DELETE' });
      setAppointmentModalOpen(false);
      setEditingAppointmentId(null);
      setNotice('Agendamento descartado com segurança.');
      await loadHubData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível descartar o agendamento.');
    } finally {
      setSavingAppointment(false);
    }
  }

  function getWhatsAppLink(item: CalendarAppointment) {
    if (!item.whatsapp) return null;
    const cleanPhone = item.whatsapp.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    const isOnline = item.type.toLowerCase().includes('online') || item.type.toLowerCase().includes('tele');
    const dateFormatted = new Date(`${item.date.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR');
    const callUrl = item.meetingUrl || `${window.location.origin}/teleconsulta/${item.id}`;

    const text = isOnline
      ? `Olá, ${item.patientName}! 🎥 Sua teleconsulta nutricional está confirmada para ${dateFormatted} às ${item.time}. Acesse a sala virtual da nossa chamada no link: ${callUrl}. Até já!`
      : `Olá, ${item.patientName}! 🌿 Passando para confirmar sua consulta nutricional agendada para ${dateFormatted} às ${item.time}. Nos vemos em breve!`;

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  }

  async function handleQuickClose(id: string, patientName: string) {
    if (!(await confirm({title:'Encerrar e arquivar?',message:`O atendimento de ${patientName} será concluído e movido para o Histórico de Realizados.`,confirmLabel:'Encerrar atendimento',tone:'warning'}))) {
      return;
    }
    try {
      await api(`/api/encounters/${id}/quick-close`, { method: 'PATCH' });
      await loadHubData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encerrar atendimento.');
    }
  }

  async function handleDeleteEncounter(id: string, patientName: string) {
    if (!(await confirm({title:'Excluir prontuário permanentemente?',message:`O atendimento de ${patientName} será removido de forma permanente. Esta ação não pode ser desfeita.`,confirmLabel:'Excluir prontuário',tone:'destructive'}))) {
      return;
    }
    try {
      await api(`/api/encounters/${id}`, { method: 'DELETE' });
      await loadHubData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir atendimento.');
    }
  }

  async function handleBulkCloseAll() {
    if (!inProgressList.length) return;
    if (!(await confirm({title:'Encerrar atendimentos em lote?',message:`Os ${inProgressList.length} atendimentos em andamento serão concluídos e movidos para o Histórico.`,confirmLabel:'Encerrar todos',tone:'warning'}))) {
      return;
    }
    try {
      await api('/api/encounters/bulk-close', {
        method: 'POST',
        body: JSON.stringify({ ids: inProgressList.map((e) => e.id) }),
      });
      await loadHubData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao encerrar atendimentos.');
    }
  }

  const inProgressList = encounters.filter((e) => e.status === 'IN_PROGRESS');
  const completedList = encounters.filter((e) => e.status === 'COMPLETED');
  const selectedDateAppointments = monthAppointments.filter(
    (item) => item.date.slice(0, 10) === selectedDate
  );

  const filteredInProgress = inProgressList.filter(
    (e) =>
      e.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (e.objective && e.objective.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredToday = todayAppointments.filter(
    (a) =>
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCompleted = completedList.filter(
    (e) =>
      e.patientName.toLowerCase().includes(search.toLowerCase()) ||
      (e.appointmentType && e.appointmentType.toLowerCase().includes(search.toLowerCase()))
  );

  const editingAppointment = editingAppointmentId
    ? monthAppointments.find((item) => item.id === editingAppointmentId)
    : undefined;

  const scheduleChanged = Boolean(
    editingAppointment &&
      (appointmentForm.date !== editingAppointment.date.slice(0, 10) ||
        appointmentForm.time !== editingAppointment.time.slice(0, 5))
  );

  const formStatuses = editingAppointment
    ? [
        ...new Set([
          ...statusTransitions[editingAppointment.status],
          ...(scheduleChanged && ['CANCELLED', 'NO_SHOW'].includes(editingAppointment.status)
            ? newAppointmentStatuses
            : []),
        ]),
      ]
    : newAppointmentStatuses;

  return (
    <div className="encounter-hub">
      <header className="encounter-hub-header">
        <div className="encounter-hub-title">
          <div className="encounter-hub-icon">
            <CalendarDays size={26} />
          </div>
          <div>
            <h1>Agenda & Atendimentos</h1>
            <p>
              Organize horários, acompanhe consultas do dia, retome atendimentos em andamento e acesse o histórico clínico completo.
            </p>
          </div>
        </div>

        <div className="encounter-hub-header-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => showCreateAppointment()}
            title="Agendar uma nova consulta na agenda"
          >
            <Plus size={16} /> Nova Consulta
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => setWalkInOpen(true)}
            title="Iniciar atendimento sem agendamento prévio (Encaixe)"
          >
            <Zap size={16} /> Atendimento Avulso (Encaixe)
          </button>
        </div>
      </header>

      {error && <div className="form-error">{error}</div>}
      {notice && <div className="form-success">{notice}</div>}

      {requests.length > 0 && (
        <section className="panel appointment-requests" style={{ marginBottom: 20 }}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Portal do Paciente</span>
              <h3>Solicitações pendentes de confirmação</h3>
            </div>
            <strong>{requests.length}</strong>
          </div>
          <div>
            {requests.map((item) => (
              <article key={item.id}>
                <CalendarDays size={20} />
                <div>
                  <strong>{item.patientName}</strong>
                  <span>
                    {new Date(`${item.preferredDate}T12:00:00`).toLocaleDateString('pt-BR')} ·{' '}
                    {{ MORNING: 'Manhã', AFTERNOON: 'Tarde', EVENING: 'Noite' }[item.preferredPeriod]} ·{' '}
                    {item.appointmentType}
                  </span>
                  {item.notes && <small>{item.notes}</small>}
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void declineRequest(item)}
                >
                  Recusar
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => approveRequest(item)}
                >
                  Agendar
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="encounter-hub-tabs-bar">
        <div className="encounter-hub-tabs">
          <button
            type="button"
            className={`encounter-hub-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarDays size={15} />
            <span>Calendário & Agenda</span>
            <span className="encounter-hub-tab-badge">{monthAppointments.length}</span>
          </button>

          <button
            type="button"
            className={`encounter-hub-tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <Calendar size={15} />
            <span>Consultas de Hoje</span>
            <span className="encounter-hub-tab-badge">{todayAppointments.length}</span>
          </button>

          <button
            type="button"
            className={`encounter-hub-tab-btn ${activeTab === 'in_progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('in_progress')}
          >
            <Clock size={15} />
            <span>Em Andamento / Rascunhos</span>
            <span className="encounter-hub-tab-badge">{inProgressList.length}</span>
          </button>

          <button
            type="button"
            className={`encounter-hub-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle2 size={15} />
            <span>Histórico Realizado</span>
            <span className="encounter-hub-tab-badge">{completedList.length}</span>
          </button>
        </div>

        {activeTab !== 'calendar' && (
          <div className="encounter-hub-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar por paciente ou tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="encounter-hub-empty">
          <span className="spinner" />
          <p>Carregando dados clínicos e agenda...</p>
        </div>
      ) : activeTab === 'calendar' ? (
        <div className="agenda-layout">
          <section className="panel calendar-panel">
            <div className="calendar-heading">
              <button
                type="button"
                className="icon-button"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              >
                <ChevronLeft size={19} />
              </button>
              <h2>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              >
                <ChevronRight size={19} />
              </button>
            </div>

            <div className="calendar-weekdays">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {calendarCells.map((date) => {
                const value = isoDate(date);
                const count = monthAppointments.filter((a) => a.date.slice(0, 10) === value).length;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`${date.getMonth() !== month.getMonth() ? 'outside ' : ''}${value === selectedDate ? 'selected ' : ''}${value === todayIso ? 'today' : ''}`}
                    onClick={() => setSelectedDate(value)}
                  >
                    <span>{date.getDate()}</span>
                    {count > 0 && <small>{count}</small>}
                  </button>
                );
              })}
            </div>

            <div className="calendar-legend">
              <span>
                <i /> Dia com consulta
              </span>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  const now = new Date();
                  setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  setSelectedDate(todayIso);
                }}
              >
                Ir para hoje
              </button>
            </div>
          </section>

          <section className="panel day-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Agenda do dia</span>
                <h3>
                  {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => showCreateAppointment(selectedDate)}
                aria-label="Agendar neste dia"
                title="Novo agendamento nesta data"
              >
                <Plus size={20} />
              </button>
            </div>

            {selectedDateAppointments.length === 0 ? (
              <div className="empty-state">
                <CalendarDays size={32} />
                <strong>Nenhuma consulta agendada neste dia</strong>
                <p>Escolha outro dia no calendário ou adicione um novo horário.</p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => showCreateAppointment(selectedDate)}
                >
                  <Plus size={17} /> Agendar consulta
                </button>
              </div>
            ) : (
              <div className="appointment-list">
                {selectedDateAppointments.map((item) => (
                  <article
                    className={`appointment-card appointment-card--${item.status.toLowerCase()} response-${item.patientResponse.toLowerCase()}`}
                    key={item.id}
                  >
                    <div className="appointment-time">
                      <strong title={`${item.time} às ${getEndTime(item.time, item.durationMinutes)}`}>
                        {item.time} às {getEndTime(item.time, item.durationMinutes)}
                      </strong>
                      <small>{item.durationMinutes} min</small>
                    </div>
                    <div className="appointment-info">
                      <strong>{item.patientName}</strong>
                      <span>{item.type}</span>
                      <small>
                        {item.patientResponse === 'RESCHEDULE_REQUESTED'
                          ? `Reagendamento: ${item.patientResponseNote}`
                          : item.patientResponse === 'CONFIRMED'
                          ? 'Paciente confirmou presença'
                          : 'Aguardando confirmação do paciente'}
                      </small>
                    </div>

                    <select
                      className={`appointment-status status-${item.status.toLowerCase()}`}
                      value={item.status}
                      onChange={(e) => void updateAppointmentStatus(item, e.target.value as AppointmentStatus)}
                    >
                      {statusTransitions[item.status].map((value) => (
                        <option key={value} value={value}>
                          {statusLabels[value]}
                        </option>
                      ))}
                    </select>

                    <div className="appointment-actions">
                      {item.patientResponse === 'RESCHEDULE_REQUESTED' && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => showEditAppointment(item)}
                        >
                          Reagendar
                        </button>
                      )}
                      {item.whatsapp && (
                        <a
                          className="icon-button"
                          href={getWhatsAppLink(item)!}
                          target="_blank"
                          rel="noreferrer"
                          title="Enviar lembrete e link no WhatsApp"
                          style={{ color: '#16a34a' }}
                        >
                          <MessageCircle size={17} />
                        </a>
                      )}
                      {item.meetingUrl && (
                        <a
                          className="icon-button"
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir sala externa"
                        >
                          <Video size={17} />
                        </a>
                      )}
                      {!['CANCELLED','NO_SHOW'].includes(item.status) && (
                        <button
                          type="button"
                          className={`start-care ${item.status==='IN_PROGRESS'?'is-live':item.status==='COMPLETED'?'is-complete':''}`}
                          onClick={() => item.encounterId
                            ? onSelectEncounter(item.encounterId, item.status==='IN_PROGRESS' && item.type.toLowerCase().includes('online'))
                            : void handleStartAppointment(item)}
                          title={item.status==='IN_PROGRESS'?'Continuar atendimento em andamento':item.status==='COMPLETED'?'Consultar prontuário finalizado':'Iniciar atendimento'}
                        >
                          {item.status==='IN_PROGRESS'?'Continuar':item.status==='COMPLETED'?'Ver prontuário':'Iniciar atendimento'} <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : activeTab === 'in_progress' ? (
        filteredInProgress.length === 0 ? (
          <div className="encounter-hub-empty">
            <div className="encounter-hub-empty-icon">
              <Clock size={24} />
            </div>
            <h3>Nenhum atendimento em andamento no momento</h3>
            <p>
              Quando você inicia uma consulta pela Agenda ou como encaixe, ela aparece aqui como rascunho até ser finalizada.
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={15} /> Ver Calendário de Consultas
            </button>
          </div>
        ) : (
          <>
            <div className="encounter-hub-in-progress-actions">
              <span className="encounter-hub-in-progress-info">
                Você possui <strong>{filteredInProgress.length}</strong> atendimento(s) em andamento.
              </span>
              <button
                type="button"
                className="secondary-button bulk-close-btn"
                onClick={() => void handleBulkCloseAll()}
                title="Encerrar e arquivar todos os rascunhos de uma só vez"
              >
                <Check size={14} /> Encerrar todos os {filteredInProgress.length} rascunhos
              </button>
            </div>

            <div className="encounter-hub-grid">
              {filteredInProgress.map((enc) => (
                <article key={enc.id} className="encounter-hub-card">
                  <div className="encounter-hub-card-header">
                    <div className="encounter-hub-avatar">{enc.patientName.charAt(0)}</div>
                    <div className="encounter-hub-patient-info">
                      <strong>{enc.patientName}</strong>
                      <small>{enc.appointmentType || enc.objective || 'Consulta Nutricional'}</small>
                    </div>
                    <span className="encounter-hub-tag in-progress">Em andamento</span>
                  </div>

                  <div className="encounter-hub-card-meta">
                    <div className="encounter-hub-card-meta-row">
                      <Clock size={13} />
                      <span>
                        Iniciado em:{' '}
                        <strong>
                          {new Date(enc.startedAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(enc.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </strong>
                      </span>
                    </div>
                    {enc.appointmentTime && (
                      <div className="encounter-hub-card-meta-row">
                        <Calendar size={13} />
                        <span>
                          Horário agendado:{' '}
                          <strong>{formatAppointmentSchedule(enc.appointmentTime, enc.durationMinutes || 60)}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="encounter-hub-card-footer">
                    <button
                      type="button"
                      className="encounter-hub-action-btn danger"
                      onClick={() => void handleDeleteEncounter(enc.id, enc.patientName)}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="encounter-hub-action-btn secondary"
                      onClick={() => void handleQuickClose(enc.id, enc.patientName)}
                    >
                      <Check size={14} /> Encerrar
                    </button>
                    <button
                      type="button"
                      className="encounter-hub-action-btn primary"
                      onClick={() => onSelectEncounter(enc.id, false)}
                    >
                      <Play size={14} /> Continuar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )
      ) : activeTab === 'today' ? (
        filteredToday.length === 0 ? (
          <div className="encounter-hub-empty">
            <div className="encounter-hub-empty-icon">
              <Calendar size={24} />
            </div>
            <h3>Nenhuma consulta agendada para hoje</h3>
            <p>Abra o Calendário para verificar outros dias ou marcar novos atendimentos.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={15} /> Ir para o Calendário
            </button>
          </div>
        ) : (
          <div className="encounter-hub-grid">
            {filteredToday.map((app) => (
              <article key={app.id} className="encounter-hub-card">
                <div className="encounter-hub-card-header">
                  <div className="encounter-hub-avatar">{app.patientName.charAt(0)}</div>
                  <div className="encounter-hub-patient-info">
                    <strong>{app.patientName}</strong>
                    <small>{app.type || 'Consulta Nutricional'}</small>
                  </div>
                  <span className="encounter-hub-tag today">Hoje</span>
                </div>

                <div className="encounter-hub-card-meta">
                  <div className="encounter-hub-card-meta-row">
                    <Clock size={13} />
                    <span>
                      Horário: <strong>{formatAppointmentSchedule(app.time, app.durationMinutes || 60)}</strong>
                    </span>
                  </div>
                  {app.whatsapp && (
                    <div className="encounter-hub-card-meta-row">
                      <span>
                        WhatsApp: <strong>{app.whatsapp}</strong>
                      </span>
                    </div>
                  )}
                  {app.notes && (
                    <div className="encounter-hub-card-meta-row">
                      <span>
                        Notas: <strong>{app.notes}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="encounter-hub-card-footer">
                  <button
                    type="button"
                    className="encounter-hub-action-btn primary"
                    onClick={() => void handleStartAppointment(app)}
                  >
                    <Play size={14} /> Iniciar Consulta
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        filteredCompleted.length === 0 ? (
          <div className="encounter-hub-empty">
            <div className="encounter-hub-empty-icon">
              <CheckCircle2 size={24} />
            </div>
            <h3>Nenhum prontuário finalizado encontrado</h3>
            <p>Os atendimentos concluídos com envio de materiais e documentos serão arquivados aqui.</p>
          </div>
        ) : (
          <div className="encounter-hub-grid">
            {filteredCompleted.map((enc) => (
              <article key={enc.id} className="encounter-hub-card">
                <div className="encounter-hub-card-header">
                  <div className="encounter-hub-avatar">{enc.patientName.charAt(0)}</div>
                  <div className="encounter-hub-patient-info">
                    <strong>{enc.patientName}</strong>
                    <small>{enc.appointmentType || enc.objective || 'Atendimento concluído'}</small>
                  </div>
                  <span className="encounter-hub-tag completed">Concluído</span>
                </div>

                <div className="encounter-hub-card-meta">
                  <div className="encounter-hub-card-meta-row">
                    <CheckCircle2 size={13} />
                    <span>
                      Finalizado em:{' '}
                      <strong>
                        {enc.completedAt
                          ? new Date(enc.completedAt).toLocaleDateString('pt-BR')
                          : new Date(enc.startedAt).toLocaleDateString('pt-BR')}
                      </strong>
                    </span>
                  </div>
                  {enc.objective && (
                    <div className="encounter-hub-card-meta-row">
                      <Zap size={13} />
                      <span>
                        Objetivo: <strong>{enc.objective}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="encounter-hub-card-footer">
                  <button
                    type="button"
                    className="encounter-hub-action-btn danger"
                    onClick={() => void handleDeleteEncounter(enc.id, enc.patientName)}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="encounter-hub-action-btn secondary"
                    onClick={() => onSelectEncounter(enc.id, false)}
                  >
                    <Eye size={14} /> Ver Prontuário
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {appointmentModalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAppointmentModalOpen(false);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="appointment-title">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">Agenda clínica</span>
                <h2 id="appointment-title">
                  {isRebooking
                    ? 'Reagendar consulta'
                    : editingAppointmentId
                    ? 'Editar consulta'
                    : 'Nova consulta'}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setAppointmentModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveAppointment}>
              <div className="form-grid">
                <label className="full">
                  Paciente
                  <select
                    value={appointmentForm.patientId}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, patientId: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecione um paciente</option>
                    {patients.map((patient) => (
                      <option value={patient.id} key={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Data
                  <input
                    type="date"
                    min={!editingAppointmentId ? todayIso : undefined}
                    value={appointmentForm.date}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, date: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Horário
                  <input
                    type="time"
                    value={appointmentForm.time}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, time: e.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Tipo
                  <select
                    value={appointmentForm.type}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, type: e.target.value })
                    }
                  >
                    {appointmentTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Duração
                  <select
                    value={appointmentForm.durationMinutes}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, durationMinutes: e.target.value })
                    }
                  >
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                    <option value="90">90 minutos</option>
                  </select>
                </label>

                <div
                  style={{
                    gridColumn: '1/-1',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.82rem',
                    color: '#166534',
                    fontWeight: 700,
                  }}
                >
                  <Clock3 size={16} /> Horário agendado: {appointmentForm.time} às{' '}
                  {getEndTime(appointmentForm.time, Number(appointmentForm.durationMinutes) || 60)} (
                  {appointmentForm.durationMinutes} minutos)
                </div>

                <label>
                  Valor (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={appointmentForm.price}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, price: e.target.value })
                    }
                  />
                </label>

                <label>
                  Status
                  <select
                    value={appointmentForm.status}
                    onChange={(e) =>
                      setAppointmentForm({
                        ...appointmentForm,
                        status: e.target.value as AppointmentStatus,
                      })
                    }
                  >
                    {formStatuses.map((value) => (
                      <option key={value} value={value}>
                        {statusLabels[value]}
                      </option>
                    ))}
                  </select>
                </label>

                {appointmentForm.type.toLowerCase().includes('online') && (
                  <label className="full">
                    Link da teleconsulta
                    <div className="input-with-icon">
                      <Video size={17} />
                      <input
                        type="url"
                        value={appointmentForm.meetingUrl}
                        onChange={(e) =>
                          setAppointmentForm({ ...appointmentForm, meetingUrl: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </label>
                )}

                <label className="full">
                  Observações
                  <textarea
                    rows={3}
                    value={appointmentForm.notes}
                    onChange={(e) =>
                      setAppointmentForm({ ...appointmentForm, notes: e.target.value })
                    }
                    placeholder="Ex.: trazer exames laboratoriais recentes"
                  />
                </label>
              </div>

              {patients.length === 0 && (
                <div className="inline-guidance">
                  <UserRound size={18} />
                  <span>Cadastre um paciente antes de criar a consulta.</span>
                </div>
              )}

              <div className="modal-actions">
                {editingAppointmentId && (
                  <button type="button" className="danger-button appointment-discard-btn" onClick={() => void discardAppointment(editingAppointmentId)} disabled={savingAppointment}>
                    <Trash2 size={16} /> Descartar agendamento
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setAppointmentModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingAppointment || patients.length === 0}
                >
                  {savingAppointment ? (
                    'Salvando...'
                  ) : (
                    <>
                      <Clock3 size={17} />{' '}
                      {isRebooking
                        ? 'Confirmar reagendamento'
                        : editingAppointmentId
                        ? 'Salvar consulta'
                        : 'Confirmar consulta'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {walkInOpen && (
        <div className="modal-backdrop walk-in-backdrop" onClick={() => setWalkInOpen(false)}>
          <section className="modal-content walk-in-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="walk-in-title">
            <div className="modal-header walk-in-header">
              <div className="walk-in-heading">
                <span className="walk-in-icon" aria-hidden="true"><Zap size={21} /></span>
                <div>
                  <span className="eyebrow">Atendimento imediato</span>
                  <h3 id="walk-in-title">Atendimento avulso</h3>
                </div>
              </div>
              <button type="button" className="icon-button" onClick={() => setWalkInOpen(false)} aria-label="Fechar janela">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body walk-in-body">
              <p>
                Inicie uma consulta sem agendamento prévio. O prontuário será vinculado automaticamente ao paciente selecionado.
              </p>

              <label className="walk-in-field">
                <span>Paciente</span>
                <select
                  value={walkInPatientId}
                  onChange={(e) => setWalkInPatientId(e.target.value)}
                >
                  <option value="">Selecione um paciente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="modal-footer walk-in-footer">
              <button type="button" className="secondary-button" onClick={() => setWalkInOpen(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleStartWalkIn()}
                disabled={!walkInPatientId || startingWalkIn}
              >
                {startingWalkIn ? 'Abrindo...' : 'Iniciar Atendimento'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const checkinLabels:Record<string,string>={improvements:'O que melhorou',mainDifficulty:'Principal dificuldade',medicationChanges:'Mudanças de medicamentos',newSymptoms:'Sintomas novos',adherence:'Adesão percebida (0–10)',examsCompleted:'Exames realizados',discussionTopics:'Assuntos para a consulta'};

function ClinicalSnapshot({encounter,reload}:{encounter:Encounter;reload:()=>void}){
  const anamnesis=encounter.sections.anamnesis?.data||{};
  const conduct=encounter.sections.conduct?.data||{};
  const exams=encounter.sections.exams?.data||{};
  const assessment=encounter.sections.assessment?.data||{};
  const pending=encounter.checkins?.filter(item=>item.status==='PENDING_REVIEW')||[];
  const cards=[['Objetivo',encounter.objective],['Alergias e intolerâncias',anamnesis.allergies],['Medicamentos em uso',anamnesis.medications],['Peso atual',assessment.weight?`${assessment.weight} kg`:null],['Próximo acompanhamento',conduct.followUp],['Exames pendentes',exams.pendingExams]].filter(([,value])=>String(value||'').trim());
  const[selected,setSelected]=useState<Record<string,string[]>>({});

  async function review(id:string){
    await api(`/api/encounters/${encounter.id}/checkins/${id}/review`,{method:'PATCH'});
    reload();
  }

  function toggle(id:string,key:string){
    setSelected(current=>{
      const fields=current[id]||[];
      return{...current,[id]:fields.includes(key)?fields.filter(x=>x!==key):[...fields,key]};
    });
  }

  async function incorporate(id:string){
    const fields=selected[id]||[];
    if(!fields.length)return;
    await api(`/api/encounters/${encounter.id}/import-clinical`,{method:'POST',body:JSON.stringify({sourceType:'CHECKIN',sourceId:id,fields})});
    await review(id);
  }

  return (
    <section className="clinical-snapshot">
      <header>
        <div>
          <span className="eyebrow">Resumo clínico vivo</span>
          <h3>Essencial para esta decisão</h3>
        </div>
        {pending.length>0&&<strong>{pending.length} check-in{pending.length>1?'s':''} para revisar</strong>}
      </header>
      <div className="snapshot-grid">
        {cards.length?cards.map(([label,value])=><article key={String(label)}><small>{label}</small><p>{String(value)}</p></article>):<p className="snapshot-empty">O resumo será formado conforme as etapas forem salvas.</p>}
      </div>
      {pending.map(item=>(
        <details className="checkin-review" key={item.id} open>
          <summary>Check-in enviado em {new Date(item.submittedAt).toLocaleDateString('pt-BR')}</summary>
          <div>
            {Object.entries(item.answers).filter(([,value])=>String(value||'').trim()).map(([key,value])=>(
              <article key={key}>
                <label className="check">
                  <input type="checkbox" checked={(selected[item.id]||[]).includes(key)} onChange={()=>toggle(item.id,key)}/>
                  <strong>{checkinLabels[key]||key}</strong>
                </label>
                <p>{String(value)}</p>
              </article>
            ))}
          </div>
          <button className="primary-button" type="button" disabled={!(selected[item.id]||[]).length} onClick={()=>void incorporate(item.id)}>
            <Check size={15}/> Incorporar selecionados à evolução
          </button>
          <button className="secondary-button" type="button" onClick={()=>void review(item.id)}>
            Apenas marcar como revisado
          </button>
          <small>Somente os itens selecionados entram nas Anotações, com registro de auditoria.</small>
        </details>
      ))}
    </section>
  );
}

function EncounterPlan({encounterId,planId,onCreated}:{encounterId:string;planId:string;onCreated:()=>void}){const[creating,setCreating]=useState(false);const[error,setError]=useState('');async function open(){setCreating(true);setError('');try{await api('/api/nutrition/plans/for-encounter',{method:'POST',body:JSON.stringify({encounterId})});onCreated()}catch(c){setError(c instanceof Error?c.message:'Não foi possível preparar o plano.')}finally{setCreating(false)}}if(!planId)return <div className="encounter-plan-empty"><UtensilsCrossed size={34}/><h3>Plano alimentar deste atendimento</h3><p>Crie um rascunho vinculado ao paciente e use TACO e receitas sem sair da videochamada.</p>{error&&<div className="form-error">{error}</div>}<button className="primary-button" onClick={()=>void open()} disabled={creating}>{creating?'Preparando editor...':<><Plus size={17}/> Criar plano para este paciente</>}</button></div>;return <iframe className="embedded-plan-editor" src={`/embed/planos/${planId}`} title="Editor do plano alimentar"/>}

function Review({
  encounter,
  dirty,
  onFinalize,
  saving,
  onNavigateStep,
}: {
  encounter: Encounter;
  dirty: boolean;
  onFinalize: () => void;
  saving: boolean;
  onNavigateStep: (index: number) => void;
}) {
  const context = encounter.sections.context?.data || {};
  const anamnesis = encounter.sections.anamnesis?.data || {};
  const followup = encounter.sections.followup?.data || {};
  const assessment = encounter.sections.assessment?.data || {};
  const exams = encounter.sections.exams?.data || {};
  const conduct = encounter.sections.conduct?.data || {};
  const plan = encounter.sections.plan?.data || {};
  const supplements = encounter.sections.supplements?.data || {};

  const weightNum = parseFloat(String(assessment.weight || ''));
  const heightNum = parseFloat(String(assessment.height || '')) / 100;
  const ageNum = parseInt(String(assessment.age || ''), 10);
  const bmiCalc = weightNum > 0 && heightNum > 0 ? (weightNum / (heightNum * heightNum)).toFixed(1) : null;
  const whrCalc = Number(assessment.waist) > 0 && Number(assessment.hip) > 0 ? (Number(assessment.waist) / Number(assessment.hip)).toFixed(2) : null;
  const bmrCalc = weightNum > 0 && heightNum > 0 && ageNum > 0 ? Math.round(10 * weightNum + 6.25 * (heightNum * 100) - 5 * ageNum + (assessment.sex === 'Masculino' ? 5 : -161)) : null;

  const requirements = [
    { label: 'Contexto social & Queixa', saved: Boolean(encounter.sections.context), step: 0 },
    { label: 'Anamnese clínica / Retorno', saved: Boolean(encounter.sections.anamnesis || encounter.sections.followup), step: encounter.sections.followup ? 9 : 1 },
    { label: 'Conduta e Orientações', saved: Boolean(encounter.sections.conduct), step: 5 },
  ];

  const supportingItems = [
    { label: 'Avaliação Antropométrica', present: Boolean(assessment.weight || assessment.height), step: 3, value: assessment.weight ? `${assessment.weight} kg (IMC ${bmiCalc || '-'})` : 'Não registrada' },
    { label: 'Plano Alimentar', present: Boolean(plan.planId), step: 6, value: plan.planId ? 'Cardápio estruturado vinculado' : 'Opcional / Não criado' },
    { label: 'Suplementação', present: Boolean(encounter.supplements?.length || supplements.prescription), step: 7, value: encounter.supplements?.length ? `${encounter.supplements.length} item(ns) prescrito(s)` : supplements.prescription ? 'Prescrição descrita' : 'Sem suplementos' },
    { label: 'Exames Laboratoriais', present: Boolean(encounter.labs?.length || exams.markers), step: 4, value: encounter.labs?.length ? `${encounter.labs.length} marcador(es)` : exams.markers ? 'Resultados descritos' : 'Nenhum exame anexado' },
  ];

  const missing = requirements.filter((item) => !item.saved);
  const isReady = missing.length === 0 && !dirty;

  return (
    <div className="review-dashboard">
      <section className="review-summary-hero">
        <div className="review-summary-info">
          <div className="review-hero-icon">
            <FileCheck2 size={28} />
          </div>
          <div>
            <h3>Espelho Clínico & Fechamento da Consulta</h3>
            <p>
              Revise o resumo consolidado antes de finalizar. Ao concluir, o prontuário será gravado com integridade clínica e você poderá disparar o plano alimentar, lista de compras e lâminas educativas ao paciente.
            </p>
          </div>
        </div>

        <div className={`review-hero-status-pill ${isReady ? 'ready' : 'pending'}`}>
          {isReady ? (
            <>
              <CheckCircle2 size={16} /> Todos os requisitos preenchidos
            </>
          ) : (
            <>
              <Sparkles size={16} /> {missing.length} requisito(s) obrigatório(s) pendente(s)
            </>
          )}
        </div>
      </section>

      <div className="review-checklist-bar">
        {requirements.map((req) => (
          <div key={req.label} className="review-check-card" onClick={() => onNavigateStep(req.step)} style={{ cursor: 'pointer' }} title="Clique para ir até a etapa correspondente">
            <div className={`review-check-dot ${req.saved ? 'done' : ''}`}>
              {req.saved ? <Check size={14} /> : <UserRound size={14} />}
            </div>
            <div className="review-check-info">
              <strong>{req.label}</strong>
              <small>{req.saved ? 'Obrigatório salvo ✓' : 'Pendente de preenchimento'}</small>
            </div>
          </div>
        ))}

        {supportingItems.map((item) => (
          <div key={item.label} className="review-check-card" onClick={() => onNavigateStep(item.step)} style={{ cursor: 'pointer' }} title="Clique para editar este item">
            <div className={`review-check-dot ${item.present ? 'done' : ''}`}>
              {item.present ? <Check size={14} /> : <Sparkles size={14} />}
            </div>
            <div className="review-check-info">
              <strong>{item.label}</strong>
              <small>{item.value}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="review-mirror-grid">
        <div className="review-mirror-card">
          <div className="review-card-head">
            <span className="review-card-head-title">
              <ClipboardList size={16} /> 1. Contexto & Queixa Principal
            </span>
            <button type="button" className="review-edit-btn" onClick={() => onNavigateStep(0)}>
              <Edit3 size={12} /> Ajustar Contexto
            </button>
          </div>
          <div className="review-card-body">
            <div className="review-data-row">
              <span>Tipo de Atendimento</span>
              <p>{String(context.consultationType || 'Primeira consulta')}</p>
            </div>
            <div className="review-data-row">
              <span>Queixa Principal</span>
              <p>{String(context.mainComplaint || encounter.objective || 'Não especificada')}</p>
            </div>
            {context.expectations && (
              <div className="review-data-row">
                <span>Expectativas do Paciente</span>
                <p>{String(context.expectations)}</p>
              </div>
            )}
            {context.profession && (
              <div className="review-data-row">
                <span>Profissão / Rotina</span>
                <p>{String(context.profession)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="review-mirror-card">
          <div className="review-card-head">
            <span className="review-card-head-title">
              <HeartPulse size={16} /> 2. Histórico & Estilo de Vida
            </span>
            <button type="button" className="review-edit-btn" onClick={() => onNavigateStep(encounter.sections.followup ? 9 : 1)}>
              <Edit3 size={12} /> Ajustar Anamnese
            </button>
          </div>
          <div className="review-card-body">
            <div className="review-data-row">
              <span>Alergias & Intolerâncias</span>
              <p>{String(anamnesis.allergies || 'Nenhuma alergia ou intolerância informada')}</p>
            </div>
            <div className="review-data-row">
              <span>Medicamentos em Uso</span>
              <p>{String(anamnesis.medications || 'Nenhum medicamento de uso contínuo')}</p>
            </div>
            <div className="review-data-pills">
              {anamnesis.bowelFunction && (
                <span className="review-metric-pill">
                  Intestino: <strong>{String(anamnesis.bowelFunction)}</strong>
                </span>
              )}
              {anamnesis.waterIntake && (
                <span className="review-metric-pill">
                  Água: <strong>{String(anamnesis.waterIntake)}</strong>
                </span>
              )}
              {anamnesis.sleep && (
                <span className="review-metric-pill">
                  Sono: <strong>{String(anamnesis.sleep)}</strong>
                </span>
              )}
              {anamnesis.smoking && (
                <span className="review-metric-pill">
                  Tabagismo: <strong>{String(anamnesis.smoking)}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="review-mirror-card">
          <div className="review-card-head">
            <span className="review-card-head-title">
              <Scale size={16} /> 3. Avaliação Física & Composição
            </span>
            <button type="button" className="review-edit-btn" onClick={() => onNavigateStep(3)}>
              <Edit3 size={12} /> Ajustar Avaliação
            </button>
          </div>
          <div className="review-card-body">
            <div className="review-data-pills">
              {assessment.weight && (
                <span className="review-metric-pill">
                  Peso: <strong>{String(assessment.weight)} kg</strong>
                </span>
              )}
              {assessment.height && (
                <span className="review-metric-pill">
                  Altura: <strong>{String(assessment.height)} cm</strong>
                </span>
              )}
              {bmiCalc && (
                <span className="review-metric-pill">
                  IMC: <strong>{bmiCalc} kg/m²</strong>
                </span>
              )}
              {assessment.bodyFat && (
                <span className="review-metric-pill">
                  Gordura: <strong>{String(assessment.bodyFat)}%</strong>
                </span>
              )}
              {assessment.muscleMass && (
                <span className="review-metric-pill">
                  Massa Muscular: <strong>{String(assessment.muscleMass)} kg</strong>
                </span>
              )}
              {bmrCalc && (
                <span className="review-metric-pill">
                  TMB: <strong>{bmrCalc} kcal</strong>
                </span>
              )}
              {whrCalc && (
                <span className="review-metric-pill">
                  RCQ: <strong>{whrCalc}</strong>
                </span>
              )}
            </div>
            {assessment.assessmentNotes && (
              <div className="review-data-row">
                <span>Observações da Avaliação</span>
                <p>{String(assessment.assessmentNotes)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="review-mirror-card">
          <div className="review-card-head">
            <span className="review-card-head-title">
              <Zap size={16} /> 4. Conduta & Estratégia Nutricional
            </span>
            <button type="button" className="review-edit-btn" onClick={() => onNavigateStep(5)}>
              <Edit3 size={12} /> Ajustar Conduta
            </button>
          </div>
          <div className="review-card-body">
            {conduct.diagnosticImpression && (
              <div className="review-data-row">
                <span>Diagnóstico Nutricional</span>
                <p>{String(conduct.diagnosticImpression)}</p>
              </div>
            )}
            <div className="review-data-row">
              <span>Metas Acordadas</span>
              <p>{String(conduct.goals || followup.nextGoal || 'Metas a definir com o paciente')}</p>
            </div>
            {conduct.guidance && (
              <div className="review-data-row">
                <span>Orientações & Diretrizes</span>
                <p>{String(conduct.guidance)}</p>
              </div>
            )}
            {conduct.followUp && (
              <div className="review-data-row">
                <span>Prazo de Retorno / Acompanhamento</span>
                <p>{String(conduct.followUp)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="review-mirror-card">
          <div className="review-card-head">
            <span className="review-card-head-title">
              <UtensilsCrossed size={16} /> 5. Plano Alimentar do Atendimento
            </span>
            <button type="button" className="review-edit-btn" onClick={() => onNavigateStep(6)}>
              <Edit3 size={12} /> Abrir Editor de Plano
            </button>
          </div>
          <div className="review-card-body">
            {plan.planId ? (
              <>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--forest)', fontWeight: 600 }}>
                  ✨ Plano alimentar vinculado e pronto para visualização do paciente.
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <a
                    href={`/documentos/plano/${plan.planId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="review-doc-button"
                  >
                    <ExternalLink size={13} /> Visualizar Plano A4
                  </a>
                </div>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)' }}>
                Nenhum plano alimentar novo criado nesta sessão. O paciente manterá o plano anterior ou receberá as orientações por escrito.
              </p>
            )}
          </div>
        </div>

        <div className="review-mirror-card">
          <div className="review-card-head">
            <span className="review-card-head-title">
              <Pill size={16} /> 6. Suplementos & Exames Laboratoriais
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button type="button" className="review-edit-btn" onClick={() => onNavigateStep(7)}>
                <Edit3 size={12} /> Suplementos
              </button>
              <button type="button" className="review-edit-btn" onClick={() => onNavigateStep(4)}>
                <Edit3 size={12} /> Exames
              </button>
            </div>
          </div>
          <div className="review-card-body">
            <div className="review-data-row">
              <span>Prescrição de Suplementação</span>
              <p>
                {encounter.supplements?.length > 0
                  ? encounter.supplements.map((s) => `• ${s.name} (${s.dosage || ''}${s.posology ? ` - ${s.posology}` : s.pharmaceuticalForm ? ` - ${s.pharmaceuticalForm}` : ''})`).join('\n')
                  : String(supplements.prescription || 'Nenhum suplemento prescrito')}
              </p>
            </div>
            {(exams.markers || encounter.labs?.length > 0) && (
              <div className="review-data-row">
                <span>Marcadores de Exames</span>
                <p>
                  {encounter.labs?.length > 0
                    ? encounter.labs.map((l) => `• ${l.marker}: ${l.value} ${l.unit || ''}${l.status ? ` (${l.status})` : ''}`).join('\n')
                    : String(exams.markers)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="review-documents-bar">
        <div className="review-documents-bar-head">
          <FileText size={18} />
          <span>Documentos & Impressões Rápidas (A4 Timbrado)</span>
        </div>
        <div className="review-doc-links">
          {plan.planId && (
            <a
              href={`/documentos/plano/${plan.planId}`}
              target="_blank"
              rel="noreferrer"
              className="review-doc-button"
            >
              <Printer size={14} /> Imprimir Plano Alimentar A4
            </a>
          )}
          <a
            href="/documentos"
            target="_blank"
            rel="noreferrer"
            className="review-doc-button"
          >
            <FileText size={14} /> Emitir Declaração / Atestado Nutricional
          </a>
          <a
            href="/documentos"
            target="_blank"
            rel="noreferrer"
            className="review-doc-button"
          >
            <Pill size={14} /> Emitir Receituário de Suplementação
          </a>
        </div>
      </section>

      <section className="review-finalize-cta-box">
        <div className="review-finalize-cta-info">
          <h3>Tudo pronto para finalizar a consulta?</h3>
          <p>
            {encounter.status === 'COMPLETED'
              ? 'Este atendimento já foi finalizado e os materiais foram salvos com integridade clínica.'
              : dirty
              ? 'Existem alterações não salvas no prontuário. Clique em "Salvar e continuar" na etapa correspondente antes de finalizar.'
              : missing.length > 0
              ? `Requisitos obrigatórios pendentes: ${missing.map((item) => item.label).join(', ')}.`
              : 'Ao clicar abaixo, você poderá disparar o e-mail timbrado de orientações, selecionar as lâminas educativas e concluir o atendimento.'}
          </p>
        </div>

        <button
          type="button"
          className="review-finalize-main-btn"
          onClick={onFinalize}
          disabled={saving || encounter.status === 'COMPLETED' || missing.length > 0 || dirty}
        >
          {encounter.status === 'COMPLETED' ? (
            <>
              <CheckCircle2 size={18} /> Atendimento Concluído
            </>
          ) : saving ? (
            <>
              <span className="spinner" /> Finalizando...
            </>
          ) : (
            <>
              <Send size={18} /> Concluir Atendimento & Entregar Materiais
            </>
          )}
        </button>
      </section>
    </div>
  );
}
