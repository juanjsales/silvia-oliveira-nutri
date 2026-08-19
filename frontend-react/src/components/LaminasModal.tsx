import {
  BookOpen,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Droplets,
  HeartPulse,
  Printer,
  Repeat,
  Salad,
  Search,
  Sparkles,
  Tags,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { NUTRITIONAL_LAMINAS, type NutritionalLamina } from '../lib/nutritionalLaminas';

const iconMap: Record<string, any> = {
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
  onBroadcast?: (laminaId: string, laminaTitle: string) => void;
};

export function LaminasModal({ isOpen, onClose, patientName, onBroadcast }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [activeLamina, setActiveLamina] = useState<NutritionalLamina>(NUTRITIONAL_LAMINAS[0] || {} as NutritionalLamina);
  const [copied, setCopied] = useState(false);
  const [broadcastDone, setBroadcastDone] = useState(false);

  const categories = [
    { key: 'ALL', label: 'Todas as Lâminas' },
    { key: 'PRATICA', label: 'Prática & Prato' },
    { key: 'ROTULOS', label: 'Rótulos & Compras' },
    { key: 'COMPORTAMENTO', label: 'Fome & Emoções' },
    { key: 'HIDRATACAO', label: 'Hidratação' },
    { key: 'SUBSTITUICAO', label: 'Substituições' },
    { key: 'HIGIENE', label: 'Higiene & Segurança' },
  ];

  const filteredLaminas = useMemo(() => {
    return NUTRITIONAL_LAMINAS.filter((lamina) => {
      const matchCat = selectedCategory === 'ALL' || lamina.category === selectedCategory;
      const q = search.toLowerCase();
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

    const patientGreeting = patientName ? `<div class="patient-tag">👤 Material preparado para: <strong>${patientName}</strong></div>` : '';

    win.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8"/>
        <title>Lâmina Educativa A4 · ${lamina.title}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 18mm; }
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
            padding: 24px 28px;
            background: #ffffff;
          }
          .a4-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2ece9;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand h1 { margin: 0 0 4px; font-size: 22px; color: #1b4332; font-weight: 800; }
          .brand p { margin: 0; font-size: 12px; color: #52b788; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .a4-badge {
            background: #e8f5e9;
            color: #1b4332;
            border: 1px solid #c8e6c9;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 20px;
            text-transform: uppercase;
          }
          .patient-tag {
            background: #f0fdf4;
            border-left: 4px solid #2d6a4f;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 13px;
            color: #1b4332;
            margin-bottom: 18px;
          }
          .hero-card {
            background: #f4fbf7;
            border: 1px solid #d8f3dc;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 22px;
          }
          .hero-card h2 {
            margin: 0 0 6px;
            font-size: 18px;
            color: #1b4332;
            font-weight: 800;
          }
          .hero-card p {
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
            color: #2d6a4f;
          }
          .section-title {
            font-size: 15px;
            font-weight: 800;
            color: #1b4332;
            margin: 0 0 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .tips-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 24px;
          }
          .tip-item {
            background: #ffffff;
            border: 1px solid #e2ece9;
            border-left: 4px solid #52b788;
            border-radius: 8px;
            padding: 12px 16px;
            font-size: 13.5px;
            line-height: 1.55;
            color: #212529;
          }
          .tip-item strong { color: #1b4332; }
          .a4-footer {
            margin-top: 30px;
            border-top: 1px dashed #b7e4c7;
            padding-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #74c69d;
          }
        </style>
      </head>
      <body>
        <div class="a4-sheet">
          <div class="a4-header">
            <div class="brand">
              <h1>Dra. Silvia Oliveira Lemos</h1>
              <p>Nutrição Clínica & Comportamental · CRN 12345</p>
            </div>
            <div class="a4-badge">${lamina.categoryLabel}</div>
          </div>
          ${patientGreeting}
          <div class="hero-card">
            <h2>${lamina.title}</h2>
            <p>${lamina.summary}</p>
          </div>
          <div class="section-title">✨ Diretrizes & Orientações Práticas:</div>
          <div class="tips-grid">
            ${lamina.tips
              .map(
                (t, idx) => `
              <div class="tip-item">
                <strong>Passo ${idx + 1}:</strong> ${t}
              </div>
            `
              )
              .join('')}
          </div>
          <div class="a4-footer">
            <span>Guia Educativo Exclusivo para o Paciente</span>
            <span>Emitido durante a consulta clínica</span>
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
      onBroadcast(lamina.id, lamina.title);
      setBroadcastDone(true);
      setTimeout(() => setBroadcastDone(false), 3000);
    }
  }

  function handleCopyText(lamina: NutritionalLamina) {
    const text = `*${lamina.title}*\n_${lamina.summary}_\n\n` + lamina.tips.map((t, i) => `${i + 1}. ${t}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => undefined);
  }

  const IconComp = iconMap[activeLamina.icon] || Sparkles;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content laminas-interactive-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1080px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(45, 106, 79, 0.12)', color: 'var(--forest)', padding: '8px', borderRadius: '10px' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text)' }}>
                Painel Interativo de Lâminas Educativas A4
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
                Apresente na teleconsulta, imprima em formato A4 ou compartilhe durante a consulta clínica.
              </p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="laminas-modal-body" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', padding: '16px 0', flex: 1, overflow: 'hidden' }}>
          {/* ── COLUNA ESQUERDA: LISTA & FILTROS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--border)', paddingRight: '16px', overflowY: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Buscar lâminas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    border: selectedCategory === c.key ? '1px solid var(--forest)' : '1px solid var(--border)',
                    background: selectedCategory === c.key ? 'var(--forest)' : 'var(--surface)',
                    color: selectedCategory === c.key ? '#ffffff' : 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {filteredLaminas.map((lamina) => {
                const ItemIcon = iconMap[lamina.icon] || Sparkles;
                const isSelected = activeLamina.id === lamina.id;
                return (
                  <article
                    key={lamina.id}
                    onClick={() => setActiveLamina(lamina)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid var(--forest)' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(45, 106, 79, 0.07)' : 'var(--surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ color: isSelected ? 'var(--forest)' : 'var(--muted)' }}>
                      <ItemIcon size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lamina.title}
                      </strong>
                      <small style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{lamina.categoryLabel}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* ── COLUNA DIREITA: PREVIEW A4 INTERATIVO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--forest)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {activeLamina.categoryLabel}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleCopyText(activeLamina)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  title="Copiar texto para WhatsApp"
                >
                  {copied ? <><Check size={14} color="#38c777" /> Copiado!</> : <><Copy size={14} /> Copiar Texto</>}
                </button>
                {onBroadcast && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleBroadcastLamina(activeLamina)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    title="Transmitir esta lâmina na chamada do paciente"
                  >
                    {broadcastDone ? <><Check size={14} color="#38c777" /> Transmitindo!</> : <><Sparkles size={14} /> Transmitir no Vídeo</>}
                  </button>
                )}
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handlePrintA4(activeLamina)}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  title="Imprimir modelo A4 de alta qualidade"
                >
                  <Printer size={15} /> Imprimir A4
                </button>
              </div>
            </div>

            {/* FOLHA A4 SIMULADA */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid rgba(45, 106, 79, 0.25)',
                borderRadius: '16px',
                padding: '24px 28px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2ece9', paddingBottom: '14px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#1b4332', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IconComp size={22} color="#2d6a4f" /> {activeLamina.title}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#52b788', fontWeight: 700, textTransform: 'uppercase' }}>
                    Dra. Silvia Oliveira Lemos · Nutrição Clínica & Funcional
                  </p>
                </div>
                <span style={{ background: '#e8f5e9', color: '#1b4332', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>
                  {activeLamina.categoryLabel}
                </span>
              </div>

              {patientName && (
                <div style={{ background: '#f0fdf4', borderLeft: '4px solid #2d6a4f', padding: '8px 12px', borderRadius: '6px', fontSize: '0.82rem', color: '#1b4332' }}>
                  👤 Material personalizado para: <strong>{patientName}</strong>
                </div>
              )}

              <div style={{ background: '#f4fbf7', border: '1px solid #d8f3dc', borderRadius: '10px', padding: '14px 18px', fontSize: '0.9rem', color: '#2d6a4f', lineHeight: 1.5 }}>
                {activeLamina.summary}
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: '#1b4332', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  ✨ Orientações & Passo a Passo:
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {activeLamina.tips.map((tip, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2ece9',
                        borderLeft: '4px solid #52b788',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        color: '#212529',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong style={{ color: '#1b4332', marginRight: '6px' }}>Passo {idx + 1}:</strong>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #b7e4c7', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#74c69d' }}>
                <span>Material Educativo Oficial</span>
                <span>Dra. Silvia Oliveira Lemos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
