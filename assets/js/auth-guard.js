/**
 * ====================================================================
 * KOS WEB & AUTOMAÇÃO - GUARDIÃO DE AUTENTICAÇÃO E CONTROLE DE ACESSO
 * ====================================================================
 * Protege rotas frontend verificando nível de permissão (Admin / Paciente).
 */

(function () {
  'use strict';

  // Obter nível de autorização exigido da meta tag <meta name="kos-auth-level" content="...">
  const metaTag = document.querySelector('meta[name="kos-auth-level"]');
  const requiredLevel = metaTag ? metaTag.getAttribute('content') : 'public';
  const isLocalPreview = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  // Funções utilitárias de checagem de sessão
  function isAdminLoggedIn() {
    const user = getStoredUser('kos_user_dados');
    return user?.tipo === 'ADMIN' && !!user?.session_token;
  }

  function isPacienteLoggedIn() {
    return !!getStoredUser('kos_paciente_dados')?.session_token || isAdminLoggedIn();
  }

  function getStoredUser(key) {
    try { return JSON.parse(sessionStorage.getItem(key) || localStorage.getItem(key) || 'null'); }
    catch (e) { return null; }
  }

  // Executar verificação de rota imediatamente
  function checkAccess() {
    if (isLocalPreview) return;
    if (requiredLevel === 'admin') {
      if (!isAdminLoggedIn()) {
        console.warn('[KOS Auth Guard] Acesso restrito a Administradores. Redirecionando para login...');
        window.location.href = 'login.html';
      }
    } else if (requiredLevel === 'paciente') {
      const urlParams = new URLSearchParams(window.location.search);
      const hasRoom = urlParams.has('room');
      if (!isPacienteLoggedIn() && !hasRoom) {
        console.warn('[KOS Auth Guard] Acesso restrito a Pacientes. Redirecionando para login...');
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
      }
    } else if (requiredLevel === 'guest-only') {
      // Página de login: se o usuário já estiver logado, encaminha para a página apropriada
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect');
      if (isAdminLoggedIn()) {
        window.location.href = redirectUrl || 'app-nutri.html';
      } else if (isPacienteLoggedIn()) {
        window.location.href = redirectUrl || 'portal-paciente.html';
      }
    }
  }

  checkAccess();

  // Expor a função de logout globalmente
  window.kosLogout = function () {
    sessionStorage.removeItem('kos_adm_auth');
    sessionStorage.removeItem('kos_user_dados');
    sessionStorage.removeItem('kos_paciente_auth');
    sessionStorage.removeItem('kos_paciente_dados');
    localStorage.removeItem('kos_adm_auth');
    localStorage.removeItem('kos_user_dados');
    localStorage.removeItem('kos_paciente_auth');
    localStorage.removeItem('kos_paciente_dados');
    window.location.href = 'login.html';
  };
})();
