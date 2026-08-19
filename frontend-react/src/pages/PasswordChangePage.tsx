import { KeyRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { PasswordInput } from '../components/PasswordInput';

export function PasswordChangePage(){
  const[currentPassword,setCurrent]=useState('');
  const[newPassword,setNext]=useState('');
  const[confirmation,setConfirmation]=useState('');
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState('');
  const[error,setError]=useState('');

  async function submit(e:FormEvent){
    e.preventDefault();
    if(newPassword!==confirmation){
      setError('As novas senhas não coincidem.');
      return;
    }
    setBusy(true);
    setError('');
    try{
      const r=await api<{message:string}>('/api/auth/password-change',{method:'POST',body:JSON.stringify({currentPassword,newPassword})});
      setMessage(r.message);
      setCurrent('');
      setNext('');
      setConfirmation('');
    }catch(c){
      setError(c instanceof Error?c.message:'Não foi possível alterar a senha.');
    }finally{
      setBusy(false);
    }
  }

  return (
    <main className="password-change-page">
      <section className="panel">
        <KeyRound/>
        <span className="eyebrow">Segurança da conta</span>
        <h2>Alterar senha</h2>
        <p className="muted">As demais sessões serão encerradas depois da alteração.</p>
        <form onSubmit={submit}>
          <label>
            Senha atual
            <PasswordInput value={currentPassword} onChange={e=>setCurrent(e.target.value)} required/>
          </label>
          <label>
            Nova senha
            <PasswordInput minLength={12} value={newPassword} onChange={e=>setNext(e.target.value)} required/>
          </label>
          <label>
            Confirmar nova senha
            <PasswordInput minLength={12} value={confirmation} onChange={e=>setConfirmation(e.target.value)} required/>
          </label>
          {message&&<div className="form-success">{message}</div>}
          {error&&<div className="form-error">{error}</div>}
          <button className="primary-button" disabled={busy}>{busy?'Salvando...':'Alterar senha'}</button>
        </form>
        <Link className="auth-back" to="/portal">Voltar ao portal</Link>
      </section>
    </main>
  );
}

