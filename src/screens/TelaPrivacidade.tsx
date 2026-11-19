/**
 * Tela 6: Ajustes (Acessibilidade + Privacidade LGPD) com ilustracoes 2D planas.
 * Inclui card de destaque no topo para abrir a tela completa de Acessibilidade.
 */
import React, { useState } from 'react';
import { BotaoGrande } from '../components/BotaoGrande';
import { IconeCirculo } from '../components/IconeCirculo';
import { ScrollView, StyleSheet, Text, View } from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { ESCALAS_TEXTO, ModoTema, tema } from '../theme/tema';
import { DadosUsuario, VinculoCuidador } from '../types/modelos';

const NOMES_TEMA: Record<ModoTema, string> = {
  claro: 'Claro',
  escuro: 'Escuro',
  alto_contraste: 'Alto contraste',
  automatico: 'Automático',
};

export function textoParaLerAjustes(cuidador: VinculoCuidador): string {
  const statusFamiliar = cuidador.ativo
    ? `${cuidador.nome}, ${cuidador.parentesco}, tem acesso autorizado.`
    : 'Nenhum familiar tem acesso aos seus dados neste momento.';

  return (
    'Tela Ajustes. No topo você pode abrir as opções de Acessibilidade para mudar tamanho das letras, cores e voz. ' +
    `Em privacidade: ${statusFamiliar} ` +
    'Você também pode tocar em Ver meus dados ou em Apagar meus dados.'
  );
}

export function TelaPrivacidade() {
  const {
    cuidador,
    revogarCuidador,
    reativarCuidador,
    buscarMeusDados,
    apagarTodosOsDados,
    abrirAcessibilidade,
  } = useApp();

  const { preferencias, cores, fonte, espessuraBorda, altoContraste } =
    useAcessibilidade();

  const [dadosVisiveis, setDadosVisiveis] = useState<DadosUsuario | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(false);

  const [confirmandoRevogacao, setConfirmandoRevogacao] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [apagando, setApagando] = useState(false);

  const nivelTextoAtual =
    ESCALAS_TEXTO.find((e) => e.valor === preferencias.escalaFonte)?.rotulo ||
    'Normal';

  async function handleVerDados() {
    if (dadosVisiveis) {
      setDadosVisiveis(null);
      return;
    }
    setCarregandoDados(true);
    try {
      const dados = await buscarMeusDados();
      setDadosVisiveis(dados);
    } finally {
      setCarregandoDados(false);
    }
  }

  async function handleRevogar() {
    await revogarCuidador();
    setConfirmandoRevogacao(false);
    if (dadosVisiveis) {
      const atualizados = await buscarMeusDados();
      setDadosVisiveis(atualizados);
    }
  }

  async function handleReativar() {
    await reativarCuidador();
    if (dadosVisiveis) {
      const atualizados = await buscarMeusDados();
      setDadosVisiveis(atualizados);
    }
  }

  async function handleConfirmarApagar() {
    setApagando(true);
    try {
      await apagarTodosOsDados();
    } finally {
      setApagando(false);
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={styles.conteudo}
      accessibilityLabel="Tela Ajustes: acessibilidade e privacidade"
    >
      <View style={styles.cabecalho}>
        <Text
          style={{
            fontSize: fonte(30),
            lineHeight: fonte(38),
            fontWeight: '800',
            color: cores.texto,
          }}
          accessibilityRole="header"
        >
          Ajustes
        </Text>
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(30),
            fontWeight: '500',
            color: cores.textoSecundario,
          }}
        >
          Deixe o aplicativo confortável para você e controle seus dados.
        </Text>
      </View>

      {/* CARD NO TOPO: ACESSIBILIDADE */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cores.primariaClara,
            borderWidth: 2,
            borderColor: cores.primaria,
          },
          !altoContraste && tema.sombraCard,
        ]}
      >
        <View style={styles.linhaTituloCard}>
          <IconeCirculo
            tipo="acessibilidade"
            corFundo={cores.superficie}
            corIcone={cores.primaria}
            tamanho={56}
            tamanhoIcone={30}
          />
          <View style={styles.textosTituloCard}>
            <Text
              style={{
                fontSize: fonte(24),
                lineHeight: fonte(32),
                fontWeight: '700',
                color: cores.primaria,
              }}
              accessibilityRole="header"
            >
              Acessibilidade ♿
            </Text>
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '500',
                color: cores.texto,
              }}
            >
              Letra {nivelTextoAtual} · Tema {NOMES_TEMA[preferencias.modoTema]}
              {preferencias.botoesMaiores ? ' · Botões maiores' : ''}
            </Text>
          </View>
        </View>

        <BotaoGrande
          titulo="Abrir Acessibilidade"
          variante="primario"
          onPress={abrirAcessibilidade}
          accessibilityLabel="Abrir tela de acessibilidade para ajustar letras, cores e voz"
        />
      </View>

      {/* QUEM PODE VER MEUS DADOS */}
      <View style={estiloCard}>
        <View style={styles.linhaTituloCard}>
          <IconeCirculo
            tipo="familia"
            corFundo={cores.acentoClaro}
            tamanho={56}
            tamanhoIcone={28}
          />
          <View style={styles.textosTituloCard}>
            <Text
              style={{
                fontSize: fonte(24),
                lineHeight: fonte(32),
                fontWeight: '700',
                color: cores.texto,
              }}
              accessibilityRole="header"
            >
              Quem pode ver meus dados
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.caixaCuidador,
            {
              backgroundColor: cores.fundo,
              borderWidth: altoContraste ? 2 : 0,
              borderColor: cores.borda,
            },
          ]}
        >
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            {cuidador.nome} · {cuidador.parentesco}
          </Text>
          <View
            style={[
              styles.chipStatus,
              {
                backgroundColor: cuidador.ativo
                  ? cores.sucessoFundo
                  : cores.atrasadaFundo,
                borderWidth: altoContraste ? 2 : 0,
                borderColor: cuidador.ativo
                  ? cores.sucessoTexto
                  : cores.atrasadaTexto,
              },
            ]}
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '700',
                color: cuidador.ativo
                  ? cores.sucessoTexto
                  : cores.atrasadaTexto,
              }}
            >
              {cuidador.ativo ? '✓ Acesso autorizado' : 'Acesso revogado'}
            </Text>
          </View>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            {cuidador.ativo
              ? `Vê apenas se você tomou os remédios de hoje (desde ${cuidador.desde}).`
              : 'Neste momento, nenhum familiar consegue ver seus horários.'}
          </Text>
        </View>

        {cuidador.ativo ? (
          !confirmandoRevogacao ? (
            <BotaoGrande
              titulo="Revogar acesso"
              variante="secundario"
              onPress={() => setConfirmandoRevogacao(true)}
              accessibilityLabel={`Revogar acesso de ${cuidador.nome}`}
            />
          ) : (
            <View
              style={[
                styles.caixaConfirmacaoSuave,
                {
                  backgroundColor: cores.atrasadaFundo,
                  borderWidth: altoContraste ? 2 : 0,
                  borderColor: cores.atrasadaTexto,
                },
              ]}
              accessibilityRole="alert"
            >
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(30),
                  fontWeight: '500',
                  color: cores.texto,
                }}
              >
                Quer mesmo retirar o acesso de {cuidador.nome}? Você pode
                autorizar de novo quando quiser.
              </Text>
              <BotaoGrande
                titulo="Sim, revogar acesso"
                variante="perigoSolido"
                onPress={handleRevogar}
                accessibilityLabel="Confirmar revogacao do acesso do familiar"
              />
              <BotaoGrande
                titulo="Manter acesso"
                variante="secundario"
                onPress={() => setConfirmandoRevogacao(false)}
                accessibilityLabel="Cancelar e manter acesso do familiar"
              />
            </View>
          )
        ) : (
          <BotaoGrande
            titulo={`Autorizar ${cuidador.nome} novamente`}
            variante="secundario"
            onPress={handleReativar}
            accessibilityLabel={`Autorizar ${cuidador.nome} novamente`}
          />
        )}
      </View>

      {/* VER MEUS DADOS */}
      <View style={estiloCard}>
        <View style={styles.linhaTituloCard}>
          <IconeCirculo
            tipo="documento"
            corFundo={cores.primariaClara}
            corIcone={cores.primaria}
            tamanho={56}
            tamanhoIcone={28}
          />
          <View style={styles.textosTituloCard}>
            <Text
              style={{
                fontSize: fonte(24),
                lineHeight: fonte(32),
                fontWeight: '700',
                color: cores.texto,
              }}
            >
              Ver meus dados
            </Text>
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(30),
                fontWeight: '500',
                color: cores.textoSecundario,
              }}
            >
              Confira tudo o que está guardado no aplicativo.
            </Text>
          </View>
        </View>

        <BotaoGrande
          titulo={
            carregandoDados
              ? 'Carregando...'
              : dadosVisiveis
              ? 'Esconder meus dados'
              : 'Ver meus dados'
          }
          variante="secundario"
          desabilitado={carregandoDados}
          onPress={handleVerDados}
          accessibilityLabel="Ver meus dados guardados"
        />

        {dadosVisiveis && (
          <View
            style={[
              styles.listaDados,
              {
                backgroundColor: cores.fundo,
                borderWidth: altoContraste ? 2 : 0,
                borderColor: cores.borda,
              },
            ]}
            accessibilityLabel="Resumo dos seus dados"
          >
            {[
              { chave: 'Apelido', valor: dadosVisiveis.apelido },
              {
                chave: 'Familiar vinculado',
                valor: `${dadosVisiveis.cuidadorNome} · ${
                  dadosVisiveis.cuidadorAtivo ? 'Autorizado' : 'Revogado'
                }`,
              },
              {
                chave: 'Consentimento LGPD',
                valor: `Aceito em ${dadosVisiveis.consentimentoAceitoEm}`,
              },
              {
                chave: 'Remédios de hoje',
                valor: `${dadosVisiveis.dosesTomadasHoje} de ${dadosVisiveis.totalDosesHoje} tomados`,
              },
              {
                chave: 'Jardim da Saúde',
                valor: `${dadosVisiveis.pontosJardim} pontos · ${dadosVisiveis.sequenciaDias} dias`,
              },
              { chave: 'Bulas lidas', valor: String(dadosVisiveis.documentosLidos) },
              {
                chave: 'Fila sem internet',
                valor: `${dadosVisiveis.itensNaFilaOffline} ${
                  dadosVisiveis.itensNaFilaOffline === 1 ? 'item' : 'itens'
                }`,
              },
            ].map((linha) => (
              <View
                key={linha.chave}
                style={[styles.linhaDado, { borderColor: cores.borda }]}
              >
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '500',
                    color: cores.textoSecundario,
                  }}
                >
                  {linha.chave}
                </Text>
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '700',
                    color: cores.texto,
                  }}
                >
                  {linha.valor}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* APAGAR MEUS DADOS */}
      <View style={estiloCard}>
        <View style={styles.linhaTituloCard}>
          <IconeCirculo
            tipo="lixeira"
            corFundo={cores.atrasadaFundo}
            corIcone={cores.atrasadaTexto}
            tamanho={56}
            tamanhoIcone={28}
          />
          <View style={styles.textosTituloCard}>
            <Text
              style={{
                fontSize: fonte(24),
                lineHeight: fonte(32),
                fontWeight: '700',
                color: cores.texto,
              }}
            >
              Apagar meus dados
            </Text>
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(30),
                fontWeight: '500',
                color: cores.textoSecundario,
              }}
            >
              Remove seu apelido, histórico de doses, bulas lidas, pontos do
              jardim e vínculo familiar.
            </Text>
          </View>
        </View>

        {!confirmandoExclusao ? (
          <BotaoGrande
            titulo="Apagar meus dados"
            variante="perigo"
            onPress={() => setConfirmandoExclusao(true)}
            accessibilityLabel="Iniciar exclusao de todos os meus dados"
          />
        ) : (
          <View
            style={[
              styles.caixaConfirmacaoSuave,
              {
                backgroundColor: cores.atrasadaFundo,
                borderWidth: altoContraste ? 2 : 0,
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
              Confirmação necessária
            </Text>
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(30),
                fontWeight: '500',
                color: cores.texto,
              }}
            >
              Ao confirmar, apagaremos seu apelido, seus registros de remédios,
              seu jardim e o acesso da família. Você voltará para a tela inicial.
            </Text>
            <BotaoGrande
              titulo={apagando ? 'Apagando...' : 'Sim, apagar tudo'}
              variante="perigoSolido"
              desabilitado={apagando}
              onPress={handleConfirmarApagar}
              accessibilityLabel="Confirmar exclusao definitiva de todos os dados"
            />
            <BotaoGrande
              titulo="Cancelar"
              variante="secundario"
              desabilitado={apagando}
              onPress={() => setConfirmandoExclusao(false)}
              accessibilityLabel="Cancelar e manter meus dados"
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: tema.espacamento.tela,
    gap: tema.espacamento.m,
    paddingBottom: tema.espacamento.xg,
  },
  cabecalho: {
    gap: 6,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: tema.espacamento.m,
  },
  linhaTituloCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  textosTituloCard: {
    flex: 1,
    gap: 4,
  },
  caixaCuidador: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  chipStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: tema.formas.raioChip,
  },
  listaDados: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  linhaDado: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    gap: 2,
  },
  caixaConfirmacaoSuave: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
});
