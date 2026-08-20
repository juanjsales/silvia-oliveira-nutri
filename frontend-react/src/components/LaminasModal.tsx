import {
  BookOpen,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  Copy,
  Droplets,
  Eye,
  HeartPulse,
  Printer,
  Radio,
  Repeat,
  Salad,
  Search,
  Share2,
  Sparkles,
  Tags,
  X,
  Zap,
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';
import { NUTRITIONAL_LAMINAS, type NutritionalLamina } from '../lib/nutritionalLaminas';

const iconMap: Record<string, ComponentType<{ size?: number; color?: string; style?: React.CSSProperties; className?: string }>> = {
  Salad,
  Tags,
  Brain,
  Droplets,
  Repeat,
  Sparkles,
  HeartPulse,
  Boxes,
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  onBroadcast?: (lamina: NutritionalLamina) => void;
};

export function LaminasModal({ isOpen, onClose, patientName, onBroadcast }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [activeLamina, setActiveLamina] = useState<NutritionalLamina>(
    NUTRITIONAL_LAMINAS[0] || ({} as NutritionalLamina)
  );
  const [copied, setCopied] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  const categories = [
    { key: 'ALL', label: 'Todas as Lâminas', count: NUTRITIONAL_LAMINAS.length },
    { key: 'PRATICA', label: 'Prato & Prática', count: NUTRITIONAL_LAMINAS.filter((l) => l.category === 'PRATICA').length },
    { key: 'ROTULOS', label: 'Rótulos & Compras', count: NUTRITIONAL_LAMINAS.filter((l) => l.category === 'ROTULOS').length },
    { key: 'COMPORTAMENTO', label: 'Fome & Emoções', count: NUTRITIONAL_LAMINAS.filter((l) => l.category === 'COMPORTAMENTO').length },
    { key: 'HIDRATACAO', label: 'Hidratação', count: NUTRITIONAL_LAMINAS.filter((l) => l.category === 'HIDRATACAO').length },
    { key: 'SUBSTITUICAO', label: 'Substituições', count: NUTRITIONAL_LAMINAS.filter((l) => l.category === 'SUBSTITUICAO').length },
    { key: 'HIGIENE', label: 'Higiene & Preparo', count: NUTRITIONAL_LAMINAS.filter((l) => l.category === 'HIGIENE').length },
  ];

  const filteredLaminas = useMemo(() => {
    return NUTRITIONAL_LAMINAS.filter((lamina) => {
      const matchCat = selectedCategory === 'ALL' || lamina.category === selectedCategory;
      const q = search.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch =
        lamina.title.toLowerCase().includes(q) ||
        lamina.summary.toLowerCase().includes(q) ||
        lamina.tips.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, search]);

  if (!isOpen) return null;

  function handlePrintA4(lamina: NutritionalLamina) {
    const win = window.open('', '_blank');
    if (!win) return;

    const patientGreeting = patientName
      ? `<div class="patient-tag">👤 Material personalizado para: <strong>${patientName}</strong></div>`
      : '';

    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8"/>
        <title>Lâmina Educativa A4 · ${lamina.title}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 16mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1b4332;
            margin: 0;
            padding: 0;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .a4-sheet {
            max-width: 100%;
            border: 2px solid #2d6a4f;
            border-radius: 16px;
            padding: 26px 30px;
            background: #ffffff;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2d6a4f;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .clinic-name {
            font-size: 1.35rem;
            font-weight: 800;
            color: #1b4332;
            margin: 0 0 3px;
          }
          .clinic-subtitle {
            font-size: 0.82rem;
            color: #52b788;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
          }
          .category-badge {
            background: #e8f5e9;
            color: #1b4332;
            border: 1px solid #b7e4c7;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 5px 12px;
            border-radius: 20px;
            text-transform: uppercase;
          }
          .patient-tag {
            background: #f4fbf7;
            border-left: 4px solid #2d6a4f;
            padding: 9px 14px;
            border-radius: 6px;
            font-size: 0.88rem;
            color: #1b4332;
            margin-bottom: 16px;
          }
          .lamina-title {
            font-size: 1.45rem;
            font-weight: 800;
            color: #1b4332;
            margin: 0 0 10px;
          }
          .summary-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 14px 18px;
            font-size: 0.95rem;
            color: #166534;
            line-height: 1.55;
            margin-bottom: 20px;
          }
          .tips-title {
            font-size: 0.92rem;
            font-weight: 800;
            color: #1b4332;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 12px;
          }
          .tip-card {
            background: #ffffff;
            border: 1px solid #e2ece9;
            border-left: 5px solid #2d6a4f;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 10px;
            font-size: 0.9rem;
            color: #212529;
            line-height: 1.5;
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }
          .tip-num {
            background: #2d6a4f;
            color: #ffffff;
            font-weight: 800;
            font-size: 0.8rem;
            min-width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 1px;
          }
          .footer {
            margin-top: 24px;
            border-top: 1px dashed #b7e4c7;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.78rem;
            color: #74c69d;
          }
        </style>
      </head>
      <body>
        <div class="a4-sheet">
          <div class="header">
            <div>
              <h1 class="clinic-name">Dra. Silvia Oliveira Lemos</h1>
              <p class="clinic-subtitle">Nutrição Clínica & Funcional · CRN-3 12345</p>
            </div>
            <span class="category-badge">${lamina.categoryLabel}</span>
          </div>
          ${patientGreeting}
          <h2 class="lamina-title">🍃 ${lamina.title}</h2>
          <div class="summary-box">${lamina.summary}</div>
          <div class="tips-title">✨ Orientações & Passo a Passo:</div>
          <div>
            ${lamina.tips
              .map(
                (tip, i) => `
              <div class="tip-card">
                <span class="tip-num">${i + 1}</span>
                <div>${tip}</div>
              </div>`
              )
              .join('')}
          </div>
          <div class="footer">
            <span>Material Educativo Oficial</span>
            <span>Emitido em ${new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    win.document.close();
  }

  function handleBroadcastLamina(lamina: NutritionalLamina) {
    if (onBroadcast) {
      onBroadcast(lamina);
      setBroadcastDone(true);
      setTimeout(() => setBroadcastDone(false), 3500);
    }
  }

  function handleCopyText(lamina: NutritionalLamina) {
    const text =
      `*🌿 ${lamina.title}*\n` +
      `_${lamina.summary}_\n\n` +
      `*Orientações Práticas:*\n` +
      lamina.tips.map((t, i) => `▫️ *Passo ${i + 1}:* ${t}`).join('\n') +
      `\n\n_Dra. Silvia Oliveira Lemos · Nutrição Clínica_`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => undefined);
  }

  const ActiveIcon = iconMap[activeLamina.icon] || Sparkles;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content laminas-interactive-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1180px',
          width: '95vw',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          borderRadius: '16px',
        }}
      >
        {/* ── CABEÇALHO DO MODAL ── */}
        <div
          className="modal-header"
          style={{
            borderBottom: '1px solid var(--border)',
            paddingBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #2d6a4f, #1b4332)',
                color: '#ffffff',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(45,106,79,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text)', fontWeight: 800 }}>
                Lâminas Educativas A4 & Painel Interativo
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.83rem', color: 'var(--muted)' }}>
                Apresente na teleconsulta do paciente, imprima em formato A4 timbrado ou envie via WhatsApp.
              </p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* ── CORPO PRINCIPAL: 2 COLUNAS ── */}
        <div
          className="laminas-modal-body"
          style={{
            display: 'grid',
            gridTemplateColumns: '360px 1fr',
            gap: '24px',
            padding: '16px 0 0',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* ── COLUNA ESQUERDA: FILTROS & LISTA ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              borderRight: '1px solid var(--border)',
              paddingRight: '18px',
              overflowY: 'auto',
            }}
          >
            {/* Campo de Busca */}
            <div style={{ position: 'relative' }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--muted)' }}
              />
              <input
                type="text"
                placeholder="Buscar por tema ou alimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  fontSize: '0.85rem',
                  background: 'var(--surface)',
                }}
              />
            </div>

            {/* Categorias em Pílulas */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                paddingBottom: '4px',
                scrollbarWidth: 'thin',
              }}
            >
              {categories.map((c) => {
                const isActive = selectedCategory === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setSelectedCategory(c.key)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      border: isActive ? '1px solid var(--forest)' : '1px solid var(--border)',
                      background: isActive ? 'var(--forest)' : 'var(--surface)',
                      color: isActive ? '#ffffff' : 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{c.label}</span>
                    <span
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '0.68rem',
                      }}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Lista de Lâminas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {filteredLaminas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Nenhuma lâmina encontrada para esta busca.
                </div>
              ) : (
                filteredLaminas.map((lamina) => {
                  const ItemIcon = iconMap[lamina.icon] || Sparkles;
                  const isSelected = activeLamina.id === lamina.id;
                  return (
                    <article
                      key={lamina.id}
                      onClick={() => setActiveLamina(lamina)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid var(--forest)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(45, 106, 79, 0.08)' : 'var(--surface)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(45,106,79,0.12)' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isSelected ? 'var(--forest)' : 'rgba(45,106,79,0.1)',
                          color: isSelected ? '#ffffff' : 'var(--forest)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ItemIcon size={19} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: '0.88rem',
                            color: 'var(--text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {lamina.title}
                        </strong>
                        <small style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                          {lamina.categoryLabel} · {lamina.tips.length} passos
                        </small>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* ── COLUNA DIREITA: PREVIEW TIMBRADO A4 ── */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
              paddingRight: '6px',
            }}
          >
            {/* Barra de Ações Rápidas */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                background: 'var(--surface)',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: 'var(--forest)',
                    background: 'rgba(45, 106, 79, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                  }}
                >
                  {activeLamina.categoryLabel}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  {activeLamina.tips.length} tópicos práticos
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleCopyText(activeLamina)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  title="Copiar texto formatado para o WhatsApp"
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#16a34a" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copiar Texto
                    </>
                  )}
                </button>

                {onBroadcast && (
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleBroadcastLamina(activeLamina)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      background: broadcastDone ? '#16a34a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      borderColor: 'transparent',
                    }}
                    title="Apresentar esta lâmina instantaneamente na tela do paciente"
                  >
                    {broadcastDone ? (
                      <>
                        <CheckCircle2 size={14} /> Transmitindo na tela do paciente!
                      </>
                    ) : (
                      <>
                        <Radio size={14} /> Transmitir no Vídeo
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handlePrintA4(activeLamina)}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  title="Imprimir modelo A4 em alta qualidade"
                >
                  <Printer size={15} /> Imprimir A4
                </button>
              </div>
            </div>

            {/* FOLHA A4 SIMULADA TIMBRADA */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid rgba(45, 106, 79, 0.25)',
                borderRadius: '16px',
                padding: '28px 32px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              {/* Header Timbrado */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #e2ece9',
                  paddingBottom: '16px',
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: '0 0 4px',
                      fontSize: '1.35rem',
                      color: '#1b4332',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <ActiveIcon size={24} color="#2d6a4f" /> {activeLamina.title}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.82rem',
                      color: '#52b788',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Dra. Silvia Oliveira Lemos · Nutrição Clínica & Funcional
                  </p>
                </div>
                <span
                  style={{
                    background: '#e8f5e9',
                    color: '#1b4332',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '5px 12px',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    border: '1px solid #b7e4c7',
                  }}
                >
                  {activeLamina.categoryLabel}
                </span>
              </div>

              {patientName && (
                <div
                  style={{
                    background: '#f4fbf7',
                    borderLeft: '4px solid #2d6a4f',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: '#1b4332',
                  }}
                >
                  👤 Material personalizado para: <strong>{patientName}</strong>
                </div>
              )}

              {/* Resumo da Conduta */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  fontSize: '0.94rem',
                  color: '#166534',
                  lineHeight: 1.6,
                }}
              >
                {activeLamina.summary}
              </div>

              {/* Lista de Passos / Orientações */}
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    color: '#1b4332',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  ✨ Orientações & Passo a Passo:
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {activeLamina.tips.map((tip, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2ece9',
                        borderLeft: '4px solid #2d6a4f',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        fontSize: '0.88rem',
                        color: '#212529',
                        lineHeight: 1.55,
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <span
                        style={{
                          background: '#2d6a4f',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.78rem',
                          minWidth: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '1px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>{tip}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rodapé da Lâmina */}
              <div
                style={{
                  borderTop: '1px dashed #b7e4c7',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  color: '#74c69d',
                }}
              >
                <span>Material Educativo Oficial para Consulta</span>
                <span>Dra. Silvia Oliveira Lemos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
