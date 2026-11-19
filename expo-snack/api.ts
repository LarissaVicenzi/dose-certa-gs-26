/**
 * Modulo isolado de API do Dose Certa (Fase 2 - React Native / Expo Snack).
 * Altere USE_MOCK = false e aponte BASE_URL para o endereco do seu servidor FastAPI/Express
 * para conectar o celular ao vivo ao Portal Web do Cuidador e a IA Gemini.
 */

export const BASE_URL = 'https://SUA-API-DOSE-CERTA.onrender.com/v1';
export const USE_MOCK = true;

export type PeriodoDia = 'Manhã' | 'Tarde' | 'Noite';
export type StatusDose = 'tomada' | 'pendente' | 'atrasada';

export interface Dose {
  id: string;
  horario: string;
  periodo: PeriodoDia;
  nome: string;
  dose: string;
  instrucao: string;
  status: StatusDose;
  horarioTomado?: string;
  pendenteSincronizacao?: boolean;
}

export interface DocumentoLido {
  id: string;
  nomeRemedio: string;
  fotoUri: string;
  resumoSimples: string;
  paraQueServe: string;
  comoTomar: string;
  cuidados: string;
  lidoEm: string;
}

export interface Conquista {
  id: string;
  codigo: string;
  titulo: string;
  dica: string;
  pontos: number;
  emoji: string;
  desbloqueada: boolean;
  dataConquista?: string;
}

export interface Gamificacao {
  pontos: number;
  nomeEstagio: string;
  emojiEstagio: string;
  proximoEstagioNome: string | null;
  pontosProximoEstagio: number | null;
  pontosEstagioAtualMin: number;
  sequenciaDias: number;
  diasSemana: Array<{ sigla: string; cumprido: boolean; hoje: boolean }>;
  conquistas: Conquista[];
  mensagemFamilia: {
    remetente: string;
    parentesco: string;
    texto: string;
    data: string;
  } | null;
  ultimoGanhoMensagem: string | null;
}

const ESTAGIOS = [
  { nome: 'Semente', emoji: '🌱', min: 0, prox: 'Broto', proxMin: 30 },
  { nome: 'Broto', emoji: '🌿', min: 30, prox: 'Planta', proxMin: 80 },
  { nome: 'Planta', emoji: '🪴', min: 80, prox: 'Flor', proxMin: 160 },
  { nome: 'Flor', emoji: '🌸', min: 160, prox: 'Jardim Florido', proxMin: 300 },
  { nome: 'Jardim Florido', emoji: '🌳🌸', min: 300, prox: null, proxMin: null },
];

const BULAS_MOCK: Record<string, Omit<DocumentoLido, 'id' | 'fotoUri' | 'lidoEm'>> = {
  losartana: {
    nomeRemedio: 'Losartana Potássica 50 mg',
    resumoSimples: 'Ajuda a manter a sua pressão controlada com calma.',
    paraQueServe:
      'Controla a pressão alta e protege o coração e os rins no dia a dia.',
    comoTomar:
      'Tomar 1 comprimido ao dia com um copo de água, de preferência no mesmo horário.',
    cuidados:
      'Levante-se devagar da cama ou da cadeira para evitar tontura. Não pare sem falar com o médico.',
  },
  metformina: {
    nomeRemedio: 'Metformina 850 mg',
    resumoSimples: 'Ajuda a equilibrar o açúcar (glicose) no sangue.',
    paraQueServe:
      'Auxilia no controle da glicose em pessoas com diabetes tipo 2.',
    comoTomar:
      'Tomar durante ou logo após o almoço ou jantar, com água, para proteger o estômago.',
    cuidados:
      'Beba água ao longo do dia e evite excesso de bebidas alcoólicas.',
  },
  sinvastatina: {
    nomeRemedio: 'Sinvastatina 20 mg',
    resumoSimples: 'Cuida do seu colesterol enquanto você dorme.',
    paraQueServe:
      'Ajuda a reduzir o colesterol alto e protege os vasos sanguíneos e o coração.',
    comoTomar: 'Tomar 1 comprimido à noite, com água, antes de dormir.',
    cuidados:
      'Avise o médico se sentir dor muscular forte e fora do comum.',
  },
};

const CATALOGO_CONQUISTAS = [
  { id: 'c1', codigo: 'PRIMEIRO_PASSO', titulo: 'Primeiro Passo', dica: 'Você confirmou sua primeira dose.', pontos: 10, emoji: '🌱' },
  { id: 'c2', codigo: 'MANHA_EM_DIA', titulo: 'Manhã em Dia', dica: '5 manhãs seguidas em dia.', pontos: 20, emoji: '🌅' },
  { id: 'c3', codigo: 'SEMANA_FIRME', titulo: 'Semana Firme', dica: '7 dias seguidos de cuidado.', pontos: 40, emoji: '🗓️' },
  { id: 'c4', codigo: 'CURIOSA', titulo: 'Curiosa', dica: 'Leu 5 bulas ou receitas.', pontos: 25, emoji: '📖' },
  { id: 'c5', codigo: 'SEM_PRESSA', titulo: 'Sem Pressa', dica: 'Tomou uma dose atrasada sem desistir.', pontos: 15, emoji: '🌤️' },
  { id: 'c6', codigo: 'RECOMECAR', titulo: 'Recomeço', dica: 'Voltou depois de um dia de descanso.', pontos: 15, emoji: '🌿' },
  { id: 'c7', codigo: 'EM_FAMILIA', titulo: 'Em Família', dica: 'Recebeu carinho de um familiar.', pontos: 15, emoji: '💛' },
  { id: 'c8', codigo: 'MES_DE_CUIDADO', titulo: 'Mês de Cuidado', dica: '30 dias cuidando bem da saúde.', pontos: 100, emoji: '🌳' },
];

let estadoMock = {
  agenda: [
    {
      id: 'dose-1',
      horario: '08:00',
      periodo: 'Manhã' as PeriodoDia,
      nome: 'Losartana 50 mg',
      dose: '1 comprimido',
      instrucao: 'Tomar com um copo de água',
      status: 'tomada' as StatusDose,
      horarioTomado: '08:05',
    },
    {
      id: 'dose-2',
      horario: '12:00',
      periodo: 'Tarde' as PeriodoDia,
      nome: 'Metformina 850 mg',
      dose: '1 comprimido',
      instrucao: 'Tomar logo após o almoço',
      status: 'atrasada' as StatusDose,
    },
    {
      id: 'dose-3',
      horario: '20:00',
      periodo: 'Noite' as PeriodoDia,
      nome: 'Sinvastatina 20 mg',
      dose: '1 comprimido',
      instrucao: 'Tomar antes de dormir',
      status: 'pendente' as StatusDose,
    },
  ],
  pontos: 92,
  sequenciaDias: 5,
  documentosLidos: 3,
  docsHoje: 0,
  diaCompletoPremiado: false,
  conquistas: {
    PRIMEIRO_PASSO: '10/11/2026',
    MANHA_EM_DIA: '14/11/2026',
    EM_FAMILIA: '12/11/2026',
  } as Record<string, string>,
  ultimoGanhoMensagem: null as string | null,
};

function horaAgora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export async function getAgenda(): Promise<Dose[]> {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/agenda`);
    if (!res.ok) throw new Error('Erro ao carregar agenda');
    return res.json();
  }
  return estadoMock.agenda.map((d) => ({ ...d }));
}

export async function confirmarDose(doseId: string, horarioConfirmacao?: string): Promise<Dose> {
  const hora = horarioConfirmacao || horaAgora();
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/doses/${doseId}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ horarioConfirmacao: hora }),
    });
    if (!res.ok) throw new Error('Erro ao confirmar dose');
    return res.json();
  }

  let atualizada: Dose | null = null;
  estadoMock.agenda = estadoMock.agenda.map((item) => {
    if (item.id === doseId) {
      if (item.status !== 'tomada') {
        const atrasada = item.status === 'atrasada';
        const pts = atrasada ? 6 : 10;
        estadoMock.pontos += pts;
        if (atrasada && !estadoMock.conquistas.SEM_PRESSA) {
          estadoMock.conquistas.SEM_PRESSA = new Date().toLocaleDateString('pt-BR');
          estadoMock.pontos += 15;
        }
        estadoMock.ultimoGanhoMensagem = atrasada
          ? `+${pts} pontos · Ainda deu tempo!`
          : `+${pts} pontos · Dose confirmada no horário!`;
      }
      atualizada = { ...item, status: 'tomada', horarioTomado: hora };
      return atualizada;
    }
    return item;
  });

  if (estadoMock.agenda.every((d) => d.status === 'tomada') && !estadoMock.diaCompletoPremiado) {
    estadoMock.diaCompletoPremiado = true;
    estadoMock.pontos += 15;
    estadoMock.sequenciaDias += 1;
    estadoMock.ultimoGanhoMensagem = '+15 pontos de bônus · Dia completo!';
  }

  if (!atualizada) throw new Error('Dose não encontrada');
  return atualizada;
}

export async function lerDocumento(
  fotoUri: string,
  codigoDocumento = 'losartana',
  extras?: { fotoBase64?: string; mimeType?: string }
): Promise<DocumentoLido> {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/documentos/ler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fotoUri,
        codigoDocumento,
        fotoBase64: extras?.fotoBase64,
        mimeType: extras?.mimeType,
      }),
    });
    if (!res.ok) throw new Error('Erro ao ler documento com a IA');
    return res.json();
  }

  const base = BULAS_MOCK[codigoDocumento] || BULAS_MOCK.losartana;
  estadoMock.documentosLidos += 1;
  if (estadoMock.docsHoje < 2) {
    estadoMock.docsHoje += 1;
    estadoMock.pontos += 8;
    estadoMock.ultimoGanhoMensagem = '+8 pontos · Que bom entender seu remédio!';
  }
  return {
    id: `doc-${Date.now()}`,
    fotoUri,
    lidoEm: horaAgora(),
    ...base,
  };
}

export async function perguntarSobreDocumento(
  documento: DocumentoLido,
  pergunta: string
): Promise<string> {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/documentos/perguntar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento, pergunta }),
    });
    if (!res.ok) throw new Error('Erro ao consultar a bula');
    const data = await res.json();
    return data.resposta;
  }

  const q = pergunta.toLowerCase();
  const bloqueadas = ['2', 'dobrar', 'aumentar', 'parar', 'sintoma', 'dor', 'misturar', 'álcool'];
  if (bloqueadas.some((b) => q.includes(b))) {
    return 'Pergunte ao seu médico ou farmacêutico.';
  }
  if (q.includes('como') || q.includes('tomar') || q.includes('horário')) {
    return `Na bula de ${documento.nomeRemedio}: ${documento.comoTomar}`;
  }
  if (q.includes('serve') || q.includes('para que')) {
    return `Na bula de ${documento.nomeRemedio}: ${documento.paraQueServe}`;
  }
  if (q.includes('cuidado') || q.includes('atenção')) {
    return `Na bula de ${documento.nomeRemedio}: ${documento.cuidados}`;
  }
  return 'Pergunte ao seu médico ou farmacêutico.';
}

export async function getGamificacao(cuidadorAtivo = true): Promise<Gamificacao> {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/gamificacao?cuidadorAtivo=${cuidadorAtivo}`);
    if (!res.ok) throw new Error('Erro ao carregar Jardim da Saúde');
    return res.json();
  }

  let est = ESTAGIOS[0];
  for (const e of ESTAGIOS) {
    if (estadoMock.pontos >= e.min) est = e;
  }

  return {
    pontos: estadoMock.pontos,
    nomeEstagio: est.nome,
    emojiEstagio: est.emoji,
    proximoEstagioNome: est.prox,
    pontosProximoEstagio: est.proxMin,
    pontosEstagioAtualMin: est.min,
    sequenciaDias: estadoMock.sequenciaDias,
    diasSemana: [
      { sigla: 'Seg', cumprido: true, hoje: false },
      { sigla: 'Ter', cumprido: true, hoje: false },
      { sigla: 'Qua', cumprido: true, hoje: false },
      { sigla: 'Qui', cumprido: true, hoje: false },
      { sigla: 'Sex', cumprido: estadoMock.agenda.some((d) => d.status === 'tomada'), hoje: true },
      { sigla: 'Sáb', cumprido: false, hoje: false },
      { sigla: 'Dom', cumprido: false, hoje: false },
    ],
    conquistas: CATALOGO_CONQUISTAS.map((c) => ({
      ...c,
      desbloqueada: Boolean(estadoMock.conquistas[c.codigo]),
      dataConquista: estadoMock.conquistas[c.codigo],
    })),
    mensagemFamilia: cuidadorAtivo
      ? {
          remetente: 'Ana',
          parentesco: 'Filha',
          texto: 'Oi mãe! Vi que o seu jardim está lindo. Te amo!',
          data: 'Hoje, 08:20',
        }
      : null,
    ultimoGanhoMensagem: estadoMock.ultimoGanhoMensagem,
  };
}

export async function apagarDadosRemotos(): Promise<void> {
  if (!USE_MOCK) {
    await fetch(`${BASE_URL}/privacidade/dados`, { method: 'DELETE' });
    return;
  }
  estadoMock.pontos = 0;
  estadoMock.sequenciaDias = 0;
  estadoMock.documentosLidos = 0;
  estadoMock.conquistas = {};
}
