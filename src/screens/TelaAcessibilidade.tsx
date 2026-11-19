/**
 * Tela de Acessibilidade completa do Dose Certa.
 * Acessivel pelo botao fixo ♿ no cabecalho e pela aba Ajustes.
 * Inclui previa ao vivo, 4 escalas de texto, 4 modos de tema, botoes maiores,
 * velocidade de voz, leitura automatica, reduzir movimento e voltar ao padrao.
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
import {
  PreferenciasAcessibilidade,
  useAcessibilidade,
} from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { VelocidadeVoz } from '../services/voz';
import { ESCALAS_TEXTO, ModoTema, tema } from '../theme/tema';

const OPCOES_TEMA: Array<{
  valor: ModoTema;
  rotulo: string;
  descricao: string;
}> = [
  { valor: 'claro', rotulo: 'Claro', descricao: 'Fundo creme suave' },
  { valor: 'escuro', rotulo: 'Escuro', descricao: 'Confortável à noite' },
  {
    valor: 'alto_contraste',
    rotulo: 'Alto contraste',
    descricao: 'Fundo preto e amarelo',
  },
  {
    valor: 'automatico',
    rotulo: 'Automático',
    descricao: 'Segue o celular',
  },
];

const OPCOES_VELOCIDADE: Array<{ valor: VelocidadeVoz; rotulo: string }> = [
  { valor: 'lenta', rotulo: 'Lenta' },
  { valor: 'normal', rotulo: 'Normal' },
  { valor: 'rapida', rotulo: 'Rápida' },
];

export function textoParaLerAcessibilidade(
  pref: PreferenciasAcessibilidade
): string {
  const nivel =
    ESCALAS_TEXTO.find((e) => e.valor === pref.escalaFonte)?.rotulo || 'Normal';
  const nomeTema =
    OPCOES_TEMA.find((t) => t.valor === pref.modoTema)?.rotulo || 'Claro';
  return (
    `Tela de Acessibilidade. Deixe o aplicativo do jeito mais confortável para você. ` +
    `Tamanho da letra atual: ${nivel}. Tema atual: ${nomeTema}. ` +
    `Botões maiores está ${pref.botoesMaiores ? 'ligado' : 'desligado'}. ` +
    `Você pode mudar a letra, as cores, a velocidade da voz, ligar leitura automática ou voltar ao padrão.`
  );
}

export function TelaAcessibilidade() {
  const { fecharAcessibilidade } = useApp();
  const {
    preferencias,
    cores,
    fonte,
    espessuraBorda,
    toqueMinimo,
    altoContraste,
    lerTexto,
    atualizarPreferencia,
    aumentarFonte,
    diminuirFonte,
    voltarAoPadrao,
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

  const escalaIdx = ESCALAS_TEXTO.findIndex(
    (e) => e.valor === preferencias.escalaFonte
  );
  const podeDiminuir = escalaIdx > 0;
  const podeAumentar = escalaIdx < ESCALAS_TEXTO.length - 1;

  return (
    <View style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={styles.conteudo}
        accessibilityLabel="Tela de Acessibilidade"
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
            Acessibilidade ♿
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Ajuste as letras, as cores e a voz do jeito mais confortável. Tudo é
            salvo só no seu celular.
          </Text>
        </View>

        {/* Previa ao vivo */}
        <View
          style={[
            styles.cardPrevia,
            {
              backgroundColor: cores.primariaClara,
              borderWidth: espessuraBorda,
              borderColor: cores.primaria,
            },
          ]}
          accessibilityLabel="Prévia ao vivo do tamanho da letra e cores"
        >
          <Text
            style={{
              fontSize: fonte(18, 26),
              lineHeight: fonte(24, 34),
              fontWeight: '800',
              color: cores.primaria,
            }}
          >
            PRÉVIA AO VIVO
          </Text>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Losartana 50 mg · 08:00
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.texto,
            }}
          >
            Bom dia! Este é um exemplo de como os textos vão aparecer para você.
          </Text>
        </View>

        {/* a) Tamanho do texto */}
        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Tamanho da letra
          </Text>

          <View style={styles.linhaBotoesA}>
            <Pressable
              onPress={diminuirFonte}
              disabled={!podeDiminuir}
              style={[
                styles.botaoAjusteLetra,
                {
                  minHeight: Math.max(64, toqueMinimo),
                  backgroundColor: cores.fundo,
                  borderWidth: 2,
                  borderColor: cores.primaria,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Diminuir tamanho da letra"
            >
              <Text
                style={{
                  fontSize: fonte(24, 32),
                  lineHeight: fonte(30, 38),
                  fontWeight: '800',
                  color: cores.primaria,
                }}
              >
                A−
              </Text>
            </Pressable>

            <Pressable
              onPress={aumentarFonte}
              disabled={!podeAumentar}
              style={[
                styles.botaoAjusteLetra,
                {
                  minHeight: Math.max(64, toqueMinimo),
                  backgroundColor: cores.primaria,
                  borderWidth: 2,
                  borderColor: cores.primaria,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Aumentar tamanho da letra"
            >
              <Text
                style={{
                  fontSize: fonte(24, 32),
                  lineHeight: fonte(30, 38),
                  fontWeight: '800',
                  color: cores.textoSobrePrimaria,
                }}
              >
                A+
              </Text>
            </Pressable>
          </View>

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
                    styles.opcaoChip,
                    {
                      minHeight: toqueMinimo,
                      backgroundColor: ativo ? cores.primaria : cores.fundo,
                      borderWidth: 2,
                      borderColor: ativo ? cores.primaria : cores.borda,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`Tamanho de letra ${opcao.rotulo}`}
                >
                  <Text
                    style={{
                      fontSize: fonte(20, 26),
                      lineHeight: fonte(26, 32),
                      fontWeight: '800',
                      color: ativo ? cores.textoSobrePrimaria : cores.texto,
                      textAlign: 'center',
                    }}
                  >
                    {opcao.rotulo} ({opcao.descricao})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* b) Tema */}
        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Cores da tela (Tema)
          </Text>
          <View style={styles.listaVertical}>
            {OPCOES_TEMA.map((item) => {
              const ativo = preferencias.modoTema === item.valor;
              return (
                <Pressable
                  key={item.valor}
                  onPress={() => atualizarPreferencia('modoTema', item.valor)}
                  style={[
                    styles.cartaoOpcao,
                    {
                      minHeight: toqueMinimo,
                      backgroundColor: ativo ? cores.primariaClara : cores.fundo,
                      borderWidth: 2,
                      borderColor: ativo ? cores.primaria : cores.borda,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`Tema ${item.rotulo}: ${item.descricao}`}
                >
                  <View style={styles.textoOpcao}>
                    <Text
                      style={{
                        fontSize: fonte(20),
                        lineHeight: fonte(28),
                        fontWeight: '800',
                        color: ativo ? cores.primaria : cores.texto,
                      }}
                    >
                      {ativo ? '✓ ' : ''}
                      {item.rotulo}
                    </Text>
                    <Text
                      style={{
                        fontSize: fonte(20),
                        lineHeight: fonte(28),
                        fontWeight: '500',
                        color: cores.textoSecundario,
                      }}
                    >
                      {item.descricao}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* c) Botoes maiores */}
        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Botões maiores
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Deixa todos os botões mais altos e fáceis de tocar (72px).
          </Text>
          <Pressable
            onPress={() =>
              atualizarPreferencia('botoesMaiores', !preferencias.botoesMaiores)
            }
            style={[
              styles.botaoToggle,
              {
                minHeight: Math.max(60, toqueMinimo),
                backgroundColor: preferencias.botoesMaiores
                  ? cores.primaria
                  : cores.fundo,
                borderWidth: 2,
                borderColor: cores.primaria,
              },
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: preferencias.botoesMaiores }}
            accessibilityLabel="Alternar botões maiores"
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '800',
                color: preferencias.botoesMaiores
                  ? cores.textoSobrePrimaria
                  : cores.primaria,
              }}
            >
              {preferencias.botoesMaiores
                ? '✓ Ligado (botões grandes)'
                : 'Desligado (tamanho padrão)'}
            </Text>
          </Pressable>
        </View>

        {/* d) Voz */}
        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Velocidade da voz 🔊
          </Text>
          <View style={styles.gradeOpcoes}>
            {OPCOES_VELOCIDADE.map((op) => {
              const ativo = preferencias.velocidadeVoz === op.valor;
              return (
                <Pressable
                  key={op.valor}
                  onPress={() => atualizarPreferencia('velocidadeVoz', op.valor)}
                  style={[
                    styles.opcaoChip,
                    {
                      minHeight: toqueMinimo,
                      backgroundColor: ativo ? cores.primaria : cores.fundo,
                      borderWidth: 2,
                      borderColor: ativo ? cores.primaria : cores.borda,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`Velocidade da voz ${op.rotulo}`}
                >
                  <Text
                    style={{
                      fontSize: fonte(20, 26),
                      lineHeight: fonte(26, 32),
                      fontWeight: '800',
                      color: ativo ? cores.textoSobrePrimaria : cores.texto,
                    }}
                  >
                    {op.rotulo}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <BotaoGrande
            titulo="Testar voz"
            icone="som"
            variante="secundario"
            onPress={() =>
              lerTexto(
                'Olá! Assim é a minha voz no Dose Certa. Você pode deixar mais devagar ou mais rápido quando quiser.'
              )
            }
            accessibilityLabel="Testar a velocidade atual da voz"
          />
        </View>

        {/* e) Ler automaticamente */}
        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Ler a tela ao abrir
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Quando você entrar em uma tela, o aplicativo já lê em voz alta.
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
            accessibilityLabel="Alternar leitura automática ao abrir cada tela"
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
              {preferencias.lerAutomaticamente ? '✓ Ligado' : 'Desligado'}
            </Text>
          </Pressable>
        </View>

        {/* f) Reduzir movimento */}
        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Reduzir movimento
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Desliga animações para deixar a tela mais parada e calma.
          </Text>
          <Pressable
            onPress={() =>
              atualizarPreferencia(
                'reduzirMovimento',
                !preferencias.reduzirMovimento
              )
            }
            style={[
              styles.botaoToggle,
              {
                minHeight: Math.max(60, toqueMinimo),
                backgroundColor: preferencias.reduzirMovimento
                  ? cores.primaria
                  : cores.fundo,
                borderWidth: 2,
                borderColor: cores.primaria,
              },
            ]}
            accessibilityRole="switch"
            accessibilityState={{ checked: preferencias.reduzirMovimento }}
            accessibilityLabel="Alternar reduzir movimento"
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '800',
                color: preferencias.reduzirMovimento
                  ? cores.textoSobrePrimaria
                  : cores.primaria,
              }}
            >
              {preferencias.reduzirMovimento
                ? '✓ Animações desligadas'
                : 'Animações suaves ligadas'}
            </Text>
          </Pressable>
        </View>

        {/* g) Acoes finais */}
        <View style={styles.acoesFinais}>
          <BotaoGrande
            titulo="Voltar ao padrão"
            variante="secundario"
            onPress={voltarAoPadrao}
            accessibilityLabel="Voltar todas as opções de acessibilidade ao padrão"
          />
          <BotaoGrande
            titulo="Pronto, voltar"
            variante="primario"
            onPress={fecharAcessibilidade}
            accessibilityLabel="Salvar e voltar para a tela anterior"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },
  rolagem: {
    flex: 1,
  },
  conteudo: {
    padding: tema.espacamento.tela,
    gap: tema.espacamento.m,
    paddingBottom: tema.espacamento.xg,
  },
  cabecalho: {
    gap: 8,
  },
  cardPrevia: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 8,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 14,
  },
  linhaBotoesA: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoAjusteLetra: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  gradeOpcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  opcaoChip: {
    flexGrow: 1,
    minWidth: 120,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listaVertical: {
    gap: 10,
  },
  cartaoOpcao: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  textoOpcao: {
    gap: 4,
  },
  botaoToggle: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acoesFinais: {
    gap: 12,
    marginTop: 4,
  },
});
