import {
  BookOpen,
  Boxes,
  Brain,
  CheckCircle2,
  Droplets,
  HeartPulse,
  Printer,
  Repeat,
  Salad,
  Search,
  Sparkles,
  Tags,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { NUTRITIONAL_LAMINAS, type NutritionalLamina } from '../../lib/nutritionalLaminas';
import { getLaminaSources } from '../../lib/laminaSources';
import { LaminaVisualInfographic } from '../LaminaVisualInfographic';

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

export function PortalLaminasView() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeLamina, setActiveLamina] = useState<NutritionalLamina | null>(null);

  const categories = [
    { key: 'ALL', label: 'Todas as Lâminas' },
    { key: 'PRATICA', label: 'Prática & Funcional' },
    { key: 'ROTULOS', label: 'Rótulos & Compras' },
    { key: 'COMPORTAMENTO', label: 'Comportamento' },
    { key: 'HIDRATACAO', label: 'Hidratação' },
    { key: 'SUBSTITUICAO', label: 'Substituições' },
    { key: 'HIGIENE', label: 'Higiene & Segurança' },
  ];

  const filteredLaminas = useMemo(() => {
    return NUTRITIONAL_LAMINAS.filter((lamina) => {
      const matchCategory =
        selectedCategory === 'ALL' || lamina.category === selectedCategory;
      const searchLower = search.toLowerCase();
      const matchSearch =
        lamina.title.toLowerCase().includes(searchLower) ||
        lamina.summary.toLowerCase().includes(searchLower) ||
        lamina.tips.some((tip) => tip.toLowerCase().includes(searchLower));
      return matchCategory && matchSearch;
    });
  }, [search, selectedCategory]);

  function handlePrintLamina(lamina: NutritionalLamina) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    let diagramHtml = '';
    if (lamina.id === 'prato-ideal') {
      diagramHtml = `
        <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:10px; margin: 16px 0 20px;">
          <div style="background:#d8f3dc; border:2px solid #52b788; border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:1.8rem;">🥗 🥦</div>
            <strong style="font-size:1.2rem; color:#1b4332; display:block;">50%</strong>
            <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#1b4332;">Vegetais & Fibras</span>
          </div>
          <div style="background:#fef3c7; border:2px solid #f59e0b; border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:1.8rem;">🍗 🥚</div>
            <strong style="font-size:1.2rem; color:#78350f; display:block;">25%</strong>
            <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#78350f;">Proteínas</span>
          </div>
          <div style="background:#ffedd5; border:2px solid #f97316; border-radius:10px; padding:12px; text-align:center;">
            <div style="font-size:1.8rem;">🍚 🥔</div>
            <strong style="font-size:1.2rem; color:#7c2d12; display:block;">25%</strong>
            <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:#7c2d12;">Carboidratos</span>
          </div>
        </div>
      `;
    } else if (lamina.id === 'fome-saciedade') {
      diagramHtml = `
        <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:12px; margin:16px 0 20px; display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div style="background:#ffffff; border:1px solid #bbf7d0; padding:10px; border-radius:8px;">
            <strong style="color:#15803d; font-size:0.88rem;">🟢 Nível 3 a 4: Comer</strong>
            <p style="margin:4px 0 0; font-size:0.78rem; color:#166534;">Fome física moderada. Coma com calma e atenção plena.</p>
          </div>
          <div style="background:#ffffff; border:1px solid #bbf7d0; padding:10px; border-radius:8px;">
            <strong style="color:#15803d; font-size:0.88rem;">🛑 Nível 6 a 7: Parar</strong>
            <p style="margin:4px 0 0; font-size:0.78rem; color:#166534;">Satisfação confortável e restauradora. Pare sem empachamento.</p>
          </div>
        </div>
      `;
    } else if (lamina.id === 'hidratacao-correta') {
      diagramHtml = `
        <div style="background:#ecfeff; border:1.5px solid #a5f3fc; border-radius:10px; padding:12px; margin:16px 0 20px; text-align:center;">
          <strong style="color:#0891b2; font-size:1.1rem; display:block;">💧 Meta: Seu Peso (kg) × 35 ml</strong>
          <span style="font-size:0.82rem; color:#155e75;">Urina ideal: Amarelo-palha claro e translúcido.</span>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${lamina.title} - Dra. Silvia Oliveira Lemos</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #183b2b; }
          .header { border-bottom: 2px solid #25633b; padding-bottom: 16px; margin-bottom: 24px; }
          .header h1 { margin: 0 0 6px; font-size: 22px; color: #183b2b; }
          .header p { margin: 0; font-size: 13px; color: #556b5e; }
          .summary { background: #f4f8f5; border-left: 4px solid #25633b; padding: 14px 18px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
          .tips-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
          ul { padding-left: 20px; line-height: 1.6; font-size: 14px; }
          li { margin-bottom: 10px; }
          .footer { margin-top: 40px; border-top: 1px solid #e0e8e2; padding-top: 12px; font-size: 11px; color: #778f80; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${lamina.title}</h1>
          <p>Dra. Silvia Oliveira Lemos · Nutricionista Clínica e Funcional</p>
        </div>
        <div class="summary">${lamina.summary}</div>
        ${diagramHtml}
        <div class="tips-title">✨ Orientações Práticas para seu Dia a Dia:</div>
        <ul>
          ${lamina.tips.map((t) => `<li>${t}</li>`).join('')}
          <h3>Fontes e referências</h3>
          ${getLaminaSources(lamina).map((source) => `<p><b>${source.institution}.</b> ${source.title}. ${source.year}.<br>${source.url}</p>`).join('')}
        </ul>
        <div class="footer">
          Material educativo exclusivo · Consultório Nutricional Dra. Silvia Oliveira Lemos
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="portal-laminas-container">
      {/* Header com Boas-Vindas e Busca */}
      <header className="portal-laminas-header">
        <div className="portal-laminas-title">
          <div className="portal-laminas-badge">
            <BookOpen size={20} />
          </div>
          <div>
            <h2>Lâminas & Guias Educativos</h2>
            <p>Infográficos e orientações visuais preparadas pela Dra. Silvia para seu dia a dia.</p>
          </div>
        </div>

        <div className="portal-laminas-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por alimento, rótulo, hidratação..."
          />
        </div>
      </header>

      {/* Categorias Pills */}
      <div className="portal-laminas-categories">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`portal-cat-pill ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid de Lâminas */}
      {filteredLaminas.length === 0 ? (
        <div className="portal-empty-card">
          <BookOpen size={36} />
          <p>Nenhuma lâmina encontrada para a sua busca.</p>
        </div>
      ) : (
        <div className="portal-laminas-grid">
          {filteredLaminas.map((lamina) => {
            const Icon = iconMap[lamina.icon] || Sparkles;

            return (
              <article key={lamina.id} className="portal-lamina-card">
                <div className="portal-lamina-top">
                  <div className="portal-lamina-icon">
                    <Icon size={20} />
                  </div>
                  <span className="portal-lamina-tag">{lamina.categoryLabel}</span>
                </div>

                <h3>{lamina.title}</h3>
                <p className="portal-lamina-desc">{lamina.summary}</p>

                <div className="portal-lamina-tips-box">
                  <strong>💡 Destaques:</strong>
                  <ul>
                    {lamina.tips.slice(0, 2).map((tip, idx) => (
                      <li key={idx}>
                        <CheckCircle2 size={13} className="tip-bullet" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="portal-lamina-actions">
                  <button
                    type="button"
                    className="portal-view-btn"
                    onClick={() => setActiveLamina(lamina)}
                  >
                    Ver Guia Completo
                  </button>
                  <button
                    type="button"
                    className="portal-print-btn"
                    onClick={() => handlePrintLamina(lamina)}
                    title="Imprimir ou salvar em PDF para a geladeira"
                  >
                    <Printer size={15} /> Imprimir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Detalhado da Lâmina */}
      {activeLamina && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveLamina(null);
          }}
        >
          <div className="portal-lamina-detail-modal">
            <header className="portal-detail-header">
              <div>
                <span className="eyebrow">{activeLamina.categoryLabel}</span>
                <h2>{activeLamina.title}</h2>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setActiveLamina(null)}
              >
                ✕
              </button>
            </header>

            <div className="portal-detail-body">
              <div className="portal-detail-summary">
                {activeLamina.summary}
              </div>

              {/* Infográfico Visual Ilustrado */}
              <LaminaVisualInfographic laminaId={activeLamina.id} />

              <h4>✨ Orientações e Dicas Práticas:</h4>
              <ul className="portal-detail-list">
                {activeLamina.tips.map((tip, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="tip-icon-green" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <div className="portal-lamina-references">
                <h4>Fontes e referências</h4>
                {getLaminaSources(activeLamina).map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                    {source.institution}. {source.title}. {source.year}.
                  </a>
                ))}
                <small>Conteúdo educativo geral. Sua orientação individual pode ser diferente.</small>
              </div>
            </div>

            <footer className="portal-detail-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => handlePrintLamina(activeLamina)}
              >
                <Printer size={16} /> Imprimir / PDF
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setActiveLamina(null)}
              >
                Entendi
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
