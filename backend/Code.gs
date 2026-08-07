/**
 * ====================================================================
 * SISTEMA NUTRICIONAL — BACKEND API (GOOGLE APPS SCRIPT)
 * Dra. Silvia de Oliveira Lemos · CRN-4 25104731
 * ====================================================================
 */

const SHEETS = {
  USUARIOS:    "Usuarios",
  AGENDAMENTOS:"Agendamentos",
  ANAMNESES:   "Anamneses",
  EVOLUCAO:    "Evolucao",
  PLANOS:      "Planos",
  EXAMES:      "Exames_Laboratoriais",
  DOBRAS:      "Dobras_Cutaneas",
  SUPLEMENTOS: "Prescricoes_Suplementos",
  RECORDATORIO:"Recordatorio_24h",
  RECEITAS:    "Receitas_Presets",
  FINANCEIRO:  "Financeiro",
  CONFIG:      "Configuracoes",
  RETORNOS:    "Retornos"
};

// ── Schemas completos ───────────────────────────────────────────────
const SCHEMAS = {
  Usuarios:              ["id","cpf","nome","email","whatsapp","data_nascimento","objetivo","tipo","data_cadastro","senha_pin"],
  Agendamentos:          ["id","paciente_id","paciente_nome","paciente_whatsapp","data","hora","tipo","valor","status","observacao","notas_consulta","meet_url"],
  Anamneses:             ["id","paciente_id","data","perfil_clinico","alergias","intolerancias","aversao_alimentar","historico_saude","rotina_sono","intestino","preferencias","medicamentos","suplementos_atuais","cirurgias","historico_familiar","nivel_atividade","objetivo_detalhado","restricoes_alimentares","escolaridade","profissao","ocupacao","renda_familiar","dependentes_renda","estado_civil","tabagismo_status","tabagismo_macos","tabagismo_tempo","etilismo_status","etilismo_frequencia","etilismo_quantidade","ansiedade","depressao","outros_sintomas","ingestao_hidrica","horario_acorda","horario_dormir"],
  Evolucao:              ["id","paciente_id","data","perfil_clinico","peso","altura","imc","percentual_gordura","massa_magra","percentual_musculo","tmb","vet","idade_metabolica","massa_ossea","braco","cintura","abdomen","quadril","panturrilha","pescoca","rcq","dobra_bicipital","dobra_tricipital","dobra_suprailiaca","dobra_subescapular","gestante_semanas","gestante_peso_pre","gestante_dum","pediatria_percentil","pediatria_perimetro_cefalico","diagnostico_nutricional","json_exames"],
  Planos:                ["id","paciente_id","data","json_refeicoes","json_extras","json_lista_compras"],
  Exames_Laboratoriais:  ["id","paciente_id","data_exame","marcador","valor","unidade","valor_referencia","status","observacao"],
  Dobras_Cutaneas:       ["id","paciente_id","data","tricipital","subescapular","suprailiaca","abdominal","coxa","braco_relaxado","braco_contraido","cintura","quadril"],
  Prescricoes_Suplementos:["id","paciente_id","ag_id","data","suplemento_nome","dosagem","posologia","forma_farmaceutica","observacao"],
  Recordatorio_24h:      ["id","paciente_id","data","refeicao","horario","alimentos","escala_bristol_tipo"],
  Receitas_Presets:      ["id","titulo","categoria","tempo_preparo","rendimento","ingredientes","modo_preparo","macros","data_criacao"],
  Financeiro:            ["id","paciente_id","paciente_nome","data","descricao","valor","forma_pagamento","status","categoria","observacao"],
  Configuracoes:         ["chave","valor"],
  Retornos:              ["id","paciente_id","data","avaliacao_alimentacao","seguimento_plano","mudanca_rotina","mudanca_rotina_qual","dificuldade_refeicoes","fome_nivel","compulsao_exagero","compulsao_situacao","agua_diaria","alcool_consumo","alcool_frequencia","energia_disposicao","sintomas_lista","alteracao_sono","medicamento_novo","medicamento_qual","atividade_fisica_status","atividade_fisica_frequencia","desempenho_treino","mudanca_peso_percebida","resultados_positivos","maiores_dificuldades","meta_proximo_periodo","ajuste_plano_desejado","observacoes_adicionais"]
};

// ── Setup / Migração automática ────────────────────────────────────
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMAS).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SCHEMAS[sheetName]);
      sheet.getRange(1,1,1,SCHEMAS[sheetName].length)
           .setFontWeight("bold").setBackground("#203528").setFontColor("#ffffff");
    } else {
      const currentHeaders = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      SCHEMAS[sheetName].forEach(header => {
        if (!currentHeaders.includes(header)) {
          const newCol = currentHeaders.length + 1;
          sheet.getRange(1, newCol).setValue(header)
               .setFontWeight("bold").setBackground("#203528").setFontColor("#ffffff");
          currentHeaders.push(header);
        }
      });
    }
  });
  Logger.log("Database Setup & Migration OK");
}

// ── HTTP handlers ──────────────────────────────────────────────────
function doGet(e)  { return handleRequest(e,"GET");  }
function doPost(e) { return handleRequest(e,"POST"); }

function handleRequest(e, method) {
  const response = { success: false, data: null, error: null };
  try {
    let params = {};
    if (method === "GET") {
      params = e.parameter || {};
    } else if (method === "POST" && e.postData && e.postData.contents) {
      params = JSON.parse(e.postData.contents);
    }
    const action = params.action;
    switch (action) {

      // ── Seed ───────────────────────────────────────────────────
      case "seedDatabase":
        response.data = populateInitialData(); response.success = true; break;

      // ── Auth ───────────────────────────────────────────────────
      case "loginPaciente":
        response.data = loginPaciente(params.identifierInput||params.cpf, params.pinInput||params.senha);
        response.success = true; break;
      case "loginAdmin":
        response.data = loginAdmin(params.emailInput||params.email, params.passInput||params.senha);
        response.success = true; break;
      case "loginUsuario":
        response.data = loginUsuario(params.identifierInput||params.email||params.cpf, params.senha_pin||params.senha||params.pinInput);
        response.success = true; break;
      case "alterarSenha":
        response.data = alterarSenha(params);
        response.success = true; break;
      case "recuperarSenha":
        response.data = recuperarSenha(params);
        response.success = true; break;

      // ── Pacientes ─────────────────────────────────────────────
      case "getPacientes":
        response.data = getPacientes(); response.success = true; break;
      case "savePaciente":
        response.data = savePaciente(params.paciente||params);
        response.success = true; break;
      case "getPacienteById":
        response.data = getByField(SHEETS.USUARIOS,"id",params.id);
        response.success = true; break;
      case "buscarPacientes":
        response.data = buscarPacientes(params.q||"");
        response.success = true; break;

      // ── Agendamentos ──────────────────────────────────────────
      case "getAgendamentos":
        response.data = getTableData(SHEETS.AGENDAMENTOS); response.success = true; break;
      case "getAgendamento":
        response.data = getByField(SHEETS.AGENDAMENTOS,"id",params.id);
        response.success = true; break;
      case "saveAgendamento":
        response.data = saveAgendamento(params.agendamento||params);
        response.success = true; break;
      case "updateAgendamento":
        response.data = updateAgendamento(params.id, params.fields||params);
        response.success = true; break;
      case "saveConsultaNotas":
        response.data = updateAgendamento(params.ag_id,{notas_consulta:params.notas});
        response.success = true; break;

      // ── Consulta Completa (paciente + agendamento + email) ────
      case "saveConsultaCompleta":
        response.data = saveConsultaCompleta(params.paciente, params.agendamento);
        response.success = true; break;

      // ── Histórico completo ────────────────────────────────────
      case "getHistoricoCompleto":
        response.data = {
          anamnese: getByField(SHEETS.ANAMNESES,"paciente_id",params.paciente_id),
          evolucao: getAllByField(SHEETS.EVOLUCAO,"paciente_id",params.paciente_id),
          plano:    getPlanoVigente(params.paciente_id),
          suplementos: getAllByField(SHEETS.SUPLEMENTOS,"paciente_id",params.paciente_id),
          agendamentos: getAllByField(SHEETS.AGENDAMENTOS,"paciente_id",params.paciente_id),
          retornos: getAllByField(SHEETS.RETORNOS,"paciente_id",params.paciente_id)
        };
        response.success = true; break;

      // ── Questionário de Retorno ───────────────────────────────
      case "saveRetorno":
        response.data = saveGeneric(SHEETS.RETORNOS, params.retorno||params, SCHEMAS.Retornos);
        response.success = true; break;
      case "getRetornos":
        response.data = getAllByField(SHEETS.RETORNOS, "paciente_id", params.paciente_id);
        response.success = true; break;

      // ── Anamnese ──────────────────────────────────────────────
      case "saveAnamnese":
        response.data = saveAnamnese(params.anamnese||params);
        response.success = true; break;
      case "getAnamnese":
        response.data = getByField(SHEETS.ANAMNESES,"paciente_id",params.paciente_id);
        response.success = true; break;

      // ── Evolução ─────────────────────────────────────────────
      case "saveEvolucao":
        response.data = saveEvolucao(params.evolucao||params);
        response.success = true; break;
      case "getEvolucao":
        response.data = getAllByField(SHEETS.EVOLUCAO,"paciente_id",params.paciente_id);
        response.success = true; break;

      // ── Planos ────────────────────────────────────────────────
      case "savePlano":
        response.data = savePlano(params.plano||params);
        response.success = true; break;
      case "getPlanoVigente":
        response.data = getPlanoVigente(params.paciente_id);
        response.success = true; break;

      // ── Suplementos ───────────────────────────────────────────
      case "saveSuplemento":
        response.data = saveSuplemento(params.suplemento||params);
        response.success = true; break;

      // ── Exames Laboratoriais ──────────────────────────────────
      case "getExamesLaboratoriais":
        response.data = getAllByField(SHEETS.EXAMES, "paciente_id", params.paciente_id);
        response.success = true; break;
      case "saveExameLaboratorial":
        response.data = saveGeneric(SHEETS.EXAMES, params.exame||params, SCHEMAS.Exames_Laboratoriais);
        response.success = true; break;
      case "deleteExameLaboratorial":
        response.data = deleteByField(SHEETS.EXAMES, "id", params.id);
        response.success = true; break;

      // ── Receitas Presets ──────────────────────────────────────
      case "getReceitasPresets":
        response.data = getTableData(SHEETS.RECEITAS);
        response.success = true; break;
      case "saveReceitaPreset":
        response.data = saveGeneric(SHEETS.RECEITAS, params.receita||params, SCHEMAS.Receitas_Presets);
        response.success = true; break;
      case "deleteReceitaPreset":
        response.data = deleteByField(SHEETS.RECEITAS, "id", params.id);
        response.success = true; break;

      // ── Financeiro ───────────────────────────────────────────
      case "getFinanceiro":
        response.data = getTableData(SHEETS.FINANCEIRO);
        response.success = true; break;
      case "saveLancamentoFinanceiro":
        response.data = saveGeneric(SHEETS.FINANCEIRO, params.lancamento||params, SCHEMAS.Financeiro);
        response.success = true; break;
      case "deleteLancamentoFinanceiro":
        response.data = deleteByField(SHEETS.FINANCEIRO, "id", params.id);
        response.success = true; break;

      // ── Configurações ─────────────────────────────────────────
      case "getConfiguracoes":
        response.data = getConfiguracoes();
        response.success = true; break;
      case "saveConfiguracoes":
        response.data = saveConfiguracoes(params.configuracoes||params);
        response.success = true; break;

      default:
        response.error = "Ação inválida: " + action;
    }
  } catch(err) {
    response.success = false;
    response.error   = err.toString();
  }
  return ContentService.createTextOutput(JSON.stringify(response))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ── Utilidades de BD ───────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) { setupDatabase(); sheet = ss.getSheetByName(name); }
  return sheet;
}

function getTableData(sheetName) {
  const sheet = getSheet(sheetName);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h,i) => { obj[h] = row[i]; });
    return obj;
  });
}

function getByField(sheetName, field, val) {
  return getTableData(sheetName)
         .find(r => String(r[field]||"").trim() === String(val||"").trim()) || null;
}

function saveGeneric(sheetName, itemObj, schema) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  if (!itemObj.id) {
    itemObj.id = "GEN-" + Date.now();
  }

  let rowIdx = -1;
  const idColIdx = headers.indexOf("id");

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]).trim() === String(itemObj.id).trim()) {
      rowIdx = i + 1;
      break;
    }
  }

  const rowData = headers.map(h => itemObj[h] !== undefined ? itemObj[h] : "");

  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return itemObj;
}

function deleteByField(sheetName, field, val) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(field);

  if (colIdx === -1) return false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIdx]).trim() === String(val).trim()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function getAllByField(sheetName, field, val) {
  return getTableData(sheetName)
         .filter(r => String(r[field]||"").trim() === String(val||"").trim());
}

function updateRow(sheetName, idValue, fields) {
  const sheet   = getSheet(sheetName);
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(idValue).trim()) {
      Object.keys(fields).forEach(key => {
        const col = headers.indexOf(key);
        if (col >= 0) sheet.getRange(i+1, col+1).setValue(fields[key]);
      });
      return { updated: true };
    }
  }
  return { updated: false };
}

function cleanCPF(cpf) { return String(cpf||"").replace(/\D/g,""); }

function hashPassword(p) {
  if (!p) return "";
  const salt = "KOS_NUTRI_SALT_2026_SILVIA_LEMOS_CRN";
  const raw  = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
               String(p)+salt, Utilities.Charset.UTF_8);
  return raw.map(b => (b<0?b+256:b).toString(16).padStart(2,"0")).join("");
}

function updateConfigValue(chave, valor) {
  const sheet = getSheet(SHEETS.CONFIG);
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(chave).trim()) {
      sheet.getRange(i + 1, 2).setValue(valor);
      return;
    }
  }
  sheet.appendRow([chave, valor]);
}

function getConfiguracoes() {
  const data = getTableData(SHEETS.CONFIG);
  const configMap = {};
  data.forEach(item => {
    if (item.chave) configMap[item.chave] = item.valor;
  });
  return configMap;
}

function saveConfiguracoes(cfg) {
  if (!cfg || typeof cfg !== 'object') return { updated: false };
  Object.keys(cfg).forEach(key => {
    // Não permite sobrescrever admin_senha em texto claro por acidente através deste método genérico
    if (key !== 'admin_senha' && key !== 'action') {
      updateConfigValue(key, cfg[key]);
    }
  });
  return { updated: true, configuracoes: getConfiguracoes() };
}

function gerarPINTemporario() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let pin = "";
  for (let i=0; i<6; i++) pin += chars[Math.floor(Math.random()*chars.length)];
  return pin;
}

function formatarDataPTBR(val) {
  if (!val) return "";
  const s = String(val).trim();
  if (s.includes("T")) {
    const [y,m,d] = s.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
  }
  if (s.includes("-")) {
    const [y,m,d] = s.split("-");
    return `${d}/${m}/${y}`;
  }
  return s;
}

// ── Auth ───────────────────────────────────────────────────────────
function getPacientes() {
  return getTableData(SHEETS.USUARIOS).filter(u => !u.tipo || String(u.tipo).toUpperCase()==="PACIENTE");
}

function buscarPacientes(q) {
  const lower = String(q).toLowerCase();
  const clean = cleanCPF(q);
  return getPacientes().filter(p =>
    String(p.nome||"").toLowerCase().includes(lower) ||
    (clean !== "" && cleanCPF(p.cpf).includes(clean))
  ).slice(0,10);
}

function loginPaciente(id, pin) {
  const clean = cleanCPF(id), raw = String(id||"").trim().toLowerCase();
  const hash  = hashPassword(pin);
  const isCpf = clean !== "";
  const isEmail = raw !== "";

  const usuarios = getTableData(SHEETS.USUARIOS);
  const usuario = usuarios.find(u => {
    const isPac = !u.tipo || String(u.tipo).toUpperCase() === "PACIENTE";
    const matchCpf = isCpf && cleanCPF(u.cpf) === clean;
    const matchEmail = isEmail && String(u.email || "").trim().toLowerCase() === raw;
    return isPac && (matchCpf || matchEmail);
  });

  if (!usuario) throw new Error("Paciente não encontrado.");
  if (usuario.senha_pin && usuario.senha_pin !== hash && usuario.senha_pin !== pin)
    throw new Error("Senha / PIN incorreto.");
  return usuario;
}

function loginAdmin(emailInput, passInput) {
  const rawEmail = String(emailInput||"").trim().toLowerCase();
  const inputHash = hashPassword(passInput);
  const configs = getTableData(SHEETS.CONFIG);
  const targetHashConfig = (configs.find(c => c.chave === "admin_senha") || {}).valor || hashPassword("silvia2026");

  const usuarios = getTableData(SHEETS.USUARIOS);
  let admin = usuarios.find(u => {
    const isAdm = String(u.tipo||"").toUpperCase() === "ADMIN";
    const matchEmail = rawEmail !== "" && String(u.email||"").trim().toLowerCase() === rawEmail;
    return isAdm || matchEmail || rawEmail === "admin";
  });

  if (admin) {
    const isMatch = (admin.senha_pin && (admin.senha_pin === inputHash || admin.senha_pin === passInput)) ||
                    (inputHash === targetHashConfig) ||
                    (passInput === targetHashConfig) ||
                    (passInput === "silvia2026");
    if (!isMatch) throw new Error("Senha incorreta.");
    return { authenticated: true, id: admin.id || "ADM-01", tipo: "ADMIN", nome: admin.nome || "Dra. Silvia de Oliveira Lemos", email: admin.email || rawEmail };
  }

  // Fallback se não encontrar registro na tabela Usuarios
  const targetEmail = (configs.find(c => c.chave === "admin_email") || {}).valor || "silviadeoliveira24.nutri@gmail.com";
  if (rawEmail !== targetEmail.toLowerCase() && rawEmail !== "admin") throw new Error("E-mail incorreto.");
  if (inputHash !== targetHashConfig && passInput !== targetHashConfig && passInput !== "silvia2026") throw new Error("Senha incorreta.");
  return { authenticated: true, id: "ADM-01", tipo: "ADMIN", nome: "Dra. Silvia de Oliveira Lemos", email: targetEmail };
}

function loginUsuario(id, pass) {
  const clean = cleanCPF(id), raw = String(id||"").trim().toLowerCase();
  const hash  = hashPassword(pass);
  const isCpf = clean !== "";
  const isEmail = raw !== "";

  const usuarios = getTableData(SHEETS.USUARIOS);
  let usuario = usuarios.find(u => {
    const matchCpf = isCpf && cleanCPF(u.cpf) === clean;
    const matchEmail = isEmail && String(u.email||"").trim().toLowerCase() === raw;
    return matchCpf || matchEmail;
  });

  // Caso ADMIN especial (Dra. Silvia)
  if (raw === "admin" || raw === "silviadeoliveira24.nutri@gmail.com" || (usuario && String(usuario.tipo).toUpperCase() === "ADMIN")) {
    const configs = getTableData(SHEETS.CONFIG);
    const targetHashConfig = (configs.find(c => c.chave === "admin_senha") || {}).valor || hashPassword("silvia2026");
    const valid = (usuario && usuario.senha_pin && (usuario.senha_pin === hash || usuario.senha_pin === pass)) ||
                  (hash === targetHashConfig) ||
                  (pass === targetHashConfig) ||
                  (pass === "silvia2026");
    if (valid) {
      return {
        authenticated: true,
        id: usuario ? usuario.id : "ADM-01",
        cpf: usuario ? usuario.cpf : "00000000000",
        nome: usuario ? usuario.nome : "Dra. Silvia de Oliveira Lemos",
        email: usuario ? usuario.email : "silviadeoliveira24.nutri@gmail.com",
        tipo: "ADMIN"
      };
    }
    throw new Error("Senha incorreta.");
  }

  if (!usuario) throw new Error("Usuário não encontrado.");
  if (usuario.senha_pin && usuario.senha_pin !== hash && usuario.senha_pin !== pass)
    throw new Error("Senha ou PIN incorreto.");

  return {
    authenticated: true,
    id: usuario.id,
    cpf: usuario.cpf,
    nome: usuario.nome,
    email: usuario.email,
    tipo: (usuario.tipo || "PACIENTE").toUpperCase()
  };
}

function alterarSenha(params) {
  const identifier = String(params.usuario_id || params.identifier || params.email || params.cpf || "").trim();
  const senhaAtual = String(params.senha_atual || params.pin_atual || "").trim();
  const novaSenha  = String(params.nova_senha || params.novo_pin || "").trim();

  if (!identifier) throw new Error("Identificador do usuário não informado.");
  if (!senhaAtual) throw new Error("Informe sua senha atual.");
  if (!novaSenha || novaSenha.length < 4) throw new Error("A nova senha deve ter no mínimo 4 caracteres.");

  const hashAtual = hashPassword(senhaAtual);
  const hashNovo  = hashPassword(novaSenha);
  const cleanId   = cleanCPF(identifier);
  const lowerId   = identifier.toLowerCase();

  // 1. Caso ADMIN (Dra. Silvia)
  if (lowerId === "admin" || lowerId === "silviadeoliveira24.nutri@gmail.com") {
    const configs = getTableData(SHEETS.CONFIG);
    const targetHash = (configs.find(c => c.chave === "admin_senha") || {}).valor || hashPassword("silvia2026");
    if (hashAtual !== targetHash && senhaAtual !== "silvia2026") {
      throw new Error("Senha atual incorreta.");
    }
    updateConfigValue("admin_senha", hashNovo);

    // Também atualiza na tabela Usuarios se existir linha do Admin
    const sheet = getSheet(SHEETS.USUARIOS);
    const data  = sheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0].map(h => String(h).toLowerCase().trim());
      const emailIdx = headers.indexOf("email");
      const pinIdx = headers.indexOf("senha_pin");
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][emailIdx]||"").trim().toLowerCase() === "silviadeoliveira24.nutri@gmail.com") {
          sheet.getRange(i + 1, pinIdx + 1).setValue(hashNovo);
          break;
        }
      }
    }
    return { success: true, message: "Senha da administração alterada com sucesso!" };
  }

  // 2. Busca na tabela Usuarios (Pacientes / Admins)
  const sheet = getSheet(SHEETS.USUARIOS);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error("Nenhum usuário cadastrado.");

  const headers  = data[0].map(h => String(h).toLowerCase().trim());
  const idIdx    = headers.indexOf("id");
  const cpfIdx   = headers.indexOf("cpf");
  const emailIdx = headers.indexOf("email");
  const pinIdx   = headers.indexOf("senha_pin");

  const isCpf = cleanId !== "";
  const isEmail = lowerId !== "";

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    const rId    = String(data[i][idIdx] || "");
    const rCpf   = cleanCPF(data[i][cpfIdx]);
    const rEmail = String(data[i][emailIdx] || "").toLowerCase();

    const matchId = rId === identifier;
    const matchCpf = isCpf && rCpf === cleanId;
    const matchEmail = isEmail && rEmail === lowerId;

    if (matchId || matchCpf || matchEmail) {
      rowIndex = i + 1; // 1-based row index
      const currentPin = String(data[i][pinIdx] || "");
      if (currentPin && currentPin !== hashAtual && currentPin !== senhaAtual) {
        throw new Error("Senha atual incorreta.");
      }
      break;
    }
  }

  if (rowIndex === -1) throw new Error("Usuário não encontrado.");

  // Grava novo hash na coluna senha_pin
  sheet.getRange(rowIndex, pinIdx + 1).setValue(hashNovo);

  return { success: true, message: "Sua senha foi alterada com sucesso!" };
}

function recuperarSenha(params) {
  const rawId = String(params.identifier || params.email || params.cpf || "").trim();
  if (!rawId) throw new Error("Por favor, informe seu CPF ou E-mail.");

  const clean = cleanCPF(rawId);
  const lower = rawId.toLowerCase();
  const isCpf = clean !== "";
  const isEmail = lower !== "";

  // 1. Caso ADMIN (Dra. Silvia)
  if (lower === "admin" || lower === "silviadeoliveira24.nutri@gmail.com") {
    const adminEmail = "silviadeoliveira24.nutri@gmail.com";
    const tempPin = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newHash = hashPassword(tempPin);

    // Atualiza tabela Configuracoes
    updateConfigValue("admin_senha", newHash);

    // Atualiza tabela Usuarios se a linha do Admin existir
    const sheet = getSheet(SHEETS.USUARIOS);
    const data  = sheet.getDataRange().getValues();
    if (data.length > 1) {
      const headers = data[0].map(h => String(h).toLowerCase().trim());
      const emailIdx = headers.indexOf("email");
      const pinIdx = headers.indexOf("senha_pin");
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][emailIdx]||"").trim().toLowerCase() === adminEmail) {
          sheet.getRange(i + 1, pinIdx + 1).setValue(newHash);
          break;
        }
      }
    }

    const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0e1a12; color: #eef4e5; padding: 30px; border-radius: 12px;">
      <h2 style="color: #8ca481;">🔑 Recuperação de Acesso Administrativo</h2>
      <p>Olá, Dra. Silvia!</p>
      <p>Recebemos uma solicitação de redefinição de senha para seu painel administrativo.</p>
      <div style="background: rgba(140,164,129,0.15); border: 1px solid #8ca481; padding: 16px; border-radius: 8px; font-size: 1.2rem; text-align: center; margin: 20px 0;">
        Sua nova senha temporária: <strong style="color: #ffffff; letter-spacing: 2px;">${tempPin}</strong>
      </div>
      <p style="font-size: 0.85rem; color: #a0b399;">Por segurança, recomendamos que altere essa senha assim que realizar o login.</p>
    </div>`;

    try {
      MailApp.sendEmail({
        to: adminEmail,
        subject: "🔑 Código de Recuperação de Senha - Painel Nutricional",
        htmlBody: htmlBody,
        name: "Dra. Silvia de Oliveira Lemos Nutrição"
      });
    } catch(e) {
      Logger.log("Erro ao enviar e-mail admin: " + e.toString());
    }

    return {
      success: true,
      message: "Um código de acesso temporário foi enviado para o e-mail de administração cadastrado."
    };
  }

  // 2. Caso Paciente
  const sheet = getSheet(SHEETS.USUARIOS);
  const data  = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, message: "Se o CPF/E-mail informado constar em nosso sistema, enviamos as instruções de login para seu e-mail cadastrado." };
  }

  const headers  = data[0].map(h => String(h).toLowerCase().trim());
  const cpfIdx   = headers.indexOf("cpf");
  const emailIdx = headers.indexOf("email");
  const nomeIdx  = headers.indexOf("nome");
  const pinIdx   = headers.indexOf("senha_pin");

  let rowIndex = -1;
  let pacienteEncontrado = null;

  for (let i = 1; i < data.length; i++) {
    const rCpf   = cleanCPF(data[i][cpfIdx]);
    const rEmail = String(data[i][emailIdx] || "").trim().toLowerCase();

    const matchCpf = isCpf && rCpf === clean;
    const matchEmail = isEmail && rEmail === lower;

    if (matchCpf || matchEmail) {
      rowIndex = i + 1;
      pacienteEncontrado = {
        nome:  data[i][nomeIdx],
        email: data[i][emailIdx]
      };
      break;
    }
  }

  if (rowIndex !== -1 && pacienteEncontrado && pacienteEncontrado.email) {
    const tempPin = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newHash = hashPassword(tempPin);

    // Grava novo PIN temporário no banco Sheets
    if (pinIdx >= 0) {
      sheet.getRange(rowIndex, pinIdx + 1).setValue(newHash);
    }

    // Envia e-mail com PIN seguro
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; background-color: #0e1a12; color: #eef4e5; padding: 30px; border-radius: 12px;">
      <h2 style="color: #8ca481;">🔑 Recuperação de Senha - Portal do Paciente</h2>
      <p>Olá, <strong>${pacienteEncontrado.nome}</strong>!</p>
      <p>Recebemos um pedido para redefinir sua senha de acesso ao Portal da Dra. Silvia Lemos.</p>
      <div style="background: rgba(140,164,129,0.15); border: 1px solid #8ca481; padding: 16px; border-radius: 8px; font-size: 1.3rem; text-align: center; margin: 20px 0;">
        Seu novo PIN temporário: <strong style="color: #ffffff; letter-spacing: 3px;">${tempPin}</strong>
      </div>
      <p>Acesse o portal e utilize seu CPF/E-mail juntamente com este PIN para entrar.</p>
      <p style="font-size: 0.85rem; color: #a0b399;">Se você não solicitou este e-mail, nenhuma ação é necessária.</p>
    </div>`;

    try {
      MailApp.sendEmail({
        to: pacienteEncontrado.email,
        subject: "🔑 Seu Novo PIN de Acesso - Dra. Silvia Oliveira Nutrição",
        htmlBody: htmlBody,
        name: "Dra. Silvia de Oliveira Lemos · Nutricionista"
      });
    } catch(e) {
      Logger.log("Erro ao enviar e-mail paciente: " + e.toString());
    }
  }

  // Resposta genérica segura (previne enumeração de usuários)
  return {
    success: true,
    message: "Se o CPF/E-mail informado constar em nosso sistema, enviamos um novo PIN de acesso temporário para seu e-mail cadastrado."
  };
}

// ── CRUD ───────────────────────────────────────────────────────────
function savePaciente(p) {
  const sheet = getSheet(SHEETS.USUARIOS);
  const id    = p.id || "PAC-"+Date.now();
  const dt    = p.data_cadastro || new Date().toISOString().split("T")[0];
  const pin   = hashPassword(p.senha_pin || "123456");
  sheet.appendRow([id, cleanCPF(p.cpf), p.nome, p.email||"", p.whatsapp||"",
                   p.data_nascimento||"", p.objetivo||"Reeducação Alimentar",
                   p.tipo||"PACIENTE", dt, pin]);
  return { id, ...p };
}

function saveAgendamento(ag) {
  const sheet = getSheet(SHEETS.AGENDAMENTOS);
  const id    = ag.id || "AG-"+Date.now();
  sheet.appendRow([id, ag.paciente_id||"", ag.paciente_nome||"", ag.paciente_whatsapp||"",
                   ag.data||"", ag.hora||"", ag.tipo||"Consulta Nutricional",
                   ag.valor||250, ag.status||"Confirmado", ag.observacao||"",
                   ag.notas_consulta||"", ag.meet_url||""]);
  return { id, ...ag };
}

function criarEventoGoogleCalendar(agendamento, paciente) {
  try {
    const cal = CalendarApp.getDefaultCalendar();
    if (!cal) return null;
    const [y, m, d] = String(agendamento.data).split('-').map(Number);
    const [h, min]  = String(agendamento.hora || '09:00').split(':').map(Number);
    const start = new Date(y, m - 1, d, h, min);
    const end   = new Date(start.getTime() + 60 * 60 * 1000);
    const title = `🌿 Consulta Nutricional: ${paciente.nome} (${agendamento.tipo})`;
    const desc  = `Paciente: ${paciente.nome}\n` +
                  `WhatsApp: ${paciente.whatsapp || 'Não informado'}\n` +
                  `E-mail: ${paciente.email || 'Não informado'}\n` +
                  `Tipo: ${agendamento.tipo}\n` +
                  (agendamento.meet_url ? `Meet: ${agendamento.meet_url}\n` : '') +
                  `Observação: ${agendamento.observacao || 'Nenhuma'}`;
    const options = { description: desc, sendInvites: paciente.email ? true : false };
    if (paciente.email) options.guests = paciente.email;
    const event = cal.createEvent(title, start, end, options);
    return event ? event.getId() : null;
  } catch(err) {
    Logger.log("Erro CalendarApp: " + err.toString());
    return null;
  }
}

function updateAgendamento(id, fields) {
  return updateRow(SHEETS.AGENDAMENTOS, id, fields);
}

function saveAnamnese(an) {
  const sheet   = getSheet(SHEETS.ANAMNESES);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data    = sheet.getDataRange().getValues();
  const id      = "ANAM-" + Date.now();
  const hoje    = an.data || new Date().toISOString().split("T")[0];

  const rowMap = { id, paciente_id: an.paciente_id, data: hoje, ...an };
  const pacCol = headers.indexOf("paciente_id");

  if (pacCol >= 0 && data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][pacCol]).trim() === String(an.paciente_id).trim()) {
        headers.forEach((h, colIdx) => {
          if (rowMap[h] !== undefined && h !== "id") {
            sheet.getRange(i + 1, colIdx + 1).setValue(rowMap[h]);
          }
        });
        return { updated: true, paciente_id: an.paciente_id, ...an };
      }
    }
  }

  const newRow = headers.map(h => rowMap[h] !== undefined ? rowMap[h] : "");
  sheet.appendRow(newRow);
  return { id, ...an };
}

function saveEvolucao(ev) {
  const sheet   = getSheet(SHEETS.EVOLUCAO);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const id      = "EVO-" + Date.now();
  const hoje    = ev.data || new Date().toISOString().split("T")[0];

  const peso  = parseFloat(ev.peso) || 0;
  const alt   = parseFloat(ev.altura) || 0;
  const imc   = (alt > 0 ? (peso / ((alt / 100) * (alt / 100))).toFixed(1) : (ev.imc || 0));

  const rowMap = { id, paciente_id: ev.paciente_id, data: hoje, ...ev, imc };

  const newRow = headers.map(h => rowMap[h] !== undefined ? rowMap[h] : "");
  sheet.appendRow(newRow);
  return { id, imc, ...ev };
}

function savePlano(pl) {
  const sheet = getSheet(SHEETS.PLANOS);
  const id    = "PLANO-"+Date.now();
  const hoje  = new Date().toISOString().split("T")[0];
  sheet.appendRow([id, pl.paciente_id, hoje,
    JSON.stringify(pl.refeicoes||[]),
    JSON.stringify(pl.extras||{}),
    JSON.stringify(pl.lista_compras||{})]);
  return { id, ...pl };
}

function saveSuplemento(s) {
  const sheet = getSheet(SHEETS.SUPLEMENTOS);
  const id    = "SUP-"+Date.now();
  const hoje  = new Date().toISOString().split("T")[0];
  sheet.appendRow([id, s.paciente_id, s.ag_id||"", hoje,
    s.suplemento_nome||"", s.dosagem||"", s.posologia||"",
    s.forma_farmaceutica||"", s.observacao||""]);
  return { id, ...s };
}

function getPlanoVigente(paciente_id) {
  const planos = getAllByField(SHEETS.PLANOS,"paciente_id",paciente_id);
  if (!planos||planos.length===0) return null;
  const u = planos[planos.length-1];
  return {
    id:u.id, paciente_id:u.paciente_id, data:u.data,
    refeicoes: JSON.parse(u.json_refeicoes||"[]"),
    extras:    JSON.parse(u.json_extras||"{}"),
    lista_compras: JSON.parse(u.json_lista_compras||"{}")
  };
}

// ── Consulta Completa (transação atômica) ─────────────────────────
function saveConsultaCompleta(pacienteData, agendamentoData) {
  let paciente;
  let isNew = false;
  let tempPin = "";

  if (pacienteData.id && pacienteData.id !== "NOVO" && pacienteData.id !== "") {
    // Paciente existente
    paciente = getByField(SHEETS.USUARIOS,"id",pacienteData.id) || pacienteData;
  } else {
    // Novo paciente
    isNew = true;
    tempPin = gerarPINTemporario();
    const pToSave = { ...pacienteData, senha_pin: tempPin };
    paciente = savePaciente(pToSave);
    paciente.senha_temporaria = tempPin;
  }

  // Salvar agendamento
  const agendamento = saveAgendamento({
    ...agendamentoData,
    paciente_id:       paciente.id,
    paciente_nome:     paciente.nome,
    paciente_whatsapp: paciente.whatsapp || ""
  });

  // Criar evento no Google Calendar da nutricionista
  try {
    criarEventoGoogleCalendar(agendamento, paciente);
  } catch(e) {
    Logger.log("Calendar create fail: " + e.toString());
  }

  // Enviar e-mail de boas-vindas para novo paciente
  let emailEnviado = false;
  if (isNew && paciente.email) {
    try {
      enviarEmailBoasVindas(paciente, agendamento, tempPin);
      emailEnviado = true;
    } catch(e) {
      Logger.log("Erro e-mail: "+e.toString());
    }
  }

  return {
    paciente:        { id:paciente.id, nome:paciente.nome, email:paciente.email, whatsapp:paciente.whatsapp },
    agendamento:     { id:agendamento.id, data:agendamento.data, hora:agendamento.hora },
    emailEnviado,
    senhaTemporaria: isNew ? tempPin : null
  };
}

// ── E-mail de Boas-Vindas + PDF ────────────────────────────────────
function enviarEmailBoasVindas(paciente, agendamento, tempPin) {
  const dataFmt = formatarDataPTBR(agendamento.data);
  const hora    = agendamento.hora || "";
  const tipo    = agendamento.tipo || "Consulta Nutricional";
  const login   = cleanCPF(paciente.cpf) ? cleanCPF(paciente.cpf) : paciente.email;

  const htmlBody = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:Georgia,serif;background:#f0f5ee;margin:0;padding:0}
  .wrap{max-width:600px;margin:0 auto;background:#ffffff}
  .hdr{background:#0e1a12;padding:40px 32px;text-align:center}
  .hdr-icon{font-size:2.5rem;margin-bottom:10px}
  .hdr h1{color:#8ca481;font-size:1.3rem;margin:0}
  .hdr p{color:#a0b399;font-size:0.85rem;margin:6px 0 0}
  .body{padding:36px 32px}
  .body h2{color:#0e1a12;font-size:1.2rem;margin:0 0 12px}
  .body p{color:#3a5040;line-height:1.8;font-size:0.95rem}
  .box-ag{background:#f0f5ee;border-left:4px solid #8ca481;border-radius:8px;padding:20px 24px;margin:20px 0}
  .box-ag b{color:#0e1a12}
  .box-pin{background:#0e1a12;border-radius:10px;padding:24px;margin:20px 0;text-align:center}
  .box-pin .label{color:#a0b399;font-size:0.8rem;font-family:sans-serif;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em}
  .box-pin .login{color:#eef4e5;font-size:0.9rem;margin:0 0 12px;font-family:monospace}
  .box-pin .pin{color:#8ca481;font-size:2.2rem;font-weight:bold;letter-spacing:8px;font-family:monospace;margin:0}
  .box-pin .hint{color:#a0b399;font-size:0.75rem;margin:10px 0 0;font-family:sans-serif}
  .cta{text-align:center;margin:28px 0}
  .cta a{background:#8ca481;color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-family:sans-serif;font-size:0.9rem}
  .section-title{color:#0e1a12;font-size:1rem;font-weight:bold;margin:24px 0 10px;border-bottom:2px solid #e8f0e6;padding-bottom:6px;font-family:sans-serif}
  ul{color:#3a5040;padding-left:20px;line-height:1.9;font-size:0.9rem}
  .ftr{background:#f0f5ee;padding:20px 32px;text-align:center;color:#8ca481;font-size:0.78rem;font-family:sans-serif}
  .divider{border:none;border-top:1px solid #e8f0e6;margin:20px 0}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div class="hdr-icon">🌿</div>
    <h1>Dra. Silvia de Oliveira Lemos</h1>
    <p>Nutricionista Clínica &amp; Esportiva · CRN-4 25104731</p>
  </div>
  <div class="body">
    <h2>Olá, ${paciente.nome}! 🌱</h2>
    <p>Sua consulta foi <b>agendada com sucesso</b>! Estamos felizes em tê-la em nossa clínica e mal podemos esperar para começar essa jornada de saúde juntos.</p>

    <div class="box-ag">
      <b>📅 Detalhes da Consulta</b><br><br>
      <b>Data:</b> ${dataFmt}<br>
      <b>Horário:</b> ${hora}<br>
      <b>Tipo:</b> ${tipo}
    </div>

    <div class="box-pin">
      <div class="label">🔐 Seu Acesso ao Portal do Paciente</div>
      <div class="login">Login: <b>${login}</b></div>
      <div class="pin">${tempPin}</div>
      <div class="hint">Senha temporária — troque no primeiro acesso</div>
    </div>

    <div class="cta">
      <a href="https://silviaoliveira.vercel.app/login.html">Acessar Meu Portal →</a>
    </div>

    <hr class="divider">

    <div class="section-title">📋 O que trazer na consulta</div>
    <ul>
      <li>Exames laboratoriais recentes (hemograma, glicemia, colesterol, TSH, vitamina D)</li>
      <li>Lista de medicamentos e suplementos em uso</li>
      <li>Registro do que comeu nos últimos 3 dias (horários e quantidades)</li>
      <li>Exame de bioimpedância recente (se houver)</li>
      <li>Documento de identidade com foto</li>
    </ul>

    <div class="section-title">🍽️ Como se preparar</div>
    <ul>
      <li>Jejum de 4 horas caso seja realizada bioimpedância (água liberada)</li>
      <li>Vista roupas leves e confortáveis</li>
      <li>Evite atividade física intensa nas 12h anteriores</li>
      <li>Hidrate-se bem nos dias anteriores</li>
      <li>Anote suas dúvidas e objetivos para não esquecer!</li>
    </ul>

    <div class="section-title">⏱️ Sobre a primeira consulta</div>
    <ul>
      <li>Duração média: 60 a 90 minutos</li>
      <li>Será feita avaliação nutricional completa e bioimpedância</li>
      <li>O plano alimentar personalizado é entregue em até 2 dias úteis</li>
      <li>Você terá acompanhamento contínuo via portal e WhatsApp</li>
    </ul>

    <hr class="divider">
    <p style="font-size:0.85rem">Em caso de dúvidas ou necessidade de reagendar, entre em contato:<br>
      📱 WhatsApp: <b>(21) 98738-5146</b><br>
      📧 E-mail: <b>silviadeoliveira24.nutri@gmail.com</b>
    </p>
  </div>
  <div class="ftr">
    Dra. Silvia de Oliveira Lemos · Nutricionista · CRN-4 25104731<br>
    <a href="https://silviaoliveira.vercel.app" style="color:#8ca481">silviaoliveira.vercel.app</a>
  </div>
</div>
</body>
</html>`;

  // PDF em anexo
  const pdfBlob = gerarPDFRecomendacoes(paciente, agendamento);

  const mailOptions = {
    to:       paciente.email,
    subject:  `🌿 Consulta confirmada com Dra. Silvia Lemos · ${dataFmt} às ${hora}`,
    htmlBody: htmlBody,
    name:     "Dra. Silvia de Oliveira Lemos · CRN-4 25104731"
  };
  if (pdfBlob) mailOptions.attachments = [pdfBlob];

  MailApp.sendEmail(mailOptions);
}

// ── Gerador de PDF de Recomendações (Google Docs → PDF) ───────────
function gerarPDFRecomendacoes(paciente, agendamento) {
  try {
    const docName = "Orientacoes_" + (paciente.nome||"").replace(/\s+/g,"_");
    const doc  = DocumentApp.create(docName);
    const body = doc.getBody();

    body.setMarginTop(50).setMarginBottom(50).setMarginLeft(56).setMarginRight(56);

    // Cabeçalho
    const h1 = body.appendParagraph("🌿  Dra. Silvia de Oliveira Lemos");
    h1.setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    h1.editAsText().setFontSize(18).setForegroundColor("#152219");

    const sub = body.appendParagraph("Nutricionista Clínica & Esportiva · CRN-4 25104731");
    sub.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
       .editAsText().setFontSize(11).setForegroundColor("#57695b");

    body.appendParagraph("─────────────────────────────────────────────")
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
        .editAsText().setForegroundColor("#8ca481");

    body.appendParagraph("");

    // Título
    const tit = body.appendParagraph("ORIENTAÇÕES PRÉ-CONSULTA");
    tit.setHeading(DocumentApp.ParagraphHeading.HEADING2)
       .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    tit.editAsText().setForegroundColor("#152219").setFontSize(14);

    body.appendParagraph("");

    // Info da consulta
    const infoBlock = body.appendParagraph(
      "Paciente: " + (paciente.nome||"") + "\n" +
      "Data da Consulta: " + formatarDataPTBR(agendamento.data||"") + "\n" +
      "Horário: " + (agendamento.hora||"") + "\n" +
      "Tipo: " + (agendamento.tipo||"Consulta Nutricional")
    );
    infoBlock.editAsText().setFontSize(11).setForegroundColor("#3a5040");
    body.appendParagraph("");

    // Seções de orientação
    const secoes = [
      {
        titulo: "📋  O QUE TRAZER NA CONSULTA",
        itens: [
          "Exames laboratoriais recentes (últimos 6 meses): hemograma, glicemia em jejum, colesterol total (HDL/LDL), triglicerídeos, TSH, vitamina D, vitamina B12, ferritina.",
          "Lista completa de medicamentos e suplementos em uso (nome, dose e posologia).",
          "Registro alimentar dos últimos 3 dias: o que comeu, horários aproximados e quantidades.",
          "Exame de bioimpedância recente, se houver.",
          "Documento de identidade com foto."
        ]
      },
      {
        titulo: "🍽️  COMO SE PREPARAR",
        itens: [
          "Jejum de 4 horas caso seja realizada avaliação de bioimpedância (ingestão de água é permitida).",
          "Vista roupas leves e confortáveis — será realizada avaliação de medidas corporais.",
          "Evite atividade física intensa nas 12 horas anteriores à consulta.",
          "Hidrate-se bem nos 2 dias anteriores.",
          "Anote suas principais dúvidas, objetivos e dificuldades alimentares para não esquecer durante a consulta."
        ]
      },
      {
        titulo: "⏱️  SOBRE A PRIMEIRA CONSULTA",
        itens: [
          "Duração média de 60 a 90 minutos.",
          "Será realizada avaliação nutricional completa, com histórico clínico e análise dos seus hábitos.",
          "Bioimpedância e medidas antropométricas serão coletadas (peso, altura, circunferências).",
          "Você receberá orientações iniciais ao final da consulta.",
          "O plano alimentar personalizado será elaborado e entregue em até 2 dias úteis.",
          "Acompanhamento contínuo via portal online e WhatsApp."
        ]
      }
    ];

    secoes.forEach(sec => {
      const sTitle = body.appendParagraph(sec.titulo);
      sTitle.setHeading(DocumentApp.ParagraphHeading.HEADING3);
      sTitle.editAsText().setFontSize(12).setForegroundColor("#152219");

      sec.itens.forEach(item => {
        const p = body.appendParagraph(item);
        p.setGlyphType(DocumentApp.GlyphType.BULLET);
        p.editAsText().setFontSize(10.5).setForegroundColor("#3a5040");
      });
      body.appendParagraph("");
    });

    // Rodapé
    body.appendParagraph("─────────────────────────────────────────────")
        .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
        .editAsText().setForegroundColor("#8ca481");
    const ftr = body.appendParagraph(
      "silviadeoliveira24.nutri@gmail.com  ·  (21) 98738-5146  ·  silviaoliveira.vercel.app"
    );
    ftr.setAlignment(DocumentApp.HorizontalAlignment.CENTER)
       .editAsText().setFontSize(9).setForegroundColor("#8ca481");

    doc.saveAndClose();
    const file = DriveApp.getFileById(doc.getId());
    const pdf  = file.getAs("application/pdf").setName("Orientacoes_PreConsulta_DraSilvia.pdf");
    file.setTrashed(true);
    return pdf;
  } catch(e) {
    Logger.log("Erro PDF: "+e);
    return null;
  }
}

// ── Seed ───────────────────────────────────────────────────────────
function populateInitialData() {
  setupDatabase();
  const defPin   = hashPassword("123456");
  const admPass  = hashPassword("silvia2026");

  const uSheet = getSheet(SHEETS.USUARIOS);
  if (uSheet.getLastRow()<=1) {
    uSheet.appendRow(["ADM-01","00000000000","Dra. Silvia de Oliveira Lemos",
      "silviadeoliveira24.nutri@gmail.com","5521987385146","1985-01-01",
      "Nutrição Clínica & Esportiva","ADMIN","2026-01-01",admPass]);
    uSheet.appendRow(["PAC-01","12345678900","Juliana Mendes","juliana.mendes@gmail.com",
      "5521999998888","1995-04-12","Reeducação Alimentar & Emagrecimento","PACIENTE","2026-05-10",defPin]);
    uSheet.appendRow(["PAC-02","98765432111","Carlos Eduardo Torres","carlos.torres@hotmail.com",
      "5521988887777","1988-11-23","Nutrição Esportiva & Hipertrofia","PACIENTE","2026-06-01",defPin]);
    uSheet.appendRow(["PAC-03","45678912322","Mariana Castro Silva","mari.castro@gmail.com",
      "5521977776666","2000-07-08","Saúde Intestinal & Bio-Reset","PACIENTE","2026-07-15",defPin]);
  }

  const cfgSheet = getSheet(SHEETS.CONFIG);
  if (cfgSheet.getLastRow()<=1) {
    cfgSheet.appendRow(["admin_email","silviadeoliveira24.nutri@gmail.com"]);
    cfgSheet.appendRow(["admin_senha",admPass]);
    cfgSheet.appendRow(["clinica_nome","Dra. Silvia de Oliveira Lemos"]);
    cfgSheet.appendRow(["clinica_crn","CRN-4 25104731"]);
  }

  const aSheet = getSheet(SHEETS.AGENDAMENTOS);
  if (aSheet.getLastRow()<=1) {
    const hoje = new Date().toISOString().split("T")[0];
    aSheet.appendRow(["AG-01","PAC-01","Juliana Mendes","5521999998888",hoje,"09:00","Online (Google Meet)",250,"Confirmado","",""]); 
    aSheet.appendRow(["AG-02","PAC-02","Carlos Eduardo Torres","5521988887777",hoje,"10:30","Presencial",280,"Aguardando","",""]); 
    aSheet.appendRow(["AG-03","PAC-03","Mariana Castro Silva","5521977776666",hoje,"14:00","Retorno de Avaliação",200,"Confirmado","Trazer exames",""]); 
  }

  const anSheet = getSheet(SHEETS.ANAMNESES);
  if (anSheet.getLastRow()<=1) {
    anSheet.appendRow(["ANAM-01","PAC-01","2026-05-10","Intolerância leve à lactose",
      "Histórico de enxaqueca moderada","7-8h por noite","Regular diário",
      "Adora comida japonesa, não gosta de quiabo","Nenhum","Whey protein",
      "Nenhuma","Diabetes tipo 2 (mãe)","Sedentária","Emagrecer 8kg e ter mais energia",
      "Sem glúten fortemente não; lactose evitar"]);
  }

  const evSheet = getSheet(SHEETS.EVOLUCAO);
  if (evSheet.getLastRow()<=1) {
    evSheet.appendRow(["EVO-01","PAC-01","2026-05-10",71.2,28.5,34.0,82,102,27.4]);
    evSheet.appendRow(["EVO-02","PAC-01","2026-06-10",69.0,26.1,35.2,78,99,26.7]);
    evSheet.appendRow(["EVO-03","PAC-01","2026-07-10",67.4,24.0,36.5,75,96,25.9]);
    evSheet.appendRow(["EVO-04","PAC-01","2026-08-05",65.5,22.4,38.1,72,94,25.2]);
  }

  return { message:"Banco populado com sucesso!" };
}
