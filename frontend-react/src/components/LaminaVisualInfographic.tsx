import React from 'react';
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplet,
  Droplets,
  Flame,
  HelpCircle,
  Layers,
  Leaf,
  PieChart,
  Repeat,
  Salad,
  Scale,
  ShieldCheck,
  Smile,
  Sparkles,
  Utensils,
  Zap,
} from 'lucide-react';

export function LaminaVisualInfographic({ laminaId }: { laminaId: string }) {
  switch (laminaId) {
    case 'prato-ideal':
    case 'fibras-no-dia':
    case 'lanche-equilibrado':
      return <PratoIdealIllustration />;
    case 'rotulos-alimentos':
    case 'acucar-bebidas':
    case 'sodio-rotulos':
      return <RotulosIllustration />;
    case 'fome-saciedade':
    case 'comer-com-atencao':
      return <FomeSaciedadeIllustration />;
    case 'hidratacao-correta':
    case 'hidratacao-rotina':
      return <HidratacaoIllustration />;
    case 'substituicoes-praticas':
      return <SubstituicoesIllustration />;
    case 'higienizacao-hortifruti':
      return <HigienizacaoIllustration />;
    case 'gorduras-boas':
      return <GordurasBoasIllustration />;
    case 'meal-prep-marmitas':
    case 'planejamento-compras':
    case 'conservacao-sobras':
      return <MealPrepIllustration />;
    default:
      return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   1. PRATO EQUILIBRADO (50% / 25% / 25%)
   ───────────────────────────────────────────────────────────── */
function PratoIdealIllustration() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '8px 0' }}>
      {/* Círculo do Prato Ilustrado */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
          aspectRatio: '1/1',
          background: 'radial-gradient(circle at center, #ffffff 60%, #e2ece9 100%)',
          borderRadius: '50%',
          border: '10px solid #ffffff',
          boxShadow: '0 12px 36px rgba(45, 106, 79, 0.18), inset 0 2px 10px rgba(0,0,0,0.06)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 6,
          padding: 12,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Metade Esquerda: 50% Vegetais */}
        <div
          style={{
            gridColumn: '1 / 2',
            gridRow: '1 / 3',
            background: 'linear-gradient(135deg, #d8f3dc, #b7e4c7)',
            borderRadius: '180px 0 0 180px',
            border: '2px dashed #52b788',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14,
            textAlign: 'center',
            color: '#1b4332',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 4 }}>🥗 🥦 🥕</div>
          <strong style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1 }}>50%</strong>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', marginTop: 2 }}>
            Vegetais & Fibras
          </span>
          <small style={{ fontSize: '0.68rem', color: '#2d6a4f', marginTop: 4, lineHeight: 1.2 }}>
            Folhas cruas, legumes cozidos e saladas coloridas
          </small>
        </div>

        {/* Quadrante Superior Direito: 25% Proteínas */}
        <div
          style={{
            gridColumn: '2 / 3',
            gridRow: '1 / 2',
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderRadius: '0 180px 0 0',
            border: '2px dashed #f59e0b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            textAlign: 'center',
            color: '#78350f',
          }}
        >
          <div style={{ fontSize: '1.4rem' }}>🍗 🥚 🐟</div>
          <strong style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>25%</strong>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Proteínas
          </span>
          <small style={{ fontSize: '0.62rem', color: '#92400e' }}>
            Frango, peixe, ovos, tofu, leguminosas
          </small>
        </div>

        {/* Quadrante Inferior Direito: 25% Carboidratos */}
        <div
          style={{
            gridColumn: '2 / 3',
            gridRow: '2 / 3',
            background: 'linear-gradient(135deg, #ffedd5, #fed7aa)',
            borderRadius: '0 0 180px 0',
            border: '2px dashed #f97316',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            textAlign: 'center',
            color: '#7c2d12',
          }}
        >
          <div style={{ fontSize: '1.4rem' }}>🍚 🥔 🍠</div>
          <strong style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>25%</strong>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
            Carboidratos
          </span>
          <small style={{ fontSize: '0.62rem', color: '#9a3412' }}>
            Arroz integral, mandioca, batatas, quinoa
          </small>
        </div>

        {/* Centro: Fio de Azeite */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            border: '2px solid #52b788',
            borderRadius: '50%',
            width: 58,
            height: 58,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🫒</span>
          <span style={{ fontSize: '0.52rem', fontWeight: 800, color: '#1b4332', textTransform: 'uppercase' }}>
            Azeite
          </span>
        </div>
      </div>

      {/* Legenda Explicativa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        <div style={{ background: '#d8f3dc', padding: '8px 10px', borderRadius: 8, fontSize: '0.75rem', color: '#1b4332', textAlign: 'center' }}>
          <strong>🥬 Fibras & Volume</strong>
          <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#2d6a4f' }}>Saciedade precoce e controle glicêmico</p>
        </div>
        <div style={{ background: '#fef3c7', padding: '8px 10px', borderRadius: 8, fontSize: '0.75rem', color: '#78350f', textAlign: 'center' }}>
          <strong>🥩 Massa Muscular</strong>
          <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#92400e' }}>Reparação e sustentação da saciedade</p>
        </div>
        <div style={{ background: '#ffedd5', padding: '8px 10px', borderRadius: 8, fontSize: '0.75rem', color: '#7c2d12', textAlign: 'center' }}>
          <strong>⚡ Energia Limpa</strong>
          <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: '#9a3412' }}>Combustível para o cérebro e treinos</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. LEITURA DE RÓTULOS (Infográfico Anatômico)
   ───────────────────────────────────────────────────────────── */
function RotulosIllustration() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '8px 0' }}>
      <div
        style={{
          background: '#ffffff',
          border: '2px solid #cbd5e1',
          borderRadius: 14,
          padding: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          position: 'relative',
        }}
      >
        {/* Banner de Destaque da Lupa */}
        <div
          style={{
            background: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            padding: '8px 12px',
            margin: '-16px -16px 14px -16px',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong style={{ fontSize: '0.82rem', color: '#334155' }}>🔍 Anatomia de um Rótulo Alimentar</strong>
          <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#991b1b', fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
            Atenção à Ordem
          </span>
        </div>

        {/* 1. Lista de Ingredientes com Lupa */}
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
            1. Lista de Ingredientes (Ordem Decrescente de Quantidade):
          </span>
          <div
            style={{
              background: '#fff1f2',
              border: '1.5px solid #fecdd3',
              borderRadius: 10,
              padding: 12,
              fontSize: '0.82rem',
              lineHeight: 1.6,
              color: '#881337',
            }}
          >
            <strong>INGREDIENTES: </strong>
            <span style={{ background: '#fda4af', padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>
              1º Açúcar ⚠️
            </span>{' '}
            (o ingrediente em MAIOR quantidade no produto), Farinha de trigo enriquecida, Gordura vegetal hidrogenada (Trans), Xarope de milho, Emulsificantes (INS 322), Aromatizante artificial.
          </div>
        </div>

        {/* 2. Regra de Ouro da Nutrição */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 10 }}>
            <strong style={{ fontSize: '0.76rem', color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
              ✅ Sinal Verde
            </strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: '0.72rem', color: '#14532d', lineHeight: 1.4 }}>
              <li>Menos de 5 ingredientes</li>
              <li>Nomes de comida real que você conhece</li>
              <li>Açúcar ausente ou no final da lista</li>
            </ul>
          </div>

          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 10 }}>
            <strong style={{ fontSize: '0.76rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 5 }}>
              ❌ Sinal de Alerta
            </strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: '0.72rem', color: '#7f1d1d', lineHeight: 1.4 }}>
              <li>Açúcar nos 3 primeiros itens</li>
              <li>Gordura hidrogenada / Interesterificada</li>
              <li>Excesso de corantes e conservantes INS</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. FOME & SACIEDADE (Régua / Termômetro Visual 1 a 10)
   ───────────────────────────────────────────────────────────── */
function FomeSaciedadeIllustration() {
  const levels = [
    { num: 1, label: 'Voraz / Tontura', color: '#ef4444', zone: 'danger', desc: 'Sintomas de fraqueza' },
    { num: 2, label: 'Fome Intensa', color: '#f87171', zone: 'danger', desc: 'Irritabilidade' },
    { num: 3, label: 'Fome Física', color: '#22c55e', zone: 'ideal-start', desc: '🟢 IDEAL PARA COMER' },
    { num: 4, label: 'Primeiros Sinais', color: '#4ade80', zone: 'ideal-start', desc: 'Estômago roncando' },
    { num: 5, label: 'Neutro', color: '#94a3b8', zone: 'neutral', desc: 'Sem fome nem cheio' },
    { num: 6, label: 'Satisfeito Leve', color: '#4ade80', zone: 'ideal-stop', desc: 'Energia renovada' },
    { num: 7, label: 'Satisfeito Ideal', color: '#22c55e', zone: 'ideal-stop', desc: '🟢 IDEAL PARA PARAR' },
    { num: 8, label: 'Cheio', color: '#fbbf24', zone: 'warning', desc: 'Passou do ponto' },
    { num: 9, label: 'Pesado', color: '#f97316', zone: 'danger', desc: 'Desconforto gástrico' },
    { num: 10, label: 'Empachado', color: '#ef4444', zone: 'danger', desc: 'Letargia e sono' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '8px 0' }}>
      {/* Régua Interativa */}
      <div
        style={{
          background: '#ffffff',
          border: '2px solid #e2ece9',
          borderRadius: 14,
          padding: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1b4332', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
          🧭 Termômetro dos Sinais Fisiológicos:
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, marginBottom: 14 }}>
          {levels.map((lvl) => {
            const isTarget = lvl.num === 3 || lvl.num === 4 || lvl.num === 6 || lvl.num === 7;
            return (
              <div
                key={lvl.num}
                style={{
                  background: isTarget ? '#dcfce7' : '#f8fafc',
                  border: `2px solid ${lvl.color}`,
                  borderRadius: 8,
                  padding: '10px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  boxShadow: isTarget ? '0 2px 8px rgba(34,197,94,0.25)' : 'none',
                }}
              >
                <strong style={{ fontSize: '1.2rem', color: lvl.color, lineHeight: 1 }}>{lvl.num}</strong>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#334155', marginTop: 4, lineHeight: 1.1 }}>
                  {lvl.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Caixas de Ação */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 10, padding: 12 }}>
            <strong style={{ fontSize: '0.82rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
              🍽️ Nível 3 a 4: Comece a Comer
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#166534', lineHeight: 1.4 }}>
              Fome física genuína. Você come com calma, aprecia o sabor e escolhe alimentos nutritivos.
            </p>
          </div>

          <div style={{ background: '#dcfce7', border: '1.5px solid #86efac', borderRadius: 10, padding: 12 }}>
            <strong style={{ fontSize: '0.82rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
              🛑 Nível 6 a 7: Pare de Comer
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#166534', lineHeight: 1.4 }}>
              Sensação de satisfação leve e confortável, com energia física restaurada sem sonolência.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. HIDRATAÇÃO & ESCALA DE URINA
   ───────────────────────────────────────────────────────────── */
function HidratacaoIllustration() {
  const urineColors = [
    { level: 1, color: '#fef9c3', label: '1-2: Hidratação Perfeita', status: 'Excelente' },
    { level: 2, color: '#fef08a', label: '3-4: Hidratação Boa', status: 'Ideal' },
    { level: 3, color: '#facc15', label: '5-6: Levemente Desidratado', status: 'Beba 1 Copo' },
    { level: 4, color: '#ca8a04', label: '7-8: Desidratação Severa', status: 'Atenção Crítica' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '8px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 12 }}>
        {/* Fórmula e Garrafa */}
        <div style={{ background: '#ecfeff', border: '1.5px solid #a5f3fc', borderRadius: 12, padding: 14 }}>
          <strong style={{ fontSize: '0.82rem', color: '#0e7490', display: 'flex', alignItems: 'center', gap: 6 }}>
            💧 Cálculo de Água Individualizado:
          </strong>
          <div style={{ background: '#ffffff', borderRadius: 8, padding: '10px 12px', margin: '8px 0', textAlign: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0891b2' }}>
              Seu Peso (kg) × 35 ml
            </span>
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
              Exemplo: 70 kg × 35 = <strong>2.450 ml (2,45 L / dia)</strong>
            </p>
          </div>
          <small style={{ fontSize: '0.68rem', color: '#155e75', display: 'block' }}>
            ✨ Dica: Tenha uma garrafa de 750ml e estipule a meta de enchê-la 3 a 4 vezes ao longo do dia.
          </small>
        </div>

        {/* Escala de Urina */}
        <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
          <strong style={{ fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: 8 }}>
            🧪 Escala Visual da Urina:
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {urineColors.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.7rem' }}>
                <span
                  style={{
                    width: 22,
                    height: 18,
                    borderRadius: 4,
                    background: u.color,
                    border: '1px solid rgba(0,0,0,0.15)',
                    display: 'inline-block',
                  }}
                />
                <span style={{ flex: 1, color: '#475569', fontWeight: 600 }}>{u.label}</span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    color: i < 2 ? '#166534' : '#b45309',
                    background: i < 2 ? '#dcfce7' : '#fef3c7',
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. SUBSTITUIÇÕES SAUDÁVEIS
   ───────────────────────────────────────────────────────────── */
function SubstituicoesIllustration() {
  const swaps = [
    { from: 'Frituras no óleo', to: 'Assados, grelhados ou airfryer', icon: '🍗', gain: 'Menos gordura saturada inflamatória' },
    { from: 'Refrigerantes e sucos', to: 'Água c/ gás, limão e hortelã', icon: '🍋', gain: 'Zero picos de insulina e açúcar' },
    { from: 'Arroz branco simples', to: 'Arroz integral, tubérculos, quinoa', icon: '🍠', gain: 'Fibras e saciedade duradoura' },
    { from: 'Doces ultraprocessados', to: 'Frutas com canela / Cacau 70%+', icon: '🍫', gain: 'Polifenóis e antioxidantes' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
        {swaps.map((s, idx) => (
          <div
            key={idx}
            style={{
              background: '#ffffff',
              border: '1.5px solid #e2ece9',
              borderRadius: 10,
              padding: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.74rem', color: '#dc2626', textDecoration: 'line-through', fontWeight: 600 }}>
                {s.from}
              </span>
              <span style={{ fontSize: '0.85rem' }}>➡️</span>
              <strong style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 800 }}>
                {s.to}
              </strong>
            </div>
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#52b788', fontWeight: 700, background: '#f0fdf4', padding: '3px 6px', borderRadius: 4 }}>
              ✨ Ganho: {s.gain}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. HIGIENIZAÇÃO DE HORTIFRÚTI (4 Passos Ilustrados)
   ───────────────────────────────────────────────────────────── */
function HigienizacaoIllustration() {
  const steps = [
    { num: 1, title: 'Água Corrente', icon: '🚿', desc: 'Lave folha por folha para tirar resíduos e terra visível.' },
    { num: 2, title: 'Solução Clorada', icon: '🧴', desc: '1 colher de sopa de água sanitária (2-2,5%) para 1L de água.' },
    { num: 3, title: 'Timer 15 min', icon: '⏱️', desc: 'Mantenha 100% imerso pelo tempo estrito de 15 minutos.' },
    { num: 4, title: 'Enxágue e Seque', icon: '🥗', desc: 'Enxágue em água filtrada e seque antes de guardar em pote.' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, margin: '8px 0' }}>
      {steps.map((st) => (
        <div
          key={st.num}
          style={{
            background: '#ffffff',
            border: '2px solid #e2ece9',
            borderTop: '4px solid #2d6a4f',
            borderRadius: 10,
            padding: 12,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 4 }}>{st.icon}</span>
          <span style={{ fontSize: '0.62rem', background: '#2d6a4f', color: '#fff', padding: '2px 6px', borderRadius: 10, fontWeight: 800 }}>
            Passo {st.num}
          </span>
          <strong style={{ fontSize: '0.78rem', color: '#1b4332', display: 'block', margin: '4px 0 2px' }}>
            {st.title}
          </strong>
          <small style={{ fontSize: '0.66rem', color: '#64748b', lineHeight: 1.3, display: 'block' }}>
            {st.desc}
          </small>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. GORDURAS BOAS & ANTI-INFLAMATÓRIAS
   ───────────────────────────────────────────────────────────── */
function GordurasBoasIllustration() {
  const sources = [
    { name: 'Azeite de Oliva EV', tag: 'Ômega-9 Puro', icon: '🫒', use: 'Consumir cru sobre os pratos prontos' },
    { name: 'Abacate / Avocado', tag: 'Glutationa & Fibras', icon: '🥑', use: 'Em saladas, cremes ou com ovos' },
    { name: 'Chia & Linhaça', tag: 'Ômega-3 Vegetal', icon: '🌱', use: 'Triturada em iogurtes e frutas' },
    { name: 'Castanha-do-Pará', tag: 'Selênio Diário', icon: '🌰', use: '1 a 2 unidades ao dia (tireoide)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, margin: '8px 0' }}>
      {sources.map((s, i) => (
        <div
          key={i}
          style={{
            background: '#ffffff',
            border: '1.5px solid #d8f3dc',
            borderRadius: 10,
            padding: 12,
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: 4 }}>{s.icon}</span>
          <strong style={{ fontSize: '0.8rem', color: '#1b4332', display: 'block' }}>{s.name}</strong>
          <span style={{ fontSize: '0.64rem', color: '#2d6a4f', fontWeight: 800, background: '#d8f3dc', padding: '2px 6px', borderRadius: 4, display: 'inline-block', margin: '3px 0' }}>
            {s.tag}
          </span>
          <small style={{ fontSize: '0.66rem', color: '#64748b', display: 'block', marginTop: 2 }}>{s.use}</small>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. MEAL PREP & SALADA NO POTE
   ───────────────────────────────────────────────────────────── */
function MealPrepIllustration() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '8px 0' }}>
      {/* Pote de Salada em Camadas */}
      <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
        <strong style={{ fontSize: '0.78rem', color: '#334155', display: 'block', marginBottom: 8 }}>
          🥗 Salada no Pote (Dura até 5 dias sem murchar):
        </strong>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ background: '#dcfce7', padding: '6px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#166534' }}>
            <strong>4º Topo:</strong> Folhas verdes secas (alface, rúcula)
          </div>
          <div style={{ background: '#fef3c7', padding: '6px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#78350f' }}>
            <strong>3º Meio:</strong> Proteína & Grãos (frango, ovos, grão de bico)
          </div>
          <div style={{ background: '#fed7aa', padding: '6px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#7c2d12' }}>
            <strong>2º Base:</strong> Legumes firmes (cenoura, pepino, rabanete)
          </div>
          <div style={{ background: '#fee2e2', padding: '6px 8px', borderRadius: 6, fontSize: '0.7rem', color: '#991b1b' }}>
            <strong>1º Fundo:</strong> Molho (azeite, limão, sal) — NUNCA no topo
          </div>
        </div>
      </div>

      {/* Regra de Validade */}
      <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: 14 }}>
        <strong style={{ fontSize: '0.78rem', color: '#166534', display: 'block', marginBottom: 8 }}>
          📦 Prazos Seguros de Armazenamento:
        </strong>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.72rem', color: '#14532d', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>
            <strong>Geladeira (3 a 5 dias):</strong> Potes herméticos de vidro bem vedados.
          </li>
          <li>
            <strong>Freezer (60 a 90 dias):</strong> Porcionado individualmente sem tempero cru.
          </li>
          <li>
            <strong>Descongelamento:</strong> Sempre dentro da geladeira de um dia para o outro.
          </li>
        </ul>
      </div>
    </div>
  );
}
