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

  // Funções utilitárias de checagem de sessão
  function isAdminLoggedIn() {
    return (
      sessionStorage.getItem('kos_adm_auth') === 'true' ||
      localStorage.getItem('kos_adm_auth') === 'true'
    );
  }

  function isPacienteLoggedIn() {
    return (
      sessionStorage.getItem('kos_paciente_auth') === 'true' ||
      localStorage.getItem('kos_paciente_auth') === 'true' ||
      isAdminLoggedIn() // Admin também tem permissão de visualizar área de paciente para teste
    );
  }

  // Executar verificação de rota imediatamente
  function checkAccess() {
    if (requiredLevel === 'admin') {
      if (!isAdminLoggedIn()) {
        console.warn('[KOS Auth Guard] Acesso restrito a Administradores. Redirecionando para login...');
        window.location.href = 'login.html';
      }
    } else if (requiredLevel === 'paciente') {
      if (!isPacienteLoggedIn()) {
        console.warn('[KOS Auth Guard] Acesso restrito a Pacientes. Redirecionando para login...');
        window.location.href = 'login.html';
      }
    } else if (requiredLevel === 'guest-only') {
      // Página de login: se o usuário já estiver logado, encaminha para a página apropriada
      if (isAdminLoggedIn()) {
        window.location.href = 'app-nutri.html';
      } else if (isPacienteLoggedIn()) {
        window.location.href = 'portal-paciente.html';
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
