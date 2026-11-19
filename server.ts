/**
 * Servidor Full-Stack do Dose Certa (Express + Vite + Gemini AI server-side).
 * Compartilha a mesma API REST entre o App do Idoso e o Portal Web do Familiar Cuidador.
 * A chave GEMINI_API_KEY permanece exclusivamente no servidor.
 */
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODELO_GEMINI = 'gemini-4-hydrogen';

function criarClienteGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      'GEMINI_API_KEY não configurada no servidor. Configure a variável de ambiente para ativar a leitura com IA.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatarErroGemini(err: unknown, padrao: string): string {
  const texto = err instanceof Error ? err.message : String(err || '');
  if (
    texto.includes('503') ||
    texto.includes('UNAVAILABLE') ||
    texto.includes('high demand')
  ) {
    return 'A inteligência artificial está com muitos pedidos neste segundo. Toque novamente em alguns instantes.';
  }
  if (texto.includes('429') || texto.includes('RESOURCE_EXHAUSTED')) {
    return 'Muitas leituras seguidas agora. Aguarde um pouquinho e tente de novo.';
  }
  if (texto.includes('GEMINI_API_KEY')) {
    return texto;
  }
  return padrao;
}

async function chamarComRetentativa<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err || '');
    const transitorio =
      msg.includes('503') ||
      msg.includes('UNAVAILABLE') ||
      msg.includes('high demand');
    if (!transitorio) throw err;
    await new Promise((r) => setTimeout(r, 1200));
    return fn();
  }
}

// ---------- Tipos locais (Node 22 native TS type-stripping safe) ----------

interface DoseRegistro {
  id: string;
  horario: string;
  periodo: 'Manhã' | 'Tarde' | 'Noite';
  nome: string;
  dose: string;
  instrucao: string;
  status: 'tomada' | 'pendente' | 'atrasada';
  horarioTomado?: string;
}

interface DocumentoRegistro {
  id: string;
  nomeRemedio: string;
  fotoUri: string;
  resumoSimples: string;
  paraQueServe: string;
  comoTomar: string;
  cuidados: string;
  lidoEm: string;
  origemIA?: string;
}

interface MensagemFamilia {
  remetente: string;
  parentesco: string;
  texto: string;
  data: string;
}

interface EventoImpacto {
  tipo: string;
  descricao: string;
  pontos: number;
  registradoEm: string;
}

interface DefinicaoConquista {
  id: string;
  codigo: string;
  titulo: string;
  dica: string;
  pontos: number;
  emoji: string;
}

interface EstagioInfo {
  estagio: 'semente' | 'broto' | 'planta' | 'flor' | 'jardim_florido';
  nome: string;
  emoji: string;
  min: number;
  proximoNome: string | null;
  verboProximo: string;
  proximoMin: number | null;
}

const PONTOS = {
  DOSE_NO_HORARIO: 10,
  DOSE_COM_ATRASO: 6,
  DOCUMENTO_LIDO: 8,
  DIA_COMPLETO: 15,
  SEMANA_COMPLETA: 40,
};

const ESTAGIOS: EstagioInfo[] = [
  {
    estagio: 'semente',
    nome: 'Semente',
    emoji: '🌱',
    min: 0,
    proximoNome: 'Broto',
    verboProximo: 'virar Broto',
    proximoMin: 30,
  },
  {
    estagio: 'broto',
    nome: 'Broto',
    emoji: '🌿',
    min: 30,
    proximoNome: 'Planta',
    verboProximo: 'virar Planta',
    proximoMin: 80,
  },
  {
    estagio: 'planta',
    nome: 'Planta',
    emoji: '🪴',
    min: 80,
    proximoNome: 'Flor',
    verboProximo: 'dar Flor',
    proximoMin: 160,
  },
  {
    estagio: 'flor',
    nome: 'Flor',
    emoji: '🌸',
    min: 160,
    proximoNome: 'Jardim Florido',
    verboProximo: 'virar Jardim Florido',
    proximoMin: 300,
  },
  {
    estagio: 'jardim_florido',
    nome: 'Jardim Florido',
    emoji: '🌳🌸',
    min: 300,
    proximoNome: null,
    verboProximo: 'continuar florescendo',
    proximoMin: null,
  },
];

const CATALOGO_CONQUISTAS: DefinicaoConquista[] = [
  {
    id: 'c1',
    codigo: 'PRIMEIRO_PASSO',
    titulo: 'Primeiro Passo',
    dica: 'Você confirmou sua primeira dose no aplicativo.',
    pontos: 10,
    emoji: '🌱',
  },
  {
    id: 'c2',
    codigo: 'MANHA_EM_DIA',
    titulo: 'Manhã em Dia',
    dica: 'Tomou todas as doses da manhã por 5 dias seguidos.',
    pontos: 20,
    emoji: '🌅',
  },
  {
    id: 'c3',
    codigo: 'SEMANA_FIRME',
    titulo: 'Semana Firme',
    dica: 'Completou 7 dias seguidos cuidando da sua saúde.',
    pontos: 40,
    emoji: '🗓️',
  },
  {
    id: 'c4',
    codigo: 'CURIOSA',
    titulo: 'Curiosa',
    dica: 'Leu 5 bulas ou receitas para entender seus remédios.',
    pontos: 25,
    emoji: '📖',
  },
  {
    id: 'c5',
    codigo: 'SEM_PRESSA',
    titulo: 'Sem Pressa',
    dica: 'Tomou uma dose atrasada sem desistir do cuidado.',
    pontos: 15,
    emoji: '🌤️',
  },
  {
    id: 'c6',
    codigo: 'RECOMECAR',
    titulo: 'Recomeço',
    dica: 'Voltou a registrar suas doses depois de um dia de descanso.',
    pontos: 15,
    emoji: '🌿',
  },
  {
    id: 'c7',
    codigo: 'EM_FAMILIA',
    titulo: 'Em Família',
    dica: 'Recebeu carinho de um familiar cuidador pelo aplicativo.',
    pontos: 15,
    emoji: '💛',
  },
  {
    id: 'c8',
    codigo: 'MES_DE_CUIDADO',
    titulo: 'Mês de Cuidado',
    dica: 'Completou 30 dias cuidando bem dos seus remédios.',
    pontos: 100,
    emoji: '🌳',
  },
];

const TEXTOS_BULA_EXEMPLO: Record<string, string> = {
  losartana:
    'Bula Oficial Simulada: Losartana Potássica 50 mg, comprimidos revestidos, uso oral. Indicação: controle da pressão arterial (hipertensão) e proteção do coração e dos rins. Posologia comum: 1 comprimido ao dia, de preferência no mesmo horário, com água, com ou sem alimentos. Cuidados: levantar-se devagar ao sair da cama ou da cadeira para evitar tontura; não interromper o tratamento sem orientação médica.',
  metformina:
    'Bula Oficial Simulada: Cloridrato de Metformina 850 mg, comprimidos revestidos, uso oral. Indicação: ajuda a controlar o nível de açúcar (glicose) no sangue em pessoas com diabetes tipo 2. Posologia comum: tomar durante ou logo após as refeições principais (almoço ou jantar), com água, para reduzir desconforto no estômago. Cuidados: manter boa hidratação, evitar excesso de bebidas alcoólicas e avisar o médico se sentir mal-estar persistente.',
  sinvastatina:
    'Bula Oficial Simulada: Sinvastatina 20 mg, comprimidos revestidos, uso oral. Indicação: auxilia na redução do colesterol alto e protege os vasos sanguíneos e o coração. Posologia comum: 1 comprimido à noite, com um copo de água, antes de dormir. Cuidados: evitar suco de toranja (grapefruit) e avisar o médico se surgir dor ou fraqueza muscular forte e fora do comum.',
};

// ---------- Estado em memoria compartilhado (App Mobile + Portal Web) ----------

interface EstadoServidor {
  apelido: string;
  cuidadorAtivo: boolean;
  cuidadorNome: string;
  cuidadorParentesco: string;
  diasVinculoCuidador: number;
  agenda: DoseRegistro[];
  pontos: number;
  sequenciaDias: number;
  documentosLidos: number;
  documentosLidosHoje: number;
  diaCompletoPremiado: boolean;
  dosesAtrasadasTomadas: number;
  conquistasDesbloqueadas: Record<string, string>;
  mensagemFamilia: MensagemFamilia;
  ultimoGanhoMensagem: string | null;
  historicoDocumentos: DocumentoRegistro[];
  eventosImpacto: EventoImpacto[];
}

function criarAgendaInicial(): DoseRegistro[] {
  return [
    {
      id: 'dose-1',
      horario: '08:00',
      periodo: 'Manhã',
      nome: 'Losartana 50 mg',
      dose: '1 comprimido',
      instrucao: 'Tomar com um copo de água',
      status: 'tomada',
      horarioTomado: '08:05',
    },
    {
      id: 'dose-2',
      horario: '12:00',
      periodo: 'Tarde',
      nome: 'Metformina 850 mg',
      dose: '1 comprimido',
      instrucao: 'Tomar logo após o almoço',
      status: 'atrasada',
    },
    {
      id: 'dose-3',
      horario: '20:00',
      periodo: 'Noite',
      nome: 'Sinvastatina 20 mg',
      dose: '1 comprimido',
      instrucao: 'Tomar antes de dormir',
      status: 'pendente',
    },
  ];
}

function criarEstadoInicial(): EstadoServidor {
  return {
    apelido: 'Dona Maria',
    cuidadorAtivo: true,
    cuidadorNome: 'Ana',
    cuidadorParentesco: 'Filha',
    diasVinculoCuidador: 12,
    agenda: criarAgendaInicial(),
    pontos: 92,
    sequenciaDias: 5,
    documentosLidos: 3,
    documentosLidosHoje: 0,
    diaCompletoPremiado: false,
    dosesAtrasadasTomadas: 0,
    conquistasDesbloqueadas: {
      PRIMEIRO_PASSO: '10/11/2026',
      MANHA_EM_DIA: '14/11/2026',
      EM_FAMILIA: '12/11/2026',
    },
    mensagemFamilia: {
      remetente: 'Ana',
      parentesco: 'Filha',
      texto: 'Oi mãe! Vi que o seu jardim está lindo. Te amo, qualquer coisa me liga!',
      data: 'Hoje, 08:20',
    },
    ultimoGanhoMensagem: null,
    historicoDocumentos: [],
    eventosImpacto: [
      {
        tipo: 'DOSE_CONFIRMADA',
        descricao: 'Losartana 50 mg confirmada no horário',
        pontos: 10,
        registradoEm: '08:05',
      },
      {
        tipo: 'MENSAGEM_CUIDADOR',
        descricao: 'Ana (Filha) enviou um recado de carinho',
        pontos: 0,
        registradoEm: '08:20',
      },
    ],
  };
}

let estado: EstadoServidor = criarEstadoInicial();

function horaAtualBR(): string {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, '0')}:${String(
    agora.getMinutes()
  ).padStart(2, '0')}`;
}

function registrarEvento(tipo: string, descricao: string, pontos: number): void {
  estado.eventosImpacto.unshift({
    tipo,
    descricao,
    pontos,
    registradoEm: horaAtualBR(),
  });
  if (estado.eventosImpacto.length > 30) {
    estado.eventosImpacto = estado.eventosImpacto.slice(0, 30);
  }
}

function obterEstagio(pontos: number): EstagioInfo {
  let atual = ESTAGIOS[0];
  for (const item of ESTAGIOS) {
    if (pontos >= item.min) {
      atual = item;
    }
  }
  return atual;
}

function checarConquistas(): string[] {
  const hojeStr = new Date().toLocaleDateString('pt-BR');
  const novas: string[] = [];

  const liberar = (codigo: string) => {
    if (!estado.conquistasDesbloqueadas[codigo]) {
      estado.conquistasDesbloqueadas[codigo] = hojeStr;
      const def = CATALOGO_CONQUISTAS.find((c) => c.codigo === codigo);
      if (def) {
        estado.pontos += def.pontos;
        novas.push(def.titulo);
        registrarEvento('CONQUISTA', `Conquista liberada: ${def.titulo}`, def.pontos);
      }
    }
  };

  if (estado.agenda.some((d) => d.status === 'tomada')) {
    liberar('PRIMEIRO_PASSO');
  }
  if (estado.dosesAtrasadasTomadas >= 1) {
    liberar('SEM_PRESSA');
  }
  if (estado.documentosLidos >= 5) {
    liberar('CURIOSA');
  }
  if (estado.sequenciaDias >= 7) {
    liberar('SEMANA_FIRME');
  }
  if (estado.sequenciaDias >= 30) {
    liberar('MES_DE_CUIDADO');
  }
  if (estado.cuidadorAtivo) {
    liberar('EM_FAMILIA');
  }
  return novas;
}

function montarGamificacao(cuidadorAtivoParam?: boolean) {
  const cuidadorAtivo =
    typeof cuidadorAtivoParam === 'boolean'
      ? cuidadorAtivoParam
      : estado.cuidadorAtivo;
  const est = obterEstagio(estado.pontos);
  const todasTomadasHoje =
    estado.agenda.length > 0 &&
    estado.agenda.every((d) => d.status === 'tomada');
  const algumaTomadaHoje = estado.agenda.some((d) => d.status === 'tomada');

  const diasSemana = [
    { sigla: 'Seg', nomeDia: 'Segunda-feira', cumprido: true, hoje: false },
    { sigla: 'Ter', nomeDia: 'Terça-feira', cumprido: true, hoje: false },
    { sigla: 'Qua', nomeDia: 'Quarta-feira', cumprido: true, hoje: false },
    { sigla: 'Qui', nomeDia: 'Quinta-feira', cumprido: true, hoje: false },
    {
      sigla: 'Sex',
      nomeDia: 'Sexta-feira',
      cumprido: todasTomadasHoje || algumaTomadaHoje,
      hoje: true,
    },
    { sigla: 'Sáb', nomeDia: 'Sábado', cumprido: false, hoje: false },
    { sigla: 'Dom', nomeDia: 'Domingo', cumprido: false, hoje: false },
  ];

  const conquistas = CATALOGO_CONQUISTAS.map((def) => ({
    ...def,
    desbloqueada: Boolean(estado.conquistasDesbloqueadas[def.codigo]),
    dataConquista: estado.conquistasDesbloqueadas[def.codigo],
  }));

  return {
    pontos: estado.pontos,
    estagio: est.estagio,
    nomeEstagio: est.nome,
    emojiEstagio: est.emoji,
    proximoEstagioNome: est.proximoNome,
    verboProximoEstagio: est.verboProximo,
    pontosProximoEstagio: est.proximoMin,
    pontosEstagioAtualMin: est.min,
    sequenciaDias: estado.sequenciaDias,
    diasSemana,
    conquistas,
    mensagemFamilia: cuidadorAtivo ? estado.mensagemFamilia : null,
    cuidadorPresente: cuidadorAtivo && estado.diasVinculoCuidador >= 7,
    relatorioSemanalLiberado: cuidadorAtivo && estado.diasVinculoCuidador >= 7,
    ultimoGanhoMensagem: estado.ultimoGanhoMensagem,
  };
}

function montarMetricasImpacto() {
  const totalDosesHoje = estado.agenda.length;
  const dosesTomadasHoje = estado.agenda.filter(
    (d) => d.status === 'tomada'
  ).length;
  const dosesAtrasadasHoje = estado.agenda.filter(
    (d) => d.status === 'atrasada'
  ).length;
  const dosesPendentesHoje = estado.agenda.filter(
    (d) => d.status === 'pendente'
  ).length;
  const taxaAdesaoHoje =
    totalDosesHoje > 0
      ? Math.round((dosesTomadasHoje / totalDosesHoje) * 100)
      : 0;
  const estagio = obterEstagio(estado.pontos);

  return {
    apelidoIdoso: estado.apelido,
    cuidadorAtivo: estado.cuidadorAtivo,
    cuidadorNome: `${estado.cuidadorNome} (${estado.cuidadorParentesco})`,
    diasVinculoCuidador: estado.diasVinculoCuidador,
    totalDosesHoje,
    dosesTomadasHoje,
    dosesPendentesHoje,
    dosesAtrasadasHoje,
    taxaAdesaoHoje,
    documentosLidosComIA: estado.documentosLidos,
    pontosJardim: estado.pontos,
    estagioJardim: `${estagio.emoji} ${estagio.nome}`,
    sequenciaDias: estado.sequenciaDias,
    conquistasDesbloqueadas: Object.keys(estado.conquistasDesbloqueadas).length,
    totalConquistas: CATALOGO_CONQUISTAS.length,
    eventosRecentes: estado.eventosImpacto.slice(0, 8),
  };
}

// ---------- App Express ----------

async function iniciarServidor() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      servico: 'Dose Certa API',
      modeloIA: MODELO_GEMINI,
      iaConfigurada: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  app.get('/api/agenda', (_req, res) => {
    res.json(estado.agenda);
  });

  app.post('/api/doses', (req, res) => {
    const { nome, dose, horario, periodo, instrucao } = req.body || {};
    if (!nome || !String(nome).trim() || !horario || !String(horario).trim()) {
      res
        .status(400)
        .json({ error: 'Informe pelo menos o nome do remédio e o horário.' });
      return;
    }

    const periodoValido: 'Manhã' | 'Tarde' | 'Noite' =
      periodo === 'Manhã' || periodo === 'Tarde' || periodo === 'Noite'
        ? periodo
        : 'Manhã';

    const novaDose: DoseRegistro = {
      id: `dose-${Date.now()}`,
      nome: String(nome).trim(),
      dose: String(dose || '1 comprimido').trim(),
      horario: String(horario).trim(),
      periodo: periodoValido,
      instrucao: String(
        instrucao || 'Tomar com um copo de água, seguindo a receita'
      ).trim(),
      status: 'pendente',
    };

    estado.agenda.push(novaDose);
    estado.agenda.sort((a, b) => a.horario.localeCompare(b.horario));
    registrarEvento(
      'MEDICAMENTO_ADICIONADO',
      `${novaDose.nome} (${novaDose.horario}) incluído na agenda`,
      0
    );
    res.status(201).json(novaDose);
  });

  app.post('/api/doses/:id/confirmar', (req, res) => {
    const { id } = req.params;
    const { horarioConfirmacao } = req.body || {};
    const alvo = estado.agenda.find((d) => d.id === id);

    if (!alvo) {
      res.status(404).json({ error: 'Dose não encontrada na agenda.' });
      return;
    }

    if (alvo.status !== 'tomada') {
      const eraAtrasada = alvo.status === 'atrasada';
      const pontosGanhos = eraAtrasada
        ? PONTOS.DOSE_COM_ATRASO
        : PONTOS.DOSE_NO_HORARIO;

      alvo.status = 'tomada';
      alvo.horarioTomado = String(horarioConfirmacao || horaAtualBR());
      estado.pontos += pontosGanhos;

      if (eraAtrasada) {
        estado.dosesAtrasadasTomadas += 1;
      }

      let mensagemGanho = eraAtrasada
        ? `+${pontosGanhos} pontos · Ainda deu tempo! Seu jardim agradece.`
        : `+${pontosGanhos} pontos · Dose confirmada no horário!`;

      registrarEvento(
        'DOSE_CONFIRMADA',
        `${alvo.nome} confirmada (${eraAtrasada ? 'com atraso' : 'no horário'})`,
        pontosGanhos
      );

      const todasTomadas = estado.agenda.every((d) => d.status === 'tomada');
      if (todasTomadas && !estado.diaCompletoPremiado) {
        estado.diaCompletoPremiado = true;
        estado.pontos += PONTOS.DIA_COMPLETO;
        estado.sequenciaDias += 1;
        mensagemGanho = `+${
          pontosGanhos + PONTOS.DIA_COMPLETO
        } pontos · Dia completo! Seu jardim floresceu hoje.`;
        registrarEvento(
          'DIA_COMPLETO',
          'Todas as doses do dia foram confirmadas',
          PONTOS.DIA_COMPLETO
        );
      }

      const novasConquistas = checarConquistas();
      if (novasConquistas.length > 0) {
        mensagemGanho += ` Nova conquista: ${novasConquistas[0]}!`;
      }
      estado.ultimoGanhoMensagem = mensagemGanho;
    }

    res.json(alvo);
  });

  app.post('/api/documentos/ler', async (req, res) => {
    const { fotoUri, fotoBase64, mimeType, codigoDocumento } = req.body || {};

    try {
      const ai = criarClienteGemini();

      const instrucaoSistema = [
        'Você é o assistente de leitura de bulas e receitas do aplicativo Dose Certa, feito para pessoas idosas (60+) no Brasil.',
        'Sua tarefa é ler a foto da bula, caixa de remédio ou receita (ou o texto da bula enviada) e explicar em português do Brasil simples, acolhedor, respeitoso e direto, tratando o leitor por "você".',
        'REGRAS DE SEGURANÇA OBRIGATÓRIAS:',
        '1. Nunca receite medicamentos, nunca mude a dose e nunca faça diagnósticos.',
        '2. Use frases curtas, fáceis de entender e sem jargões médicos difíceis.',
        '3. Se a imagem não for um medicamento, bula ou receita legível, informe com carinho em resumoSimples e oriente a tirar outra foto com mais luz ou perguntar ao farmacêutico.',
      ].join('\n');

      const promptUsuario =
        'Analise esta bula/receita de medicamento e retorne um JSON com: nomeRemedio, resumoSimples (1 frase curta e acolhedora), paraQueServe (explicação clara em 1 a 2 frases), comoTomar (orientação geral escrita na bula/receita sem inventar doses), cuidados (principais cuidados práticos).';

      const parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      > = [];

      const mimeSuportado =
        typeof mimeType === 'string' &&
        (mimeType === 'image/jpeg' ||
          mimeType === 'image/png' ||
          mimeType === 'image/webp');

      if (fotoBase64 && mimeSuportado) {
        parts.push({
          inlineData: {
            mimeType,
            data: String(fotoBase64),
          },
        });
        parts.push({ text: promptUsuario });
      } else {
        const codigo = String(codigoDocumento || 'losartana').toLowerCase();
        const textoBula =
          TEXTOS_BULA_EXEMPLO[codigo] || TEXTOS_BULA_EXEMPLO.losartana;
        parts.push({
          text: `${promptUsuario}\n\nTexto extraído da bula fotografada:\n${textoBula}`,
        });
      }

      const response = await chamarComRetentativa(() =>
        ai.models.generateContent({
          model: MODELO_GEMINI,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction: instrucaoSistema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                nomeRemedio: { type: Type.STRING },
                resumoSimples: { type: Type.STRING },
                paraQueServe: { type: Type.STRING },
                comoTomar: { type: Type.STRING },
                cuidados: { type: Type.STRING },
              },
              required: [
                'nomeRemedio',
                'resumoSimples',
                'paraQueServe',
                'comoTomar',
                'cuidados',
              ],
            },
          },
        })
      );

      const textoBruto = response.text?.trim();
      if (!textoBruto) {
        throw new Error('A IA não retornou uma explicação para este documento.');
      }

      const dadosExtraidos = JSON.parse(textoBruto) as {
        nomeRemedio: string;
        resumoSimples: string;
        paraQueServe: string;
        comoTomar: string;
        cuidados: string;
      };

      estado.documentosLidos += 1;
      let pontosDoc = 0;
      if (estado.documentosLidosHoje < 2) {
        estado.documentosLidosHoje += 1;
        pontosDoc = PONTOS.DOCUMENTO_LIDO;
        estado.pontos += pontosDoc;
        estado.ultimoGanhoMensagem = `+${pontosDoc} pontos · Que bom entender melhor o seu remédio!`;
      }

      const novasConquistas = checarConquistas();
      if (novasConquistas.length > 0) {
        estado.ultimoGanhoMensagem = `${
          estado.ultimoGanhoMensagem || ''
        } Nova conquista: ${novasConquistas[0]}!`.trim();
      }

      const documento: DocumentoRegistro = {
        id: `doc-${Date.now()}`,
        nomeRemedio: dadosExtraidos.nomeRemedio,
        fotoUri: String(fotoUri || ''),
        resumoSimples: dadosExtraidos.resumoSimples,
        paraQueServe: dadosExtraidos.paraQueServe,
        comoTomar: dadosExtraidos.comoTomar,
        cuidados: dadosExtraidos.cuidados,
        lidoEm: horaAtualBR(),
        origemIA: MODELO_GEMINI,
      };

      estado.historicoDocumentos.unshift(documento);
      registrarEvento(
        'BULA_LIDA_IA',
        `Bula explicada por IA (${MODELO_GEMINI}): ${documento.nomeRemedio}`,
        pontosDoc
      );

      res.json(documento);
    } catch (err) {
      const mensagem = formatarErroGemini(
        err,
        'Não foi possível ler a bula com a IA agora. Tente novamente.'
      );
      console.error('[Dose Certa API] Erro em /api/documentos/ler:', err);
      res.status(502).json({ error: mensagem });
    }
  });

  app.post('/api/documentos/perguntar', async (req, res) => {
    const { documento, pergunta } = req.body || {};
    const perguntaLimpa = String(pergunta || '').trim();

    if (!documento || !perguntaLimpa) {
      res
        .status(400)
        .json({ error: 'Envie o documento lido e a sua pergunta.' });
      return;
    }

    try {
      const ai = criarClienteGemini();
      const instrucaoSistema = [
        'Você responde dúvidas de uma pessoa idosa (60+) EXCLUSIVAMENTE com base no conteúdo da bula fornecida abaixo.',
        'REGRA CRÍTICA E INEGOCIÁVEL:',
        '- Se a pergunta pedir para alterar dosagem, tomar 2 comprimidos, dobrar dose, parar de tomar, misturar com outro remédio ou álcool, diagnosticar sintomas, ou perguntar qualquer coisa que NÃO esteja explicitamente escrita no documento fornecido, responda EXATAMENTE com a frase:',
        'Pergunte ao seu médico ou farmacêutico.',
        '- Se a resposta estiver explicitamente no documento fornecido, responda em 1 a 2 frases curtas, simples e acolhedoras, tratando por "você".',
      ].join('\n');

      const contextoDocumento = [
        `Remédio: ${documento.nomeRemedio}`,
        `Resumo: ${documento.resumoSimples}`,
        `Para que serve: ${documento.paraQueServe}`,
        `Como tomar: ${documento.comoTomar}`,
        `Cuidados: ${documento.cuidados}`,
      ].join('\n');

      const response = await chamarComRetentativa(() =>
        ai.models.generateContent({
          model: MODELO_GEMINI,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `DOCUMENTO DA BULA:\n${contextoDocumento}\n\nPERGUNTA DO USUÁRIO:\n${perguntaLimpa}`,
                },
              ],
            },
          ],
          config: {
            systemInstruction: instrucaoSistema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        })
      );

      const respostaTexto =
        response.text?.trim() || 'Pergunte ao seu médico ou farmacêutico.';

      registrarEvento(
        'DUVIDA_BULA_IA',
        `Pergunta respondida sobre ${documento.nomeRemedio}`,
        0
      );

      res.json({ resposta: respostaTexto });
    } catch (err) {
      const mensagem = formatarErroGemini(
        err,
        'Não foi possível responder sua dúvida agora. Tente novamente.'
      );
      console.error('[Dose Certa API] Erro em /api/documentos/perguntar:', err);
      res.status(502).json({ error: mensagem });
    }
  });

  app.post('/api/rotina/analisar', async (req, res) => {
    const body = (req.body || {}) as {
      medicamentos?: Array<{
        nome?: string;
        dose?: string;
        horario?: string;
        periodo?: string;
      }>;
    };

    const listaEntrada = Array.isArray(body.medicamentos)
      ? body.medicamentos
          .map((m) => ({
            nome: String(m?.nome || '').trim(),
            dose: String(m?.dose || '').trim(),
            horario: String(m?.horario || '').trim(),
            periodo: String(m?.periodo || '').trim(),
          }))
          .filter((m) => m.nome.length > 0)
      : [];

    const rotinaParaAnalisar =
      listaEntrada.length > 0
        ? listaEntrada
        : estado.agenda.map((d) => ({
            nome: d.nome,
            dose: d.dose,
            horario: d.horario,
            periodo: d.periodo,
          }));

    if (rotinaParaAnalisar.length === 0) {
      res.status(400).json({
        error: 'Adicione pelo menos um medicamento para analisar a rotina.',
      });
      return;
    }

    try {
      const ai = criarClienteGemini();

      const instrucaoSistema = [
        'Você é o assistente farmacológico educativo do aplicativo Dose Certa, voltado para pessoas idosas (60+) e familiares cuidadores no Brasil.',
        'Sua função é analisar a rotina completa de medicamentos informada pelo usuário, relacionar os medicamentos entre si (interações medicamentosas, sobreposição de efeitos colaterais e conflitos de horário/refeição) e alertar sobre possíveis efeitos colaterais prejudiciais.',
        'REGRAS DE SEGURANÇA OBRIGATÓRIAS:',
        '1. Nunca receite novos medicamentos, nunca mande o paciente suspender ou alterar a dose por conta própria e nunca faça diagnósticos médicos.',
        '2. Use português do Brasil claro, acolhedor, respeitoso e fácil de entender por pessoas idosas.',
        '3. Analise especificamente as combinações entre os remédios listados (ex.: risco de queda de pressão/tontura combinada, hipoglicemia, sangramento gastrointestinal, sobrecarga renal/hepática, miopatia, irritação gástrica ou horários inadequados).',
        '4. Classifique "nivelGeral" e cada item de "nivelRisco" estritamente como "baixo", "atencao" ou "alto".',
        '5. Se houver apenas 1 medicamento, avalie seus principais efeitos colaterais de atenção e cuidados de horário. Se houver 2 ou mais, relacione os pares/grupos que merecem atenção ou confirmação de compatibilidade.',
        '6. Sempre inclua em "avisoMedico" a recomendação clara de não interromper nenhum tratamento sem falar com o médico ou farmacêutico.',
      ].join('\n');

      const descricaoRotina = rotinaParaAnalisar
        .map((m, idx) => {
          const detalhes = [m.dose, m.horario, m.periodo]
            .filter(Boolean)
            .join(' · ');
          return `${idx + 1}. ${m.nome}${detalhes ? ` (${detalhes})` : ''}`;
        })
        .join('\n');

      const promptUsuario = [
        'Analise a rotina completa de medicamentos abaixo e relacione possíveis interações e efeitos colaterais prejudiciais:',
        '',
        descricaoRotina,
        '',
        'Retorne um JSON estruturado com:',
        '- nivelGeral: "baixo" | "atencao" | "alto"',
        '- resumoGeral: resumo claro em 1 a 2 frases sobre a segurança geral dessa combinação',
        '- interacoes: lista de relações/efeitos entre os medicamentos (inclua tanto alertas importantes quanto pontos de atenção ou confirmação de compatibilidade entre os principais pares)',
        '- cuidadosHorarios: lista com 2 a 4 orientações práticas sobre horários, alimentação ou sinais de alerta para observar',
        '- avisoMedico: orientação final de segurança para conversar com o médico ou farmacêutico',
      ].join('\n');

      const response = await chamarComRetentativa(() =>
        ai.models.generateContent({
          model: MODELO_GEMINI,
          contents: [{ role: 'user', parts: [{ text: promptUsuario }] }],
          config: {
            systemInstruction: instrucaoSistema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                nivelGeral: { type: Type.STRING },
                resumoGeral: { type: Type.STRING },
                interacoes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      medicamentosEnvolvidos: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      nivelRisco: { type: Type.STRING },
                      tituloAlerta: { type: Type.STRING },
                      efeitoColateralPrejudicial: { type: Type.STRING },
                      orientacaoPratica: { type: Type.STRING },
                    },
                    required: [
                      'medicamentosEnvolvidos',
                      'nivelRisco',
                      'tituloAlerta',
                      'efeitoColateralPrejudicial',
                      'orientacaoPratica',
                    ],
                  },
                },
                cuidadosHorarios: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                avisoMedico: { type: Type.STRING },
              },
              required: [
                'nivelGeral',
                'resumoGeral',
                'interacoes',
                'cuidadosHorarios',
                'avisoMedico',
              ],
            },
          },
        })
      );

      const textoBruto = response.text?.trim();
      if (!textoBruto) {
        throw new Error('A IA não retornou uma análise para a rotina informada.');
      }

      const normalizarNivel = (
        valor?: string
      ): 'baixo' | 'atencao' | 'alto' => {
        const v = String(valor || '').toLowerCase().trim();
        if (v === 'alto') return 'alto';
        if (v === 'atencao' || v === 'atenção' || v === 'moderado') {
          return 'atencao';
        }
        return 'baixo';
      };

      const parsed = JSON.parse(textoBruto) as {
        nivelGeral?: string;
        resumoGeral?: string;
        interacoes?: Array<{
          medicamentosEnvolvidos?: string[];
          nivelRisco?: string;
          tituloAlerta?: string;
          efeitoColateralPrejudicial?: string;
          orientacaoPratica?: string;
        }>;
        cuidadosHorarios?: string[];
        avisoMedico?: string;
      };

      const analise = {
        id: `rotina-${Date.now()}`,
        analisadoEm: horaAtualBR(),
        medicamentosAnalisados: rotinaParaAnalisar.map((m) => m.nome),
        nivelGeral: normalizarNivel(parsed.nivelGeral),
        resumoGeral: String(parsed.resumoGeral || '').trim(),
        interacoes: Array.isArray(parsed.interacoes)
          ? parsed.interacoes.map((item) => ({
              medicamentosEnvolvidos: Array.isArray(item.medicamentosEnvolvidos)
                ? item.medicamentosEnvolvidos.map((n) => String(n).trim()).filter(Boolean)
                : [],
              nivelRisco: normalizarNivel(item.nivelRisco),
              tituloAlerta: String(item.tituloAlerta || '').trim(),
              efeitoColateralPrejudicial: String(
                item.efeitoColateralPrejudicial || ''
              ).trim(),
              orientacaoPratica: String(item.orientacaoPratica || '').trim(),
            }))
          : [],
        cuidadosHorarios: Array.isArray(parsed.cuidadosHorarios)
          ? parsed.cuidadosHorarios.map((c) => String(c).trim()).filter(Boolean)
          : [],
        avisoMedico:
          String(parsed.avisoMedico || '').trim() ||
          'Nunca interrompa ou altere a dose de um medicamento por conta própria. Em caso de dúvida ou sintoma, converse com seu médico ou farmacêutico.',
        origemIA: MODELO_GEMINI,
      };

      registrarEvento(
        'ANALISE_ROTINA_IA',
        `Rotina de ${rotinaParaAnalisar.length} medicamentos analisada por IA (${MODELO_GEMINI})`,
        0
      );

      res.json(analise);
    } catch (err) {
      const mensagem = formatarErroGemini(
        err,
        'Não foi possível analisar as interações da rotina com a IA agora. Tente novamente.'
      );
      console.error('[Dose Certa API] Erro em /api/rotina/analisar:', err);
      res.status(502).json({ error: mensagem });
    }
  });

  app.get('/api/gamificacao', (req, res) => {
    const param = req.query.cuidadorAtivo;
    const cuidadorAtivo =
      param === 'false' ? false : param === 'true' ? true : estado.cuidadorAtivo;
    res.json(montarGamificacao(cuidadorAtivo));
  });

  app.post('/api/cuidador/mensagem', (req, res) => {
    const { texto, remetente, parentesco } = req.body || {};
    const textoLimpo = String(texto || '').trim();
    if (!textoLimpo) {
      res.status(400).json({ error: 'Escreva um recado antes de enviar.' });
      return;
    }
    if (textoLimpo.length > 140) {
      res
        .status(400)
        .json({ error: 'O recado deve ter no máximo 140 caracteres.' });
      return;
    }

    estado.mensagemFamilia = {
      remetente: String(remetente || estado.cuidadorNome).trim(),
      parentesco: String(parentesco || estado.cuidadorParentesco).trim(),
      texto: textoLimpo,
      data: `Hoje, ${horaAtualBR()}`,
    };
    registrarEvento(
      'MENSAGEM_CUIDADOR',
      `${estado.mensagemFamilia.remetente} enviou um recado afetivo`,
      0
    );
    res.status(201).json(estado.mensagemFamilia);
  });

  app.patch('/api/privacidade/cuidador', (req, res) => {
    const { ativo, apelido } = req.body || {};
    if (typeof ativo === 'boolean') {
      estado.cuidadorAtivo = ativo;
      registrarEvento(
        'LGPD_VINCULO',
        ativo
          ? 'Idoso autorizou o acompanhamento do familiar cuidador'
          : 'Idoso pausou o acesso do familiar cuidador (LGPD)',
        0
      );
    }
    if (typeof apelido === 'string' && apelido.trim()) {
      estado.apelido = apelido.trim();
    }
    res.json({
      cuidadorAtivo: estado.cuidadorAtivo,
      apelido: estado.apelido,
    });
  });

  app.get('/api/metricas/impacto', (_req, res) => {
    res.json(montarMetricasImpacto());
  });

  app.get('/api/privacidade/dados', (req, res) => {
    const apelido = String(req.query.apelido || estado.apelido);
    const cuidadorNome = String(
      req.query.cuidadorNome ||
        `${estado.cuidadorNome} (${estado.cuidadorParentesco})`
    );
    const cuidadorAtivo =
      req.query.cuidadorAtivo === 'false' ? false : estado.cuidadorAtivo;
    const consentimentoAceitoEm = String(
      req.query.consentimentoAceitoEm || new Date().toLocaleDateString('pt-BR')
    );
    const itensNaFilaOffline = Number(req.query.itensNaFilaOffline || 0);

    res.json({
      apelido,
      cuidadorNome,
      cuidadorAtivo,
      consentimentoAceitoEm,
      totalDosesHoje: estado.agenda.length,
      dosesTomadasHoje: estado.agenda.filter((d) => d.status === 'tomada')
        .length,
      pontosJardim: estado.pontos,
      sequenciaDias: estado.sequenciaDias,
      documentosLidos: estado.documentosLidos,
      itensNaFilaOffline,
    });
  });

  app.delete('/api/privacidade/dados', (_req, res) => {
    estado = criarEstadoInicial();
    res.json({ ok: true });
  });

  // Vite middleware (desenvolvimento) ou arquivos estaticos (producao)
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dose Certa] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

iniciarServidor();
