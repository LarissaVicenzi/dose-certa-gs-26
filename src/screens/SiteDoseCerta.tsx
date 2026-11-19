/**
 * Plataforma Web Oficial do Dose Certa (Site + Portal do Cuidador + IA Gemini + Jardim + Impacto).
 * Projetada nativamente para desktop/web responsivo, mantendo acessibilidade WCAG AA/AAA
 * (Claro, Escuro, Alto Contraste, escala de fonte e leitura em voz alta pt-BR).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accessibility,
  AlertCircle,
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Heart,
  HeartPulse,
  Lock,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import {
  adicionarDose,
  analisarRotinaMedicamentos,
  atualizarAcessoCuidador,
  confirmarDose,
  enviarMensagemCuidador,
  getAgenda,
  getGamificacao,
  getMetricasImpacto,
  lerDocumento,
  perguntarSobreDocumento,
} from '../services/api';
import {
  escolherFoto,
  escolherFotoReal,
  listarExemplosBula,
} from '../services/camera';
import { ESCALAS_TEXTO, ModoTema } from '../theme/tema';
import {
  AnaliseRotinaMedicamentos,
  DocumentoLido,
  Dose,
  Gamificacao,
  MedicamentoRotinaInput,
  MetricasImpacto,
  NivelRiscoInteracao,
  PeriodoDia,
} from '../types/modelos';

type SecaoWeb = 'painel' | 'bula' | 'jardim' | 'impacto';
type FiltroAgenda = 'todas' | 'tomada' | 'pendente' | 'atrasada';

const MAPA_ENDPOINTS = [
  { metodo: 'GET', rota: '/api/health', fastapi: '/v1/health', desc: 'Status do serviço e configuração do modelo Gemini' },
  { metodo: 'GET', rota: '/api/agenda', fastapi: '/v1/agenda', desc: 'Lista ordenada das doses diárias do idoso' },
  { metodo: 'POST', rota: '/api/doses', fastapi: '/v1/doses', desc: 'Cadastro de novo medicamento pelo familiar cuidador' },
  { metodo: 'POST', rota: '/api/doses/:id/confirmar', fastapi: '/v1/doses/{id}/confirmar', desc: 'Confirmação de dose com cálculo ético de pontos' },
  { metodo: 'POST', rota: '/api/documentos/ler', fastapi: '/v1/documentos/ler', desc: 'Leitura multimodal de bula/receita com Google Gemini' },
  { metodo: 'POST', rota: '/api/documentos/perguntar', fastapi: '/v1/documentos/perguntar', desc: 'Dúvidas restritas à bula com trava clínica de segurança' },
  { metodo: 'POST', rota: '/api/rotina/analisar', fastapi: '/v1/rotina/analisar', desc: 'Análise com IA de interações e efeitos colaterais na rotina completa' },
  { metodo: 'GET', rota: '/api/gamificacao', fastapi: '/v1/gamificacao', desc: 'Estado do Jardim da Saúde, sequência e 8 conquistas' },
  { metodo: 'POST', rota: '/api/cuidador/mensagem', fastapi: '/v1/cuidador/mensagem', desc: 'Envio de recado afetivo do cuidador (até 140 caracteres)' },
  { metodo: 'PATCH', rota: '/api/privacidade/cuidador', fastapi: '/v1/privacidade/cuidador', desc: 'Revogação ou reativação imediata do vínculo LGPD' },
  { metodo: 'GET', rota: '/api/metricas/impacto', fastapi: '/v1/metricas/impacto', desc: 'Indicadores ao vivo de adesão, IA e engajamento CitizenTech' },
  { metodo: 'GET / DELETE', rota: '/api/privacidade/dados', fastapi: '/v1/privacidade/dados', desc: 'Transparência e exclusão definitiva de dados (LGPD)' },
];

const ESTAGIOS_JARDIM = [
  { emoji: '🌱', nome: 'Semente', min: 0, faixa: '0–29 pts' },
  { emoji: '🌿', nome: 'Broto', min: 30, faixa: '30–79 pts' },
  { emoji: '🪴', nome: 'Planta', min: 80, faixa: '80–159 pts' },
  { emoji: '🌸', nome: 'Flor', min: 160, faixa: '160–299 pts' },
  { emoji: '🌳', nome: 'Jardim Florido', min: 300, faixa: '300+ pts' },
];

const PERIODOS: PeriodoDia[] = ['Manhã', 'Tarde', 'Noite'];

interface SiteDoseCertaProps {
  onAbrirAppIdoso: () => void;
}

export function SiteDoseCerta({ onAbrirAppIdoso }: SiteDoseCertaProps) {
  const {
    preferencias,
    temaResolvido,
    falandoAgora,
    lerTexto,
    pararLeitura,
    atualizarPreferencia,
    voltarAoPadrao,
  } = useAcessibilidade();

  const [secaoAtiva, setSecaoAtiva] = useState<SecaoWeb>('painel');
  const [painelAcessibilidadeAberto, setPainelAcessibilidadeAberto] =
    useState(false);

  const [agenda, setAgenda] = useState<Dose[]>([]);
  const [gamificacao, setGamificacao] = useState<Gamificacao | null>(null);
  const [metricas, setMetricas] = useState<MetricasImpacto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [filtroAgenda, setFiltroAgenda] = useState<FiltroAgenda>('todas');

  // Recado afetivo
  const [textoRecado, setTextoRecado] = useState('');
  const [enviandoRecado, setEnviandoRecado] = useState(false);
  const [avisoRecado, setAvisoRecado] = useState<string | null>(null);

  // Novo medicamento
  const [nomeRemedio, setNomeRemedio] = useState('');
  const [horarioRemedio, setHorarioRemedio] = useState('15:00');
  const [doseRemedio, setDoseRemedio] = useState('1 comprimido');
  const [periodoRemedio, setPeriodoRemedio] = useState<PeriodoDia>('Tarde');
  const [instrucaoRemedio, setInstrucaoRemedio] = useState(
    'Tomar com um copo de água'
  );
  const [salvandoDose, setSalvandoDose] = useState(false);
  const [avisoDose, setAvisoDose] = useState<string | null>(null);

  // Ler Bula com Gemini AI
  const [documentoAtual, setDocumentoAtual] = useState<DocumentoLido | null>(
    null
  );
  const [lendoBula, setLendoBula] = useState(false);
  const [erroBula, setErroBula] = useState<string | null>(null);
  const [perguntaBula, setPerguntaBula] = useState('');
  const [respostaBula, setRespostaBula] = useState('');
  const [erroPergunta, setErroPergunta] = useState<string | null>(null);
  const [respondendoBula, setRespondendoBula] = useState(false);

  // Análise de rotina completa e interações medicamentosas (IA)
  const [extrasRotina, setExtrasRotina] = useState<string[]>([]);
  const [novoRemedioRotina, setNovoRemedioRotina] = useState('');
  const [idsAgendaExcluidos, setIdsAgendaExcluidos] = useState<string[]>([]);
  const [analiseRotina, setAnaliseRotina] =
    useState<AnaliseRotinaMedicamentos | null>(null);
  const [analisandoRotina, setAnalisandoRotina] = useState(false);
  const [erroRotina, setErroRotina] = useState<string | null>(null);

  const exemplosBula = useMemo(() => listarExemplosBula(), []);

  // Sincroniza classe dark no html e escala base de fonte
  useEffect(() => {
    const html = document.documentElement;
    if (temaResolvido === 'escuro' || temaResolvido === 'alto_contraste') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    html.style.fontSize = `${Math.round(16 * preferencias.escalaFonte)}px`;
    return () => {
      html.style.fontSize = '16px';
    };
  }, [temaResolvido, preferencias.escalaFonte]);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErroGeral(null);
    try {
      const [dadosAgenda, dadosMetricas] = await Promise.all([
        getAgenda(),
        getMetricasImpacto(),
      ]);
      const dadosGam = await getGamificacao(dadosMetricas.cuidadorAtivo);
      setAgenda(dadosAgenda);
      setMetricas(dadosMetricas);
      setGamificacao(dadosGam);
    } catch (err) {
      setErroGeral(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os dados da plataforma.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const agendaFiltrada = useMemo(() => {
    if (filtroAgenda === 'todas') return agenda;
    return agenda.filter((item) => item.status === filtroAgenda);
  }, [agenda, filtroAgenda]);

  async function handleConfirmarDoseWeb(doseId: string) {
    try {
      const agora = new Date();
      const hhmm = `${String(agora.getHours()).padStart(2, '0')}:${String(
        agora.getMinutes()
      ).padStart(2, '0')}`;
      await confirmarDose(doseId, hhmm);
      await carregarDados();
    } catch (err) {
      setErroGeral(
        err instanceof Error ? err.message : 'Erro ao confirmar dose.'
      );
    }
  }

  async function handleAlternarPermissaoLGPD() {
    if (!metricas) return;
    try {
      await atualizarAcessoCuidador({ ativo: !metricas.cuidadorAtivo });
      await carregarDados();
    } catch (err) {
      setErroGeral(
        err instanceof Error ? err.message : 'Erro ao alterar permissão LGPD.'
      );
    }
  }

  async function handleEnviarRecado(e: React.FormEvent) {
    e.preventDefault();
    const texto = textoRecado.trim();
    if (!texto) return;
    setEnviandoRecado(true);
    setAvisoRecado(null);
    try {
      await enviarMensagemCuidador(texto, 'Ana', 'Filha');
      setTextoRecado('');
      setAvisoRecado(
        'Recado enviado com sucesso. Ele já aparece no Jardim da Saúde.'
      );
      await carregarDados();
    } catch (err) {
      setAvisoRecado(
        err instanceof Error ? err.message : 'Não foi possível enviar o recado.'
      );
    } finally {
      setEnviandoRecado(false);
    }
  }

  async function handleAdicionarMedicamento(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeRemedio.trim() || !horarioRemedio.trim()) return;
    setSalvandoDose(true);
    setAvisoDose(null);
    try {
      await adicionarDose({
        nome: nomeRemedio.trim(),
        horario: horarioRemedio.trim(),
        dose: doseRemedio.trim() || '1 comprimido',
        periodo: periodoRemedio,
        instrucao: instrucaoRemedio.trim() || 'Seguir a receita médica',
      });
      setNomeRemedio('');
      setAvisoDose('Medicamento incluído na agenda diária.');
      await carregarDados();
    } catch (err) {
      setAvisoDose(
        err instanceof Error
          ? err.message
          : 'Não foi possível adicionar o medicamento.'
      );
    } finally {
      setSalvandoDose(false);
    }
  }

  async function handleUploadFotoBula() {
    pararLeitura();
    setErroBula(null);
    setErroPergunta(null);
    setRespostaBula('');
    setPerguntaBula('');

    const foto = await escolherFotoReal();
    if (!foto) return;

    setLendoBula(true);
    try {
      const doc = await lerDocumento(foto.uri, foto.codigoDocumento, {
        fotoBase64: foto.base64,
        mimeType: foto.mimeType,
      });
      setDocumentoAtual(doc);
      await carregarDados();
    } catch (err) {
      setErroBula(
        err instanceof Error
          ? err.message
          : 'Não foi possível ler a imagem com a IA agora.'
      );
    } finally {
      setLendoBula(false);
    }
  }

  async function handleExemploBula(
    codigo: 'losartana' | 'metformina' | 'sinvastatina'
  ) {
    pararLeitura();
    setErroBula(null);
    setErroPergunta(null);
    setRespostaBula('');
    setPerguntaBula('');
    setLendoBula(true);
    try {
      const foto = await escolherFoto(codigo);
      const doc = await lerDocumento(foto.uri, foto.codigoDocumento);
      setDocumentoAtual(doc);
      await carregarDados();
    } catch (err) {
      setErroBula(
        err instanceof Error
          ? err.message
          : 'Não foi possível ler o exemplo agora.'
      );
    } finally {
      setLendoBula(false);
    }
  }

  async function handlePerguntarBula(perguntaFixa?: string) {
    if (!documentoAtual) return;
    const consulta = (perguntaFixa ?? perguntaBula).trim();
    if (!consulta) return;
    setPerguntaBula(consulta);
    setErroPergunta(null);
    setRespondendoBula(true);
    try {
      const resp = await perguntarSobreDocumento(documentoAtual, consulta);
      setRespostaBula(resp);
    } catch (err) {
      setErroPergunta(
        err instanceof Error ? err.message : 'Erro ao consultar a bula.'
      );
    } finally {
      setRespondendoBula(false);
    }
  }

  const medicamentosRotinaAtivos = useMemo<MedicamentoRotinaInput[]>(() => {
    const daAgenda = agenda
      .filter((d) => !idsAgendaExcluidos.includes(d.id))
      .map((d) => ({
        nome: d.nome,
        dose: d.dose,
        horario: d.horario,
        periodo: d.periodo,
      }));
    const extras = extrasRotina.map((nome) => ({ nome }));
    return [...daAgenda, ...extras];
  }, [agenda, idsAgendaExcluidos, extrasRotina]);

  function handleToggleDoseNaAnalise(doseId: string) {
    setIdsAgendaExcluidos((prev) =>
      prev.includes(doseId)
        ? prev.filter((id) => id !== doseId)
        : [...prev, doseId]
    );
  }

  function handleAdicionarExtraRotina(nomeInformado?: string) {
    const nomeLimpo = (nomeInformado ?? novoRemedioRotina).trim();
    if (!nomeLimpo) return;
    const jaExiste =
      agenda.some(
        (d) =>
          !idsAgendaExcluidos.includes(d.id) &&
          d.nome.toLowerCase() === nomeLimpo.toLowerCase()
      ) ||
      extrasRotina.some((n) => n.toLowerCase() === nomeLimpo.toLowerCase());
    if (!jaExiste) {
      setExtrasRotina((prev) => [...prev, nomeLimpo]);
    }
    if (!nomeInformado) {
      setNovoRemedioRotina('');
    }
  }

  function handleRemoverExtraRotina(nome: string) {
    setExtrasRotina((prev) => prev.filter((item) => item !== nome));
  }

  async function handleAnalisarRotina() {
    pararLeitura();
    setErroRotina(null);
    if (medicamentosRotinaAtivos.length === 0) {
      setErroRotina('Selecione ou adicione pelo menos um medicamento para analisar.');
      return;
    }
    setAnalisandoRotina(true);
    try {
      const resultado = await analisarRotinaMedicamentos(medicamentosRotinaAtivos);
      setAnaliseRotina(resultado);
      await carregarDados();
    } catch (err) {
      setErroRotina(
        err instanceof Error
          ? err.message
          : 'Não foi possível analisar a rotina de medicamentos agora.'
      );
    } finally {
      setAnalisandoRotina(false);
    }
  }

  function handleOuvirAnaliseRotina() {
    if (!analiseRotina) return;
    if (falandoAgora) {
      pararLeitura();
      return;
    }
    const alertasTexto = analiseRotina.interacoes
      .map(
        (item) =>
          `${item.tituloAlerta}. Medicamentos: ${item.medicamentosEnvolvidos.join(' e ')}. Risco: ${item.efeitoColateralPrejudicial} Orientação: ${item.orientacaoPratica}`
      )
      .join(' ');
    lerTexto(
      `Análise da rotina completa de medicamentos. ${analiseRotina.resumoGeral} ${alertasTexto} ${analiseRotina.avisoMedico}`
    );
  }

  function handleOuvirPagina() {
    if (falandoAgora) {
      pararLeitura();
      return;
    }
    if (secaoAtiva === 'bula' && documentoAtual) {
      lerTexto(
        `${documentoAtual.nomeRemedio}. ${documentoAtual.resumoSimples} Para que serve: ${documentoAtual.paraQueServe} Como tomar: ${documentoAtual.comoTomar} Cuidados: ${documentoAtual.cuidados}`
      );
      return;
    }
    if (secaoAtiva === 'jardim' && gamificacao) {
      lerTexto(
        `Jardim da Saúde. Estágio atual: ${gamificacao.nomeEstagio}, com ${gamificacao.pontos} pontos e ${gamificacao.sequenciaDias} dias de cuidado. Seu jardim nunca diminui.`
      );
      return;
    }
    if (secaoAtiva === 'impacto') {
      lerTexto(
        'Métricas de Impacto, Mapa da API e Modelo de Negócio e Impacto Social. Conectado aos Objetivos de Desenvolvimento Sustentável 3 e 10, com Plano Cidadão Gratuito para o idoso, Plano Família Conectada, parcerias com prefeituras e UBS, e compromisso integral com a LGPD.'
      );
      return;
    }
    lerTexto(
      `Portal Dose Certa. Acompanhando ${
        metricas?.apelidoIdoso || 'Dona Maria'
      }. Adesão de hoje: ${metricas?.taxaAdesaoHoje ?? 0} por cento, com ${
        metricas?.dosesTomadasHoje ?? 0
      } de ${metricas?.totalDosesHoje ?? 0} doses confirmadas.`
    );
  }

  const altoContraste = temaResolvido === 'alto_contraste';
  const fundoPagina = altoContraste
    ? 'bg-black text-white'
    : 'bg-[#FBF7F1] dark:bg-[#121A17] text-[#1F2933] dark:text-[#F2F5F3]';
  const classeCard = altoContraste
    ? 'bg-black border-2 border-white rounded-2xl'
    : 'bg-white dark:bg-[#1C2622] border border-[#E8DFD2] dark:border-[#2E3B36] rounded-2xl';
  const textoSec = altoContraste
    ? 'text-white'
    : 'text-[#4A5560] dark:text-[#C5D0CB]';
  const botaoPrimario = altoContraste
    ? 'bg-[#FFD60A] text-black font-bold border-2 border-white hover:opacity-90'
    : 'bg-[#0B6E4F] dark:bg-[#5FD3A3] text-white dark:text-[#06281B] font-semibold hover:opacity-95';
  const botaoSecundario = altoContraste
    ? 'bg-black text-[#FFD60A] border-2 border-[#FFD60A] font-bold hover:opacity-90'
    : 'bg-transparent text-[#0B6E4F] dark:text-[#5FD3A3] border border-[#0B6E4F] dark:border-[#5FD3A3] font-semibold hover:bg-[#DFF3E8]/50 dark:hover:bg-[#1F3D32]/60';

  const autorizadoLGPD = metricas ? metricas.cuidadorAtivo : true;

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${fundoPagina}`}>
      {/* Faixa institucional discreta nas cores do Brasil */}
      <div className="h-1.5 w-full flex" aria-hidden="true">
        <div className="flex-1 bg-[#0B6E4F]" />
        <div className="flex-1 bg-[#F2A541]" />
        <div className="flex-1 bg-[#1351B4]" />
      </div>

      {/* Top Bar Contract: 3 zonas limpas em 1 linha */}
      <header
        className={`sticky top-0 z-30 border-b ${
          altoContraste
            ? 'bg-black border-white'
            : 'bg-white/95 dark:bg-[#1C2622]/95 border-[#E8DFD2] dark:border-[#2E3B36] backdrop-blur-sm'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setSecaoAtiva('painel')}
            className={`font-display text-xl font-extrabold tracking-tight whitespace-nowrap shrink-0 cursor-pointer ${
              altoContraste
                ? 'text-[#FFD60A]'
                : 'text-[#0B6E4F] dark:text-[#5FD3A3]'
            }`}
          >
            Dose Certa
          </button>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7"
          >
            {(
              [
                ['painel', 'Painel'],
                ['bula', 'Ler Bula (IA)'],
                ['jardim', 'Jardim da Saúde'],
                ['impacto', 'Impacto e API'],
              ] as Array<[SecaoWeb, string]>
            ).map(([id, rotulo]) => {
              const ativo = secaoAtiva === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSecaoAtiva(id)}
                  className={`py-2 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                    ativo
                      ? altoContraste
                        ? 'border-[#FFD60A] text-[#FFD60A]'
                        : 'border-[#0B6E4F] dark:border-[#5FD3A3] text-[#0B6E4F] dark:text-[#5FD3A3]'
                      : `border-transparent ${textoSec} hover:text-[#1F2933] dark:hover:text-white`
                  }`}
                >
                  {rotulo}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onAbrirAppIdoso}
              className={`py-2 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 border-transparent transition-colors cursor-pointer ${
                altoContraste
                  ? 'text-[#FFD60A]'
                  : 'text-[#1351B4] dark:text-[#74B2FF] hover:opacity-80'
              }`}
            >
              App do Idoso
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setPainelAcessibilidadeAberto((v) => !v)}
              aria-expanded={painelAcessibilidadeAberto}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap shrink-0 transition-opacity cursor-pointer ${botaoPrimario}`}
            >
              <Accessibility className="w-4 h-4 shrink-0" />
              <span>Acessibilidade</span>
            </button>
          </div>
        </div>

        {/* Navegacao mobile compacta */}
        <div
          className={`md:hidden flex items-center justify-around gap-1 px-3 py-2 border-t ${
            altoContraste
              ? 'border-white'
              : 'border-[#E8DFD2] dark:border-[#2E3B36]'
          }`}
        >
          {(
            [
              ['painel', 'Painel'],
              ['bula', 'Bula IA'],
              ['jardim', 'Jardim'],
              ['impacto', 'API'],
            ] as Array<[SecaoWeb, string]>
          ).map(([id, rotulo]) => {
            const ativo = secaoAtiva === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSecaoAtiva(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  ativo
                    ? botaoPrimario
                    : `${textoSec}`
                }`}
              >
                {rotulo}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onAbrirAppIdoso}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              altoContraste
                ? 'text-[#FFD60A]'
                : 'text-[#1351B4] dark:text-[#74B2FF]'
            }`}
          >
            App
          </button>
        </div>
      </header>

      {/* Barra de Acessibilidade expansivel (Tema, Escala, Voz) */}
      {painelAcessibilidadeAberto && (
        <section
          aria-label="Controles de acessibilidade"
          className={`border-b ${
            altoContraste
              ? 'bg-black border-white'
              : 'bg-[#DFF3E8]/55 dark:bg-[#1A2D26] border-[#E8DFD2] dark:border-[#2E3B36]'
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold">Tamanho da letra:</span>
              <div className="flex items-center gap-1.5">
                {ESCALAS_TEXTO.map((op) => {
                  const ativo = preferencias.escalaFonte === op.valor;
                  return (
                    <button
                      key={op.rotulo}
                      type="button"
                      onClick={() =>
                        atualizarPreferencia('escalaFonte', op.valor)
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        ativo ? botaoPrimario : botaoSecundario
                      }`}
                    >
                      {op.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold">Tema:</span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    ['claro', 'Claro'],
                    ['escuro', 'Escuro'],
                    ['alto_contraste', 'Alto contraste'],
                  ] as Array<[ModoTema, string]>
                ).map(([valor, rotulo]) => {
                  const ativo = preferencias.modoTema === valor;
                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => atualizarPreferencia('modoTema', valor)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                        ativo ? botaoPrimario : botaoSecundario
                      }`}
                    >
                      {rotulo}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOuvirPagina}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${botaoSecundario}`}
              >
                {falandoAgora ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Parar leitura</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Ouvir tela</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={voltarAoPadrao}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold underline cursor-pointer ${textoSec}`}
              >
                Padrão
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Conteudo Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {erroGeral && (
          <div
            role="alert"
            className={`p-4 rounded-xl border ${
              altoContraste
                ? 'bg-black border-[#FF8A80] text-[#FF8A80]'
                : 'bg-[#FDE8E4] dark:bg-[#3D1E1C] border-[#9B2C1F]/30 text-[#9B2C1F] dark:text-[#FFB3AA]'
            }`}
          >
            <p className="text-sm font-semibold">{erroGeral}</p>
          </div>
        )}

        {/* ==================== SECAO 1: PAINEL DO CUIDADOR ==================== */}
        {secaoAtiva === 'painel' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className={`text-sm font-medium ${textoSec}`}>
                  Portal do Familiar Cuidador · {metricas?.cuidadorNome || 'Ana (Filha)'} ·{' '}
                  {metricas?.diasVinculoCuidador ?? 12} dias de vínculo
                  {gamificacao?.cuidadorPresente && autorizadoLGPD
                    ? ' · Selo Cuidador Presente'
                    : ''}
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance">
                  Acompanhamento de {metricas?.apelidoIdoso || 'Dona Maria'}
                </h1>
                <p className={`text-base leading-relaxed ${textoSec}`}>
                  Organize os horários de medicamentos, acompanhe a adesão sem
                  pressão e envie recados de carinho que aparecem direto no
                  aplicativo do idoso.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onAbrirAppIdoso}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap cursor-pointer ${botaoPrimario}`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Abrir App do Idoso</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSecaoAtiva('bula')}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap cursor-pointer ${botaoSecundario}`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Ler Bula com IA</span>
                </button>

                <button
                  type="button"
                  onClick={handleAlternarPermissaoLGPD}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap cursor-pointer ${botaoSecundario}`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {autorizadoLGPD
                      ? 'Simular pausa LGPD'
                      : 'Reativar acesso LGPD'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={carregarDados}
                  disabled={carregando}
                  aria-label="Atualizar dados"
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm whitespace-nowrap cursor-pointer ${botaoSecundario}`}
                >
                  <RefreshCw
                    className={`w-4 h-4 shrink-0 ${
                      carregando ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{carregando ? 'Atualizando' : 'Atualizar'}</span>
                </button>
              </div>
            </div>

            {!autorizadoLGPD ? (
              <div className={`p-8 space-y-4 ${classeCard}`} role="alert">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-[#8A5A00] dark:text-[#FFD479]" />
                  <h2 className="text-xl font-bold">
                    Acompanhamento pausado pela pessoa idosa (LGPD)
                  </h2>
                </div>
                <p className={`text-base max-w-2xl leading-relaxed ${textoSec}`}>
                  {metricas?.apelidoIdoso || 'Dona Maria'} pausou o
                  compartilhamento de dados no aplicativo. Por respeito à
                  autonomia e à LGPD, os registros de doses ficam ocultos até
                  nova autorização.
                </p>
                <button
                  type="button"
                  onClick={handleAlternarPermissaoLGPD}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm cursor-pointer ${botaoPrimario}`}
                >
                  Reativar autorização para demonstração
                </button>
              </div>
            ) : (
              <>
                {/* Faixa de 4 KPIs em largura total (tabular-nums) */}
                <section
                  aria-label="Indicadores do dia"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <div className={`p-5 space-y-1.5 ${classeCard}`}>
                    <p className={`text-sm font-medium ${textoSec}`}>
                      Adesão de hoje
                    </p>
                    <p className="text-3xl font-extrabold font-mono-num text-[#0B6E4F] dark:text-[#5FD3A3]">
                      {metricas?.taxaAdesaoHoje ?? 0}%
                    </p>
                    <p className={`text-xs ${textoSec}`}>
                      {metricas?.dosesTomadasHoje ?? 0} de{' '}
                      {metricas?.totalDosesHoje ?? 0} doses confirmadas
                    </p>
                  </div>

                  <div className={`p-5 space-y-1.5 ${classeCard}`}>
                    <p className={`text-sm font-medium ${textoSec}`}>
                      Jardim da Saúde
                    </p>
                    <p className="text-2xl font-extrabold">
                      {metricas?.estagioJardim || '🪴 Planta'}
                    </p>
                    <p className={`text-xs font-mono-num ${textoSec}`}>
                      {metricas?.pontosJardim ?? 0} pontos ·{' '}
                      {metricas?.sequenciaDias ?? 0} dias seguidos
                    </p>
                  </div>

                  <div className={`p-5 space-y-1.5 ${classeCard}`}>
                    <p className={`text-sm font-medium ${textoSec}`}>
                      Bulas explicadas (IA)
                    </p>
                    <p className="text-3xl font-extrabold font-mono-num text-[#1351B4] dark:text-[#74B2FF]">
                      {metricas?.documentosLidosComIA ?? 0}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSecaoAtiva('bula')}
                      className="text-xs font-semibold underline text-[#1351B4] dark:text-[#74B2FF] cursor-pointer"
                    >
                      Abrir leitor com IA Gemini →
                    </button>
                  </div>

                  <div className={`p-5 space-y-1.5 ${classeCard}`}>
                    <p className={`text-sm font-medium ${textoSec}`}>
                      Conquistas alcançadas
                    </p>
                    <p className="text-3xl font-extrabold font-mono-num text-[#8A5A00] dark:text-[#F7B955]">
                      {metricas?.conquistasDesbloqueadas ?? 0}/
                      {metricas?.totalConquistas ?? 8}
                    </p>
                    <p className={`text-xs ${textoSec}`}>
                      Marcos positivos sem punição
                    </p>
                  </div>
                </section>

                {/* Grid 2 colunas: Agenda do Dia + Acoes do Cuidador */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Esquerda: Agenda */}
                  <section className={`lg:col-span-7 p-6 space-y-5 ${classeCard}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">
                          Agenda de medicamentos de hoje
                        </h2>
                        <p className={`text-sm ${textoSec}`}>
                          Acompanhamento calmo — nunca culpabilizamos atrasos.
                        </p>
                      </div>

                      <div
                        className={`flex items-center gap-1 p-1 rounded-lg ${
                          altoContraste
                            ? 'border border-white'
                            : 'bg-[#FBF7F1] dark:bg-[#121A17]'
                        }`}
                      >
                        {(
                          [
                            ['todas', 'Todas'],
                            ['tomada', 'Tomadas'],
                            ['pendente', 'Pendentes'],
                            ['atrasada', 'Atrasadas'],
                          ] as Array<[FiltroAgenda, string]>
                        ).map(([chave, label]) => (
                          <button
                            key={chave}
                            type="button"
                            onClick={() => setFiltroAgenda(chave)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                              filtroAgenda === chave
                                ? altoContraste
                                  ? 'bg-[#FFD60A] text-black'
                                  : 'bg-white dark:bg-[#24332D] text-[#1F2933] dark:text-white shadow-xs'
                                : textoSec
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-[#E8DFD2] dark:divide-[#2E3B36]">
                      {agendaFiltrada.length === 0 ? (
                        <p className={`py-8 text-center text-sm ${textoSec}`}>
                          Nenhum medicamento encontrado neste filtro.
                        </p>
                      ) : (
                        agendaFiltrada.map((dose) => {
                          const tomada = dose.status === 'tomada';
                          const atrasada = dose.status === 'atrasada';
                          return (
                            <div
                              key={dose.id}
                              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                            >
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span className="font-mono-num text-base font-bold text-[#0B6E4F] dark:text-[#5FD3A3]">
                                    {dose.horario}
                                  </span>
                                  <span className="text-base font-bold">
                                    {dose.nome}
                                  </span>
                                  <span className={`text-xs ${textoSec}`}>
                                    · {dose.periodo} · {dose.dose}
                                  </span>
                                </div>
                                <p className={`text-sm ${textoSec}`}>
                                  {dose.instrucao}
                                </p>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {tomada ? (
                                  <span
                                    className={`text-sm font-semibold ${
                                      altoContraste
                                        ? 'text-[#52FF9A]'
                                        : 'text-[#0B6E4F] dark:text-[#7CE4B8]'
                                    }`}
                                  >
                                    ✓ Tomada às {dose.horarioTomado || dose.horario}
                                  </span>
                                ) : (
                                  <>
                                    <span
                                      className={`text-sm font-semibold ${
                                        atrasada
                                          ? altoContraste
                                            ? 'text-[#FF8A80]'
                                            : 'text-[#9B2C1F] dark:text-[#FFB3AA]'
                                          : altoContraste
                                            ? 'text-[#FFD60A]'
                                            : 'text-[#8A5A00] dark:text-[#FFD479]'
                                      }`}
                                    >
                                      {atrasada ? 'Ainda dá tempo' : 'Pendente'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleConfirmarDoseWeb(dose.id)
                                      }
                                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs whitespace-nowrap cursor-pointer ${botaoSecundario}`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Confirmar</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </section>

                  {/* Direita: Recado + Novo Medicamento */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Enviar Recado */}
                    <section className={`p-6 space-y-4 ${classeCard}`}>
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-5 h-5 text-[#F2A541]" />
                        <h2 className="text-lg font-bold">
                          Enviar recado de carinho
                        </h2>
                      </div>

                      {gamificacao?.mensagemFamilia && (
                        <div
                          className={`p-3.5 rounded-xl text-sm ${
                            altoContraste
                              ? 'border border-[#FFD60A] text-white'
                              : 'bg-[#FFF1D6] dark:bg-[#3A2E14] text-[#5C3B00] dark:text-[#FFE3A8]'
                          }`}
                        >
                          <p className="font-semibold">
                            Último recado ({gamificacao.mensagemFamilia.data}):
                          </p>
                          <p className="mt-1">
                            “{gamificacao.mensagemFamilia.texto}”
                          </p>
                        </div>
                      )}

                      <form onSubmit={handleEnviarRecado} className="space-y-3">
                        <div>
                          <label
                            htmlFor="campo-recado"
                            className={`block text-xs font-semibold mb-1.5 ${textoSec}`}
                          >
                            Mensagem curta (máx. 140 caracteres)
                          </label>
                          <textarea
                            id="campo-recado"
                            rows={2}
                            maxLength={140}
                            value={textoRecado}
                            onChange={(e) => setTextoRecado(e.target.value)}
                            placeholder="Ex: Que orgulho ver seu jardim crescendo, mãe! Passo aí à tarde."
                            className={`w-full rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                              altoContraste
                                ? 'bg-black border-white text-white'
                                : 'bg-[#FBF7F1] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                            }`}
                          />
                          <p className={`text-xs mt-1 font-mono-num ${textoSec}`}>
                            {textoRecado.length}/140 caracteres
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={enviandoRecado || !textoRecado.trim()}
                          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 cursor-pointer ${botaoPrimario}`}
                        >
                          <Send className="w-4 h-4" />
                          <span>
                            {enviandoRecado ? 'Enviando...' : 'Enviar recado'}
                          </span>
                        </button>

                        {avisoRecado && (
                          <p
                            role="status"
                            className="text-sm font-semibold text-[#0B6E4F] dark:text-[#5FD3A3]"
                          >
                            {avisoRecado}
                          </p>
                        )}
                      </form>
                    </section>

                    {/* Cadastrar Medicamento */}
                    <section className={`p-6 space-y-4 ${classeCard}`}>
                      <div className="flex items-center gap-2.5">
                        <Plus className="w-5 h-5 text-[#0B6E4F] dark:text-[#5FD3A3]" />
                        <h2 className="text-lg font-bold">
                          Incluir medicamento na agenda
                        </h2>
                      </div>

                      <form
                        onSubmit={handleAdicionarMedicamento}
                        className="space-y-3"
                      >
                        <div>
                          <label
                            htmlFor="nome-remedio"
                            className={`block text-xs font-semibold mb-1 ${textoSec}`}
                          >
                            Nome e concentração
                          </label>
                          <input
                            id="nome-remedio"
                            type="text"
                            value={nomeRemedio}
                            onChange={(e) => setNomeRemedio(e.target.value)}
                            placeholder="Ex: Vitamina D 1000 UI"
                            className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                              altoContraste
                                ? 'bg-black border-white text-white'
                                : 'bg-[#FBF7F1] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="horario-remedio"
                              className={`block text-xs font-semibold mb-1 ${textoSec}`}
                            >
                              Horário
                            </label>
                            <input
                              id="horario-remedio"
                              type="text"
                              value={horarioRemedio}
                              onChange={(e) =>
                                setHorarioRemedio(e.target.value)
                              }
                              placeholder="15:00"
                              className={`w-full rounded-xl px-3.5 py-2 text-sm font-mono-num border focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                                altoContraste
                                  ? 'bg-black border-white text-white'
                                  : 'bg-[#FBF7F1] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                              }`}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="dose-remedio"
                              className={`block text-xs font-semibold mb-1 ${textoSec}`}
                            >
                              Quantidade
                            </label>
                            <input
                              id="dose-remedio"
                              type="text"
                              value={doseRemedio}
                              onChange={(e) => setDoseRemedio(e.target.value)}
                              placeholder="1 cápsula"
                              className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                                altoContraste
                                  ? 'bg-black border-white text-white'
                                  : 'bg-[#FBF7F1] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {PERIODOS.map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPeriodoRemedio(p)}
                              className={`py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                                periodoRemedio === p
                                  ? botaoPrimario
                                  : botaoSecundario
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label
                            htmlFor="instrucao-remedio"
                            className={`block text-xs font-semibold mb-1 ${textoSec}`}
                          >
                            Instrução simples
                          </label>
                          <input
                            id="instrucao-remedio"
                            type="text"
                            value={instrucaoRemedio}
                            onChange={(e) =>
                              setInstrucaoRemedio(e.target.value)
                            }
                            placeholder="Tomar após o almoço com água"
                            className={`w-full rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                              altoContraste
                                ? 'bg-black border-white text-white'
                                : 'bg-[#FBF7F1] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                            }`}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={
                            salvandoDose ||
                            !nomeRemedio.trim() ||
                            !horarioRemedio.trim()
                          }
                          className={`w-full px-4 py-2.5 rounded-lg text-sm disabled:opacity-50 cursor-pointer ${botaoSecundario}`}
                        >
                          {salvandoDose
                            ? 'Salvando...'
                            : 'Adicionar à agenda'}
                        </button>

                        {avisoDose && (
                          <p
                            role="status"
                            className="text-sm font-semibold text-[#0B6E4F] dark:text-[#5FD3A3]"
                          >
                            {avisoDose}
                          </p>
                        )}
                      </form>
                    </section>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== SECAO 2: LER BULA COM IA GEMINI ==================== */}
        {secaoAtiva === 'bula' && (
          <div className="space-y-8">
            <div className="space-y-2 max-w-2xl">
              <p className={`text-sm font-medium ${textoSec}`}>
                Leitura acessível de bulas e receitas · IA Multimodal no servidor
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance">
                Ler bula em palavras simples
              </h1>
              <p className={`text-base leading-relaxed ${textoSec}`}>
                Envie uma foto real de bula, caixa ou receita (JPEG, PNG ou
                WEBP) ou teste um exemplo. A IA explica com clareza e nunca
                altera prescrições médicas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Controles de envio */}
              <section className={`lg:col-span-5 p-6 space-y-5 ${classeCard}`}>
                <h2 className="text-lg font-bold">1. Escolha uma foto</h2>

                <button
                  type="button"
                  onClick={handleUploadFotoBula}
                  disabled={lendoBula}
                  className={`w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm disabled:opacity-50 cursor-pointer ${botaoPrimario}`}
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>
                    {lendoBula
                      ? 'Lendo com inteligência...'
                      : 'Enviar foto real da bula ou receita'}
                  </span>
                </button>

                <div className="space-y-2.5 pt-2 border-t border-[#E8DFD2] dark:border-[#2E3B36]">
                  <p className={`text-sm font-medium ${textoSec}`}>
                    Ou teste agora com um medicamento de exemplo:
                  </p>
                  <div className="flex flex-col gap-2">
                    {exemplosBula.map((ex) => (
                      <button
                        key={ex.codigo}
                        type="button"
                        disabled={lendoBula}
                        onClick={() => handleExemploBula(ex.codigo)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer ${botaoSecundario}`}
                      >
                        {ex.rotulo}
                      </button>
                    ))}
                  </div>
                </div>

                {erroBula && (
                  <div
                    role="alert"
                    className={`p-4 rounded-xl text-sm font-semibold ${
                      altoContraste
                        ? 'border-2 border-[#FF8A80] text-[#FF8A80]'
                        : 'bg-[#FDE8E4] dark:bg-[#3D1E1C] text-[#9B2C1F] dark:text-[#FFB3AA]'
                    }`}
                  >
                    {erroBula}
                  </div>
                )}

                <p className={`text-xs leading-relaxed ${textoSec}`}>
                  Aviso de segurança: isto é apenas uma explicação da bula. Em
                  caso de dúvida sobre dose ou sintomas, pergunte sempre ao seu
                  médico ou farmacêutico.
                </p>
              </section>

              {/* Resultado + Tira-duvidas */}
              <section className={`lg:col-span-7 p-6 space-y-6 ${classeCard}`}>
                {!documentoAtual ? (
                  <div className="py-12 text-center space-y-3">
                    <FileText className="w-10 h-10 mx-auto text-[#0B6E4F] dark:text-[#5FD3A3]" />
                    <h2 className="text-xl font-bold">
                      Nenhuma bula lida ainda
                    </h2>
                    <p className={`text-sm max-w-md mx-auto ${textoSec}`}>
                      Envie uma foto ao lado ou selecione Losartana, Metformina
                      ou Sinvastatina para ver a explicação gerada pela IA e
                      ouvir em voz alta.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4 border-[#E8DFD2] dark:border-[#2E3B36]">
                      <div className="space-y-1">
                        <p className={`text-xs font-medium ${textoSec}`}>
                          Explicado às {documentoAtual.lidoEm}
                        </p>
                        <h2 className="text-2xl font-extrabold">
                          {documentoAtual.nomeRemedio}
                        </h2>
                        <p className="text-sm font-semibold text-[#0B6E4F] dark:text-[#5FD3A3]">
                          {documentoAtual.resumoSimples}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleOuvirPagina}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer ${botaoPrimario}`}
                      >
                        {falandoAgora ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            <span>Parar voz</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>Ouvir explicação</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <h3 className="text-base font-bold text-[#0B6E4F] dark:text-[#5FD3A3]">
                          Para que serve
                        </h3>
                        <p className="mt-1 text-base leading-relaxed">
                          {documentoAtual.paraQueServe}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#8A5A00] dark:text-[#FFD479]">
                          Como tomar
                        </h3>
                        <p className="mt-1 text-base leading-relaxed">
                          {documentoAtual.comoTomar}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#9B2C1F] dark:text-[#FFB3AA]">
                          Cuidados importantes
                        </h3>
                        <p className="mt-1 text-base leading-relaxed">
                          {documentoAtual.cuidados}
                        </p>
                      </div>
                    </div>

                    {/* Tira-duvidas restrito a bula */}
                    <div className="pt-5 border-t border-[#E8DFD2] dark:border-[#2E3B36] space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#0B6E4F] dark:text-[#5FD3A3]" />
                        <h3 className="text-base font-bold">
                          Tirar uma dúvida sobre esta bula
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handlePerguntarBula('Como devo tomar?')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${botaoSecundario}`}
                        >
                          Como devo tomar?
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handlePerguntarBula('Posso tomar 2 comprimidos?')
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${botaoSecundario}`}
                        >
                          Testar trava: “Posso tomar 2?”
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={perguntaBula}
                          onChange={(e) => setPerguntaBula(e.target.value)}
                          placeholder="Escreva uma pergunta sobre esta bula..."
                          className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] ${
                            altoContraste
                              ? 'bg-black border-white text-white'
                              : 'bg-[#FBF7F1] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                          }`}
                        />
                        <button
                          type="button"
                          disabled={respondendoBula || !perguntaBula.trim()}
                          onClick={() => handlePerguntarBula()}
                          className={`px-5 py-2.5 rounded-xl text-sm whitespace-nowrap disabled:opacity-50 cursor-pointer ${botaoPrimario}`}
                        >
                          {respondendoBula ? 'Consultando...' : 'Perguntar'}
                        </button>
                      </div>

                      {erroPergunta && (
                        <p
                          role="alert"
                          className="text-sm font-semibold text-[#9B2C1F] dark:text-[#FFB3AA]"
                        >
                          {erroPergunta}
                        </p>
                      )}

                      {respostaBula && (
                        <div
                          role="status"
                          className={`p-4 rounded-xl text-sm font-semibold ${
                            altoContraste
                              ? 'border-2 border-[#FFD60A] text-[#FFD60A]'
                              : 'bg-[#FFF1D6] dark:bg-[#3A2E14] text-[#5C3B00] dark:text-[#FFE3A8]'
                          }`}
                        >
                          {respostaBula}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </section>
            </div>

            {/* Análise de Rotina Completa e Interações Medicamentosas (IA) */}
            <section
              aria-labelledby="titulo-analise-rotina"
              className={`pt-8 mt-4 border-t space-y-6 ${
                altoContraste
                  ? 'border-white bg-black'
                  : 'border-[#E8DFD2] dark:border-[#2E3B36] bg-[#FAF8F2] dark:bg-transparent'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <p
                    className={`text-sm font-semibold ${
                      altoContraste
                        ? 'text-[#FFD60A]'
                        : 'text-[#065F46] dark:text-[#5FD3A3]'
                    }`}
                  >
                    Segurança Farmacológica · Cruzamento Inteligente da Rotina
                  </p>
                  <h2
                    id="titulo-analise-rotina"
                    className={`text-2xl md:text-3xl font-extrabold tracking-tight text-balance ${
                      altoContraste
                        ? 'text-white'
                        : 'text-[#1F2933] dark:text-[#F2F5F3]'
                    }`}
                  >
                    Analisar rotina completa de medicamentos (IA)
                  </h2>
                  <p className={`text-base leading-relaxed ${textoSec}`}>
                    A inteligência artificial relaciona todos os medicamentos
                    que você toma ao longo do dia — incluindo algum novo
                    remédio ou a bula lida acima — para alertar sobre possíveis
                    interações e efeitos colaterais prejudiciais.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {analiseRotina && (
                    <button
                      type="button"
                      onClick={handleOuvirAnaliseRotina}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm whitespace-nowrap cursor-pointer ${botaoSecundario}`}
                    >
                      {falandoAgora ? (
                        <>
                          <VolumeX className="w-4 h-4 shrink-0" />
                          <span>Parar voz</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 shrink-0" />
                          <span>Ouvir análise</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={
                      analisandoRotina || medicamentosRotinaAtivos.length === 0
                    }
                    onClick={handleAnalisarRotina}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap disabled:opacity-50 cursor-pointer transition-opacity ${
                      altoContraste
                        ? 'bg-[#FFD60A] text-black font-bold border-2 border-white'
                        : 'bg-[#065F46] dark:bg-[#5FD3A3] text-white dark:text-[#06281B] hover:opacity-95'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      {analisandoRotina
                        ? 'Analisando interações com IA...'
                        : 'Analisar interações e efeitos'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Coluna esquerda: Lista de medicamentos da rotina + acréscimo */}
                <div className={`lg:col-span-5 p-6 space-y-5 ${classeCard}`}>
                  <div className="space-y-1">
                    <h3
                      className={`text-lg font-bold ${
                        altoContraste
                          ? 'text-white'
                          : 'text-[#1F2933] dark:text-[#F2F5F3]'
                      }`}
                    >
                      Medicamentos na sua rotina ({medicamentosRotinaAtivos.length})
                    </h3>
                    <p className={`text-xs leading-relaxed ${textoSec}`}>
                      Carregados automaticamente da agenda diária. Você pode
                      marcar, desmarcar ou incluir outro remédio para testar.
                    </p>
                  </div>

                  <div className="divide-y divide-[#E8DFD2] dark:divide-[#2E3B36]">
                    {agenda.map((dose) => {
                      const selecionado = !idsAgendaExcluidos.includes(dose.id);
                      return (
                        <label
                          key={dose.id}
                          className="py-2.5 flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selecionado}
                              onChange={() => handleToggleDoseNaAnalise(dose.id)}
                              className="w-4 h-4 accent-[#065F46] cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">
                                {dose.nome}
                              </p>
                              <p className={`text-xs font-mono-num ${textoSec}`}>
                                {dose.horario} · {dose.periodo} · {dose.dose}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-semibold shrink-0 ${
                              selecionado
                                ? altoContraste
                                  ? 'text-[#FFD60A]'
                                  : 'text-[#065F46] dark:text-[#5FD3A3]'
                                : textoSec
                            }`}
                          >
                            {selecionado ? 'Incluído' : 'Oculto'}
                          </span>
                        </label>
                      );
                    })}

                    {extrasRotina.map((nomeExtra) => (
                      <div
                        key={nomeExtra}
                        className="py-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">
                            {nomeExtra}
                          </p>
                          <p
                            className={`text-xs font-semibold ${
                              altoContraste
                                ? 'text-[#FFD60A]'
                                : 'text-[#065F46] dark:text-[#5FD3A3]'
                            }`}
                          >
                            Adicionado para verificação
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoverExtraRotina(nomeExtra)}
                          aria-label={`Remover ${nomeExtra} da análise`}
                          className={`p-1.5 rounded-lg cursor-pointer ${textoSec} hover:text-[#9B2C1F]`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {documentoAtual &&
                    !medicamentosRotinaAtivos.some((m) =>
                      m.nome
                        .toLowerCase()
                        .includes(
                          documentoAtual.nomeRemedio
                            .split(' ')[0]
                            .toLowerCase()
                        )
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAdicionarExtraRotina(documentoAtual.nomeRemedio)
                        }
                        className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${botaoSecundario}`}
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Incluir bula lida: {documentoAtual.nomeRemedio}
                        </span>
                      </button>
                    )}

                  <div className="pt-3 border-t border-[#E8DFD2] dark:border-[#2E3B36] space-y-2.5">
                    <label
                      htmlFor="campo-extra-rotina"
                      className={`block text-xs font-semibold ${textoSec}`}
                    >
                      Incluir outro medicamento ou suplemento na análise
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="campo-extra-rotina"
                        type="text"
                        value={novoRemedioRotina}
                        onChange={(e) => setNovoRemedioRotina(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdicionarExtraRotina();
                          }
                        }}
                        placeholder="Ex: Ibuprofeno 600 mg"
                        className={`flex-1 rounded-xl px-3.5 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-[#065F46] ${
                          altoContraste
                            ? 'bg-black border-white text-white'
                            : 'bg-[#FAF8F2] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                        }`}
                      />
                      <button
                        type="button"
                        disabled={!novoRemedioRotina.trim()}
                        onClick={() => handleAdicionarExtraRotina()}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer ${botaoSecundario}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Incluir</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Ibuprofeno 600 mg', 'Omeprazol 20 mg', 'AAS 100 mg'].map(
                        (sugestao) => (
                          <button
                            key={sugestao}
                            type="button"
                            onClick={() => handleAdicionarExtraRotina(sugestao)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${botaoSecundario}`}
                          >
                            + {sugestao}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Coluna direita: Resultado da análise da IA */}
                <div className={`lg:col-span-7 p-6 space-y-5 ${classeCard}`}>
                  {erroRotina && (
                    <div
                      role="alert"
                      className={`p-4 rounded-xl text-sm font-semibold ${
                        altoContraste
                          ? 'border-2 border-[#FF8A80] text-[#FF8A80]'
                          : 'bg-[#FDE8E4] dark:bg-[#3D1E1C] text-[#9B2C1F] dark:text-[#FFB3AA]'
                      }`}
                    >
                      {erroRotina}
                    </div>
                  )}

                  {!analiseRotina ? (
                    <div className="py-10 text-center space-y-3">
                      <ShieldCheck
                        className={`w-10 h-10 mx-auto ${
                          altoContraste
                            ? 'text-[#FFD60A]'
                            : 'text-[#065F46] dark:text-[#5FD3A3]'
                        }`}
                      />
                      <h3 className="text-xl font-bold">
                        Verifique se seus remédios combinam com segurança
                      </h3>
                      <p className={`text-sm max-w-lg mx-auto leading-relaxed ${textoSec}`}>
                        Clique em{' '}
                        <strong>“Analisar interações e efeitos”</strong> para a
                        IA cruzar os medicamentos da sua rotina (como Losartana,
                        Metformina e Sinvastatina) ou testar um remédio extra
                        como Ibuprofeno ou AAS.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Resumo geral com sinalizacao explicita (icone + rotulo + cor) */}
                      {(() => {
                        const estiloNivel = (nivel: NivelRiscoInteracao) => {
                          if (nivel === 'alto') {
                            return {
                              rotulo: 'Alerta importante de interação',
                              icone: AlertTriangle,
                              box: altoContraste
                                ? 'border-2 border-[#FF8A80] text-[#FF8A80]'
                                : 'bg-[#FDE8E4] dark:bg-[#3D1E1C] border border-[#9B2C1F]/25 text-[#9B2C1F] dark:text-[#FFB3AA]',
                            };
                          }
                          if (nivel === 'atencao') {
                            return {
                              rotulo: 'Atenção recomendada',
                              icone: AlertCircle,
                              box: altoContraste
                                ? 'border-2 border-[#FFD60A] text-[#FFD60A]'
                                : 'bg-[#FFF1D6] dark:bg-[#3A2E14] border border-[#8A5A00]/25 text-[#5C3B00] dark:text-[#FFE3A8]',
                            };
                          }
                          return {
                            rotulo: 'Rotina compatível · Baixo risco',
                            icone: CheckCircle2,
                            box: altoContraste
                              ? 'border-2 border-[#52FF9A] text-[#52FF9A]'
                              : 'bg-[#ECFDF5] dark:bg-[#1F3D32] border border-[#065F46]/25 text-[#065F46] dark:text-[#7CE4B8]',
                          };
                        };

                        const metaGeral = estiloNivel(analiseRotina.nivelGeral);
                        const IconeGeral = metaGeral.icone;

                        return (
                          <>
                            <div className={`p-4 rounded-xl space-y-2 ${metaGeral.box}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="inline-flex items-center gap-2 text-sm font-extrabold">
                                  <IconeGeral className="w-5 h-5 shrink-0" aria-hidden="true" />
                                  <span>{metaGeral.rotulo}</span>
                                </div>
                                <span className="text-xs font-mono-num opacity-85">
                                  Analisado às {analiseRotina.analisadoEm}
                                </span>
                              </div>
                              <p className="text-sm font-medium leading-relaxed">
                                {analiseRotina.resumoGeral}
                              </p>
                              <p className="text-xs opacity-85">
                                Medicamentos analisados:{' '}
                                {analiseRotina.medicamentosAnalisados.join(' · ')}
                              </p>
                            </div>

                            {/* Lista de interações e efeitos colaterais */}
                            <div className="space-y-3">
                              <h3 className="text-base font-bold">
                                Relações entre medicamentos e alertas de efeitos colaterais
                              </h3>
                              <div className="space-y-3">
                                {analiseRotina.interacoes.map((item, idx) => {
                                  const metaItem = estiloNivel(item.nivelRisco);
                                  const IconeItem = metaItem.icone;
                                  return (
                                    <div
                                      key={`${item.tituloAlerta}-${idx}`}
                                      className={`p-4 rounded-xl border space-y-2 ${
                                        altoContraste
                                          ? 'border-white bg-black'
                                          : 'bg-[#FAF8F2] dark:bg-[#121A17] border-[#E8DFD2] dark:border-[#2E3B36]'
                                      }`}
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-[#065F46] dark:text-[#5FD3A3]">
                                          {item.medicamentosEnvolvidos.join(' + ')}
                                        </p>
                                        <span
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold ${metaItem.box}`}
                                        >
                                          <IconeItem className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                          <span>{metaItem.rotulo}</span>
                                        </span>
                                      </div>

                                      <h4 className="text-base font-bold">
                                        {item.tituloAlerta}
                                      </h4>

                                      <p className="text-sm leading-relaxed">
                                        <strong>Possível efeito prejudicial: </strong>
                                        {item.efeitoColateralPrejudicial}
                                      </p>

                                      <p className={`text-sm leading-relaxed ${textoSec}`}>
                                        <strong>Como agir com segurança: </strong>
                                        {item.orientacaoPratica}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Cuidados de horário e sinais para observar */}
                            {analiseRotina.cuidadosHorarios.length > 0 && (
                              <div className="pt-3 border-t border-[#E8DFD2] dark:border-[#2E3B36] space-y-2">
                                <h3 className="text-sm font-bold text-[#065F46] dark:text-[#5FD3A3]">
                                  Cuidados práticos com horários e sintomas
                                </h3>
                                <ul className={`list-disc pl-5 space-y-1 text-sm ${textoSec}`}>
                                  {analiseRotina.cuidadosHorarios.map((dica, i) => (
                                    <li key={i}>{dica}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <p className={`pt-3 border-t border-[#E8DFD2] dark:border-[#2E3B36] text-xs font-semibold leading-relaxed ${textoSec}`}>
                              {analiseRotina.avisoMedico}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ==================== SECAO 3: JARDIM DA SAUDE ==================== */}
        {secaoAtiva === 'jardim' && gamificacao && (
          <div className="space-y-8">
            <div className="space-y-2 max-w-2xl">
              <p className={`text-sm font-medium ${textoSec}`}>
                Gamificação ética (Citizen Flow) · Sem punição e sem ranking
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance">
                Jardim da Saúde
              </h1>
              <p className={`text-base leading-relaxed ${textoSec}`}>
                Cada dose confirmada e cada bula compreendida fazem o jardim
                crescer. Quando um dia falha, o jardim só descansa — os pontos
                nunca diminuem.
              </p>
            </div>

            {/* Resumo do Estagio Atual */}
            <section className={`p-6 md:p-8 space-y-6 ${classeCard}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 ${
                      altoContraste
                        ? 'border-2 border-[#FFD60A]'
                        : 'bg-[#DFF3E8] dark:bg-[#1F3D32]'
                    }`}
                  >
                    {gamificacao.emojiEstagio}
                  </div>
                  <div className="space-y-1">
                    <p className={`text-sm font-semibold ${textoSec}`}>
                      Estágio atual
                    </p>
                    <h2 className="text-2xl md:text-3xl font-extrabold">
                      {gamificacao.nomeEstagio}
                    </h2>
                    <p className="text-sm font-mono-num font-semibold text-[#0B6E4F] dark:text-[#5FD3A3]">
                      {gamificacao.pontos} pontos acumulados ·{' '}
                      {gamificacao.sequenciaDias} dias seguidos
                    </p>
                  </div>
                </div>

                {gamificacao.pontosProximoEstagio && (
                  <div className="min-w-[240px] space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Próximo estágio: {gamificacao.proximoEstagioNome}</span>
                      <span className="font-mono-num">
                        {gamificacao.pontos}/{gamificacao.pontosProximoEstagio} pts
                      </span>
                    </div>
                    <div
                      className={`h-3 w-full rounded-full overflow-hidden ${
                        altoContraste
                          ? 'border border-white'
                          : 'bg-[#E8DFD2] dark:bg-[#2E3B36]'
                      }`}
                    >
                      <div
                        className={`h-full transition-all ${
                          altoContraste
                            ? 'bg-[#FFD60A]'
                            : 'bg-[#0B6E4F] dark:bg-[#5FD3A3]'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((gamificacao.pontos -
                                gamificacao.pontosEstagioAtualMin) /
                                Math.max(
                                  1,
                                  gamificacao.pontosProximoEstagio -
                                    gamificacao.pontosEstagioAtualMin
                                )) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5 estagios */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-[#E8DFD2] dark:border-[#2E3B36]">
                {ESTAGIOS_JARDIM.map((est) => {
                  const alcancado = gamificacao.pontos >= est.min;
                  return (
                    <div
                      key={est.nome}
                      className={`p-3.5 rounded-xl text-center space-y-1 ${
                        alcancado
                          ? altoContraste
                            ? 'border-2 border-[#FFD60A]'
                            : 'bg-[#DFF3E8]/70 dark:bg-[#1F3D32]'
                          : altoContraste
                            ? 'border border-white/50 opacity-70'
                            : 'bg-[#FBF7F1] dark:bg-[#121A17] opacity-75'
                      }`}
                    >
                      <div className="text-2xl">{est.emoji}</div>
                      <p className="text-sm font-bold">{est.nome}</p>
                      <p className={`text-xs font-mono-num ${textoSec}`}>
                        {est.faixa}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 8 Conquistas oficiais */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold">
                Conquistas oficiais ({gamificacao.conquistas.filter((c) => c.desbloqueada).length}/
                {gamificacao.conquistas.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {gamificacao.conquistas.map((conq) => (
                  <div
                    key={conq.id}
                    className={`p-5 space-y-2 ${classeCard} ${
                      !conq.desbloqueada ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{conq.emoji}</span>
                      <span className="text-xs font-mono-num font-bold text-[#0B6E4F] dark:text-[#5FD3A3]">
                        +{conq.pontos} pts
                      </span>
                    </div>
                    <h3 className="text-base font-bold">{conq.titulo}</h3>
                    <p className={`text-xs leading-relaxed ${textoSec}`}>
                      {conq.dica}
                    </p>
                    <p className="text-xs font-semibold pt-1">
                      {conq.desbloqueada
                        ? `✓ Conquistada em ${conq.dataConquista}`
                        : 'Em progresso'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ==================== SECAO 4: IMPACTO E API ==================== */}
        {secaoAtiva === 'impacto' && (
          <div className="space-y-8">
            <div className="space-y-2 max-w-2xl">
              <p className={`text-sm font-medium ${textoSec}`}>
                Framework Application · Arquitetura REST compartilhada (Web + Mobile)
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-balance">
                Métricas de Impacto e Mapa da API
              </h1>
              <p className={`text-base leading-relaxed ${textoSec}`}>
                Todos os dados desta plataforma são servidos pela mesma API REST
                projetada para o back-end FastAPI (3FN) e o aplicativo React
                Native no Expo Snack.
              </p>
            </div>

            {/* Eventos recentes ao vivo */}
            {metricas && (
              <section className={`p-6 space-y-4 ${classeCard}`}>
                <h2 className="text-lg font-bold">
                  Eventos recentes registrados em /api/metricas/impacto
                </h2>
                <div className="divide-y divide-[#E8DFD2] dark:divide-[#2E3B36]">
                  {metricas.eventosRecentes.map((ev, idx) => (
                    <div
                      key={`${ev.tipo}-${idx}`}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-mono-num font-semibold text-[#0B6E4F] dark:text-[#5FD3A3]">
                          {ev.registradoEm}
                        </span>
                        <span>{ev.descricao}</span>
                      </div>
                      {ev.pontos > 0 && (
                        <span className="font-mono-num font-bold text-[#8A5A00] dark:text-[#FFD479]">
                          +{ev.pontos} pts
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tabela Funcionalidade MVP -> Endpoint */}
            <section className={`p-6 space-y-4 ${classeCard}`}>
              <h2 className="text-lg font-bold">
                Mapa Funcionalidade do MVP → Endpoint
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E8DFD2] dark:border-[#2E3B36]">
                      <th className="py-3 pr-4 font-bold">Método</th>
                      <th className="py-3 pr-4 font-bold">Endpoint Web</th>
                      <th className="py-3 pr-4 font-bold">FastAPI</th>
                      <th className="py-3 font-bold">Funcionalidade do MVP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DFD2] dark:divide-[#2E3B36]">
                    {MAPA_ENDPOINTS.map((item) => (
                      <tr key={item.rota}>
                        <td className="py-3 pr-4 font-mono-num font-bold text-[#0B6E4F] dark:text-[#5FD3A3] whitespace-nowrap">
                          {item.metodo}
                        </td>
                        <td className="py-3 pr-4 font-mono-num whitespace-nowrap">
                          {item.rota}
                        </td>
                        <td className={`py-3 pr-4 font-mono-num whitespace-nowrap ${textoSec}`}>
                          {item.fastapi}
                        </td>
                        <td className={`py-3 ${textoSec}`}>{item.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Seção Institucional: Modelo de Negócio e Impacto Social */}
            <section
              aria-labelledby="titulo-modelo-impacto"
              className={`pt-8 mt-4 border-t space-y-8 ${
                altoContraste
                  ? 'border-white bg-black'
                  : 'border-[#E8DFD2] dark:border-[#2E3B36] bg-[#FAF8F2] dark:bg-transparent'
              }`}
            >
              <div className="space-y-2 max-w-3xl">
                <p
                  className={`text-sm font-semibold ${
                    altoContraste
                      ? 'text-[#FFD60A]'
                      : 'text-[#065F46] dark:text-[#5FD3A3]'
                  }`}
                >
                  Visão Institucional · CitizenTech de Saúde Preventiva
                </p>
                <h2
                  id="titulo-modelo-impacto"
                  className={`text-2xl md:text-3xl font-extrabold tracking-tight text-balance ${
                    altoContraste
                      ? 'text-white'
                      : 'text-[#1F2933] dark:text-[#F2F5F3]'
                  }`}
                >
                  Modelo de Negócio e Impacto Social
                </h2>
                <p className={`text-base leading-relaxed ${textoSec}`}>
                  Impacto mensurável alinhado à Agenda 2030 da ONU, sustentado
                  por um modelo híbrido que garante gratuidade permanente para
                  a pessoa idosa e escala no setor público de saúde.
                </p>
              </div>

              {/* Bloco 1: ODS Conectados */}
              <div className="space-y-4">
                <h3
                  className={`text-lg font-bold ${
                    altoContraste
                      ? 'text-white'
                      : 'text-[#1F2933] dark:text-[#F2F5F3]'
                  }`}
                >
                  1. ODS Conectados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <article className={`p-6 space-y-3 ${classeCard}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p
                          className={`text-xs font-mono-num font-bold ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                        >
                          ODS 3 · Agenda 2030 ONU
                        </p>
                        <h4 className="text-lg font-extrabold">
                          Saúde e Bem-Estar
                        </h4>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          altoContraste
                            ? 'border border-[#FFD60A] text-[#FFD60A]'
                            : 'bg-[#ECFDF5] dark:bg-[#1F3D32] text-[#065F46] dark:text-[#5FD3A3]'
                        }`}
                      >
                        <HeartPulse className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${textoSec}`}>
                      Prevenção de erros medicamentosos, trocas de horário e
                      abandono terapêutico na terceira idade por meio de
                      confirmação simples e leitura assistida de bulas.
                    </p>
                  </article>

                  <article className={`p-6 space-y-3 ${classeCard}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p
                          className={`text-xs font-mono-num font-bold ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                        >
                          ODS 10 · Agenda 2030 ONU
                        </p>
                        <h4 className="text-lg font-extrabold">
                          Redução das Desigualdades
                        </h4>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          altoContraste
                            ? 'border border-[#FFD60A] text-[#FFD60A]'
                            : 'bg-[#ECFDF5] dark:bg-[#1F3D32] text-[#065F46] dark:text-[#5FD3A3]'
                        }`}
                      >
                        <Eye className="w-5 h-5" aria-hidden="true" />
                      </div>
                    </div>
                    <p className={`text-sm leading-relaxed ${textoSec}`}>
                      Acessibilidade digital nativa para pessoas idosas e com
                      baixa visão: contraste elevado, escala ampliada de
                      tipografia, botões táteis e leitura em voz alta pt-BR.
                    </p>
                  </article>
                </div>
              </div>

              {/* Bloco 2: Sustentabilidade e Modelo de Negócio */}
              <div className="space-y-4">
                <h3
                  className={`text-lg font-bold ${
                    altoContraste
                      ? 'text-white'
                      : 'text-[#1F2933] dark:text-[#F2F5F3]'
                  }`}
                >
                  2. Sustentabilidade e Modelo de Negócio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <article className={`p-6 flex flex-col justify-between gap-4 ${classeCard}`}>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-xs font-bold ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                        >
                          B2C · Acesso Universal
                        </span>
                        <Smartphone
                          className={`w-4 h-4 shrink-0 ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <h4 className="text-lg font-extrabold">
                        Plano Cidadão Gratuito
                      </h4>
                      <p className={`text-sm leading-relaxed ${textoSec}`}>
                        100% gratuito para a pessoa idosa. Inclui agenda diária
                        com confirmação em 1 clique, Jardim da Saúde sem
                        punição e leitor de bula por voz com linguagem simples.
                      </p>
                    </div>
                    <p
                      className={`pt-3 border-t text-xs font-semibold ${
                        altoContraste
                          ? 'border-white/40 text-[#FFD60A]'
                          : 'border-[#E8DFD2] dark:border-[#2E3B36] text-[#065F46] dark:text-[#5FD3A3]'
                      }`}
                    >
                      R$ 0 / mês para o idoso · Sem anúncios
                    </p>
                  </article>

                  <article className={`p-6 flex flex-col justify-between gap-4 ${classeCard}`}>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-xs font-bold ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                        >
                          B2C · Sustentabilidade Familiar
                        </span>
                        <Users
                          className={`w-4 h-4 shrink-0 ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <h4 className="text-lg font-extrabold">
                        Plano Família Conectada
                      </h4>
                      <p className={`text-sm leading-relaxed ${textoSec}`}>
                        Assinatura acessível para filhos e cuidadores acompanharem
                        a rotina em tempo real, receberem alertas gentis de
                        adesão e enviarem recados afetivos ao aplicativo.
                      </p>
                    </div>
                    <p
                      className={`pt-3 border-t text-xs font-semibold ${
                        altoContraste
                          ? 'border-white/40 text-[#FFD60A]'
                          : 'border-[#E8DFD2] dark:border-[#2E3B36] text-[#065F46] dark:text-[#5FD3A3]'
                      }`}
                    >
                      Monitoramento em tempo real · Múltiplos cuidadores
                    </p>
                  </article>

                  <article className={`p-6 flex flex-col justify-between gap-4 ${classeCard}`}>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`text-xs font-bold ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                        >
                          B2G · Saúde Pública
                        </span>
                        <Building2
                          className={`w-4 h-4 shrink-0 ${
                            altoContraste
                              ? 'text-[#FFD60A]'
                              : 'text-[#065F46] dark:text-[#5FD3A3]'
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                      <h4 className="text-lg font-extrabold">
                        Parcerias com Prefeituras e UBS
                      </h4>
                      <p className={`text-sm leading-relaxed ${textoSec}`}>
                        Licenciamento institucional para Secretarias de Saúde e
                        Unidades Básicas de Saúde integrarem o cuidado preventivo
                        à atenção básica, reduzindo reinternações evitáveis.
                      </p>
                    </div>
                    <p
                      className={`pt-3 border-t text-xs font-semibold ${
                        altoContraste
                          ? 'border-white/40 text-[#FFD60A]'
                          : 'border-[#E8DFD2] dark:border-[#2E3B36] text-[#065F46] dark:text-[#5FD3A3]'
                      }`}
                    >
                      Integração à atenção básica · Indicadores populacionais
                    </p>
                  </article>
                </div>
              </div>

              {/* Bloco 3: Compromisso LGPD */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  altoContraste
                    ? 'bg-black border-2 border-[#FFD60A]'
                    : 'bg-white dark:bg-[#1C2622] border-[#E8DFD2] dark:border-[#2E3B36]'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      altoContraste
                        ? 'border border-[#FFD60A] text-[#FFD60A]'
                        : 'bg-[#ECFDF5] dark:bg-[#1F3D32] text-[#065F46] dark:text-[#5FD3A3]'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold">
                      Compromisso LGPD · Privacidade por Padrão
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${textoSec}`}>
                      Consentimento ativo e revogável pela pessoa idosa a qualquer
                      momento, minimização de coleta e criptografia em trânsito
                      e em repouso para dados sensíveis de saúde.
                    </p>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-2 text-xs font-bold whitespace-nowrap shrink-0 ${
                    altoContraste
                      ? 'text-[#FFD60A]'
                      : 'text-[#065F46] dark:text-[#5FD3A3]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Controle total do titular</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer
        className={`border-t mt-12 ${
          altoContraste
            ? 'border-white'
            : 'border-[#E8DFD2] dark:border-[#2E3B36]'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs">
          <p className={textoSec}>
            Dose Certa · Global Solution FIAP (CitizenTech) · Acessibilidade WCAG AA/AAA e privacidade LGPD
          </p>
          <p className={textoSec}>
            App do Idoso disponível em React Native (Expo Snack)
          </p>
        </div>
      </footer>
    </div>
  );
}
