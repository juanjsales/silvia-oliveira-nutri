import {
  ArrowLeft,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Layers,
  Maximize2,
  Mic,
  PhoneOff,
  PieChart,
  RefreshCw,
  Ruler,
  Scale,
  ShieldCheck,
  Smile,
  Sparkles,
  Target,
  UserRound,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTeleconsultation } from '../contexts/TeleconsultationContext';
import { api } from '../lib/api';

type Access = { roomUrl: string; expiresAt: string };
type GuideTab = 'medidas' | 'fome' | 'prato' | 'bristol' | 'metas' | 'avaliacao' | 'conduta';

type BroadcastData = {
  activeTab: GuideTab;
  customTitle?: string;
  customNote?: string;
  clinicalData?: {
    weight?: string;
    height?: string;
    bmi?: string;
    bodyFat?: string;
    goals?: string;
    guidance?: string;
    dietRating?: string;
  };
  updatedAt: string;
};

export function PatientVideoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { startCall, minimizeCall, endCall } = useTeleconsultation();
  const [access, setAccess] = useState<Access | null>(null);
  const [entered, setEntered] = useState(() => {
    return sessionStorage.getItem(`in_call_${id}`) === 'true';
  });
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const [guideTab, setGuideTab] = useState<GuideTab>('medidas');
  const [iframeKey, setIframeKey] = useState(1);
  const [reconnecting, setReconnecting] = useState(false);
  const [broadcast, setBroadcast] = useState<BroadcastData | null>(null);
  const [lastSyncedUpdate, setLastSyncedUpdate] = useState<string>('');

  useEffect(() => {
    if (!id || access) return;
    let timer: number | undefined;

    const checkAccess = () => {
      api<{ data: Access }>(`/api/video/appointments/${id}/access`, { method: 'POST' })
        .then((response) => {
          setAccess(response.data);
          setError('');
        })
        .catch((cause) => {
          const msg = cause instanceof Error ? cause.message : 'Não foi possível entrar na sala.';
          setError(msg);
          // Se o paciente está na sala de espera aguardando a nutri iniciar, retentar a cada 4s
          if (msg.includes('iniciar') || msg.includes('aguarde') || msg.includes('Aguarde')) {
            timer = window.setTimeout(checkAccess, 4000);
          }
        });
    };

    checkAccess();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [id, access]);

  useEffect(() => {
    if (entered && id && access) {
      sessionStorage.setItem(`in_call_${id}`, 'true');
      startCall({
        appointmentId: id,
        roomToken: id,
        patientName: user?.name || 'Paciente',
        roomUrl: access.roomUrl,
        role: 'PATIENT',
        returnPath: `/portal/video/${id}`,
      });
    }
  }, [entered, id, access, user?.name]);

  useEffect(() => {
    if (!entered) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [entered]);

  // Sincronização em tempo real do que a nutricionista está transmitindo
  useEffect(() => {
    if (!id || !entered) return;
    const fetchBroadcast = () => {
      api<{ data: BroadcastData | null }>(`/api/video/appointments/${id}/broadcast`)
        .then((res) => {
          if (res.data && res.data.updatedAt !== lastSyncedUpdate) {
            setBroadcast(res.data);
            setLastSyncedUpdate(res.data.updatedAt);
            setGuideTab(res.data.activeTab);
            setShowGuide(true);
          }
        })
        .catch(() => {});
    };
    fetchBroadcast();
    const interval = window.setInterval(fetchBroadcast, 2500);
    return () => window.clearInterval(interval);
  }, [id, entered, lastSyncedUpdate]);

  function handleReconnect() {
    setReconnecting(true);
    setIframeKey((prev) => prev + 1);
    setTimeout(() => setReconnecting(false), 1200);
  }

  function handleExitCall() {
    if (window.confirm('Deseja realmente encerrar a teleconsulta?')) {
      sessionStorage.removeItem(`in_call_${id}`);
      setEntered(false);
      endCall();
    }
  }

  return (
    <main className={`patient-video-page ${entered ? 'in-call' : 'prejoin'}`}>
      <header>
        <Link
          to="/portal"
          onClick={() => {
            if (entered) {
              minimizeCall();
            }
          }}
          title="Navegar pelo portal com o vídeo minimizado"
        >
          <ArrowLeft /> {entered ? 'Navegar pelo portal (Miniplayer)' : 'Voltar ao portal'}
        </Link>

        {entered && (
          <div className="video-header-center-actions">
            <button
              type="button"
              className={`video-guide-toggle-btn ${showGuide ? 'active' : ''}`}
              onClick={() => setShowGuide(!showGuide)}
              title="Abrir guia de apoio e medidas"
            >
              <BookOpen size={16} />
              <span>{showGuide ? 'Ocultar Apoio' : 'Painel de Apoio'}</span>
            </button>

            <button
              type="button"
              className="video-reconnect-btn"
              onClick={handleReconnect}
              disabled={reconnecting}
              title="Recarregar áudio/vídeo se houver instabilidade"
            >
              <RefreshCw size={15} className={reconnecting ? 'spin' : ''} />
              <span>{reconnecting ? 'Reconectando...' : 'Reconectar'}</span>
            </button>

            <button
              type="button"
              className="video-hangup-btn"
              onClick={handleExitCall}
              title="Encerrar consulta"
            >
              <PhoneOff size={15} />
              <span>Encerrar</span>
            </button>
          </div>
        )}

        <div className="video-session-badge">
          <ShieldCheck />
          <span>Acesso seguro & criptografado</span>
        </div>
      </header>

      {error ? (
        error.includes('iniciar') || error.includes('aguarde') || error.includes('Aguarde') ? (
          <section className="video-access-error" style={{ borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.04)' }}>
            <span className="spinner" style={{ width: 36, height: 36, borderTopColor: '#3b82f6' }} />
            <h2 style={{ color: '#1e40af' }}>Sala de Espera Virtual</h2>
            <p style={{ maxWidth: 440 }}>A Dra. Silvia Oliveira Lemos está preparando seu atendimento. Esta tela liberará sua entrada automaticamente assim que a chamada começar.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <Link className="secondary-button" to="/portal">
                Aguardar no Portal
              </Link>
            </div>
          </section>
        ) : error.includes('finalizada') || error.includes('concluída') ? (
          <section className="video-access-error" style={{ borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.04)' }}>
            <CheckCircle2 size={40} style={{ color: '#10b981' }} />
            <h2 style={{ color: '#065f46' }}>Consulta Concluída</h2>
            <p style={{ maxWidth: 440 }}>Este atendimento já foi finalizado pela Dra. Silvia. Seus novos planos, orientações e documentos já estão salvos e atualizados no seu portal.</p>
            <Link className="primary-button" to="/portal">
              Acessar Meu Portal
            </Link>
          </section>
        ) : (
          <section className="video-access-error">
            <Video />
            <h2>Sala indisponível</h2>
            <p>{error}</p>
            <Link className="primary-button" to="/portal">
              Voltar ao Portal
            </Link>
          </section>
        )
      ) : !access ? (
        <div className="page-loader">
          <span className="spinner" />
          <p>Validando consulta e horário seguro...</p>
        </div>
      ) : !entered ? (
        <section className="video-prejoin-card">
          <div className="video-prejoin-heading">
            <span className="video-prejoin-icon">
              <Video />
            </span>
            <div>
              <span className="eyebrow">Sua consulta online</span>
              <h1>Antes de entrar na sala</h1>
              <p>Leva menos de um minuto. Tenha à mão sua fita métrica e um copo d'água.</p>
            </div>
          </div>
          <div className="video-patient-identity">
            <UserRound />
            <div>
              <small>Você entrará como</small>
              <strong>{user?.name || 'Paciente'}</strong>
            </div>
          </div>
          <ol className="video-prejoin-steps">
            <li>
              <Camera />
              <div>
                <strong>Permita o uso da câmera</strong>
                <span>Quando o navegador perguntar, selecione <b>Permitir</b>.</span>
              </div>
              <CheckCircle2 />
            </li>
            <li>
              <Mic />
              <div>
                <strong>Permita o uso do microfone</strong>
                <span>Fale algumas palavras e confira se o indicador de som reage.</span>
              </div>
              <CheckCircle2 />
            </li>
            <li>
              <Ruler />
              <div>
                <strong>Apresentação interativa ao vivo</strong>
                <span>A nutricionista pode projetar guias de medidas, metas e escalas na sua tela durante a chamada.</span>
              </div>
              <CheckCircle2 />
            </li>
          </ol>
          <aside className="video-permission-help">
            <strong>Permissão bloqueada?</strong>
            <span>Clique no ícone de cadeado ou câmera ao lado do endereço do site (barra de navegação) e ative microfone e câmera.</span>
          </aside>
          <button className="primary-button video-enter-button" onClick={() => setEntered(true)}>
            <Video /> Entrar na Consulta Agora
          </button>
          <small>Se a conexão oscilar ou você recarregar a página, seu acesso permanecerá salvo nesta mesma sala.</small>
        </section>
      ) : (
        <div className={`video-call-workspace ${showGuide ? 'with-guide' : 'full-video'}`}>
          <div className="video-stream-container" id="patient-video-slot">
            <iframe
              key={iframeKey}
              src={access.roomUrl}
              title="Sala de Teleconsulta"
              allow="camera; microphone; display-capture; autoplay; fullscreen"
              allowFullScreen
            />
            <footer className="video-stream-footer">
              <small>Acesso seguro ativo até {new Date(access.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.</small>
              {!showGuide && (
                <button type="button" className="ghost-button" onClick={() => setShowGuide(true)}>
                  <BookOpen size={14} /> Abrir Painel de Apoio
                </button>
              )}
            </footer>
          </div>

          {showGuide && (
            <aside className="patient-guide-panel">
              <div className="guide-panel-header">
                <div className="guide-title">
                  <Sparkles className="guide-sparkle-icon" size={18} />
                  <div>
                    <strong>Apoio ao Vivo na Consulta</strong>
                    <small>Acompanhe orientações e materiais em tempo real</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowGuide(false)}
                  title="Fechar painel"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {broadcast && (
                <div className="broadcast-live-banner">
                  <Sparkles size={14} />
                  <span>A nutricionista está apresentando este tópico com você</span>
                </div>
              )}

              <nav className="guide-tabs">
                <button
                  type="button"
                  className={guideTab === 'medidas' ? 'active' : ''}
                  onClick={() => setGuideTab('medidas')}
                >
                  <Ruler size={15} /> Medidas
                </button>
                <button
                  type="button"
                  className={guideTab === 'fome' ? 'active' : ''}
                  onClick={() => setGuideTab('fome')}
                >
                  <Smile size={15} /> Fome
                </button>
                <button
                  type="button"
                  className={guideTab === 'prato' ? 'active' : ''}
                  onClick={() => setGuideTab('prato')}
                >
                  <PieChart size={15} /> Prato
                </button>
                <button
                  type="button"
                  className={guideTab === 'bristol' ? 'active' : ''}
                  onClick={() => setGuideTab('bristol')}
                >
                  <Layers size={15} /> Bristol
                </button>
                <button
                  type="button"
                  className={guideTab === 'metas' ? 'active' : ''}
                  onClick={() => setGuideTab('metas')}
                >
                  <Target size={15} /> Metas
                </button>
                <button
                  type="button"
                  className={guideTab === 'avaliacao' ? 'active' : ''}
                  onClick={() => setGuideTab('avaliacao')}
                >
                  <Scale size={15} /> Avaliação
                </button>
              </nav>

              <div className="guide-panel-content">
                {guideTab === 'medidas' && (
                  <div className="guide-content-section">
                    <h4>📏 Como tirar suas medidas com a fita métrica</h4>
                    <p className="guide-lead">
                      Fique de pé, relaxe o corpo e não aperte a fita na pele nem prenda a respiração.
                    </p>

                    <div className="guide-cards-list">
                      <article className="guide-measure-card">
                        <div className="measure-badge">1</div>
                        <div>
                          <strong>Cintura (Ponto Mais Estreito)</strong>
                          <p>Posicione a fita 2 dedos acima do umbigo, no ponto mais fino do tronco. Solte o ar suavemente antes de ler o valor.</p>
                        </div>
                      </article>

                      <article className="guide-measure-card">
                        <div className="measure-badge">2</div>
                        <div>
                          <strong>Abdômen (Cicatriz Umbilical)</strong>
                          <p>Passe a fita exatamente sobre o umbigo, paralela ao chão, sem contrair a musculatura.</p>
                        </div>
                      </article>

                      <article className="guide-measure-card">
                        <div className="measure-badge">3</div>
                        <div>
                          <strong>Quadril (Maior Circunferência)</strong>
                          <p>Una os pés e passe a fita na altura de maior projeção dos glúteos.</p>
                        </div>
                      </article>

                      <article className="guide-measure-card">
                        <div className="measure-badge">4</div>
                        <div>
                          <strong>Braço Relaxado</strong>
                          <p>No ponto médio entre o ombro e o cotovelo, com o braço solto ao lado do corpo.</p>
                        </div>
                      </article>

                      <article className="guide-measure-card tip">
                        <div className="measure-badge">💡</div>
                        <div>
                          <strong>Como se pesar corretamente</strong>
                          <p>Pela manhã, em jejum, logo após urinar, sem sapatos e com roupas bem leves.</p>
                        </div>
                      </article>
                    </div>
                  </div>
                )}

                {guideTab === 'fome' && (
                  <div className="guide-content-section">
                    <h4>📊 Escala de Fome & Saciedade (1 a 10)</h4>
                    <p className="guide-lead">
                      Use esta escala para descrever à nutricionista como você se sente antes e após as refeições.
                    </p>

                    <div className="satiety-scale-list">
                      <div className="scale-item level-extreme">
                        <span className="scale-num">1 - 2</span>
                        <div>
                          <strong>Fome Extrema / Fraqueza</strong>
                          <p>Dor de cabeça, irritação, tontura ou desespero por comida. <i>(Evitar chegar aqui!)</i></p>
                        </div>
                      </div>

                      <div className="scale-item level-ideal-hunger">
                        <span className="scale-num">3 - 4</span>
                        <div>
                          <strong>Fome Física Suave / Ideal</strong>
                          <p>Estômago roncando suavemente. Momento perfeito para se alimentar com calma.</p>
                        </div>
                      </div>

                      <div className="scale-item level-neutral">
                        <span className="scale-num">5</span>
                        <div>
                          <strong>Neutro / Nem Fome Nem Cheio</strong>
                          <p>Sensação equilibrada, sem vontade urgente de comer.</p>
                        </div>
                      </div>

                      <div className="scale-item level-ideal-full">
                        <span className="scale-num">6 - 7</span>
                        <div>
                          <strong>Satisfeito Confortavelmente</strong>
                          <p>Ponto de parada ideal. Energia restabelecida sem sensação de peso no estômago.</p>
                        </div>
                      </div>

                      <div className="scale-item level-too-full">
                        <span className="scale-num">8 - 10</span>
                        <div>
                          <strong>Cheio / Empanturrado / Mal-estar</strong>
                          <p>Estômago pesado, sonolência excessiva, desconforto e refluxo.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {guideTab === 'prato' && (
                  <div className="guide-content-section">
                    <h4>🍽️ Proporções do Prato Saudável</h4>
                    <p className="guide-lead">
                      Referência visual prática para montar almoço e jantar equilibrados:
                    </p>

                    <div className="plate-visual-box">
                      <div className="plate-half">
                        <strong>50% Vegetais & Legumes</strong>
                        <span>Metade do prato com folhas verdes, legumes crus e cozidos (fibras, vitaminas e saciedade).</span>
                      </div>
                      <div className="plate-quarters">
                        <div className="plate-quarter proteins">
                          <strong>25% Proteínas</strong>
                          <span>Ovos, peixe, frango, carne magra, tofu ou leguminosas.</span>
                        </div>
                        <div className="plate-quarter carbs">
                          <strong>25% Carboidratos</strong>
                          <span>Arroz integral, batata-doce, aipim, abóbora ou quinoa.</span>
                        </div>
                      </div>
                    </div>

                    <div className="guide-cards-list" style={{ marginTop: '12px' }}>
                      <article className="guide-measure-card">
                        <div className="measure-badge">💧</div>
                        <div>
                          <strong>Hidratação</strong>
                          <p>Mantenha um consumo constante de água ao longo do dia, evitando grandes volumes junto às refeições principais.</p>
                        </div>
                      </article>
                    </div>
                  </div>
                )}

                {guideTab === 'bristol' && (
                  <div className="guide-content-section">
                    <h4>🩺 Escala de Bristol (Saúde Intestinal)</h4>
                    <p className="guide-lead">
                      Classificação do formato das fezes para avaliar hidratação e função digestiva:
                    </p>

                    <div className="bristol-scale-cards">
                      <article className="bristol-card alert">
                        <strong>Tipos 1 e 2 — Constipação</strong>
                        <p>Pedaços duros, separados ou em formato de salsicha encaroçada. Sinal de baixa ingestão de água e poucas fibras solúveis.</p>
                      </article>

                      <article className="bristol-card ideal">
                        <strong>Tipos 3 e 4 — Formato Ideal ⭐</strong>
                        <p>Formato de salsicha/banana com fendas na superfície ou suave e macio. Indica trânsito intestinal e flora equilibrados.</p>
                      </article>

                      <article className="bristol-card alert">
                        <strong>Tipos 5, 6 e 7 — Amolecidas / Diarreia</strong>
                        <p>Pedaços moles com bordas recortadas ou totalmente líquidas. Pode indicar intolerâncias, estresse ou irritação intestinal.</p>
                      </article>
                    </div>
                  </div>
                )}

                {guideTab === 'metas' && (
                  <div className="guide-content-section">
                    <h4>🎯 Metas Acordadas no Atendimento</h4>
                    <p className="guide-lead">
                      Objetivos pactuados diretamente com a nutricionista para este período:
                    </p>

                    {broadcast?.clinicalData?.goals ? (
                      <div className="live-clinical-card highlight">
                        <div className="clinical-card-head">
                          <Target size={17} />
                          <strong>Metas Principais</strong>
                        </div>
                        <p className="clinical-card-body">{broadcast.clinicalData.goals}</p>
                      </div>
                    ) : (
                      <div className="live-clinical-card empty">
                        <p>A nutricionista está definindo as metas com você durante a consulta.</p>
                      </div>
                    )}

                    {broadcast?.clinicalData?.guidance && (
                      <div className="live-clinical-card" style={{ marginTop: '10px' }}>
                        <div className="clinical-card-head">
                          <Sparkles size={17} />
                          <strong>Estratégia & Orientações</strong>
                        </div>
                        <p className="clinical-card-body">{broadcast.clinicalData.guidance}</p>
                      </div>
                    )}
                  </div>
                )}

                {guideTab === 'avaliacao' && (
                  <div className="guide-content-section">
                    <h4>⚖️ Avaliação Corporal & Indicadores</h4>
                    <p className="guide-lead">
                      Dados corporais registrados no prontuário nesta consulta:
                    </p>

                    <div className="live-assessment-grid">
                      {broadcast?.clinicalData?.weight && (
                        <article className="live-metric-box">
                          <span>Peso Atual</span>
                          <strong>{broadcast.clinicalData.weight}</strong>
                        </article>
                      )}

                      {broadcast?.clinicalData?.height && (
                        <article className="live-metric-box">
                          <span>Altura</span>
                          <strong>{broadcast.clinicalData.height}</strong>
                        </article>
                      )}

                      {broadcast?.clinicalData?.bmi && (
                        <article className="live-metric-box primary">
                          <span>Índice de Massa Corporal</span>
                          <strong>IMC {broadcast.clinicalData.bmi}</strong>
                        </article>
                      )}

                      {broadcast?.clinicalData?.bodyFat && (
                        <article className="live-metric-box">
                          <span>Gordura Corporal</span>
                          <strong>{broadcast.clinicalData.bodyFat}</strong>
                        </article>
                      )}
                    </div>

                    {!broadcast?.clinicalData?.weight && !broadcast?.clinicalData?.bmi && (
                      <div className="live-clinical-card empty">
                        <p>A nutricionista preencherá e calculará seus dados durante a etapa de avaliação corporal.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </main>
  );
}


