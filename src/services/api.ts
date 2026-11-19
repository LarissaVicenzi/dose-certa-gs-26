/**
 * Modulo isolado de acesso a dados do Dose Certa.
 * Implementa as regras completas de gamificacao (Parte A e Parte B):
 * - Estagios: Semente (0), Broto (30), Planta (80), Flor (160), Jardim Florido (300+)
 * - Pontos: no horario (+10), atrasada (+6, nunca zero), bula (+8, max 2/dia), dia completo (+15)
 * - 8 conquistas oficiais (tipo_conquista) e recompensa afetiva (mensagem <= 140 caracteres)
 */
import {
  AnaliseRotinaMedicamentos,
  Conquista,
  DadosUsuario,
  DiaSemanaStatus,
  DocumentoLido,
  Dose,
  EstagioJardim,
  Gamificacao,
  MedicamentoRotinaInput,
  MensagemCuidador,
  MetricasImpacto,
  NovaDosePayload,
} from '../types/modelos';

export const BASE_URL = '/api';
export const USE_MOCK = false;

async function lerErroServidor(
  resposta: Response,
  padrao: string
): Promise<string> {
  try {
    const corpo = await resposta.json();
    if (corpo && typeof corpo.error === 'string' && corpo.error.trim()) {
      return corpo.error;
    }
  } catch {
    // fallback para mensagem padrao
  }
  return padrao;
}

export const PONTOS_ACAO = {
  DOSE_NO_HORARIO: 10,
  DOSE_ATRASADA: 6,
  DOCUMENTO_LIDO: 8,
  DIA_COMPLETO: 15,
  SEMANA_COMPLETA: 40,
  LIMITE_DOCS_DIA: 2,
};

function criarAgendaInicial(): Dose[] {
  return [
    {
      id: 'dose-1',
      horario: '08:00',
      periodo: 'Manhã',
      nome: 'Losartana 50 mg',
      dose: '1 comprimido',
      instrucao: 'Depois do café da manhã',
      status: 'tomada',
      horarioTomado: '08:05',
    },
    {
      id: 'dose-2',
      horario: '09:30',
      periodo: 'Manhã',
      nome: 'Vitamina D 1000 UI',
      dose: '1 cápsula',
      instrucao: 'Com um copo de água',
      status: 'atrasada',
    },
    {
      id: 'dose-3',
      horario: '12:30',
      periodo: 'Tarde',
      nome: 'Metformina 850 mg',
      dose: '1 comprimido',
      instrucao: 'Junto com o almoço',
      status: 'pendente',
    },
    {
      id: 'dose-4',
      horario: '17:00',
      periodo: 'Tarde',
      nome: 'AAS 100 mg',
      dose: '1 comprimido',
      instrucao: 'Após o lanche da tarde',
      status: 'pendente',
    },
    {
      id: 'dose-5',
      horario: '21:00',
      periodo: 'Noite',
      nome: 'Sinvastatina 20 mg',
      dose: '1 comprimido',
      instrucao: 'Antes de dormir',
      status: 'pendente',
    },
  ];
}

interface EstadoMockServidor {
  agenda: Dose[];
  pontos: number;
  sequenciaDias: number;
  diasTotaisCuidado: number;
  dosesNoHorarioTotal: number;
  documentosLidos: number;
  documentosLidosHoje: number;
  bonusDiaCompletoConcedido: boolean;
  voltouDePausa: boolean;
  datasConquista: Record<string, string>;
  mensagemFamilia: MensagemCuidador;
}

function criarEstadoInicial(): EstadoMockServidor {
  return {
    agenda: criarAgendaInicial(),
    pontos: 120,
    sequenciaDias: 5,
    diasTotaisCuidado: 14,
    dosesNoHorarioTotal: 9,
    documentosLidos: 4,
    documentosLidosHoje: 0,
    bonusDiaCompletoConcedido: false,
    voltouDePausa: true,
    datasConquista: {
      PRIMEIRO_PASSO: '04/11/2026',
      RECOMECAR: '12/11/2026',
    },
    mensagemFamilia: {
      remetente: 'Ana',
      parentesco: 'Filha',
      texto:
        'Oi! Fico muito feliz vendo seu jardim crescendo. Qualquer dúvida me ligue. Um beijo grande!',
      data: 'Hoje, 08:20',
    },
  };
}

let estadoMock: EstadoMockServidor = criarEstadoInicial();
let ultimoGanhoMensagem: string | null = null;

function atrasoMock(ms = 160): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function horarioAtualFormatado(): string {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function dataHojeCurta(): string {
  return new Date().toLocaleDateString('pt-BR');
}

function calcularEstagioJardim(pontos: number): {
  estagio: EstagioJardim;
  nomeEstagio: string;
  emojiEstagio: string;
  proximoEstagioNome: string | null;
  verboProximoEstagio: string;
  pontosProximoEstagio: number | null;
  pontosEstagioAtualMin: number;
} {
  if (pontos >= 300) {
    return {
      estagio: 'jardim_florido',
      nomeEstagio: 'Jardim Florido',
      emojiEstagio: '🌳🌸',
      proximoEstagioNome: null,
      verboProximoEstagio: 'Seu jardim está florido e cheio de vida',
      pontosProximoEstagio: null,
      pontosEstagioAtualMin: 300,
    };
  }
  if (pontos >= 160) {
    return {
      estagio: 'flor',
      nomeEstagio: 'Flor',
      emojiEstagio: '🌸',
      proximoEstagioNome: 'Jardim Florido',
      verboProximoEstagio: 'para virar Jardim Florido',
      pontosProximoEstagio: 300,
      pontosEstagioAtualMin: 160,
    };
  }
  if (pontos >= 80) {
    return {
      estagio: 'planta',
      nomeEstagio: 'Planta',
      emojiEstagio: '🪴',
      proximoEstagioNome: 'Flor',
      verboProximoEstagio: 'para florescer',
      pontosProximoEstagio: 160,
      pontosEstagioAtualMin: 80,
    };
  }
  if (pontos >= 30) {
    return {
      estagio: 'broto',
      nomeEstagio: 'Broto',
      emojiEstagio: '🌿',
      proximoEstagioNome: 'Planta',
      verboProximoEstagio: 'para virar Planta',
      pontosProximoEstagio: 80,
      pontosEstagioAtualMin: 30,
    };
  }
  return {
    estagio: 'semente',
    nomeEstagio: 'Semente',
    emojiEstagio: '🌱',
    proximoEstagioNome: 'Broto',
    verboProximoEstagio: 'para brotar',
    pontosProximoEstagio: 30,
    pontosEstagioAtualMin: 0,
  };
}

function montarDiasSemana(): DiaSemanaStatus[] {
  const todasTomadasHoje = estadoMock.agenda.every(
    (d) => d.status === 'tomada'
  );
  return [
    { sigla: 'D', nomeDia: 'Domingo', cumprido: true, hoje: false },
    { sigla: 'S', nomeDia: 'Segunda', cumprido: true, hoje: false },
    { sigla: 'T', nomeDia: 'Terça', cumprido: true, hoje: false },
    { sigla: 'Q', nomeDia: 'Quarta', cumprido: true, hoje: false },
    { sigla: 'Q', nomeDia: 'Quinta', cumprido: true, hoje: false },
    {
      sigla: 'S',
      nomeDia: 'Sexta (hoje)',
      cumprido: todasTomadasHoje,
      hoje: true,
    },
    { sigla: 'S', nomeDia: 'Sábado', cumprido: false, hoje: false },
  ];
}

function avaliarEConcederConquistas(): Conquista[] {
  const hoje = dataHojeCurta();
  const manhaCompleta = estadoMock.agenda
    .filter((d) => d.periodo === 'Manhã')
    .every((d) => d.status === 'tomada');

  const catalogo: Array<{
    id: string;
    codigo: string;
    titulo: string;
    dica: string;
    pontos: number;
    emoji: string;
    atingida: boolean;
  }> = [
    {
      id: 'primeiro-passo',
      codigo: 'PRIMEIRO_PASSO',
      titulo: 'Primeiro Passo',
      dica: 'Confirme seu primeiro remédio no aplicativo.',
      pontos: 10,
      emoji: '👣',
      atingida: estadoMock.agenda.some((d) => d.status === 'tomada'),
    },
    {
      id: 'manha-em-dia',
      codigo: 'MANHA_EM_DIA',
      titulo: 'Manhã em Dia',
      dica: 'Tome todos os remédios da manhã.',
      pontos: 20,
      emoji: '🌅',
      atingida: manhaCompleta,
    },
    {
      id: 'curiosa',
      codigo: 'CURIOSA',
      titulo: 'Curiosa',
      dica: 'Leia 5 bulas ou receitas na aba Ler.',
      pontos: 25,
      emoji: '📖',
      atingida: estadoMock.documentosLidos >= 5,
    },
    {
      id: 'semana-firme',
      codigo: 'SEMANA_FIRME',
      titulo: 'Semana Firme',
      dica: 'Complete 7 dias seguidos de cuidado.',
      pontos: 40,
      emoji: '🌟',
      atingida: estadoMock.sequenciaDias >= 7,
    },
    {
      id: 'recomecar',
      codigo: 'RECOMECAR',
      titulo: 'Recomeço',
      dica: 'Volte a confirmar suas doses depois de uma pausa.',
      pontos: 15,
      emoji: '🌱',
      atingida: estadoMock.voltouDePausa,
    },
    {
      id: 'rotina-tranquila',
      codigo: 'ROTINA_TRANQUILA',
      titulo: 'Rotina Tranquila',
      dica: 'Confirme 10 doses dentro do horário combinado.',
      pontos: 25,
      emoji: '🕒',
      atingida: estadoMock.dosesNoHorarioTotal >= 10,
    },
    {
      id: 'mes-de-cuidado',
      codigo: 'MES_DE_CUIDADO',
      titulo: 'Mês de Cuidado',
      dica: 'Acumule 30 dias de cuidado no seu histórico.',
      pontos: 60,
      emoji: '🗓️',
      atingida: estadoMock.diasTotaisCuidado >= 30,
    },
    {
      id: 'jardim-em-flor',
      codigo: 'JARDIM_EM_FLOR',
      titulo: 'Jardim em Flor',
      dica: 'Alcance 160 pontos para ver seu jardim florescer.',
      pontos: 30,
      emoji: '🌸',
      atingida: estadoMock.pontos >= 160,
    },
  ];

  return catalogo.map((item) => {
    const jaTinha = Boolean(estadoMock.datasConquista[item.codigo]);
    if (item.atingida && !jaTinha) {
      estadoMock.datasConquista[item.codigo] = hoje;
      estadoMock.pontos += item.pontos;
    }
    const desbloqueada = Boolean(estadoMock.datasConquista[item.codigo]);
    return {
      id: item.id,
      codigo: item.codigo,
      titulo: item.titulo,
      dica: item.dica,
      pontos: item.pontos,
      emoji: item.emoji,
      desbloqueada,
      dataConquista: estadoMock.datasConquista[item.codigo],
    };
  });
}

const BULAS_MOCK: Record<
  string,
  Omit<DocumentoLido, 'id' | 'fotoUri' | 'lidoEm'>
> = {
  losartana: {
    nomeRemedio: 'Losartana 50 mg',
    resumoSimples:
      'Esse remédio é para controlar a pressão. Tome 1 comprimido de manhã, depois do café.',
    paraQueServe: 'Ajuda a manter a pressão do sangue calma e controlada.',
    comoTomar: 'Tome 1 comprimido com água, de manhã, depois do café.',
    cuidados:
      'Guarde longe do calor e da umidade. Nunca pare de tomar sem conversar com seu médico.',
  },
  metformina: {
    nomeRemedio: 'Metformina 850 mg',
    resumoSimples:
      'Esse remédio ajuda a controlar o açúcar no sangue. Tome 1 comprimido junto com o almoço.',
    paraQueServe: 'Ajuda a manter a glicose (açúcar no sangue) equilibrada.',
    comoTomar: 'Tome 1 comprimido durante ou logo depois do almoço, com água.',
    cuidados:
      'Tomar junto da comida protege o estômago. Guarde em local seco e fresco.',
  },
  sinvastatina: {
    nomeRemedio: 'Sinvastatina 20 mg',
    resumoSimples:
      'Esse remédio ajuda a cuidar do colesterol. Tome 1 comprimido à noite, antes de dormir.',
    paraQueServe: 'Ajuda a reduzir o excesso de gordura (colesterol) no sangue.',
    comoTomar: 'Tome 1 comprimido inteiro com água, à noite, antes de dormir.',
    cuidados:
      'Mantenha na caixa original. Se sentir dores musculares diferentes, avise seu médico.',
  },
};

export async function getAgenda(): Promise<Dose[]> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/agenda`);
    if (!resposta.ok) throw new Error('Erro ao carregar agenda');
    return resposta.json();
  }

  await atrasoMock();
  return estadoMock.agenda.map((item) => ({ ...item }));
}

export async function confirmarDose(
  doseId: string,
  horarioConfirmacao?: string
): Promise<Dose> {
  const horario = horarioConfirmacao || horarioAtualFormatado();

  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/doses/${doseId}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horarioConfirmacao: horario }),
    });
    if (!resposta.ok) throw new Error('Erro ao confirmar dose');
    return resposta.json();
  }

  await atrasoMock();
  let doseAtualizada: Dose | null = null;

  estadoMock.agenda = estadoMock.agenda.map((item) => {
    if (item.id === doseId) {
      if (item.status !== 'tomada') {
        const atrasada = item.status === 'atrasada';
        const pontosGanhos = atrasada
          ? PONTOS_ACAO.DOSE_ATRASADA
          : PONTOS_ACAO.DOSE_NO_HORARIO;
        estadoMock.pontos += pontosGanhos;
        if (!atrasada) {
          estadoMock.dosesNoHorarioTotal += 1;
        }
        ultimoGanhoMensagem = atrasada
          ? `+${pontosGanhos} pontos · Ainda deu tempo!`
          : `+${pontosGanhos} pontos · Dose no horário`;
      }
      doseAtualizada = {
        ...item,
        status: 'tomada',
        horarioTomado: horario,
        pendenteSincronizacao: false,
      };
      return doseAtualizada;
    }
    return item;
  });

  if (!doseAtualizada) {
    throw new Error('Medicamento não encontrado.');
  }

  const diaCompleto = estadoMock.agenda.every((d) => d.status === 'tomada');
  if (diaCompleto && !estadoMock.bonusDiaCompletoConcedido) {
    estadoMock.bonusDiaCompletoConcedido = true;
    estadoMock.pontos += PONTOS_ACAO.DIA_COMPLETO;
    estadoMock.sequenciaDias += 1;
    estadoMock.diasTotaisCuidado += 1;
    ultimoGanhoMensagem = `+${PONTOS_ACAO.DIA_COMPLETO} pontos de bônus · Dia completo!`;
  }

  avaliarEConcederConquistas();
  return doseAtualizada;
}

export async function lerDocumento(
  fotoUri: string,
  codigoDocumento = 'losartana',
  extras?: { fotoBase64?: string; mimeType?: string }
): Promise<DocumentoLido> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/documentos/ler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fotoUri,
        codigoDocumento,
        fotoBase64: extras?.fotoBase64,
        mimeType: extras?.mimeType,
      }),
    });
    if (!resposta.ok) {
      throw new Error(
        await lerErroServidor(
          resposta,
          'Não foi possível ler a bula com a IA agora. Tente novamente.'
        )
      );
    }
    return resposta.json();
  }

  await atrasoMock(260);
  const base = BULAS_MOCK[codigoDocumento] || BULAS_MOCK.losartana;

  estadoMock.documentosLidos += 1;
  if (estadoMock.documentosLidosHoje < PONTOS_ACAO.LIMITE_DOCS_DIA) {
    estadoMock.documentosLidosHoje += 1;
    estadoMock.pontos += PONTOS_ACAO.DOCUMENTO_LIDO;
    ultimoGanhoMensagem = `+${PONTOS_ACAO.DOCUMENTO_LIDO} pontos · Bula compreendida`;
  }

  avaliarEConcederConquistas();

  return {
    id: `doc-${Date.now()}`,
    fotoUri,
    lidoEm: horarioAtualFormatado(),
    ...base,
  };
}

export async function perguntarSobreDocumento(
  documento: DocumentoLido,
  pergunta: string
): Promise<string> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/documentos/perguntar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento, pergunta }),
    });
    if (!resposta.ok) {
      throw new Error(
        await lerErroServidor(
          resposta,
          'Não foi possível responder sua dúvida agora.'
        )
      );
    }
    const dados = (await resposta.json()) as { resposta: string };
    return dados.resposta;
  }

  await atrasoMock(180);
  const texto = pergunta.toLowerCase().trim();

  const termosForaDoDocumento = [
    'posso tomar 2',
    'dobrar',
    'aumentar',
    'diminuir',
    'parar',
    'trocar',
    'substituir',
    'dor',
    'febre',
    'tontura',
    'sintoma',
    'doença',
    'diagnost',
    'receit',
    'prescrev',
    'outro remédio',
    'misturar',
    'álcool',
    'esqueci',
  ];

  if (termosForaDoDocumento.some((termo) => texto.includes(termo))) {
    return 'Pergunte ao seu médico ou farmacêutico.';
  }

  if (
    texto.includes('para que') ||
    texto.includes('serve') ||
    texto.includes('pressão') ||
    texto.includes('açúcar') ||
    texto.includes('colesterol')
  ) {
    return `Na bula de ${documento.nomeRemedio}: ${documento.paraQueServe}`;
  }

  if (
    texto.includes('como') ||
    texto.includes('horário') ||
    texto.includes('hora') ||
    texto.includes('café') ||
    texto.includes('almoço') ||
    texto.includes('dormir') ||
    texto.includes('tomar')
  ) {
    return `Na bula de ${documento.nomeRemedio}: ${documento.comoTomar}`;
  }

  if (
    texto.includes('guardar') ||
    texto.includes('cuidado') ||
    texto.includes('atenção')
  ) {
    return `Na bula de ${documento.nomeRemedio}: ${documento.cuidados}`;
  }

  return 'Pergunte ao seu médico ou farmacêutico.';
}

export async function analisarRotinaMedicamentos(
  medicamentos?: MedicamentoRotinaInput[]
): Promise<AnaliseRotinaMedicamentos> {
  const resposta = await fetch(`${BASE_URL}/rotina/analisar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ medicamentos }),
  });

  if (!resposta.ok) {
    throw new Error(
      await lerErroServidor(
        resposta,
        'Não foi possível analisar a rotina de medicamentos com a IA agora. Tente novamente.'
      )
    );
  }

  return resposta.json();
}

export async function getGamificacao(
  cuidadorAtivo = true
): Promise<Gamificacao> {
  if (!USE_MOCK) {
    const resposta = await fetch(
      `${BASE_URL}/gamificacao?cuidadorAtivo=${cuidadorAtivo ? 'true' : 'false'}`
    );
    if (!resposta.ok) throw new Error('Erro ao carregar jardim');
    return resposta.json();
  }

  await atrasoMock();
  const conquistas = avaliarEConcederConquistas();
  const estagioInfo = calcularEstagioJardim(estadoMock.pontos);

  return {
    pontos: estadoMock.pontos,
    ...estagioInfo,
    sequenciaDias: estadoMock.sequenciaDias,
    diasSemana: montarDiasSemana(),
    conquistas,
    mensagemFamilia: cuidadorAtivo ? estadoMock.mensagemFamilia : null,
    cuidadorPresente: cuidadorAtivo,
    relatorioSemanalLiberado: cuidadorAtivo,
    ultimoGanhoMensagem,
  };
}

export async function verDados(contextoLocal?: {
  apelido: string;
  cuidadorNome: string;
  cuidadorAtivo: boolean;
  consentimentoAceitoEm: string;
  itensNaFilaOffline: number;
}): Promise<DadosUsuario> {
  if (!USE_MOCK) {
    const params = new URLSearchParams();
    if (contextoLocal?.apelido) params.set('apelido', contextoLocal.apelido);
    if (contextoLocal?.cuidadorNome)
      params.set('cuidadorNome', contextoLocal.cuidadorNome);
    if (typeof contextoLocal?.cuidadorAtivo === 'boolean') {
      params.set('cuidadorAtivo', String(contextoLocal.cuidadorAtivo));
    }
    if (contextoLocal?.consentimentoAceitoEm) {
      params.set('consentimentoAceitoEm', contextoLocal.consentimentoAceitoEm);
    }
    if (typeof contextoLocal?.itensNaFilaOffline === 'number') {
      params.set(
        'itensNaFilaOffline',
        String(contextoLocal.itensNaFilaOffline)
      );
    }
    const resposta = await fetch(
      `${BASE_URL}/privacidade/dados?${params.toString()}`
    );
    if (!resposta.ok) throw new Error('Erro ao buscar seus dados');
    return resposta.json();
  }

  await atrasoMock();
  return {
    apelido: contextoLocal?.apelido || 'Não informado',
    cuidadorNome: contextoLocal?.cuidadorNome || 'Ana (Filha)',
    cuidadorAtivo: contextoLocal?.cuidadorAtivo ?? true,
    consentimentoAceitoEm:
      contextoLocal?.consentimentoAceitoEm || dataHojeCurta(),
    totalDosesHoje: estadoMock.agenda.length,
    dosesTomadasHoje: estadoMock.agenda.filter((d) => d.status === 'tomada')
      .length,
    pontosJardim: estadoMock.pontos,
    sequenciaDias: estadoMock.sequenciaDias,
    documentosLidos: estadoMock.documentosLidos,
    itensNaFilaOffline: contextoLocal?.itensNaFilaOffline || 0,
  };
}

export async function apagarDados(): Promise<{ ok: boolean }> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/privacidade/dados`, {
      method: 'DELETE',
    });
    if (!resposta.ok) throw new Error('Erro ao apagar dados');
    return resposta.json();
  }

  await atrasoMock(220);
  estadoMock = {
    ...criarEstadoInicial(),
    pontos: 0,
    sequenciaDias: 0,
    diasTotaisCuidado: 0,
    dosesNoHorarioTotal: 0,
    documentosLidos: 0,
    voltouDePausa: false,
    datasConquista: {},
  };
  ultimoGanhoMensagem = null;

  return { ok: true };
}

export async function adicionarDose(payload: NovaDosePayload): Promise<Dose> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/doses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resposta.ok) {
      throw new Error(
        await lerErroServidor(resposta, 'Erro ao adicionar medicamento.')
      );
    }
    return resposta.json();
  }

  await atrasoMock(150);
  const nova: Dose = {
    id: `dose-${Date.now()}`,
    ...payload,
    status: 'pendente',
  };
  estadoMock.agenda.push(nova);
  return nova;
}

export async function enviarMensagemCuidador(
  texto: string,
  remetente = 'Ana',
  parentesco = 'Filha'
): Promise<MensagemCuidador> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/cuidador/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, remetente, parentesco }),
    });
    if (!resposta.ok) {
      throw new Error(
        await lerErroServidor(resposta, 'Erro ao enviar recado.')
      );
    }
    return resposta.json();
  }

  await atrasoMock(150);
  estadoMock.mensagemFamilia = {
    remetente,
    parentesco,
    texto,
    data: `Hoje, ${horarioAtualFormatado()}`,
  };
  return estadoMock.mensagemFamilia;
}

export async function atualizarAcessoCuidador(payload: {
  ativo?: boolean;
  apelido?: string;
}): Promise<{ cuidadorAtivo: boolean; apelido: string }> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/privacidade/cuidador`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resposta.ok) {
      throw new Error('Erro ao atualizar vínculo familiar.');
    }
    return resposta.json();
  }

  return {
    cuidadorAtivo: payload.ativo ?? true,
    apelido: payload.apelido || 'Dona Maria',
  };
}

export async function getMetricasImpacto(): Promise<MetricasImpacto> {
  if (!USE_MOCK) {
    const resposta = await fetch(`${BASE_URL}/metricas/impacto`);
    if (!resposta.ok) throw new Error('Erro ao carregar métricas de impacto.');
    return resposta.json();
  }

  const totalDosesHoje = estadoMock.agenda.length;
  const dosesTomadasHoje = estadoMock.agenda.filter(
    (d) => d.status === 'tomada'
  ).length;
  return {
    apelidoIdoso: 'Dona Maria',
    cuidadorAtivo: true,
    cuidadorNome: 'Ana (Filha)',
    diasVinculoCuidador: 12,
    totalDosesHoje,
    dosesTomadasHoje,
    dosesPendentesHoje: estadoMock.agenda.filter((d) => d.status === 'pendente')
      .length,
    dosesAtrasadasHoje: estadoMock.agenda.filter((d) => d.status === 'atrasada')
      .length,
    taxaAdesaoHoje:
      totalDosesHoje > 0
        ? Math.round((dosesTomadasHoje / totalDosesHoje) * 100)
        : 0,
    documentosLidosComIA: estadoMock.documentosLidos,
    pontosJardim: estadoMock.pontos,
    estagioJardim: '🪴 Planta',
    sequenciaDias: estadoMock.sequenciaDias,
    conquistasDesbloqueadas: Object.keys(estadoMock.datasConquista).length,
    totalConquistas: 8,
    eventosRecentes: [],
  };
}
