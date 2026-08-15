import { ArrowLeft, Camera, CheckCircle2, Mic, ShieldCheck, UserRound, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

type Access = { roomUrl: string; expiresAt: string };

export function PatientVideoPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [access, setAccess] = useState<Access | null>(null);
  const [entered, setEntered] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api<{ data: Access }>(`/api/video/appointments/${id}/access`, { method: 'POST' })
      .then((response) => setAccess(response.data))
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Não foi possível entrar na sala.'));
  }, [id]);

  return <main className={`patient-video-page ${entered ? 'in-call' : 'prejoin'}`}>
    <header>
      <Link to="/portal"><ArrowLeft /> Voltar ao portal</Link>
      <div><ShieldCheck /><span>Acesso validado pela sua sessão</span></div>
    </header>

    {error ? <section className="video-access-error">
      <Video /><h2>Sala indisponível</h2><p>{error}</p>
      <Link className="primary-button" to="/portal">Voltar</Link>
    </section> : !access ? <div className="page-loader"><span className="spinner"/><p>Validando consulta e horário...</p></div> : !entered ? <section className="video-prejoin-card">
      <div className="video-prejoin-heading">
        <span className="video-prejoin-icon"><Video /></span>
        <div><span className="eyebrow">Sua consulta online</span><h1>Antes de entrar na sala</h1><p>Leva menos de um minuto. Procure um local tranquilo e com boa conexão.</p></div>
      </div>
      <div className="video-patient-identity"><UserRound/><div><small>Entre usando seu nome</small><strong>{user?.name || 'Seu nome completo cadastrado'}</strong></div></div>
      <ol className="video-prejoin-steps">
        <li><Camera/><div><strong>Permita o uso da câmera</strong><span>Quando o navegador perguntar, selecione <b>Permitir</b>.</span></div><CheckCircle2/></li>
        <li><Mic/><div><strong>Permita o uso do microfone</strong><span>Fale algumas palavras e confira se o indicador de som reage.</span></div><CheckCircle2/></li>
        <li><UserRound/><div><strong>Confirme seu nome</strong><span>Se a sala solicitar, informe o mesmo nome mostrado acima.</span></div><CheckCircle2/></li>
      </ol>
      <aside className="video-permission-help"><strong>Não apareceu ou você bloqueou a permissão?</strong><span>Clique no ícone de câmera ou cadeado ao lado do endereço do site, permita câmera e microfone e recarregue a página.</span></aside>
      <button className="primary-button video-enter-button" onClick={() => setEntered(true)}><Video/> Entendi, entrar na consulta</button>
      <small>Ao entrar, talvez você aguarde alguns instantes até a nutricionista admitir ou iniciar a chamada.</small>
    </section> : <>
      <iframe src={access.roomUrl} title="Videochamada nutricional" allow="camera; microphone; fullscreen; display-capture; autoplay" />
      <small>Acesso válido até {new Date(access.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.</small>
    </>}
  </main>;
}
