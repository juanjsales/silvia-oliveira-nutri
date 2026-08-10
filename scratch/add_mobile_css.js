const fs = require('fs');
const files = [
  'app-nutri.html','atendimento.html','gerenciador-plano.html',
  'portal-paciente.html','pacientes.html','agendamento.html',
  'bioimpedancia.html','configuracoes.html','index.html',
  'login.html','anamnese-publica.html','videocall.html'
];

const linkTag = '<link rel="stylesheet" href="assets/css/mobile-base.css">';

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('mobile-base.css')) {
    console.log('SKIP (already has): ' + file);
    return;
  }
  const insertBefore = content.indexOf('</head>');
  if (insertBefore === -1) {
    console.log('SKIP (no head tag): ' + file);
    return;
  }
  content = content.slice(0, insertBefore) + linkTag + '\n' + content.slice(insertBefore);
  fs.writeFileSync(file, content, 'utf8');
  console.log('UPDATED: ' + file);
});
