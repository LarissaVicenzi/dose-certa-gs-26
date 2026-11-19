/**
 * Modelos de dados do aplicativo Dose Certa.
 */

export type AbaNavegacao = 'hoje' | 'ler' | 'jardim' | 'ajustes';

export type TelaAtiva =
  | 'splash'
  | 'consentimento'
  | 'preferencias_iniciais'
  | 'entrada'
  | 'acessibilidade'
  | AbaNavegacao;

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
  origemIA?: string;
}

export type EstagioJardim =
  | 'semente'
  | 'broto'
  | 'planta'
  | 'flor'
  | 'jardim_florido';

export interface DiaSemanaStatus {
  sigla: string;
  nomeDia: string;
  cumprido: boolean;
  hoje: boolean;
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

export interface MensagemCuidador {
  remetente: string;
  parentesco: string;
  texto: string;
  data: string;
}

export interface Gamificacao {
  pontos: number;
  estagio: EstagioJardim;
  nomeEstagio: string;
  emojiEstagio: string;
  proximoEstagioNome: string | null;
  verboProximoEstagio: string;
  pontosProximoEstagio: number | null;
  pontosEstagioAtualMin: number;
  sequenciaDias: number;
  diasSemana: DiaSemanaStatus[];
  conquistas: Conquista[];
  mensagemFamilia: MensagemCuidador | null;
  cuidadorPresente: boolean;
  relatorioSemanalLiberado: boolean;
  ultimoGanhoMensagem: string | null;
}

export interface VinculoCuidador {
  nome: string;
  parentesco: string;
  ativo: boolean;
  desde: string;
}

export interface ItemFilaOffline {
  doseId: string;
  horarioConfirmacao: string;
}

export interface DadosUsuario {
  apelido: string;
  cuidadorNome: string;
  cuidadorAtivo: boolean;
  consentimentoAceitoEm: string;
  totalDosesHoje: number;
  dosesTomadasHoje: number;
  pontosJardim: number;
  sequenciaDias: number;
  documentosLidos: number;
  itensNaFilaOffline: number;
}

export interface EventoImpacto {
  tipo: string;
  descricao: string;
  pontos: number;
  registradoEm: string;
}

export interface MetricasImpacto {
  apelidoIdoso: string;
  cuidadorAtivo: boolean;
  cuidadorNome: string;
  diasVinculoCuidador: number;
  totalDosesHoje: number;
  dosesTomadasHoje: number;
  dosesPendentesHoje: number;
  dosesAtrasadasHoje: number;
  taxaAdesaoHoje: number;
  documentosLidosComIA: number;
  pontosJardim: number;
  estagioJardim: string;
  sequenciaDias: number;
  conquistasDesbloqueadas: number;
  totalConquistas: number;
  eventosRecentes: EventoImpacto[];
}

export interface NovaDosePayload {
  nome: string;
  dose: string;
  horario: string;
  periodo: PeriodoDia;
  instrucao: string;
}

export type NivelRiscoInteracao = 'baixo' | 'atencao' | 'alto';

export interface MedicamentoRotinaInput {
  nome: string;
  dose?: string;
  horario?: string;
  periodo?: string;
}

export interface InteracaoMedicamentosa {
  medicamentosEnvolvidos: string[];
  nivelRisco: NivelRiscoInteracao;
  tituloAlerta: string;
  efeitoColateralPrejudicial: string;
  orientacaoPratica: string;
}

export interface AnaliseRotinaMedicamentos {
  id: string;
  analisadoEm: string;
  medicamentosAnalisados: string[];
  nivelGeral: NivelRiscoInteracao;
  resumoGeral: string;
  interacoes: InteracaoMedicamentosa[];
  cuidadosHorarios: string[];
  avisoMedico: string;
  origemIA: string;
}
