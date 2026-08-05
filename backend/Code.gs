/**
 * ====================================================================
 * KOS NUTRIÇÃO - BACKEND API SERVERLESS (GOOGLE APPS SCRIPT)
 * Dra. Silvia de Oliveira Lemos · CRN-4 24987/P
 * ====================================================================
 * Instruções de Deploy:
 * 1. Abra o Google Sheets e vá em Extensões > Apps Script.
 * 2. Cole este código no arquivo Code.gs.
 * 3. Execute a função setupDatabase() uma vez para criar as abas.
 * 4. Implante como Web App: "Executar como: Eu" e "Quem tem acesso: Qualquer pessoa".
 * 5. Copie a URL do Web App gerada e cole no app-nutri.html e portal-paciente.html.
 */

// Nomes das Abas do Banco de Dados
const SHEETS = {
  USUARIOS: "Usuarios",
  AGENDAMENTOS: "Agendamentos",
  ANAMNESES: "Anamneses",
  EVOLUCAO: "Evolucao",
  PLANOS: "Planos",
  EXAMES: "Exames_Laboratoriais",
  DOBRAS: "Dobras_Cutaneas",
  SUPLEMENTOS: "Prescricoes_Suplementos",
  RECORDATORIO: "Recordatorio_24h",
  CONFIG: "Configuracoes"
};

/**
 * Função de Inicialização do Banco de Dados
 * Cria todas as abas necessárias com os cabeçalhos padrão
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const schemas = {
    [SHEETS.USUARIOS]: ["id", "cpf", "nome", "email", "whatsapp", "data_nascimento", "objetivo", "tipo", "data_cadastro", "senha_pin"],
    [SHEETS.AGENDAMENTOS]: ["id", "paciente_id", "paciente_nome", "data", "hora", "tipo", "valor", "status"],
    [SHEETS.ANAMNESES]: ["id", "paciente_id", "data", "alergias", "historico_saude", "rotina_sono", "intestino", "preferencias"],
    [SHEETS.EVOLUCAO]: ["id", "paciente_id", "data", "peso", "percentual_gordura", "massa_magra", "cintura", "quadril"],
    [SHEETS.PLANOS]: ["id", "paciente_id", "data", "json_refeicoes", "json_extras", "json_lista_compras"],
    [SHEETS.EXAMES]: ["id", "paciente_id", "data_exame", "glicemia", "hba1c", "insulina", "colesterol_total", "hdl", "ldl", "triglicerideos", "vitamina_d", "vitamina_b12", "ferritina", "tsh"],
    [SHEETS.DOBRAS]: ["id", "paciente_id", "data", "tricipital", "subescapular", "suprailiaca", "abdominal", "coxa", "braco_relaxado", "braco_contraido", "cintura", "quadril"],
    [SHEETS.SUPLEMENTOS]: ["id", "paciente_id", "data", "suplemento_nome", "dosagem", "posologia", "forma_farmaceutica"],
    [SHEETS.RECORDATORIO]: ["id", "paciente_id", "data", "refeicao", "horario", "alimentos", "escala_bristol_tipo"],
    [SHEETS.CONFIG]: ["chave", "valor"]
  };

  Object.keys(schemas).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(schemas[sheetName]);
      sheet.getRange(1, 1, 1, schemas[sheetName].length).setFontWeight("bold").setBackground("#203528").setFontColor("#ffffff");
    } else {
      // AUTO MIGRATION: Adiciona automaticamente novas colunas como 'senha_pin' caso a aba já existisse
      const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const targetHeaders = schemas[sheetName];

      targetHeaders.forEach(header => {
        if (!currentHeaders.includes(header)) {
          const newColIdx = currentHeaders.length + 1;
          sheet.getRange(1, newColIdx).setValue(header).setFontWeight("bold").setBackground("#203528").setFontColor("#ffffff");
          currentHeaders.push(header);
        }
      });
    }
  });

  Logger.log("Database Setup & Auto-Migration Completed Successfully!");
}

/**
 * Tratamento de Requisições GET
 */
function doGet(e) {
  return handleRequest(e, "GET");
}

/**
 * Tratamento de Requisições POST
 */
function doPost(e) {
  return handleRequest(e, "POST");
}

/**
 * Handler Central da API REST
 */
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
      // 1. SEED / POPULAR DADOS INICIAIS DA DRA. SILVIA
      case "seedDatabase":
        response.data = populateInitialData();
        response.success = true;
        break;

      // 2. LOGIN PACIENTE
      case "loginPaciente":
        response.data = loginPaciente(params.cpf, params.data_nascimento);
        response.success = true;
        break;

      // 2. PACIENTES
      case "getPacientes":
        response.data = getTableData(SHEETS.PACIENTES);
        response.success = true;
        break;

      case "savePaciente":
        response.data = savePaciente(params.paciente);
        response.success = true;
        break;

      // 3. AGENDAMENTOS
      case "getAgendamentos":
        response.data = getTableData(SHEETS.AGENDAMENTOS);
        response.success = true;
        break;

      case "saveAgendamento":
        response.data = saveAgendamento(params.agendamento);
        response.success = true;
        break;

      // 4. ANAMNESES
      case "saveAnamnese":
        response.data = saveAnamnese(params.anamnese);
        response.success = true;
        break;

      case "getAnamnese":
        response.data = getByField(SHEETS.ANAMNESES, "paciente_id", params.paciente_id);
        response.success = true;
        break;

      // 5. EVOLUÇÃO CORPORAL
      case "saveEvolucao":
        response.data = saveEvolucao(params.evolucao);
        response.success = true;
        break;

      case "getEvolucao":
        response.data = getAllByField(SHEETS.EVOLUCAO, "paciente_id", params.paciente_id);
        response.success = true;
        break;

      // 6. PLANOS ALIMENTARES
      case "savePlano":
        response.data = savePlano(params.plano);
        response.success = true;
        break;

      case "getPlanoVigente":
        response.data = getPlanoVigente(params.paciente_id);
        response.success = true;
        break;

      default:
        response.error = "Ação não informada ou inválida: " + action;
    }

  } catch (err) {
    response.success = false;
    response.error = err.toString();
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNÇÕES AUXILIARES DE BANCO DE DADOS
// ==========================================

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupDatabase();
    sheet = ss.getSheetByName(sheetName);
  }
  return sheet;
}

function getTableData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    let obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx];
    });
    return obj;
  });
}

function getByField(sheetName, fieldName, val) {
  const items = getTableData(sheetName);
  return items.find(item => String(item[fieldName]).trim() === String(val).trim()) || null;
}

function getAllByField(sheetName, fieldName, val) {
  const items = getTableData(sheetName);
  return items.filter(item => String(item[fieldName]).trim() === String(val).trim());
}

/**
 * GERADOR DE HASH CRIPTOGRÁFICO SHA-256 (COM SALT DE SEGURANÇA)
 */
function hashPassword(plainPassword) {
  if (!plainPassword) return "";
  const salt = "KOS_NUTRI_SALT_2026_SILVIA_LEMOS_CRN";
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(plainPassword) + salt,
    Utilities.Charset.UTF_8
  );
  return rawHash.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function cleanCPF(cpf) {
  return String(cpf || "").replace(/\D/g, "");
}

function loginPaciente(identifierInput, pinInput) {
  const cleanInput = cleanCPF(identifierInput);
  const rawInput = String(identifierInput || "").trim().toLowerCase();
  const inputHash = hashPassword(pinInput);
  const usuarios = getTableData(SHEETS.USUARIOS);

  const usuario = usuarios.find(u => {
    const uCpf = cleanCPF(u.cpf);
    const uEmail = String(u.email || "").trim().toLowerCase();
    const isPaciente = !u.tipo || u.tipo === "PACIENTE";
    return isPaciente && ((uCpf && uCpf === cleanInput) || (uEmail && uEmail === rawInput));
  });

  if (!usuario) {
    throw new Error("Paciente não encontrado com o CPF ou E-mail informado.");
  }

  // VALIDAÇÃO COM HASH CRIPTOGRÁFICO SHA-256
  if (usuario.senha_pin && usuario.senha_pin !== inputHash && usuario.senha_pin !== pinInput) {
    throw new Error("Senha / PIN incorreto. Tente novamente.");
  }

  return usuario;
}

function loginAdmin(emailInput, passInput) {
  const usuarios = getTableData(SHEETS.USUARIOS);
  const rawEmail = String(emailInput || "").trim().toLowerCase();
  const inputHash = hashPassword(passInput);

  // BUSCA USUÁRIO ADMIN NA TABELA DE USUÁRIOS OU NA TABELA DE CONFIGURAÇÕES
  let admin = usuarios.find(u => {
    const uEmail = String(u.email || "").trim().toLowerCase();
    const isAdmin = u.tipo === "ADMIN";
    return isAdmin && uEmail === rawEmail;
  });

  if (!admin) {
    // FALLBACK NA ABA CONFIG
    const configs = getTableData(SHEETS.CONFIG);
    const adminEmailObj = configs.find(c => c.chave === 'admin_email');
    const adminPassObj = configs.find(c => c.chave === 'admin_senha');
    const targetEmail = adminEmailObj ? adminEmailObj.valor : "silviadeoliveira24.nutri@gmail.com";
    const targetHash = adminPassObj ? adminPassObj.valor : hashPassword("silvia2026");

    if (rawEmail !== targetEmail.trim().toLowerCase()) {
      throw new Error("E-mail administrativo incorreto.");
    }
    if (inputHash !== targetHash && passInput !== targetHash) {
      throw new Error("Senha administrativa incorreta.");
    }
    return { authenticated: true, email: targetEmail, nome: "Dra. Silvia de Oliveira Lemos", tipo: "ADMIN" };
  }

  if (admin.senha_pin && admin.senha_pin !== inputHash && admin.senha_pin !== passInput) {
    throw new Error("Senha administrativa incorreta.");
  }

  return { authenticated: true, email: admin.email, nome: admin.nome, tipo: "ADMIN" };
}

function savePaciente(p) {
  const sheet = getSheet(SHEETS.USUARIOS);
  const id = p.id || "PAC-" + Date.now();
  const dataCad = p.data_cadastro || new Date().toISOString().split("T")[0];
  const hashedPin = hashPassword(p.senha_pin || "123456");
  const tipo = p.tipo || "PACIENTE";

  sheet.appendRow([
    id,
    cleanCPF(p.cpf),
    p.nome,
    p.email || "",
    p.whatsapp || "",
    p.data_nascimento || "",
    p.objetivo || "Reeducação Alimentar",
    tipo,
    dataCad,
    hashedPin
  ]);

  return { id: id, tipo: tipo, ...p };
}

function saveAgendamento(ag) {
  const sheet = getSheet(SHEETS.AGENDAMENTOS);
  const id = ag.id || "AG-" + Date.now();

  sheet.appendRow([
    id,
    ag.paciente_id,
    ag.paciente_nome,
    ag.data,
    ag.hora,
    ag.tipo || "Consulta Nutricional",
    ag.valor || 250,
    ag.status || "Confirmado"
  ]);

  return { id: id, ...ag };
}

function saveAnamnese(an) {
  const sheet = getSheet(SHEETS.ANAMNESES);
  const id = "ANAM-" + Date.now();
  const hoje = new Date().toISOString().split("T")[0];

  sheet.appendRow([
    id,
    an.paciente_id,
    hoje,
    an.alergias || "Nenhuma",
    an.historico_saude || "Sem observações",
    an.rotina_sono || "8h/noite",
    an.intestino || "Regular",
    an.preferencias || ""
  ]);

  return { id: id, ...an };
}

function saveEvolucao(ev) {
  const sheet = getSheet(SHEETS.EVOLUCAO);
  const id = "EVO-" + Date.now();
  const hoje = ev.data || new Date().toISOString().split("T")[0];

  sheet.appendRow([
    id,
    ev.paciente_id,
    hoje,
    ev.peso,
    ev.percentual_gordura,
    ev.massa_magra,
    ev.cintura || 0,
    ev.quadril || 0
  ]);

  return { id: id, ...ev };
}

function savePlano(pl) {
  const sheet = getSheet(SHEETS.PLANOS);
  const id = "PLANO-" + Date.now();
  const hoje = new Date().toISOString().split("T")[0];

  sheet.appendRow([
    id,
    pl.paciente_id,
    hoje,
    JSON.stringify(pl.refeicoes || []),
    JSON.stringify(pl.extras || {}),
    JSON.stringify(pl.lista_compras || {})
  ]);

  return { id: id, ...pl };
}

function getPlanoVigente(paciente_id) {
  const planos = getAllByField(SHEETS.PLANOS, "paciente_id", paciente_id);
  if (!planos || planos.length === 0) return null;

  const ultimo = planos[planos.length - 1];
  return {
    id: ultimo.id,
    paciente_id: ultimo.paciente_id,
    data: ultimo.data,
    refeicoes: JSON.parse(ultimo.json_refeicoes || "[]"),
    extras: JSON.parse(ultimo.json_extras || "{}"),
    lista_compras: JSON.parse(ultimo.json_lista_compras || "{}")
  };
}

/**
 * Função para Popular o Banco com Dados Reais da Dra. Silvia
 */
function populateInitialData() {
  setupDatabase();

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. USUÁRIOS REAIS (ADMIN & PACIENTES COM TIPO)
  const defaultPinHash = hashPassword("123456");
  const adminPassHash = hashPassword("silvia2026");

  const uSheet = getSheet(SHEETS.USUARIOS);
  if (uSheet.getLastRow() <= 1) {
    // ADMIN NUTRICIONISTA
    uSheet.appendRow(["ADM-01", "00000000000", "Dra. Silvia de Oliveira Lemos", "silviadeoliveira24.nutri@gmail.com", "5521987385146", "1985-01-01", "Nutrição Clínica & Esportiva", "ADMIN", "2026-01-01", adminPassHash]);

    // PACIENTES
    uSheet.appendRow(["PAC-01", "12345678900", "Juliana Mendes", "juliana.mendes@gmail.com", "5521999998888", "1995-04-12", "Reeducação Alimentar & Emagrecimento", "PACIENTE", "2026-05-10", defaultPinHash]);
    uSheet.appendRow(["PAC-02", "98765432111", "Carlos Eduardo Torres", "carlos.torres@hotmail.com", "5521988887777", "1988-11-23", "Nutrição Esportiva & Hipertrofia", "PACIENTE", "2026-06-01", defaultPinHash]);
    uSheet.appendRow(["PAC-03", "45678912322", "Mariana Castro Silva", "mari.castro@gmail.com", "5521977776666", "2000-07-08", "Saúde Intestinal & Bio-Reset", "PACIENTE", "2026-07-15", defaultPinHash]);
  }

  // 1.B CONFIGURAÇÕES DA CLÍNICA
  const cfgSheet = getSheet(SHEETS.CONFIG);
  if (cfgSheet.getLastRow() <= 1) {
    cfgSheet.appendRow(["admin_email", "silviadeoliveira24.nutri@gmail.com"]);
    cfgSheet.appendRow(["admin_senha", adminPassHash]);
    cfgSheet.appendRow(["clinica_nome", "Dra. Silvia de Oliveira Lemos Nutricionista"]);
    cfgSheet.appendRow(["clinica_crn", "CRN-4 24987/P"]);
  }

  // 2. AGENDAMENTOS REAIS
  const aSheet = getSheet(SHEETS.AGENDAMENTOS);
  if (aSheet.getLastRow() <= 1) {
    aSheet.appendRow(["AG-01", "PAC-01", "Juliana Mendes", "2026-08-05", "09:00", "Consulta Online (Google Meet)", 250, "Confirmado"]);
    aSheet.appendRow(["AG-02", "PAC-02", "Carlos Eduardo Torres", "2026-08-05", "11:00", "Consulta Presencial", 250, "Confirmado"]);
    aSheet.appendRow(["AG-03", "PAC-03", "Mariana Castro Silva", "2026-08-06", "14:30", "Retorno 30 Dias", 200, "Confirmado"]);
    aSheet.appendRow(["AG-04", "PAC-01", "Juliana Mendes", "2026-08-10", "14:00", "Retorno de Avaliação", 200, "Confirmado"]);
  }

  // 3. ANAMNESE REAL
  const anSheet = getSheet(SHEETS.ANAMNESES);
  if (anSheet.getLastRow() <= 1) {
    anSheet.appendRow(["ANAM-01", "PAC-01", "2026-05-10", "Intolerância leve à lactose", "Histórico de enxaqueca moderada", "7h a 8h por noite", "Regular (Todos os dias)", "Adora comida japonesa, não gosta de quiabo"]);
  }

  // 4. EVOLUÇÃO CORPORAL REAL
  const evSheet = getSheet(SHEETS.EVOLUCAO);
  if (evSheet.getLastRow() <= 1) {
    evSheet.appendRow(["EVO-01", "PAC-01", "2026-05-10", 71.2, 28.5, 34.0, 82, 102]);
    evSheet.appendRow(["EVO-02", "PAC-01", "2026-06-10", 69.0, 26.1, 35.2, 78, 99]);
    evSheet.appendRow(["EVO-03", "PAC-01", "2026-07-10", 67.4, 24.0, 36.5, 75, 96]);
    evSheet.appendRow(["EVO-04", "PAC-01", "2026-08-05", 65.5, 22.4, 38.1, 72, 94]);
  }

  // 5. PLANO ALIMENTAR VIGENTE REAL
  const plSheet = getSheet(SHEETS.PLANOS);
  if (plSheet.getLastRow() <= 1) {
    const refeicoes = [
      {
        nome: "Café da Manhã (08:00)",
        calorias: "350 kcal",
        itens: "2 ovos mexidos temperados com orégano + 1 fatia de pão integral 100% com 1 colher de chá de requeijão light + 1 xícara de café preto sem açúcar."
      },
      {
        nome: "Almoço - Prato 50/25/25 (12:30)",
        calorias: "600 kcal",
        itens: "50% folhas (alface, rúcula e tomate) + 25% filé de frango grelhado (120g) + 25% carboidrato (3 colheres de arroz integral + feijão preto)."
      },
      {
        nome: "Lanche da Tarde (16:00)",
        calorias: "250 kcal",
        itens: "1 iogurte natural desnatado + 1 colher de sopa de aveia em flocos + 1 banana prata em rodelas."
      },
      {
        nome: "Jantar (19:30)",
        calorias: "450 kcal",
        itens: "Omelete com 2 ovos, espinafre e tomate picado + salada verde à vontade temperada com azeite extravirgem."
      }
    ];

    const extras = {
      calorias_totais: "1800 kcal",
      proteinas: "130g",
      carboidratos: "180g",
      gorduras: "55g",
      agua_diaria: "2.3 Litros"
    };

    const lista_compras = {
      hortifruti: ["Alface crespa", "Rúcula", "Tomate", "Pepino", "Espinafre", "Bananas prata"],
      proteinas: ["Ovos caipiras (2 dúzias)", "Filé de frango grelhado (1kg)", "Patinho moído (500g)"],
      mercearia: ["Pão integral 100%", "Arroz integral", "Feijão preto", "Azeite extravirgem", "Aveia em flocos"],
      laticinios: ["Requeijão light", "Iogurte natural desnatado", "Café torrado moído"]
    };

    plSheet.appendRow([
      "PLANO-01",
      "PAC-01",
      "2026-08-05",
      JSON.stringify(refeicoes),
      JSON.stringify(extras),
      JSON.stringify(lista_compras)
    ]);
  }

  return { message: "Banco de dados populado com sucesso com dados da Dra. Silvia!" };
}

