const fs = require('fs');

const htmlFiles = [
  'app-nutri.html',
  'atendimento.html', 
  'gerenciador-plano.html',
  'portal-paciente.html',
  'pacientes.html',
  'agendamento.html',
  'bioimpedancia.html',
  'configuracoes.html',
  'index.html',
  'login.html',
  'anamnese-publica.html',
  'videocall.html'
];

console.log('=== ANALISE MOBILE-FIRST DO PROJETO ===\n');
htmlFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const hasViewport = content.includes('name="viewport"');
    const hasMQ = /@media\s*\(\s*(max-width|min-width)/.test(content);
    const hasOverflowX = content.includes('overflow-x');
    const hasFlexbox = content.includes('display:flex') || content.includes('display: flex');
    const hasGrid = content.includes('display:grid') || content.includes('display: grid');
    const lines = content.split('\n').length;
    
    const mq480 = content.includes('480px');
    const mq768 = content.includes('768px');
    
    // Count large fixed widths that might break mobile
    const largeFixed = (content.match(/width\s*:\s*(?:[6-9]\d\d|[1-9]\d{3,})px/g) || []).length;
    
    // Sidebar detection
    const hasSidebar = content.includes('sidebar') || content.includes('nav-sidebar') || content.includes('left-nav');
    const hasMobileMenu = content.includes('mobile-menu') || content.includes('menu-toggle') || content.includes('hamburger') || content.includes('nav-toggle');

    console.log(file + ' (' + lines + ' linhas)');
    console.log('  Viewport meta:         ' + (hasViewport ? 'SIM' : 'NAO ❌'));
    console.log('  Media queries:         ' + (hasMQ ? 'SIM' : 'NAO ❌'));
    console.log('  MQ 768px:              ' + (mq768 ? 'SIM' : 'NAO'));
    console.log('  MQ 480px:              ' + (mq480 ? 'SIM' : 'NAO'));
    console.log('  Overflow-x:            ' + (hasOverflowX ? 'SIM' : 'NAO'));
    console.log('  Flexbox:               ' + (hasFlexbox ? 'SIM' : 'NAO'));
    console.log('  Grid CSS:              ' + (hasGrid ? 'SIM' : 'NAO'));
    console.log('  Sidebar:               ' + (hasSidebar ? 'SIM' : 'NAO'));
    console.log('  Mobile menu/toggle:    ' + (hasMobileMenu ? 'SIM' : 'NAO'));
    console.log('  Fixed widths grandes:  ' + largeFixed + (largeFixed > 10 ? ' ⚠️' : ''));
    console.log('');
  } catch(e) {
    console.log(file + ': ERRO - ' + e.message);
  }
});
