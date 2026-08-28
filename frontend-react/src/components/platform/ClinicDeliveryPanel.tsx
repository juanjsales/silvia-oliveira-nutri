import { useState } from 'react';
import { Check, CheckCircle2, ExternalLink, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { platformDeliveryApi, type OwnerInvitationRelease } from '../../lib/platformDeliveryApi';

const formatExpiry = (value: string) => new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(value));

export function ClinicDeliveryPanel({ tenantId, ownerEmail, previewUrl }: { tenantId: string; ownerEmail: string; previewUrl?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [released, setReleased] = useState<OwnerInvitationRelease | null>(null);
  const [error, setError] = useState('');

  async function release() {
    setBusy(true); setError('');
    try { setReleased(await platformDeliveryApi.releaseOwnerInvitation(tenantId)); setConfirming(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível liberar o convite.'); }
    finally { setBusy(false); }
  }

  return <section className="clinic-delivery" aria-labelledby="clinic-delivery-title">
    <header><span><CheckCircle2 /></span><div><small>ENTREGA DA CLÍNICA</small><h3 id="clinic-delivery-title">Revisada e pronta para a proprietária</h3><p>A publicação passou pelas verificações técnicas. Finalize a transferência de acesso somente após conferir os dados abaixo.</p></div></header>
    <div className="clinic-delivery-checks">
      <div><Check /><span><strong>Publicação aprovada</strong><small>Preview validado e versão segura registrada.</small></span></div>
      <div><ShieldCheck /><span><strong>Infraestrutura verificada</strong><small>O servidor confirma Supabase e implantação conhecida.</small></span></div>
      <div><Mail /><span><strong>Destinatária confirmada</strong><small>{ownerEmail}</small></span></div>
    </div>
    {previewUrl && <a className="clinic-delivery-preview" href={previewUrl} target="_blank" rel="noreferrer">Revisar site publicado <ExternalLink /></a>}
    {!released && !confirming && <div className="clinic-delivery-footer"><div><LockKeyhole /><small>O convite não é enviado automaticamente. A liberação é registrada e deve seguir pelo canal seguro definido pela operação.</small></div><button className="platform-primary" onClick={() => setConfirming(true)}><Mail />Preparar entrega</button></div>}
    {confirming && !released && <div className="clinic-delivery-confirm" role="alertdialog" aria-label="Confirmar entrega"><div><strong>Confirmar liberação para {ownerEmail}?</strong><p>Após liberar, compartilhe o convite somente com a proprietária. O servidor bloqueará a ação se alguma verificação obrigatória não estiver válida.</p></div><div><button className="platform-secondary" disabled={busy} onClick={() => setConfirming(false)}>Voltar</button><button className="platform-primary" disabled={busy} onClick={() => void release()}>{busy ? <><LoaderCircle className="activity-spinner" />Liberando…</> : <><ShieldCheck />Confirmar liberação</>}</button></div></div>}
    {error && <div className="platform-form-error" role="alert">{error}</div>}
    {released && <div className="clinic-delivery-success" role="status"><span><Check /></span><div><strong>Entrega liberada com segurança</strong><p>O convite de <b>{released.ownerEmail}</b> está pronto para envio pelo canal seguro. Validade: {formatExpiry(released.expiresAt)}.</p><small>Nenhuma credencial ou token é exibido nesta tela.</small></div></div>}
  </section>;
}
