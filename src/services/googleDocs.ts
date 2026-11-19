/**
 * Servico de integracao client-side com Google Docs e Google Drive (Exportacao PDF).
 * - Autenticacao client-side via Firebase Auth + GoogleAuthProvider.
 * - Token OAuth mantido EXCLUSIVAMENTE em memoria (nunca em localStorage/sessionStorage).
 * - Escopos minimos: documents e drive.file.
 */
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
];

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export function initAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
}

export async function googleSignIn(): Promise<{
  user: User;
  accessToken: string;
}> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(
        'Não foi possível obter a permissão de acesso ao Google Docs.'
      );
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export async function getAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

export async function logoutGoogle(): Promise<void> {
  await auth.signOut();
  cachedAccessToken = null;
}

export interface MetadadosEntregaGrupo {
  integrantes: string;
  turma: string;
  linkGithubFastApi: string;
  linkPlataformaWeb: string;
  linkVideoDemo: string;
}

interface BlocoDocumento {
  tipo: 'titulo' | 'subtitulo' | 'h1' | 'h2' | 'paragrafo' | 'item';
  texto: string;
}

export interface ResultadoDocCriado {
  documentId: string;
  titulo: string;
  docUrl: string;
  nomeArquivoPdf: string;
  pdfBaixado: boolean;
}

function montarBlocosFramework(meta: MetadadosEntregaGrupo): BlocoDocumento[] {
  const integrantes =
    meta.integrantes.trim() ||
    'Preencher nomes completos em ordem alfabética e RMs (ex.: Ana Silva — RM000000)';
  const turma = meta.turma.trim() || '2TWDPF';
  const repo =
    meta.linkGithubFastApi.trim() ||
    '[Inserir link do repositório GitHub com backend-fastapi/]';
  const urlWeb =
    meta.linkPlataformaWeb.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '[URL da plataforma]');
  const video =
    meta.linkVideoDemo.trim() || '[Inserir link do vídeo de até 3 minutos]';

  return [
    {
      tipo: 'titulo',
      texto: 'DOSE CERTA — Entrega Framework Application (Prof. Bruno Maia)',
    },
    {
      tipo: 'subtitulo',
      texto: `Global Solution FIAP — Tema: CitizenTech · Turma ${turma}`,
    },
    { tipo: 'h1', texto: '1. Identificação do Grupo (Ordem Alfabética e RMs)' },
    { tipo: 'paragrafo', texto: integrantes },
    { tipo: 'h1', texto: '2. Ficha de Produto — CitizenTech' },
    { tipo: 'item', texto: 'Nome do projeto: Dose Certa' },
    {
      tipo: 'item',
      texto:
        'Problema cívico/social: Pessoas idosas (60+) com baixa visão, baixo letramento digital e múltiplas prescrições enfrentam alto risco de esquecimento ou erro no uso de medicamentos, agravado por bulas com letras pequenas e termos técnicos.',
    },
    {
      tipo: 'item',
      texto:
        'Público-alvo: Idosos (60+) com celulares de entrada e conexão instável + familiares cuidadores que acompanham à distância.',
    },
    {
      tipo: 'item',
      texto:
        'Proposta de valor: Aplicativo móvel ultrassimples, acessível e offline-first para confirmar doses e ouvir bulas traduzidas por IA, conectado ao vivo a um Portal Web do familiar cuidador.',
    },
    {
      tipo: 'item',
      texto:
        'ODS e Impacto Público: ODS 3 (Saúde e Bem-Estar) e ODS 10 (Redução das Desigualdades Digitais).',
    },
    {
      tipo: 'item',
      texto:
        'Acessibilidade e Ética: 4 níveis de fonte (até 1,75x), temas Claro/Escuro/Alto Contraste WCAG AA/AAA, leitura integral em voz alta pt-BR, gamificação sem punição (Jardim da Saúde) e soberania de dados LGPD.',
    },
    {
      tipo: 'item',
      texto:
        'Stack tecnológica: Front-end React/TypeScript (App Mobile + Portal Web + Expo Snack React Native), Back-end REST em FastAPI (Python) com banco relacional em 3FN e IA Multimodal Google Gemini.',
    },
    { tipo: 'h1', texto: '3. Links Oficiais da Entrega' },
    { tipo: 'item', texto: `Repositório Back-end FastAPI (GitHub): ${repo}` },
    { tipo: 'item', texto: `Plataforma Web Funcional (Portal Cuidador + App): ${urlWeb}` },
    { tipo: 'item', texto: `Vídeo de Demonstração (até 3 min): ${video}` },
    { tipo: 'h1', texto: '4. Arquitetura e Justificativas Técnicas' },
    {
      tipo: 'paragrafo',
      texto:
        'API Única Compartilhada: O App do Idoso e o Portal Web do Familiar Cuidador consomem os mesmos endpoints REST, sincronizando doses, recados de carinho (até 140 caracteres), leitura de bulas com IA e controles LGPD em tempo real.',
    },
    {
      tipo: 'paragrafo',
      texto:
        'Back-end FastAPI em 3FN: Implementado em Python com Pydantic, CORS, documentação OpenAPI (/docs) e persistência relacional normalizada em 6 tabelas (usuario, medicamento_dose, tipo_conquista, usuario_conquista, mensagem_cuidador e evento_impacto).',
    },
    {
      tipo: 'paragrafo',
      texto:
        'Segurança de IA no Servidor: A chave GEMINI_API_KEY permanece exclusivamente no back-end. A IA explica apenas o documento fotografado e aplica trava clínica obrigatória respondendo "Pergunte ao seu médico ou farmacêutico." para perguntas fora da bula.',
    },
    { tipo: 'h1', texto: '5. Mapa Funcionalidade do MVP → Endpoint' },
    { tipo: 'item', texto: 'GET /v1/health — Verificação de saúde da API e status da IA.' },
    { tipo: 'item', texto: 'GET /v1/agenda — Agenda diária de medicamentos do idoso.' },
    { tipo: 'item', texto: 'POST /v1/doses — Cadastro de novo medicamento pelo familiar cuidador.' },
    { tipo: 'item', texto: 'POST /v1/doses/{dose_id}/confirmar — Confirmação de dose e cálculo ético de pontos/conquistas.' },
    { tipo: 'item', texto: 'POST /v1/documentos/ler — Leitura multimodal de bula/receita com IA Gemini em linguagem simples.' },
    { tipo: 'item', texto: 'POST /v1/documentos/perguntar — Tira-dúvidas estritamente restrito ao texto da bula.' },
    { tipo: 'item', texto: 'GET /v1/gamificacao — Estágio do Jardim da Saúde, sequência, conquistas e recado familiar.' },
    { tipo: 'item', texto: 'POST /v1/cuidador/mensagem — Envio de recado afetivo (máx. 140 caracteres).' },
    { tipo: 'item', texto: 'PATCH /v1/privacidade/cuidador — Pausa ou reativação imediata do acesso do cuidador (LGPD).' },
    { tipo: 'item', texto: 'GET /v1/metricas/impacto — Painel ao vivo de adesão, bulas lidas e eventos CitizenTech.' },
    { tipo: 'item', texto: 'GET / DELETE /v1/privacidade/dados — Transparência e direito ao esquecimento (LGPD).' },
    { tipo: 'h1', texto: '6. Roteiro do Vídeo de Demonstração (até 3 min)' },
    { tipo: 'item', texto: '0:00–0:30: Acessibilidade (aumento de letra, Alto Contraste e leitura em voz alta).' },
    { tipo: 'item', texto: '0:30–1:15: Fluxo Hoje, confirmação de dose sem culpa, modo Offline/Online e Jardim da Saúde.' },
    { tipo: 'item', texto: '1:15–1:55: Leitura real de bula com Gemini AI e teste da trava de segurança ("Posso tomar 2?").' },
    { tipo: 'item', texto: '1:55–2:40: Portal Web do Cuidador ao vivo (métricas de impacto, recado afetivo e novo remédio).' },
    { tipo: 'item', texto: '2:40–3:00: Revogação LGPD em tempo real + documentação Swagger (/docs) da API FastAPI.' },
    { tipo: 'h1', texto: '7. Declaração do Uso de IA Generativa' },
    {
      tipo: 'paragrafo',
      texto:
        'Declaramos de forma transparente que ferramentas de IA Generativa (Google AI Studio) foram empregadas como apoio na estruturação de componentes React/TypeScript acessíveis, endpoints REST (Express e FastAPI), revisão de contraste WCAG AA/AAA e organização documental, com revisão e validação integral da equipe. No produto final, a API Google Gemini (gemini-4-hydrogen) opera exclusivamente no back-end para explicar fotos de bulas e responder dúvidas restritas ao documento.',
    },
  ];
}

function montarBlocosGamificacao(meta: MetadadosEntregaGrupo): BlocoDocumento[] {
  const integrantes =
    meta.integrantes.trim() ||
    'Preencher nomes completos em ordem alfabética e RMs (ex.: Ana Silva — RM000000)';
  const turma = meta.turma.trim() || '2TWDPF';
  const urlWeb =
    meta.linkPlataformaWeb.trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '[URL da plataforma]');

  return [
    {
      tipo: 'titulo',
      texto: 'DOSE CERTA — Estratégia de Gamificação Ética (Citizen Flow)',
    },
    {
      tipo: 'subtitulo',
      texto: `Game Dev & Gamification (Prof. Felipe Facio) · Global Solution FIAP — Turma ${turma}`,
    },
    { tipo: 'h1', texto: '1. Identificação do Grupo e Link da Plataforma' },
    { tipo: 'paragrafo', texto: integrantes },
    { tipo: 'item', texto: `Plataforma Integrada (Jardim da Saúde ao vivo): ${urlWeb}` },
    { tipo: 'h1', texto: '2. Ficha de Produto — CitizenTech' },
    { tipo: 'item', texto: 'Nome do produto: Dose Certa' },
    {
      tipo: 'item',
      texto:
        'Desafio central: Aumentar a adesão ao tratamento contínuo de pessoas idosas (60+) com baixa visão e baixo letramento digital, sem ansiedade nem vigilância invasiva.',
    },
    {
      tipo: 'item',
      texto:
        'Metáfora central: Jardim da Saúde — cresce com cada cuidado real e nunca murcha.',
    },
    {
      tipo: 'item',
      texto:
        'Citizen Flow (Core Loop): Lembrete gentil → Confirmação em 1 toque ou leitura de bula → Feedback calmo (✓ + pontos) → Evolução visual 2D do Jardim → Recado de carinho do familiar.',
    },
    { tipo: 'h1', texto: '3. Manifesto Ético da Gamificação' },
    {
      tipo: 'item',
      texto:
        'Sem punição: dose esquecida NUNCA tira pontos nem diminui o jardim ("seu jardim só descansou; hoje a gente recomeça").',
    },
    {
      tipo: 'item',
      texto:
        'Sem ranking nem competição: saúde não é disputa entre pessoas.',
    },
    {
      tipo: 'item',
      texto:
        'Tom respeitoso, adulto e caloroso: tratamos por "você" e trocamos "você esqueceu" por "ainda dá tempo de tomar".',
    },
    {
      tipo: 'item',
      texto:
        'A serviço da adesão real: pontos apenas por ações saudáveis (tomar dose, compreender a bula), nunca por tempo de tela.',
    },
    { tipo: 'h1', texto: '4. Estágios do Jardim da Saúde' },
    { tipo: 'item', texto: 'Estágio 1 — Semente 🌱 (0 a 29 pontos): reduz a barreira inicial nos primeiros dias.' },
    { tipo: 'item', texto: 'Estágio 2 — Broto 🌿 (30 a 79 pontos): reforça a criação do hábito na primeira semana.' },
    { tipo: 'item', texto: 'Estágio 3 — Planta 🪴 (80 a 159 pontos): sustenta a constância após a novidade.' },
    { tipo: 'item', texto: 'Estágio 4 — Flor 🌸 (160 a 299 pontos): consolida a rotina quinzenal de cuidado.' },
    { tipo: 'item', texto: 'Estágio 5 — Jardim Florido 🌳🌸 (300+ pontos): gera orgulho duradouro e autocuidado contínuo.' },
    { tipo: 'h1', texto: '5. Tabela de Pontuação por Ação Saudável' },
    { tipo: 'item', texto: 'Dose confirmada no horário: +10 pontos (incentiva pontualidade terapêutica).' },
    { tipo: 'item', texto: 'Dose confirmada com atraso: +6 pontos — nunca zero (evita o abandono do tipo "tudo ou nada").' },
    { tipo: 'item', texto: 'Documento/bula lida com IA: +8 pontos, limite de 2 por dia (aumenta o letramento em saúde).' },
    { tipo: 'item', texto: 'Dia completo (todas as doses confirmadas): +15 pontos (fecha o ciclo diário com bem-estar).' },
    { tipo: 'item', texto: 'Semana completa (7 dias seguidos): +40 pontos (consolida o hábito de médio prazo).' },
    { tipo: 'h1', texto: '6. Sequência de Dias e Recuperação Gentil' },
    {
      tipo: 'paragrafo',
      texto:
        'A sequência acompanha os dias consecutivos de cuidado (exibidos de Seg a Dom). Se houver uma pausa, a contagem recomeça sem culpa ("Seu jardim descansou, hoje a gente recomeça"), preservando integralmente os pontos acumulados e o estágio do jardim.',
    },
    { tipo: 'h1', texto: '7. Catálogo Oficial das 8 Conquistas (tipo_conquista)' },
    { tipo: 'item', texto: 'PRIMEIRO_PASSO — Primeiro Passo 🌱 (+10 pts): confirmou a 1ª dose. Benefício: vence o receio inicial.' },
    { tipo: 'item', texto: 'MANHA_EM_DIA — Manhã em Dia 🌅 (+20 pts): 5 manhãs seguidas em dia. Benefício: cria âncora matinal.' },
    { tipo: 'item', texto: 'SEMANA_FIRME — Semana Firme 🗓️ (+40 pts): 7 dias seguidos de cuidado. Benefício: valida a primeira semana.' },
    { tipo: 'item', texto: 'CURIOSA — Curiosa 📖 (+25 pts): 5 bulas ou receitas lidas. Benefício: promove autonomia e segurança.' },
    { tipo: 'item', texto: 'SEM_PRESSA — Sem Pressa 🌤️ (+15 pts): confirmou dose atrasada sem desistir. Benefício: acolhe imprevistos.' },
    { tipo: 'item', texto: 'RECOMECAR — Recomeço 🌿 (+15 pts): retomou após uma pausa. Benefício: celebra a volta ao tratamento.' },
    { tipo: 'item', texto: 'EM_FAMILIA — Em Família 💛 (+15 pts): recebeu recado afetivo do cuidador. Benefício: reforça apoio familiar.' },
    { tipo: 'item', texto: 'MES_DE_CUIDADO — Mês de Cuidado 🌳 (+100 pts): 30 dias cuidando bem. Benefício: consolida adesão de longo prazo.' },
    { tipo: 'h1', texto: '8. Recompensa Afetiva e Mecânica do Cuidador' },
    {
      tipo: 'paragrafo',
      texto:
        'O familiar cuidador envia recados curtos de carinho (até 140 caracteres) pelo Portal Web, exibidos no Jardim da Saúde do idoso. Após 7 dias de vínculo autorizado (LGPD), o cuidador desbloqueia o selo "Cuidador Presente" e o resumo semanal de adesão.',
    },
    { tipo: 'h1', texto: '9. Riscos Mapeados e Mitigações' },
    { tipo: 'item', texto: 'Risco de cobrança/culpa → Mitigado com zero perda de pontos, cores calmas e frases acolhedoras.' },
    { tipo: 'item', texto: 'Risco de vigilância familiar → Mitigado pelo botão LGPD "Pausar acesso" sob controle exclusivo do idoso.' },
    { tipo: 'item', texto: 'Risco de baixa acessibilidade → Ilustrações 2D adaptáveis a Alto Contraste, letra até 1,75x e leitura em voz alta.' },
    { tipo: 'h1', texto: '10. Indicadores (KPIs) para o Business Blueprint' },
    { tipo: 'item', texto: 'Taxa de adesão semanal (%) exposta em /v1/metricas/impacto.' },
    { tipo: 'item', texto: 'Retenção ativa em 30 dias (%).' },
    { tipo: 'item', texto: 'Média de bulas compreendidas por usuário com IA.' },
    { tipo: 'item', texto: 'Recados afetivos trocados entre cuidador e idoso por semana.' },
    { tipo: 'item', texto: 'Média de conquistas desbloqueadas por usuário ativo.' },
    { tipo: 'h1', texto: '11. Declaração do Uso de IA Generativa' },
    {
      tipo: 'paragrafo',
      texto:
        'Ferramentas de IA Generativa (Google AI Studio) foram usadas como apoio técnico na prototipação da interface gamificada 2D (Jardim da Saúde), validação dos cálculos de pontuação e organização deste documento, com autoria conceitual, decisões éticas e revisão final conduzidas pela equipe.',
    },
  ];
}

function construirBatchUpdateRequests(blocos: BlocoDocumento[]) {
  let cursor = 1;
  const requests: Array<Record<string, unknown>> = [];

  for (const bloco of blocos) {
    const prefixo = bloco.tipo === 'item' ? '• ' : '';
    const textoLinha = `${prefixo}${bloco.texto}\n`;
    const inicio = cursor;
    const fim = inicio + textoLinha.length;

    requests.push({
      insertText: {
        location: { index: inicio },
        text: textoLinha,
      },
    });

    if (bloco.tipo === 'titulo') {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: inicio, endIndex: fim },
          paragraphStyle: { namedStyleType: 'TITLE' },
          fields: 'namedStyleType',
        },
      });
    } else if (bloco.tipo === 'subtitulo') {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: inicio, endIndex: fim },
          paragraphStyle: { namedStyleType: 'SUBTITLE' },
          fields: 'namedStyleType',
        },
      });
    } else if (bloco.tipo === 'h1') {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: inicio, endIndex: fim },
          paragraphStyle: { namedStyleType: 'HEADING_1' },
          fields: 'namedStyleType',
        },
      });
    } else if (bloco.tipo === 'h2') {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: inicio, endIndex: fim },
          paragraphStyle: { namedStyleType: 'HEADING_2' },
          fields: 'namedStyleType',
        },
      });
    } else {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: inicio, endIndex: fim },
          paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
          fields: 'namedStyleType',
        },
      });
    }

    cursor = fim;
  }

  return requests;
}

function dispararDownloadBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function criarDocEExportarPdf(
  accessToken: string,
  titulo: string,
  nomeArquivoPdf: string,
  blocos: BlocoDocumento[]
): Promise<ResultadoDocCriado> {
  // 1. Criar documento no Google Docs
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: titulo }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(
      `Erro ao criar documento no Google Docs (${createRes.status}): ${errText}`
    );
  }

  const created = (await createRes.json()) as { documentId: string };
  const documentId = created.documentId;

  // 2. Preencher conteudo formatado via batchUpdate
  const batchRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: construirBatchUpdateRequests(blocos),
      }),
    }
  );

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    throw new Error(
      `Documento criado, mas houve erro ao inserir o texto (${batchRes.status}): ${errText}`
    );
  }

  // 3. Exportar como PDF via Google Drive API (escopo drive.file)
  let pdfBaixado = false;
  const exportRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (exportRes.ok) {
    const pdfBlob = await exportRes.blob();
    dispararDownloadBlob(pdfBlob, nomeArquivoPdf);
    pdfBaixado = true;
  }

  return {
    documentId,
    titulo,
    docUrl: `https://docs.google.com/document/d/${documentId}/edit`,
    nomeArquivoPdf,
    pdfBaixado,
  };
}

export async function gerarDocFrameworkNoGoogle(
  meta: MetadadosEntregaGrupo
): Promise<ResultadoDocCriado> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Faça login com o Google primeiro para gerar o documento.');
  }
  return criarDocEExportarPdf(
    token,
    'Dose Certa — Entrega Framework Application (FIAP GS CitizenTech)',
    'Dose_Certa_Framework_Application.pdf',
    montarBlocosFramework(meta)
  );
}

export async function gerarDocGamificacaoNoGoogle(
  meta: MetadadosEntregaGrupo
): Promise<ResultadoDocCriado> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Faça login com o Google primeiro para gerar o documento.');
  }
  return criarDocEExportarPdf(
    token,
    'Dose Certa — Entrega Gamification Citizen Flow (FIAP GS CitizenTech)',
    'Dose_Certa_Gamification_Citizen_Flow.pdf',
    montarBlocosGamificacao(meta)
  );
}

export async function baixarPdfDeDocExistente(
  documentId: string,
  nomeArquivoPdf: string
): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Faça login com o Google primeiro para baixar o PDF.');
  }
  const exportRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!exportRes.ok) {
    throw new Error(
      `Não foi possível exportar o PDF (${exportRes.status}).`
    );
  }
  const pdfBlob = await exportRes.blob();
  dispararDownloadBlob(pdfBlob, nomeArquivoPdf);
}
