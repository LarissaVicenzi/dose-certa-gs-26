/**
 * Plataforma Web do Dose Certa — Portal do Familiar Cuidador e Painel de Impacto CitizenTech.
 * Consome a MESMA API REST (/api/*) do App Mobile do Idoso, respeitando em tempo real
 * o consentimento LGPD (se o idoso pausar o acesso no celular, os dados ficam ocultos aqui).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BotaoGrande } from '../components/BotaoGrande';
import { IconeCirculo } from '../components/IconeCirculo';
import { PainelGoogleDocsPDF } from '../components/PainelGoogleDocsPDF';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import {
  adicionarDose,
  enviarMensagemCuidador,
  getAgenda,
  getGamificacao,
  getMetricasImpacto,
} from '../services/api';
import { tema } from '../theme/tema';
import {
  Dose,
  Gamificacao,
  MetricasImpacto,
  PeriodoDia,
} from '../types/modelos';

const MAPA_ENDPOINTS = [
  {
    funcionalidade: 'Agenda diária do idoso',
    metodo: 'GET',
    endpoint: '/api/agenda (FastAPI: /v1/agenda)',
  },
  {
    funcionalidade: 'Cadastrar novo medicamento (Cuidador)',
    metodo: 'POST',
    endpoint: '/api/doses (FastAPI: /v1/doses)',
  },
  {
    funcionalidade: 'Confirmar dose tomada + pontuar jardim',
    metodo: 'POST',
    endpoint: '/api/doses/:id/confirmar',
  },
  {
    funcionalidade: 'Ler foto de bula/receita com IA Gemini',
    metodo: 'POST',
    endpoint: '/api/documentos/ler',
  },
  {
    funcionalidade: 'Tirar dúvida restrita à bula com IA',
    metodo: 'POST',
    endpoint: '/api/documentos/perguntar',
  },
  {
    funcionalidade: 'Consultar Jardim da Saúde e conquistas',
    metodo: 'GET',
    endpoint: '/api/gamificacao',
  },
  {
    funcionalidade: 'Enviar recado afetivo do cuidador (≤140)',
    metodo: 'POST',
    endpoint: '/api/cuidador/mensagem',
  },
  {
    funcionalidade: 'Pausar/reativar vínculo familiar (LGPD)',
    metodo: 'PATCH',
    endpoint: '/api/privacidade/cuidador',
  },
  {
    funcionalidade: 'Métricas de impacto CitizenTech ao vivo',
    metodo: 'GET',
    endpoint: '/api/metricas/impacto',
  },
  {
    funcionalidade: 'Transparência e exclusão de dados (LGPD)',
    metodo: 'GET / DELETE',
    endpoint: '/api/privacidade/dados',
  },
];

const PERIODOS: PeriodoDia[] = ['Manhã', 'Tarde', 'Noite'];

export function PlataformaWeb() {
  const { cores, fonte, espessuraBorda, toqueMinimo, altoContraste } =
    useAcessibilidade();

  const [agenda, setAgenda] = useState<Dose[]>([]);
  const [gamificacao, setGamificacao] = useState<Gamificacao | null>(null);
  const [metricas, setMetricas] = useState<MetricasImpacto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Form recado afetivo
  const [textoRecado, setTextoRecado] = useState('');
  const [enviandoRecado, setEnviandoRecado] = useState(false);
  const [feedbackRecado, setFeedbackRecado] = useState<string | null>(null);

  // Form novo medicamento
  const [nomeRemedio, setNomeRemedio] = useState('');
  const [doseTexto, setDoseTexto] = useState('1 comprimido');
  const [horarioTexto, setHorarioTexto] = useState('15:00');
  const [periodoSelecionado, setPeriodoSelecionado] =
    useState<PeriodoDia>('Tarde');
  const [instrucaoTexto, setInstrucaoTexto] = useState(
    'Tomar com um copo de água'
  );
  const [salvandoDose, setSalvandoDose] = useState(false);
  const [feedbackDose, setFeedbackDose] = useState<string | null>(null);

  // Secao expansivel de arquitetura
  const [mostrarMapaApi, setMostrarMapaApi] = useState(false);

  const carregarTudo = useCallback(async () => {
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
          : 'Não foi possível carregar os dados do portal.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  async function handleEnviarRecado() {
    const limpo = textoRecado.trim();
    if (!limpo) return;
    setEnviandoRecado(true);
    setFeedbackRecado(null);
    try {
      await enviarMensagemCuidador(limpo, 'Ana', 'Filha');
      setTextoRecado('');
      setFeedbackRecado(
        'Recado enviado! Ele já aparece no Jardim da Saúde no celular do seu familiar.'
      );
      await carregarTudo();
    } catch (err) {
      setFeedbackRecado(
        err instanceof Error ? err.message : 'Erro ao enviar recado.'
      );
    } finally {
      setEnviandoRecado(false);
    }
  }

  async function handleAdicionarMedicamento() {
    if (!nomeRemedio.trim() || !horarioTexto.trim()) return;
    setSalvandoDose(true);
    setFeedbackDose(null);
    try {
      await adicionarDose({
        nome: nomeRemedio.trim(),
        dose: doseTexto.trim() || '1 comprimido',
        horario: horarioTexto.trim(),
        periodo: periodoSelecionado,
        instrucao: instrucaoTexto.trim() || 'Seguir a receita médica',
      });
      setNomeRemedio('');
      setFeedbackDose(
        'Medicamento adicionado! Ele já aparece na tela Hoje do aplicativo do idoso.'
      );
      await carregarTudo();
    } catch (err) {
      setFeedbackDose(
        err instanceof Error ? err.message : 'Erro ao salvar medicamento.'
      );
    } finally {
      setSalvandoDose(false);
    }
  }

  const estiloCard = [
    styles.card,
    {
      backgroundColor: cores.superficie,
      borderWidth: espessuraBorda,
      borderColor: cores.borda,
    },
    !altoContraste && tema.sombraCard,
  ];

  const cuidadorAutorizado = metricas ? metricas.cuidadorAtivo : true;

  return (
    <View style={[styles.containerExterno, { backgroundColor: cores.fundo }]}>
      <View style={styles.faixaBrasil}>
        <View style={{ flex: 1, backgroundColor: cores.verdeBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.amareloBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.azulBrasil }} />
      </View>

      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={styles.conteudo}
        accessibilityLabel="Portal Web do Familiar Cuidador Dose Certa"
      >
        {/* Cabecalho institucional */}
        <View style={[estiloCard, styles.cabecalhoPortal]}>
          <View style={styles.cabecalhoEsquerda}>
            <IconeCirculo
              tipo="familia"
              corFundo={cores.primariaClara}
              tamanho={64}
              tamanhoIcone={34}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontSize: fonte(28, 34),
                  lineHeight: fonte(36, 42),
                  fontWeight: '800',
                  color: cores.texto,
                }}
                accessibilityRole="header"
              >
                Portal do Familiar Cuidador
              </Text>
              <Text
                style={{
                  fontSize: fonte(20, 24),
                  lineHeight: fonte(28, 34),
                  fontWeight: '500',
                  color: cores.textoSecundario,
                }}
              >
                Acompanhamento respeitoso de{' '}
                {metricas?.apelidoIdoso || 'Dona Maria'} · Conectado ao vivo à
                mesma API do app
              </Text>
            </View>
          </View>

          <View style={styles.cabecalhoAcoes}>
            {gamificacao?.cuidadorPresente && cuidadorAutorizado && (
              <View
                style={[
                  styles.seloCuidador,
                  {
                    backgroundColor: cores.acentoClaro,
                    borderWidth: espessuraBorda,
                    borderColor: cores.acento,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '800',
                    color: cores.textoSobreAcento,
                  }}
                >
                  🏅 Selo Cuidador Presente ({metricas?.diasVinculoCuidador || 12}{' '}
                  dias)
                </Text>
              </View>
            )}

            <Pressable
              onPress={carregarTudo}
              style={[
                styles.botaoAtualizar,
                {
                  minHeight: toqueMinimo,
                  backgroundColor: cores.primariaClara,
                  borderWidth: 2,
                  borderColor: cores.primaria,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Atualizar dados ao vivo do portal"
            >
              <Text
                style={{
                  fontSize: fonte(18, 22),
                  lineHeight: fonte(24, 28),
                  fontWeight: '800',
                  color: cores.primaria,
                }}
              >
                {carregando ? 'Atualizando...' : 'Atualizar dados'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Gerador oficial no Google Docs + Exportacao PDF (Framework + Gamification) */}
        <PainelGoogleDocsPDF />

        {erroGeral ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: cores.atrasadaFundo,
                borderWidth: espessuraBorda,
                borderColor: cores.atrasadaTexto,
              },
            ]}
            accessibilityRole="alert"
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '700',
                color: cores.atrasadaTexto,
              }}
            >
              {erroGeral}
            </Text>
          </View>
        ) : null}

        {/* Bloco LGPD: se o idoso pausou o acesso no celular */}
        {!cuidadorAutorizado ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: cores.acentoClaro,
                borderWidth: 2,
                borderColor: cores.acento,
              },
            ]}
            accessibilityRole="alert"
          >
            <Text
              style={{
                fontSize: fonte(24),
                lineHeight: fonte(32),
                fontWeight: '800',
                color: cores.textoSobreAcento,
              }}
            >
              🔒 Acompanhamento pausado pelo idoso (LGPD)
            </Text>
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(30),
                fontWeight: '500',
                color: cores.texto,
              }}
            >
              {metricas?.apelidoIdoso || 'Seu familiar'} desativou o
              compartilhamento na aba Ajustes do aplicativo. Por respeito à
              autonomia e privacidade, a agenda de doses fica oculta até que ela
              autorize novamente.
            </Text>
          </View>
        ) : (
          <>
            {/* Metricas de Impacto CitizenTech */}
            <View style={styles.gradeKpis}>
              <View style={[estiloCard, styles.cardKpi]}>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '700',
                    color: cores.textoSecundario,
                  }}
                >
                  Adesão de hoje
                </Text>
                <Text
                  style={{
                    fontSize: fonte(34, 42),
                    lineHeight: fonte(42, 50),
                    fontWeight: '800',
                    color: cores.primaria,
                  }}
                >
                  {metricas?.taxaAdesaoHoje ?? 0}%
                </Text>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '600',
                    color: cores.textoSecundario,
                  }}
                >
                  {metricas?.dosesTomadasHoje ?? 0} de{' '}
                  {metricas?.totalDosesHoje ?? 0} doses confirmadas
                </Text>
              </View>

              <View style={[estiloCard, styles.cardKpi]}>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '700',
                    color: cores.textoSecundario,
                  }}
                >
                  Jardim da Saúde
                </Text>
                <Text
                  style={{
                    fontSize: fonte(28, 34),
                    lineHeight: fonte(36, 42),
                    fontWeight: '800',
                    color: cores.texto,
                  }}
                >
                  {metricas?.estagioJardim || '🪴 Planta'}
                </Text>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '600',
                    color: cores.primaria,
                  }}
                >
                  {metricas?.pontosJardim ?? 0} pontos ·{' '}
                  {metricas?.sequenciaDias ?? 0} dias em dia
                </Text>
              </View>

              <View style={[estiloCard, styles.cardKpi]}>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '700',
                    color: cores.textoSecundario,
                  }}
                >
                  Bulas explicadas (IA)
                </Text>
                <Text
                  style={{
                    fontSize: fonte(34, 42),
                    lineHeight: fonte(42, 50),
                    fontWeight: '800',
                    color: cores.azulBrasil,
                  }}
                >
                  {metricas?.documentosLidosComIA ?? 0}
                </Text>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '600',
                    color: cores.textoSecundario,
                  }}
                >
                  Leituras em linguagem simples
                </Text>
              </View>

              <View style={[estiloCard, styles.cardKpi]}>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '700',
                    color: cores.textoSecundario,
                  }}
                >
                  Conquistas
                </Text>
                <Text
                  style={{
                    fontSize: fonte(34, 42),
                    lineHeight: fonte(42, 50),
                    fontWeight: '800',
                    color: cores.textoSobreAcento,
                  }}
                >
                  {metricas?.conquistasDesbloqueadas ?? 0}/
                  {metricas?.totalConquistas ?? 8}
                </Text>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(24, 28),
                    fontWeight: '600',
                    color: cores.textoSecundario,
                  }}
                >
                  Marcos de cuidado sem pressão
                </Text>
              </View>
            </View>

            {/* Coluna principal: Agenda do dia + Acoes do Cuidador */}
            <View style={styles.gradeDuasColunas}>
              {/* Esquerda: Agenda ao vivo */}
              <View style={[estiloCard, styles.colunaFlex]}>
                <Text
                  style={{
                    fontSize: fonte(24),
                    lineHeight: fonte(32),
                    fontWeight: '800',
                    color: cores.texto,
                  }}
                >
                  Agenda de hoje ({metricas?.apelidoIdoso || 'Dona Maria'})
                </Text>
                <Text
                  style={{
                    fontSize: fonte(18, 22),
                    lineHeight: fonte(26, 30),
                    fontWeight: '500',
                    color: cores.textoSecundario,
                  }}
                >
                  Acompanhe com carinho — sem alertas punitivos.
                </Text>

                <View style={styles.listaDoses}>
                  {agenda.map((dose) => {
                    const corFundoChip =
                      dose.status === 'tomada'
                        ? cores.sucessoFundo
                        : dose.status === 'atrasada'
                          ? cores.atrasadaFundo
                          : cores.pendenteFundo;
                    const corTextoChip =
                      dose.status === 'tomada'
                        ? cores.sucessoTexto
                        : dose.status === 'atrasada'
                          ? cores.atrasadaTexto
                          : cores.pendenteTexto;
                    const rotuloStatus =
                      dose.status === 'tomada'
                        ? `✓ Tomada às ${dose.horarioTomado || dose.horario}`
                        : dose.status === 'atrasada'
                          ? 'Ainda dá tempo'
                          : 'Pendente';

                    return (
                      <View
                        key={dose.id}
                        style={[
                          styles.itemDoseWeb,
                          {
                            backgroundColor: cores.fundo,
                            borderWidth: espessuraBorda,
                            borderColor: cores.borda,
                          },
                        ]}
                      >
                        <View style={styles.linhaTopoDose}>
                          <Text
                            style={{
                              fontSize: fonte(20),
                              lineHeight: fonte(28),
                              fontWeight: '800',
                              color: cores.texto,
                              flex: 1,
                            }}
                          >
                            {dose.horario} · {dose.nome}
                          </Text>
                          <View
                            style={[
                              styles.chipStatus,
                              { backgroundColor: corFundoChip },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: fonte(16, 20),
                                lineHeight: fonte(22, 26),
                                fontWeight: '800',
                                color: corTextoChip,
                              }}
                            >
                              {rotuloStatus}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            fontSize: fonte(18, 22),
                            lineHeight: fonte(26, 30),
                            fontWeight: '500',
                            color: cores.textoSecundario,
                          }}
                        >
                          {dose.periodo} · {dose.dose} · {dose.instrucao}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Direita: Recado afetivo + Cadastrar remedio */}
              <View style={[styles.colunaFlex, { gap: tema.espacamento.m }]}>
                {/* Enviar recado de carinho */}
                <View style={estiloCard}>
                  <Text
                    style={{
                      fontSize: fonte(24),
                      lineHeight: fonte(32),
                      fontWeight: '800',
                      color: cores.texto,
                    }}
                  >
                    💌 Enviar recado de carinho
                  </Text>
                  <Text
                    style={{
                      fontSize: fonte(18, 22),
                      lineHeight: fonte(26, 30),
                      fontWeight: '500',
                      color: cores.textoSecundario,
                    }}
                  >
                    Aparece no Jardim da Saúde no aplicativo do idoso (máx. 140
                    caracteres).
                  </Text>

                  {gamificacao?.mensagemFamilia && (
                    <View
                      style={[
                        styles.recadoAtualBox,
                        {
                          backgroundColor: cores.acentoClaro,
                          borderColor: cores.acento,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: fonte(18, 22),
                          lineHeight: fonte(26, 30),
                          fontWeight: '700',
                          color: cores.textoSobreAcento,
                        }}
                      >
                        Recado atual ({gamificacao.mensagemFamilia.data}): “
                        {gamificacao.mensagemFamilia.texto}”
                      </Text>
                    </View>
                  )}

                  <TextInput
                    value={textoRecado}
                    onChangeText={setTextoRecado}
                    maxLength={140}
                    placeholder="Ex: Parabéns pelo cuidado hoje, mãe! Passo aí à tarde."
                    style={[
                      styles.campoInput,
                      {
                        minHeight: Math.max(56, toqueMinimo),
                        backgroundColor: cores.fundo,
                        borderColor: cores.borda,
                        fontSize: fonte(20),
                        color: cores.texto,
                      },
                    ]}
                    accessibilityLabel="Escreva um recado curto de carinho de até 140 caracteres"
                  />

                  <Text
                    style={{
                      fontSize: fonte(16, 20),
                      lineHeight: fonte(22, 26),
                      fontWeight: '600',
                      color: cores.textoSecundario,
                    }}
                  >
                    {textoRecado.length}/140 caracteres
                  </Text>

                  <BotaoGrande
                    titulo={enviandoRecado ? 'Enviando...' : 'Enviar recado'}
                    variante="primario"
                    desabilitado={enviandoRecado || !textoRecado.trim()}
                    onPress={handleEnviarRecado}
                    accessibilityLabel="Enviar recado afetivo para o aplicativo do idoso"
                  />

                  {feedbackRecado ? (
                    <Text
                      style={{
                        fontSize: fonte(18, 22),
                        lineHeight: fonte(26, 30),
                        fontWeight: '700',
                        color: cores.primaria,
                      }}
                      accessibilityRole="alert"
                    >
                      {feedbackRecado}
                    </Text>
                  ) : null}
                </View>

                {/* Cadastrar novo medicamento */}
                <View style={estiloCard}>
                  <Text
                    style={{
                      fontSize: fonte(24),
                      lineHeight: fonte(32),
                      fontWeight: '800',
                      color: cores.texto,
                    }}
                  >
                    💊 Incluir medicamento na agenda
                  </Text>

                  <TextInput
                    value={nomeRemedio}
                    onChangeText={setNomeRemedio}
                    placeholder="Nome do remédio (ex: Vitamina D 1000 UI)"
                    style={[
                      styles.campoInput,
                      {
                        minHeight: Math.max(56, toqueMinimo),
                        backgroundColor: cores.fundo,
                        borderColor: cores.borda,
                        fontSize: fonte(20),
                        color: cores.texto,
                      },
                    ]}
                    accessibilityLabel="Nome do medicamento"
                  />

                  <View style={styles.linhaCampos}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        value={horarioTexto}
                        onChangeText={setHorarioTexto}
                        placeholder="Horário (ex: 15:00)"
                        style={[
                          styles.campoInput,
                          {
                            minHeight: Math.max(56, toqueMinimo),
                            backgroundColor: cores.fundo,
                            borderColor: cores.borda,
                            fontSize: fonte(20),
                            color: cores.texto,
                          },
                        ]}
                        accessibilityLabel="Horário do medicamento"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        value={doseTexto}
                        onChangeText={setDoseTexto}
                        placeholder="Dose (ex: 1 cápsula)"
                        style={[
                          styles.campoInput,
                          {
                            minHeight: Math.max(56, toqueMinimo),
                            backgroundColor: cores.fundo,
                            borderColor: cores.borda,
                            fontSize: fonte(20),
                            color: cores.texto,
                          },
                        ]}
                        accessibilityLabel="Quantidade da dose"
                      />
                    </View>
                  </View>

                  <View style={styles.linhaPeriodos}>
                    {PERIODOS.map((p) => {
                      const ativo = periodoSelecionado === p;
                      return (
                        <Pressable
                          key={p}
                          onPress={() => setPeriodoSelecionado(p)}
                          style={[
                            styles.chipPeriodo,
                            {
                              minHeight: toqueMinimo >= 72 ? 60 : 48,
                              backgroundColor: ativo
                                ? cores.primaria
                                : cores.fundo,
                              borderWidth: 2,
                              borderColor: ativo ? cores.primaria : cores.borda,
                            },
                          ]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: ativo }}
                          accessibilityLabel={`Período ${p}`}
                        >
                          <Text
                            style={{
                              fontSize: fonte(18, 22),
                              lineHeight: fonte(24, 28),
                              fontWeight: '800',
                              color: ativo
                                ? cores.textoSobrePrimaria
                                : cores.texto,
                            }}
                          >
                            {p}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <TextInput
                    value={instrucaoTexto}
                    onChangeText={setInstrucaoTexto}
                    placeholder="Instrução simples (ex: Tomar após o café)"
                    style={[
                      styles.campoInput,
                      {
                        minHeight: Math.max(56, toqueMinimo),
                        backgroundColor: cores.fundo,
                        borderColor: cores.borda,
                        fontSize: fonte(20),
                        color: cores.texto,
                      },
                    ]}
                    accessibilityLabel="Instrução de como tomar o medicamento"
                  />

                  <BotaoGrande
                    titulo={
                      salvandoDose ? 'Salvando...' : 'Adicionar à agenda do dia'
                    }
                    variante="secundario"
                    desabilitado={
                      salvandoDose || !nomeRemedio.trim() || !horarioTexto.trim()
                    }
                    onPress={handleAdicionarMedicamento}
                    accessibilityLabel="Adicionar novo medicamento na agenda do idoso"
                  />

                  {feedbackDose ? (
                    <Text
                      style={{
                        fontSize: fonte(18, 22),
                        lineHeight: fonte(26, 30),
                        fontWeight: '700',
                        color: cores.primaria,
                      }}
                      accessibilityRole="alert"
                    >
                      {feedbackDose}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Eventos recentes de impacto */}
            {metricas && metricas.eventosRecentes.length > 0 && (
              <View style={estiloCard}>
                <Text
                  style={{
                    fontSize: fonte(24),
                    lineHeight: fonte(32),
                    fontWeight: '800',
                    color: cores.texto,
                  }}
                >
                  Atividades recentes registradas na API
                </Text>
                <View style={styles.listaEventos}>
                  {metricas.eventosRecentes.map((ev, idx) => (
                    <View
                      key={`${ev.tipo}-${idx}`}
                      style={[
                        styles.linhaEvento,
                        {
                          borderBottomWidth:
                            idx < metricas.eventosRecentes.length - 1 ? 1 : 0,
                          borderColor: cores.borda,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: fonte(18, 22),
                          lineHeight: fonte(26, 30),
                          fontWeight: '700',
                          color: cores.primaria,
                          minWidth: 64,
                        }}
                      >
                        {ev.registradoEm}
                      </Text>
                      <Text
                        style={{
                          fontSize: fonte(18, 22),
                          lineHeight: fonte(26, 30),
                          fontWeight: '500',
                          color: cores.texto,
                          flex: 1,
                        }}
                      >
                        {ev.descricao}
                      </Text>
                      {ev.pontos > 0 && (
                        <Text
                          style={{
                            fontSize: fonte(18, 22),
                            lineHeight: fonte(26, 30),
                            fontWeight: '800',
                            color: cores.textoSobreAcento,
                          }}
                        >
                          +{ev.pontos} pts
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Mapa Funcionalidade MVP -> Endpoint (Framework Application) */}
        <View style={estiloCard}>
          <Pressable
            onPress={() => setMostrarMapaApi((v) => !v)}
            style={styles.cabecalhoExpansivel}
            accessibilityRole="button"
            accessibilityLabel="Mostrar ou ocultar mapa de endpoints da API"
          >
            <Text
              style={{
                fontSize: fonte(22, 28),
                lineHeight: fonte(30, 36),
                fontWeight: '800',
                color: cores.azulBrasil,
                flex: 1,
              }}
            >
              Mapa MVP → Endpoints da API (Framework Application)
            </Text>
            <Text
              style={{
                fontSize: fonte(20, 24),
                lineHeight: fonte(26, 30),
                fontWeight: '800',
                color: cores.primaria,
              }}
            >
              {mostrarMapaApi ? 'Ocultar ▲' : 'Ver mapa ▼'}
            </Text>
          </Pressable>

          {mostrarMapaApi && (
            <View style={styles.listaEndpoints}>
              {MAPA_ENDPOINTS.map((item) => (
                <View
                  key={item.endpoint}
                  style={[
                    styles.itemEndpoint,
                    {
                      backgroundColor: cores.fundo,
                      borderColor: cores.borda,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: fonte(18, 22),
                      lineHeight: fonte(24, 28),
                      fontWeight: '800',
                      color: cores.primaria,
                    }}
                  >
                    {item.metodo} · {item.endpoint}
                  </Text>
                  <Text
                    style={{
                      fontSize: fonte(18, 22),
                      lineHeight: fonte(26, 30),
                      fontWeight: '500',
                      color: cores.texto,
                    }}
                  >
                    {item.funcionalidade}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  containerExterno: {
    flex: 1,
    width: '100%',
    maxWidth: 1120,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
  },
  faixaBrasil: {
    flexDirection: 'row',
    height: 8,
    width: '100%',
  },
  rolagem: {
    flex: 1,
  },
  conteudo: {
    padding: 24,
    gap: 20,
    paddingBottom: 36,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 14,
  },
  cabecalhoPortal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  cabecalhoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 280,
  },
  cabecalhoAcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  seloCuidador: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  botaoAtualizar: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeKpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardKpi: {
    flex: 1,
    minWidth: 220,
    gap: 6,
  },
  gradeDuasColunas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'flex-start',
  },
  colunaFlex: {
    flex: 1,
    minWidth: 320,
  },
  listaDoses: {
    gap: 12,
  },
  itemDoseWeb: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  linhaTopoDose: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chipStatus: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recadoAtualBox: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  campoInput: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '500',
  },
  linhaCampos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linhaPeriodos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipPeriodo: {
    flex: 1,
    minWidth: 96,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listaEventos: {
    gap: 4,
  },
  linhaEvento: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  cabecalhoExpansivel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  listaEndpoints: {
    gap: 10,
  },
  itemEndpoint: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
});
