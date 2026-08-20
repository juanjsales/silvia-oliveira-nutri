import { ArrowLeft, Printer } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

type Doc = {
  documentNumber: string;
  type: 'RECEIPT' | 'CLINICAL_SUMMARY';
  title: string;
  patientName: string;
  issuedAt: string;
  snapshot: Record<string, any>;
  clinicName: string;
  professionalName: string;
  crn: string;
  specialty: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  documentFooter: string;
};

const clinicalFieldLabels: Record<string, string> = {
  // Identificação e Contexto
  consultationType: 'Tipo de atendimento',
  education: 'Escolaridade',
  profession: 'Profissão / Ocupação',
  maritalStatus: 'Estado civil',
  income: 'Renda familiar',
  dependents: 'Dependentes',
  mainComplaint: 'Queixa principal',
  expectations: 'Expectativas do paciente',
  clinicalHistory: 'Histórico clínico e patológico',
  medications: 'Medicamentos em uso',
  familyHistory: 'Histórico familiar',
  allergies: 'Alergias e intolerâncias alimentares',
  smoking: 'Tabagismo',
  alcohol: 'Consumo de bebidas alcoólicas',
  waterIntake: 'Ingestão hídrica diária',
  bowelFunction: 'Função e hábito intestinal',
  emotionalSymptoms: 'Sintomas emocionais e comportamento',
  foodPreferences: 'Preferências e aversões alimentares',
  foodRoutine: 'Rotina alimentar habitual',
  sleep: 'Padrão de sono e repouso',
  physicalActivity: 'Prática de atividade física',
  objective: 'Objetivo terapêutico principal',

  // Recordatório 24h
  wakeTime: 'Horário ao acordar',
  breakfast: 'Café da manhã (Desjejum)',
  morningSnack: 'Colação (Lanche da manhã)',
  lunch: 'Almoço',
  afternoonSnack: 'Lanche da tarde',
  dinner: 'Jantar',
  supper: 'Ceia',
  otherIntake: 'Outros consumos / Beliscos',

  // Retorno
  dietRating: 'Avaliação da alimentação no período',
  planAdherence: 'Adesão ao plano prescrito',
  routineChanged: 'Alteração de rotina',
  routineChangeDetails: 'Detalhes da alteração de rotina',
  difficultMeals: 'Refeições com maior dificuldade',
  hungerLevel: 'Fome e saciedade',
  bingeEating: 'Episódios de compulsão ou exageros',
  bingeContext: 'Contexto dos episódios',
  dailyWater: 'Consumo diário de água',
  alcoholUse: 'Uso de álcool',
  alcoholFrequency: 'Frequência de consumo alcoólico',
  energy: 'Nível de energia e disposição',
  sleepChanges: 'Alterações no padrão de sono',
  newMedication: 'Novo medicamento relatado',
  newMedicationDetails: 'Detalhes do novo medicamento',
  activityStatus: 'Status da atividade física',
  activityFrequency: 'Frequência dos treinos',
  trainingPerformance: 'Desempenho no treino',
  perceivedWeightChange: 'Percepção de alteração corporal',
  positiveResults: 'Resultados positivos observados',
  mainDifficulties: 'Principais dificuldades relatadas',
  nextGoal: 'Metas para o próximo período',
  desiredPlanAdjustment: 'Ajustes desejados no plano',
  additionalNotes: 'Observações complementares',

  // Antropometria & Composição Corporal
  clinicalProfile: 'Perfil clínico da avaliação',
  assessmentDate: 'Data da avaliação física',
  sex: 'Sexo biológico',
  age: 'Idade',
  weight: 'Peso corporal',
  height: 'Estatura',
  prePregnancyWeight: 'Peso pré-gestacional',
  gestationalWeek: 'Semana gestacional',
  pregnancyNumber: 'Número de gestações',
  pregnancySymptoms: 'Intercorrências gestacionais',
  birthWeight: 'Peso ao nascer',
  gestationalAgeAtBirth: 'Idade gestacional ao nascer',
  headCircumference: 'Perímetro cefálico',
  caregiver: 'Responsável / Cuidador',
  breastfeeding: 'Aleitamento materno',
  foodIntroduction: 'Introdução alimentar',
  bodyFat: 'Percentual de gordura corporal',
  leanMass: 'Massa magra',
  muscleMass: 'Massa muscular esquelética',
  visceralFat: 'Nível de gordura visceral',
  bodyWater: 'Água corporal total',
  metabolicAge: 'Idade metabólica',
  arm: 'Circunferência do braço',
  neck: 'Circunferência do pescoço',
  chest: 'Circunferência do tórax',
  waist: 'Circunferência da cintura',
  abdomen: 'Circunferência do abdômen',
  hip: 'Circunferência do quadril',
  calf: 'Circunferência da panturrilha',
  activityFactor: 'Fator de atividade física (FAF)',
  bicipitalFold: 'Dobra cutânea bicipital',
  tricipitalFold: 'Dobra cutânea tricipital',
  suprailiacFold: 'Dobra cutânea suprailíaca',
  subscapularFold: 'Dobra cutânea subescapular',
  assessmentNotes: 'Observações da avaliação física',

  // Conduta e Diagnóstico
  diagnosticImpression: 'Diagnóstico e impressão nutricional',
  goals: 'Metas e objetivos acordados',
  guidance: 'Orientações nutricionais e conduta',
  followUp: 'Plano de acompanhamento e retorno',
  evolution: 'Evolução clínica',
  privateNotes: 'Anotações clínicas',
  prescription: 'Prescrição de suplementação',
  supplementGuidance: 'Orientações de suplementação',
};

const sectionOrder: [string, string][] = [
  ['context', 'Identificação e Contexto'],
  ['anamnesis', 'Anamnese Nutricional'],
  ['recall24h', 'Recordatório Alimentar Habitual'],
  ['followUpReview', 'Avaliação de Retorno e Adesão'],
  ['assessment', 'Avaliação Antropométrica e Corporal'],
  ['conduct', 'Diagnóstico e Conduta Nutricional'],
  ['notes', 'Evolução Clínica'],
];

function formatValue(key: string, value: any): string {
  if (value === true || value === 'true') return 'Sim';
  if (value === false || value === 'false') return 'Não';
  const str = String(value).trim();
  if (!str) return 'Não informado';

  if (key === 'weight' || key === 'prePregnancyWeight' || key === 'birthWeight' || key === 'leanMass' || key === 'muscleMass') {
    return isNaN(Number(str)) ? str : `${str} kg`;
  }
  if (key === 'height' || key === 'headCircumference' || key === 'neck' || key === 'arm' || key === 'chest' || key === 'waist' || key === 'abdomen' || key === 'hip' || key === 'calf') {
    return isNaN(Number(str)) ? str : `${str} cm`;
  }
  if (key === 'bodyFat' || key === 'bodyWater' || key === 'planAdherence') {
    return isNaN(Number(str)) ? str : `${str}%`;
  }
  if (key.includes('Fold')) {
    return isNaN(Number(str)) ? str : `${str} mm`;
  }
  return str;
}

function translateField(key: string): string {
  if (clinicalFieldLabels[key]) return clinicalFieldLabels[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function IssuedDocumentPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api<{ data: Doc }>(`/api/documents/${id}`)
        .then((r) => setDoc(r.data))
        .catch((c) => setError(c instanceof Error ? c.message : 'Erro ao abrir documento.'));
    }
  }, [id]);

  if (error) return <div className="document-loading">{error}</div>;
  if (!doc) return <div className="document-loading">Preparando documento...</div>;

  return (
    <main
      className="issued-document-view"
      style={{ '--doc-primary': doc.primaryColor, '--doc-secondary': doc.secondaryColor } as CSSProperties}
    >
      <div className="document-toolbar">
        <Link to="/documentos/emissoes">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <span>Documento nº {doc.documentNumber}</span>
        <button onClick={() => window.print()}>
          <Printer size={16} /> Imprimir / Salvar PDF
        </button>
      </div>

      <article className="official-sheet">
        <header>
          <div>
            {doc.logoUrl ? <img src={doc.logoUrl} alt="Logo" /> : <span>N</span>}
            <div>
              <strong>{doc.professionalName}</strong>
              <small>
                {doc.specialty} · {doc.crn}
              </small>
            </div>
          </div>
          <em>{doc.clinicName}</em>
        </header>

        {doc.type === 'RECEIPT' ? <Receipt doc={doc} /> : <Summary doc={doc} />}

        <footer>
          <div>
            <strong>{doc.documentFooter}</strong>
            <span>{[doc.phone, doc.email].filter(Boolean).join(' · ')}</span>
          </div>
          <span>Documento nº {doc.documentNumber}</span>
        </footer>
      </article>
    </main>
  );
}

function Receipt({ doc }: { doc: Doc }) {
  const s = doc.snapshot;
  return (
    <section className="issued-body receipt-body">
      <span>Comprovante de Pagamento</span>
      <h1>Recibo</h1>
      <p>
        Recebi de <strong>{s.patientName}</strong>
        {s.cpf ? `, inscrito(a) no CPF sob o nº ${s.cpf},` : ','} a importância de{' '}
        <strong>
          {Number(s.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </strong>
        , referente a <strong>{s.description}</strong>.
      </p>
      <aside>
        <div>
          <span>Forma de pagamento</span>
          <strong>{s.paymentMethod || 'Não informada'}</strong>
        </div>
        <div>
          <span>Data do pagamento</span>
          <strong>{s.paidAt ? new Date(s.paidAt).toLocaleDateString('pt-BR') : 'Não informada'}</strong>
        </div>
      </aside>
      <Signature doc={doc} />
    </section>
  );
}

function Summary({ doc }: { doc: Doc }) {
  const s = doc.snapshot;
  const sections = s.sections || {};

  return (
    <section className="issued-body summary-body">
      <span>Registro Clínico Confidencial</span>
      <h1>Resumo do Atendimento</h1>

      <div className="summary-identification">
        <strong>{s.patientName}</strong>
        {s.birthDate && (
          <small>Data de nascimento: {new Date(`${s.birthDate}T12:00:00`).toLocaleDateString('pt-BR')}</small>
        )}
        <small>Data da consulta: {new Date(s.startedAt).toLocaleDateString('pt-BR')}</small>
      </div>

      {sectionOrder.map(([key, title]) => {
        const sec = sections[key];
        if (!sec || typeof sec !== 'object') return null;
        const entries = Object.entries(sec).filter(([, v]) => v != null && v !== '');
        if (!entries.length) return null;

        return (
          <section key={key} className="clinical-doc-section">
            <h2>{title}</h2>
            <div className="clinical-doc-grid">
              {entries.map(([k, v]) => (
                <div key={k} className="clinical-doc-item">
                  <strong>{translateField(k)}:</strong> <span>{formatValue(k, v)}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {s.supplements?.length > 0 && (
        <section className="clinical-doc-section">
          <h2>Prescrição de Suplementos</h2>
          <div className="supplements-doc-list">
            {s.supplements.map((sup: any, i: number) => (
              <div key={i} className="supplement-doc-row">
                <strong>{sup.name}</strong>
                {sup.dosage && <span>Dose: {sup.dosage}</span>}
                {sup.posology && <p>Posologia: {sup.posology}</p>}
                {sup.observation && <small>{sup.observation}</small>}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.labs?.length > 0 && (
        <section className="clinical-doc-section">
          <h2>Exames Laboratoriais Registrados</h2>
          <div className="labs-doc-list">
            {s.labs.map((l: any, i: number) => (
              <p key={i}>
                <strong>{l.marker}:</strong> {l.value} {l.unit || ''} {l.status ? `· ${l.status}` : ''}
              </p>
            ))}
          </div>
        </section>
      )}

      <Signature doc={doc} />
    </section>
  );
}

function Signature({ doc }: { doc: Doc }) {
  return (
    <div className="signature">
      <span>Emitido em {new Date(doc.issuedAt).toLocaleDateString('pt-BR')}</span>
      <i />
      <strong>{doc.professionalName}</strong>
      <small>
        {doc.specialty} · {doc.crn}
      </small>
    </div>
  );
}
