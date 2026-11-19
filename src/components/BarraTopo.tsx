/**
 * Barra superior fixa em todas as telas com:
 * - Faixa institucional do Brasil
 * - Marca Dose Certa
 * - Botao fixo de Acessibilidade (♿)
 * - Botao fixo "Ouvir esta tela" (🔊 / Parar)
 * - Indicador visual enquanto o app esta lendo em voz alta
 * - Controle opcional de modo Online/Offline e avisos de sincronizacao
 */
import React from 'react';
import { BotaoOuvirTela } from './BotaoOuvirTela';
import { IconeCirculo } from './IconeCirculo';
import { Ilustracao2D } from './Ilustracao2D';
import { Pressable, StyleSheet, Text, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { tema } from '../theme/tema';

interface BarraTopoProps {
  textoParaLer: string;
  mostrarControleOffline?: boolean;
}

export function BarraTopo({
  textoParaLer,
  mostrarControleOffline = false,
}: BarraTopoProps) {
  const {
    cores,
    fonte,
    espessuraBorda,
    toqueMinimo,
    falandoAgora,
    pararLeitura,
  } = useAcessibilidade();

  const {
    telaAtual,
    abrirAcessibilidade,
    modoOffline,
    alternarModoOffline,
    filaOffline,
    avisoSincronizacao,
    limparAvisoSincronizacao,
  } = useApp();

  const naTelaAcessibilidade = telaAtual === 'acessibilidade';

  return (
    <View
      style={[
        styles.envoltorio,
        {
          backgroundColor: cores.superficie,
          borderBottomWidth: espessuraBorda,
          borderColor: cores.borda,
        },
      ]}
    >
      <View style={styles.faixaBrasil} accessibilityRole="none">
        <View style={{ flex: 1, backgroundColor: cores.verdeBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.amareloBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.azulBrasil }} />
      </View>

      <View style={styles.barra} accessibilityRole="header">
        <View style={styles.marca}>
          <IconeCirculo
            tipo="capsula"
            corFundo={cores.primariaClara}
            tamanho={40}
            tamanhoIcone={22}
          />
          <Text
            style={{
              fontSize: fonte(20, 24),
              lineHeight: fonte(24, 28),
              fontWeight: '800',
              color: cores.azulBrasil,
              flexShrink: 1,
            }}
          >
            Dose Certa
          </Text>
        </View>

        <View style={styles.acoesTopo}>
          <Pressable
            onPress={abrirAcessibilidade}
            style={[
              styles.botaoAcessibilidade,
              {
                minWidth: toqueMinimo,
                minHeight: toqueMinimo,
                borderRadius: toqueMinimo / 2,
                backgroundColor: naTelaAcessibilidade
                  ? cores.primaria
                  : cores.acentoClaro,
                borderColor: naTelaAcessibilidade
                  ? cores.primaria
                  : cores.acento,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: naTelaAcessibilidade }}
            accessibilityLabel={
              naTelaAcessibilidade
                ? 'Fechar tela de acessibilidade e voltar'
                : 'Abrir opcoes de acessibilidade: tamanho da letra, cores e voz'
            }
          >
            <Text
              style={{
                fontSize: fonte(22, 26),
                lineHeight: fonte(26, 30),
                fontWeight: '800',
                color: naTelaAcessibilidade
                  ? cores.textoSobrePrimaria
                  : cores.textoSobreAcento,
              }}
            >
              ♿
            </Text>
          </Pressable>

          <BotaoOuvirTela textoParaLer={textoParaLer} />
        </View>
      </View>

      {falandoAgora && (
        <View
          style={[
            styles.faixaFalando,
            {
              backgroundColor: cores.primariaClara,
              borderColor: cores.primaria,
            },
          ]}
          accessibilityRole="alert"
        >
          <View style={styles.linhaFalando}>
            <Ilustracao2D
              tipo="som"
              tamanho={20}
              corPrincipal={cores.primaria}
            />
            <Text
              style={{
                fontSize: fonte(18, 26),
                lineHeight: fonte(24, 34),
                fontWeight: '800',
                color: cores.primaria,
                flex: 1,
              }}
            >
              Lendo em voz alta...
            </Text>
          </View>
          <Pressable
            onPress={pararLeitura}
            style={[
              styles.botaoPararBarra,
              {
                minHeight: toqueMinimo >= 72 ? 56 : 44,
                backgroundColor: cores.primaria,
                borderColor: cores.borda,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Parar leitura em voz alta"
          >
            <Text
              style={{
                fontSize: fonte(18, 22),
                lineHeight: fonte(22, 26),
                fontWeight: '800',
                color: cores.textoSobrePrimaria,
              }}
            >
              Parar
            </Text>
          </Pressable>
        </View>
      )}

      {mostrarControleOffline && (
        <View
          style={[
            styles.barraStatusConexao,
            {
              backgroundColor: cores.fundo,
              borderColor: cores.borda,
            },
          ]}
        >
          <Text
            style={{
              fontSize: fonte(18, 24),
              lineHeight: fonte(24, 30),
              fontWeight: '700',
              color: cores.textoSecundario,
              flex: 1,
            }}
          >
            {modoOffline ? 'Sem internet (simulado)' : 'Conexão normal'}
          </Text>

          <Pressable
            onPress={alternarModoOffline}
            style={[
              styles.botaoOffline,
              {
                minHeight: toqueMinimo >= 72 ? 60 : 48,
                backgroundColor: modoOffline
                  ? cores.acentoClaro
                  : cores.sucessoFundo,
                borderColor: modoOffline ? cores.acento : cores.verdeBrasil,
              },
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: modoOffline }}
            accessibilityLabel={
              modoOffline
                ? 'Modo offline ligado. Toque para voltar a ficar online.'
                : 'Conectado. Toque para simular modo offline.'
            }
          >
            <View style={styles.linhaBotaoOffline}>
              <Ilustracao2D
                tipo={modoOffline ? 'sinalOffline' : 'sinalOnline'}
                tamanho={18}
                corPrincipal={
                  modoOffline ? cores.textoSobreAcento : cores.sucessoTexto
                }
              />
              <Text
                style={{
                  fontSize: fonte(18, 24),
                  lineHeight: fonte(22, 28),
                  fontWeight: '800',
                  color: modoOffline
                    ? cores.textoSobreAcento
                    : cores.sucessoTexto,
                }}
              >
                {modoOffline ? 'Offline' : 'Online'}
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      {avisoSincronizacao && (
        <View
          style={[
            styles.faixaAviso,
            {
              backgroundColor: modoOffline
                ? cores.pendenteFundo
                : cores.sucessoFundo,
              borderColor: cores.borda,
            },
          ]}
          accessibilityRole="alert"
        >
          <View style={styles.faixaTextoContainer}>
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '700',
                color: modoOffline ? cores.pendenteTexto : cores.sucessoTexto,
              }}
            >
              {modoOffline && filaOffline.length > 0
                ? `Modo offline · ${filaOffline.length} ${
                    filaOffline.length === 1
                      ? 'registro na fila'
                      : 'registros na fila'
                  }`
                : avisoSincronizacao}
            </Text>
          </View>

          <Pressable
            onPress={limparAvisoSincronizacao}
            style={[
              styles.botaoFecharAviso,
              {
                minWidth: toqueMinimo,
                minHeight: toqueMinimo,
                borderRadius: toqueMinimo / 2,
                backgroundColor: cores.superficie,
                borderColor: cores.primaria,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
          >
            <Text
              style={{
                fontSize: fonte(20, 26),
                lineHeight: fonte(24, 30),
                fontWeight: '800',
                color: cores.primaria,
              }}
            >
              OK
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  envoltorio: {
    width: '100%',
  },
  faixaBrasil: {
    flexDirection: 'row',
    height: 6,
    width: '100%',
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: tema.espacamento.m,
    paddingVertical: 10,
    gap: 8,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  acoesTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  botaoAcessibilidade: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  faixaFalando: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: tema.espacamento.m,
    paddingVertical: 10,
    borderTopWidth: 2,
    gap: 10,
  },
  linhaFalando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  botaoPararBarra: {
    borderRadius: 24,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barraStatusConexao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: tema.espacamento.m,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  botaoOffline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linhaBotaoOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  faixaAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: tema.espacamento.m,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  faixaTextoContainer: {
    flex: 1,
  },
  botaoFecharAviso: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
