  BadgeCheck,
  Calendar,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  Pill,
  Printer,
  Receipt,
  Sparkles,
  Stethoscope,
  User,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { api } from '../lib/api';

type Patient = { id: string; name: string; cpf?: string | null };
type EncounterList = {
  id: string;
  patientId: string;
  patientName: string;
  status: string;
  startedAt: string;
};
type Supplement = {
  id: string;
  name: string;
  dosage?: string;
  posology?: string;
  pharmaceuticalForm?: string;
  observation?: string;
};
type Encounter = { id: string; patientName: string; supplements: Supplement[] };
type Settings = {
  clinicName: string;
  professionalName: string;
  crn: string;
  specialty: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  documentFooter: string;
};
type Kind = 'declaration' | 'certificate' | 'supplements' | 'receipt';

const today = new Date().toISOString().slice(0, 10);
const fmt = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

export function DocumentsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [encounters, setEncounters] = useState<EncounterList[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [kind, setKind] = useState<Kind>('declaration');
  const [patientId, setPatientId] = useState('');
  const [encounterId, setEncounterId] = useState('');
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [date, setDate] = useState(today);
  const [start, setStart] = useState('14:00');
  const [end, setEnd] = useState('15:00');
  const [observation, setObservation] = useState('');
  const [amount, setAmount] = useState('250,00');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [serviceDesc, setServiceDesc] = useState('Consulta e Acompanhamento Nutricional Clínico');
  const [error, setError] = useState('');
  const [zoomScale, setZoomScale] = useState(1);

  useEffect(() => {
    Promise.all([
      api<{ data: Patient[] }>('/api/patients'),
      api<{ data: EncounterList[] }>('/api/encounters'),
      api<{ data: Settings }>('/api/settings'),
    ])
      .then(([p, e, s]) => {
        setPatients(p.data);
        setEncounters(e.data);
        setSettings(s.data);
      })
      .catch((c) =>
        setError(c instanceof Error ? c.message : 'Erro ao carregar dados de documentos.')
      );
  }, []);

  useEffect(() => {
    if (encounterId) {
      api<{ data: Encounter }>(`/api/encounters/${encounterId}`)
        .then((r) => setEncounter(r.data))
        .catch((c) =>
          setError(c instanceof Error ? c.message : 'Erro ao abrir prescrição.')
        );
    } else {
      setEncounter(null);
    }
  }, [encounterId]);

  const patient = useMemo(
    () => patients.find((p) => p.id === patientId),
    [patients, patientId]
  );
  const patientEncounters = encounters.filter(
    (e) => !patientId || e.patientId === patientId
  );

  const style = settings
    ? ({
        '--doc-primary': settings.primaryColor || '#203528',
        '--doc-secondary': settings.secondaryColor || '#8ca481',
      } as CSSProperties)
    : undefined;

  function print() {
    window.print();
  }

  const isReady =
    Boolean(settings) &&
    ((kind !== 'supplements' && Boolean(patient)) ||
      (kind === 'supplements' && Boolean(encounter)));

  return (
    <div className="documents-center-v2">
      {/* ── CABEÇALHO DA PÁGINA ── */}
      <div className="page-intro-v2">
        <div>
          <span className="eyebrow">Documentos Clínicos Oficiais</span>
          <h2>Emissões & Laudos A4</h2>
          <p>
            Gere declarações de comparecimento, atestados nutricionais e prescrições em formato A4 padronizado.
          </p>
        </div>
        <div className="doc-header-actions">
          <button
            type="button"
            className="primary-button doc-print-btn"
            onClick={print}
            disabled={!isReady}
          >
            <Printer size={17} /> Imprimir / Salvar em PDF
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="documents-layout-v2">
        {/* ── PAINEL LATERAL DE CONTROLES ── */}
        <aside className="panel doc-controls-panel">
          <span className="control-section-title">1. Tipo de Documento</span>
          <div className="doc-type-selector">
            <button
              type="button"
              className={`doc-type-btn ${kind === 'declaration' ? 'active' : ''}`}
              onClick={() => setKind('declaration')}
            >
              <FileCheck2 size={18} />
              <div>
                <strong>Declaração</strong>
                <small>Comparecimento e horário</small>
              </div>
            </button>

            <button
              type="button"
              className={`doc-type-btn ${kind === 'certificate' ? 'active' : ''}`}
              onClick={() => setKind('certificate')}
            >
              <Stethoscope size={18} />
              <div>
                <strong>Atestado</strong>
                <small>Acompanhamento nutricional</small>
              </div>
            </button>

            <button
              type="button"
              className={`doc-type-btn ${kind === 'supplements' ? 'active' : ''}`}
              onClick={() => setKind('supplements')}
            >
              <Pill size={18} />
              <div>
                <strong>Suplementação</strong>
                <small>Prescrição individualizada</small>
              </div>
            </button>

            <button
              type="button"
              className={`doc-type-btn ${kind === 'receipt' ? 'active' : ''}`}
              onClick={() => setKind('receipt')}
            >
              <Receipt size={18} />
              <div>
                <strong>Recibo & Reembolso</strong>
                <small>Comprovante de pagamento</small>
              </div>
            </button>
          </div>

          <span className="control-section-title" style={{ marginTop: 10 }}>
            2. Paciente & Dados
          </span>

          <label className="doc-field-label">
            Paciente *
            <select
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                setEncounterId('');
              }}
              required
            >
              <option value="">Selecione o paciente cadastrado</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                </option>
              ))}
            </select>
          </label>

          {kind === 'supplements' ? (
            <label className="doc-field-label">
              Atendimento Clínico com Prescrição *
              <select
                value={encounterId}
                onChange={(e) => setEncounterId(e.target.value)}
              >
                <option value="">Selecione a consulta realizada</option>
                {patientEncounters.map((e) => (
                  <option key={e.id} value={e.id}>
                    {new Date(e.startedAt).toLocaleDateString('pt-BR')} · {e.patientName}
                  </option>
                ))}
              </select>
            </label>
          ) : kind === 'receipt' ? (
            <>
              <div className="doc-times-grid">
                <label className="doc-field-label">
                  Data do Pagamento
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>

                <label className="doc-field-label">
                  Valor Pago (R$)
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="250,00"
                  />
                </label>
              </div>

              <label className="doc-field-label">
                Forma de Pagamento
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Transferência Bancária">Transferência Bancária</option>
                  <option value="Dinheiro em Espécie">Dinheiro em Espécie</option>
                </select>
              </label>

              <label className="doc-field-label">
                Descrição do Serviço
                <input
                  type="text"
                  value={serviceDesc}
                  onChange={(e) => setServiceDesc(e.target.value)}
                  placeholder="Consulta e Acompanhamento Nutricional Clínico"
                />
              </label>

              <label className="doc-field-label">
                Observações Adicionais (Opcional)
                <textarea
                  rows={2}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex.: Recibo emitido para fins de solicitação de reembolso junto ao plano de saúde..."
                />
              </label>
            </>
          ) : (
            <>
              <div className="doc-times-grid">
                <label className="doc-field-label">
                  Data da Consulta
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>

                {kind === 'declaration' && (
                  <>
                    <label className="doc-field-label">
                      Horário Início
                      <input
                        type="time"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                      />
                    </label>

                    <label className="doc-field-label">
                      Horário Fim
                      <input
                        type="time"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                      />
                    </label>
                  </>
                )}
              </div>

              <label className="doc-field-label">
                Observações / Informações Adicionais (Opcional)
                <textarea
                  rows={3}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex.: Paciente necessita de horário flexível para refeições conforme prescrição..."
                />
              </label>
            </>
          )}

          <div className="doc-help-card">
            <Sparkles size={16} />
            <div>
              <strong>Timbrado Automático</strong>
              <p>O cabeçalho e rodapé utilizam seu nome, CRN e contatos definidos em Configurações.</p>
            </div>
          </div>
        </aside>

        {/* ── ÁREA DE PRÉ-VISUALIZAÇÃO A4 ── */}
        <section className="doc-preview-wrapper" style={style}>
          <div className="preview-toolbar">
            <span className="preview-tag">
              <FileText size={14} /> Pré-visualização A4 (Papel Timbrado Oficial)
            </span>
            <div className="zoom-controls">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.1))}
                title="Diminuir Zoom"
              >
                <ZoomOut size={15} />
              </button>
              <span className="zoom-value">{Math.round(zoomScale * 100)}%</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoomScale(Math.min(1.3, zoomScale + 0.1))}
                title="Aumentar Zoom"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                className="zoom-btn reset"
                onClick={() => setZoomScale(1)}
              >
                100%
              </button>
            </div>
          </div>

          <div className="sheet-scroll-container">
            <div
              className="sheet-zoom-box"
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
            >
              {settings &&
                (kind === 'supplements' ? (
                  encounter ? (
                    <SupplementDocument settings={settings} encounter={encounter} />
                  ) : (
                    <PreviewEmpty text="Selecione um paciente e a consulta para visualizar a prescrição de suplementação." />
                  )
                ) : kind === 'receipt' ? (
                  patient ? (
                    <ReceiptDocument
                      settings={settings}
                      patient={patient}
                      date={date}
                      amount={amount}
                      paymentMethod={paymentMethod}
                      serviceDesc={serviceDesc}
                      observation={observation}
                    />
                  ) : (
                    <PreviewEmpty text="Selecione um paciente para gerar o recibo de pagamento timbrado." />
                  )
                ) : patient ? (
                  <OfficialDocument
                    settings={settings}
                    patient={patient}
                    kind={kind}
                    date={date}
                    start={start}
                    end={end}
                    observation={observation}
                  />
                ) : (
                  <PreviewEmpty text="Selecione um paciente no painel ao lado para gerar o documento A4 timbrado." />
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Sheet({
  settings,
  children,
  label,
}: {
  settings: Settings;
  children: ReactNode;
  label: string;
}) {
  return (
    <article className="official-sheet-v2">
      <header className="sheet-header-v2">
        <div className="sheet-clinic-info">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="sheet-logo-img" />
          ) : (
            <div className="sheet-logo-svg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
                <circle cx="50" cy="50" r="48" fill="#203528" stroke="#8ca481" strokeWidth="3" />
                <path d="M 50 18 Q 72 40 50 82 Q 28 40 50 18 Z" fill="#8ca481" />
                <path d="M 50 18 L 50 82" stroke="#203528" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 50 42 Q 62 34 68 32" stroke="#203528" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 50 55 Q 38 47 32 45" stroke="#203528" strokeWidth="2" strokeLinecap="round" fill="none" />
                <circle cx="68" cy="32" r="2.5" fill="#203528" />
                <circle cx="32" cy="45" r="2.5" fill="#203528" />
              </svg>
            </div>
          )}
          <div>
            <strong className="sheet-prof-name">{settings.professionalName}</strong>
            <small className="sheet-prof-crn">{settings.specialty} · {settings.crn}</small>
          </div>
        </div>
        <span className="sheet-category-badge">{label}</span>
      </header>

      <main className="sheet-body-v2">{children}</main>

      <footer className="sheet-footer-v2">
        <div className="sheet-footer-inner">
          <strong className="footer-title">{settings.documentFooter || settings.clinicName}</strong>
          <span className="footer-contacts">
            {[settings.phone, settings.email, settings.address, settings.city]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
      </footer>
    </article>
  );
}

function OfficialDocument({
  settings,
  patient,
  kind,
  date,
  start,
  end,
  observation,
}: {
  settings: Settings;
  patient: Patient;
  kind: Exclude<Kind, 'supplements'>;
  date: string;
  start: string;
  end: string;
  observation: string;
}) {
  const declaration = kind === 'declaration';
  return (
    <Sheet settings={settings} label={declaration ? 'Declaração' : 'Atestado Clínico'}>
      <section className="official-content-v2">
        <span className="doc-subtitle-badge">
          {declaration ? 'Comprovante Oficial de Comparecimento' : 'Atestado de Acompanhamento Nutricional'}
        </span>
        <h1 className="doc-main-title">
          {declaration ? 'Declaração de Comparecimento' : 'Atestado Nutricional'}
        </h1>

        <div className="official-body-paragraphs">
          {declaration ? (
            <p>
              Declaro, para os devidos fins a que se fizer necessário, que o(a) paciente{' '}
              <strong>{patient.name}</strong>
              {patient.cpf ? `, inscrito(a) no CPF sob o nº ${patient.cpf},` : ','} compareceu a esta
              consulta nutricional clínica no dia <strong>{fmt(date)}</strong>, no período compreendido
              das <strong>{start}</strong> às <strong>{end}</strong>.
            </p>
          ) : (
            <>
              <p>
                Atesto, para os devidos fins clínicos e comprobatórios, que o(a) paciente{' '}
                <strong>{patient.name}</strong>
                {patient.cpf ? `, inscrito(a) no CPF sob o nº ${patient.cpf},` : ','} encontra-se sob
                meu acompanhamento e orientação nutricional individualizada nesta data, <strong>{fmt(date)}</strong>.
              </p>
              <p>
                Recomenda-se a continuidade do plano alimentar prescrito, hidratação adequada e a
                observância das diretrizes nutricionais clínicas acordadas em consulta.
              </p>
            </>
          )}

          {observation && (
            <aside className="official-notes-aside">
              <strong>Observações Clínicas:</strong>
              <p>{observation}</p>
            </aside>
          )}
        </div>

        <div className="sheet-signature-block">
          <span className="signature-date">
            {settings.city || 'São Paulo'}, {fmt(date)}
          </span>
          <div className="signature-line" />
          <strong className="signature-name">{settings.professionalName}</strong>
          <small className="signature-crn">Nutricionista · {settings.crn}</small>
        </div>
      </section>
    </Sheet>
  );
}

function SupplementDocument({
  settings,
  encounter,
}: {
  settings: Settings;
  encounter: Encounter;
}) {
  return (
    <Sheet settings={settings} label="Receituário Nutricional">
      <section className="supplement-doc-v2">
        <div className="prescription-rx-badge">℞</div>
        <span className="doc-subtitle-badge">Prescrição Nutricional Individualizada</span>
        <h1 className="doc-main-title">{encounter.patientName}</h1>

        {encounter.supplements.length ? (
          <div className="supplements-list-v2">
            {encounter.supplements.map((s, index) => (
              <article key={s.id} className="supplement-card-item">
                <span className="supplement-number">{String(index + 1).padStart(2, '0')}.</span>
                <div className="supplement-details">
                  <h2>{s.name}</h2>
                  <strong className="supplement-dosage">
                    {s.dosage || 'Dosagem conforme orientação'}
                  </strong>
                  <p className="supplement-posology">
                    {s.posology || 'Tomar conforme orientações em consulta.'}
                  </p>
                  {s.pharmaceuticalForm && (
                    <small className="supplement-form">Forma farmacêutica: {s.pharmaceuticalForm}</small>
                  )}
                  {s.observation && (
                    <aside className="supplement-obs">Obs: {s.observation}</aside>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="no-prescription-notice">
            Nenhuma suplementação cadastrada nesta consulta clínica.
          </p>
        )}

        <div className="sheet-signature-block">
          <div className="signature-line" />
          <strong className="signature-name">{settings.professionalName}</strong>
          <small className="signature-crn">Nutricionista · {settings.crn}</small>
        </div>
      </section>
    </Sheet>
  );
}

function ReceiptDocument({
  settings,
  patient,
  date,
  amount,
  paymentMethod,
  serviceDesc,
  observation,
}: {
  settings: Settings;
  patient: Patient;
  date: string;
  amount: string;
  paymentMethod: string;
  serviceDesc: string;
  observation: string;
}) {
  return (
    <Sheet settings={settings} label="Recibo de Pagamento & Reembolso">
      <section className="official-doc-content-v2 receipt-doc">
        <span className="doc-subtitle-badge">Comprovante de Pagamento & Quitação</span>
        <h1 className="doc-main-title">Recibo de Consulta Nutricional</h1>

        <div className="official-body-paragraphs">
          <div className="receipt-amount-highlight">
            <span className="receipt-tag">VALOR RECEBIDO</span>
            <strong className="receipt-val">R$ {amount || '0,00'}</strong>
          </div>

          <p>
            Recebi de <strong>{patient.name}</strong>
            {patient.cpf ? `, inscrito(a) no CPF sob o nº ${patient.cpf},` : ','} a quantia de{' '}
            <strong>R$ {amount || '0,00'}</strong>, paga via <strong>{paymentMethod}</strong>, referente à prestação
            dos seguintes serviços profissionais:
          </p>

          <div className="receipt-service-card">
            <strong>{serviceDesc || 'Consulta e Acompanhamento Nutricional Clínico'}</strong>
            <span>Data de realização do atendimento: <strong>{fmt(date)}</strong></span>
          </div>

          <p>
            Pelo presente, firmo e dou plena, rasa e geral quitação da quantia retro mencionada, sendo este
            documento hábil e emitido para os devidos fins de comprovação e solicitação de <strong>reembolso junto a
            operadoras de planos de saúde</strong> ou comprovação perante a <strong>Receita Federal (IRPF)</strong>.
          </p>

          {observation && (
            <aside className="official-notes-aside">
              <strong>Observações:</strong>
              <p>{observation}</p>
            </aside>
          )}
        </div>

        <div className="sheet-signature-block">
          <span className="signature-date">
            {settings.city || 'São Paulo'}, {fmt(date)}
          </span>
          <div className="signature-line" />
          <strong className="signature-name">{settings.professionalName}</strong>
          <small className="signature-crn">Nutricionista · {settings.crn}</small>
        </div>
      </section>
    </Sheet>
  );
}

function PreviewEmpty({ text }: { text: string }) {
  return (
    <div className="document-preview-empty-v2">
      <div className="empty-doc-icon">
        <FileCheck2 size={36} />
      </div>
      <strong>Prévia do Documento A4</strong>
      <p>{text}</p>
    </div>
  );
}

