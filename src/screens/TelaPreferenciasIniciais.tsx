/**
 * Tela de onboarding rapido de acessibilidade ("Como prefere ver este app?").
 * Aparece uma unica vez apos o consentimento inicial.
 */
import React from 'react';
import { BotaoGrande } from '../components/BotaoGrande';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { ESCALAS_TEXTO, ModoTema, tema } from '../theme/tema';

export function textoParaLerPreferenciasIniciais(): string {
  return (
    'Como você prefere ver este aplicativo? ' +
    'Escolha o tamanho da letra, as cores da tela e se quer que o aplicativo fale em voz alta. ' +
    'Você pode mudar isso depois a qualquer momento no botão de acessibilidade no topo. ' +
    'Quando terminar, toque em Continuar.'
  );
}

const TEMAS_RAPIDOS: Array<{ valor: ModoTema; rotulo: string }> = [
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
  { valor: 'alto_contraste', rotulo: 'Alto contraste' },
];

export function TelaPreferenciasIniciais() {
  const { concluirPreferenciasIniciais } = useApp();
  const {
    preferencias,
    cores,
    fonte,
    espessuraBorda,
    toqueMinimo,
    altoContraste,
    atualizarPreferencia,
  } = useAcessibilidade();

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
    <View style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={styles.conteudo}
        accessibilityLabel="Tela de preferências iniciais de visualização"
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
            Como prefere ver este app?
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Escolha o que fica mais confortável para os seus olhos. Você pode
            mudar depois no botão ♿ lá em cima.
          </Text>
        </View>

        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            1. Tamanho da letra
          </Text>
          <View style={styles.gradeOpcoes}>
            {ESCALAS_TEXTO.map((opcao) => {
              const ativo = preferencias.escalaFonte === opcao.valor;
              return (
                <Pressable
                  key={opcao.rotulo}
                  onPress={() =>
                    atualizarPreferencia('escalaFonte', opcao.valor)
                  }
                  style={[
                    styles.chip,
                    {
                      minHeight: toqueMinimo,
                      backgroundColor: ativo ? cores.primaria : cores.fundo,
                      borderWidth: 2,
                      borderColor: ativo ? cores.primaria : cores.borda,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`Letra ${opcao.rotulo}`}
                >
                  <Text
                    style={{
                      fontSize: fonte(20, 26),
                      lineHeight: fonte(26, 32),
                      fontWeight: '800',
                      color: ativo ? cores.textoSobrePrimaria : cores.texto,
                    }}
                  >
                    {opcao.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            2. Cores da tela
          </Text>
          <View style={styles.gradeOpcoes}>
            {TEMAS_RAPIDOS.map((item) => {
              const ativo = preferencias.modoTema === item.valor;
              return (
                <Pressable
                  key={item.valor}
                  onPress={() => atualizarPreferencia('modoTema', item.valor)}
                  style={[
                    styles.chip,
                    {
                      minHeight: toqueMinimo,
                      backgroundColor: ativo ? cores.primaria : cores.fundo,
                      borderWidth: 2,
                      borderColor: ativo ? cores.primaria : cores.borda,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`Tema ${item.rotulo}`}
                >
                  <Text
                    style={{
                      fontSize: fonte(20, 26),
                      lineHeight: fonte(26, 32),
                      fontWeight: '800',
                      color: ativo ? cores.textoSobrePrimaria : cores.texto,
                    }}
                  >
                    {item.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            3. Quer que o app leia em voz alta?
          </Text>
          <Pressable
            onPress={() =>
              atualizarPreferencia(
                'lerAutomaticamente',
                !preferencias.lerAutomaticamente
              )
            }
            style={[
              styles.botaoToggle,
              {
                minHeight: Math.max(60, toqueMinimo),
                backgroundColor: preferencias.lerAutomaticamente
                  ? cores.primaria
                  : cores.fundo,
                borderWidth: 2,
                borderColor: cores.primaria,
              },
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: preferencias.lerAutomaticamente }}
            accessibilityLabel="Ativar leitura em voz alta ao abrir cada tela"
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '800',
                color: preferencias.lerAutomaticamente
                  ? cores.textoSobrePrimaria
                  : cores.primaria,
              }}
            >
              {preferencias.lerAutomaticamente
                ? '✓ Sim, ler as telas para mim'
                : 'Não, só quando eu tocar em Ouvir'}
            </Text>
          </Pressable>
        </View>

        <BotaoGrande
          titulo="Continuar"
          variante="primario"
          onPress={concluirPreferenciasIniciais}
          accessibilityLabel="Salvar preferências e continuar"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  rolagem: {
    flex: 1,
    minHeight: 0,
  },
  conteudo: {
    padding: tema.espacamento.tela,
    gap: tema.espacamento.m,
    paddingBottom: tema.espacamento.xg,
  },
  cabecalho: {
    gap: 8,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 14,
  },
  gradeOpcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexGrow: 1,
    minWidth: 118,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoToggle: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
