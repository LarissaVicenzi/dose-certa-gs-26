/**
 * Tela 5: Jardim da Saude com cena 2D plana (CenaJardim2D), icones 2D nas conquistas,
 * temas dinamicos e adaptacao automatica de colunas em fontes grandes (1.5x e 1.75x).
 */
import React from 'react';
import { CenaJardim2D } from '../components/CenaJardim2D';
import { IconeCirculo } from '../components/IconeCirculo';
import { Ilustracao2D, TipoIlustracao2D } from '../components/Ilustracao2D';
import { ScrollView, StyleSheet, Text, View } from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { tema } from '../theme/tema';
import { Gamificacao } from '../types/modelos';

function iconeDaConquista(id: string): TipoIlustracao2D {
  if (id === 'manha-em-dia') return 'manha';
  if (id === 'curiosa') return 'bula';
  if (id === 'semana-firme') return 'estrela';
  if (id === 'rotina-tranquila') return 'relogio';
  if (id === 'mes-de-cuidado') return 'fogo';
  if (id === 'jardim-em-flor') return 'tarde';
  return 'planta';
}

export function textoParaLerJardim(gamificacao: Gamificacao | null): string {
  if (!gamificacao) {
    return 'Tela Jardim da Saúde. Preparando seu jardim.';
  }

  const desbloqueadas = gamificacao.conquistas.filter(
    (c) => c.desbloqueada
  ).length;
  const faltam = gamificacao.pontosProximoEstagio
    ? Math.max(0, gamificacao.pontosProximoEstagio - gamificacao.pontos)
    : 0;

  const trechoProximo = gamificacao.pontosProximoEstagio
    ? ` Faltam ${faltam} pontos ${gamificacao.verboProximoEstagio}.`
    : ` ${gamificacao.verboProximoEstagio}.`;

  const trechoFamilia = gamificacao.mensagemFamilia
    ? ` Mensagem de ${gamificacao.mensagemFamilia.remetente}: ${gamificacao.mensagemFamilia.texto}.`
    : '';

  return (
    `Tela Jardim da Saúde. Seu jardim está no estágio ${gamificacao.nomeEstagio}, com ${gamificacao.pontos} pontos.` +
    trechoProximo +
    ` Você está há ${gamificacao.sequenciaDias} ${
      gamificacao.sequenciaDias === 1 ? 'dia' : 'dias'
    } em dia.` +
    trechoFamilia +
    ` Você tem ${desbloqueadas} de ${gamificacao.conquistas.length} conquistas. ` +
    `Lembre-se: o jardim só descansa, seus pontos nunca somem e sua planta nunca diminui.`
  );
}

export function TelaJardim() {
  const { gamificacao } = useApp();
  const { preferencias, cores, fonte, espessuraBorda, altoContraste } =
    useAcessibilidade();

  const textoMuitoGrande = preferencias.escalaFonte >= 1.5;

  if (!gamificacao) {
    return (
      <View style={[styles.carregando, { backgroundColor: cores.fundo }]}>
        <IconeCirculo
          tipo="planta"
          corFundo={cores.sucessoFundo}
          tamanho={80}
          tamanhoIcone={42}
        />
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(30),
            fontWeight: '500',
            color: cores.textoSecundario,
            textAlign: 'center',
          }}
        >
          Preparando seu jardim...
        </Text>
      </View>
    );
  }

  const faltamPontos = gamificacao.pontosProximoEstagio
    ? Math.max(0, gamificacao.pontosProximoEstagio - gamificacao.pontos)
    : 0;

  const percentualEstagio = gamificacao.pontosProximoEstagio
    ? Math.min(
        100,
        Math.max(
          8,
          Math.round(
            ((gamificacao.pontos - gamificacao.pontosEstagioAtualMin) /
              (gamificacao.pontosProximoEstagio -
                gamificacao.pontosEstagioAtualMin)) *
              100
          )
        )
      )
    : 100;

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
      accessibilityLabel="Tela Jardim da Saude"
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
          Jardim da Saúde
        </Text>
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(30),
            fontWeight: '500',
            color: cores.textoSecundario,
          }}
        >
          Cada cuidado no seu tempo ajuda seu jardim a crescer.
        </Text>
      </View>

      <View
        style={[
          styles.cardCena,
          {
            backgroundColor: cores.superficie,
            borderWidth: espessuraBorda,
            borderColor: cores.borda,
          },
          !altoContraste && tema.sombraCard,
        ]}
      >
        <CenaJardim2D
          estagio={gamificacao.estagio}
          nomeEstagio={gamificacao.nomeEstagio}
          pontos={gamificacao.pontos}
        />

        <View style={styles.blocoProgresso}>
          <View
            style={[
              styles.trilhoProgresso,
              {
                backgroundColor: cores.fundo,
                borderWidth: altoContraste ? 2 : 0,
                borderColor: cores.borda,
              },
            ]}
          >
            <View
              style={[
                styles.preenchimentoProgresso,
                {
                  width: `${percentualEstagio}%`,
                  backgroundColor: cores.verdeBrasil,
                },
              ]}
            />
          </View>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '700',
              color: cores.texto,
              textAlign: 'center',
            }}
          >
            {gamificacao.pontosProximoEstagio
              ? `Faltam ${faltamPontos} pontos ${gamificacao.verboProximoEstagio}`
              : gamificacao.verboProximoEstagio}
          </Text>
        </View>
      </View>

      <View
        style={estiloCard}
        accessibilityLabel={`Voce esta ha ${gamificacao.sequenciaDias} dias em dia`}
      >
        <View
          style={[
            styles.chipSequencia,
            {
              backgroundColor: cores.acentoClaro,
              borderWidth: altoContraste ? 2 : 0,
              borderColor: cores.acento,
            },
          ]}
        >
          <Ilustracao2D tipo="fogo" tamanho={24} />
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(28),
              fontWeight: '700',
              color: cores.textoSobreAcento,
              textAlign: 'center',
              flexShrink: 1,
            }}
          >
            Você está há {gamificacao.sequenciaDias}{' '}
            {gamificacao.sequenciaDias === 1 ? 'dia' : 'dias'} em dia
          </Text>
        </View>

        <View
          style={[
            styles.linhaSemana,
            textoMuitoGrande && styles.linhaSemanaQuebrada,
          ]}
        >
          {gamificacao.diasSemana.map((dia, index) => (
            <View
              key={`${dia.nomeDia}-${index}`}
              style={[
                styles.colunaDia,
                textoMuitoGrande && { flex: 0, minWidth: 52 },
              ]}
              accessibilityLabel={`${dia.nomeDia}: ${
                dia.cumprido ? 'cumprido' : dia.hoje ? 'hoje' : 'a caminho'
              }`}
            >
              <View
                style={[
                  styles.circuloDia,
                  {
                    borderColor: dia.cumprido
                      ? cores.verdeBrasil
                      : dia.hoje
                      ? cores.primaria
                      : cores.borda,
                    borderWidth: dia.hoje && !dia.cumprido ? 3 : 2,
                    backgroundColor: dia.cumprido
                      ? cores.verdeBrasil
                      : dia.hoje
                      ? cores.superficie
                      : cores.fundo,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: fonte(20, 24),
                    lineHeight: fonte(24, 28),
                    fontWeight: '700',
                    color: dia.cumprido
                      ? cores.textoSobrePrimaria
                      : cores.textoSecundario,
                  }}
                >
                  {dia.cumprido ? '✓' : dia.sigla}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: fonte(20, 24),
                  lineHeight: fonte(24, 28),
                  fontWeight: '600',
                  color: cores.textoSecundario,
                }}
              >
                {dia.sigla}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {gamificacao.mensagemFamilia && (
        <View
          style={[
            styles.cardMensagemFamilia,
            {
              backgroundColor: cores.acentoClaro,
              borderWidth: espessuraBorda,
              borderColor: cores.acento,
            },
          ]}
          accessibilityLabel={`Mensagem de ${gamificacao.mensagemFamilia.remetente}`}
        >
          <View style={styles.linhaCabecalhoMensagem}>
            <IconeCirculo
              tipo="carta"
              corFundo={cores.superficie}
              tamanho={52}
              tamanhoIcone={28}
            />
            <View style={styles.textosCabecalhoMensagem}>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(28),
                  fontWeight: '700',
                  color: cores.textoSobreAcento,
                }}
              >
                Mensagem de quem cuida de você
              </Text>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(28),
                  fontWeight: '500',
                  color: cores.textoSobreAcento,
                }}
              >
                {gamificacao.mensagemFamilia.remetente} (
                {gamificacao.mensagemFamilia.parentesco}) ·{' '}
                {gamificacao.mensagemFamilia.data}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.texto,
            }}
          >
            "{gamificacao.mensagemFamilia.texto}"
          </Text>
          {gamificacao.cuidadorPresente && (
            <View
              style={[
                styles.seloCuidador,
                {
                  backgroundColor: cores.superficie,
                  borderWidth: altoContraste ? 2 : 0,
                  borderColor: cores.sucessoTexto,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(28),
                  fontWeight: '700',
                  color: cores.sucessoTexto,
                }}
              >
                ✓ Selo Cuidador Presente · Resumo semanal ativo
              </Text>
            </View>
          )}
        </View>
      )}

      <View
        style={[
          styles.cardAcolhimento,
          {
            backgroundColor: cores.sucessoFundo,
            borderWidth: altoContraste ? 2 : 0,
            borderColor: cores.sucessoTexto,
          },
        ]}
      >
        <IconeCirculo
          tipo="planta"
          corFundo={cores.superficie}
          tamanho={48}
          tamanhoIcone={26}
        />
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(30),
            fontWeight: '600',
            color: cores.sucessoTexto,
            flex: 1,
          }}
        >
          O jardim só descansa: se um dia passar da hora, seus pontos não somem
          e sua planta nunca diminui.
        </Text>
      </View>

      <View style={styles.secaoConquistas}>
        <Text
          style={{
            fontSize: fonte(24),
            lineHeight: fonte(32),
            fontWeight: '700',
            color: cores.texto,
          }}
          accessibilityRole="header"
        >
          Suas conquistas (
          {gamificacao.conquistas.filter((c) => c.desbloqueada).length} de{' '}
          {gamificacao.conquistas.length})
        </Text>

        <View style={styles.gradeConquistas}>
          {gamificacao.conquistas.map((conquista) => (
            <View
              key={conquista.id}
              style={[
                styles.cardConquista,
                {
                  width: textoMuitoGrande ? '100%' : '48%',
                  borderWidth: espessuraBorda,
                  backgroundColor: conquista.desbloqueada
                    ? cores.sucessoFundo
                    : cores.bloqueadoFundo,
                  borderColor: conquista.desbloqueada
                    ? cores.verdeBrasil
                    : cores.bloqueadoBorda,
                },
              ]}
              accessibilityLabel={`${conquista.titulo}, vale ${conquista.pontos} pontos. ${
                conquista.desbloqueada
                  ? `Conquistada em ${conquista.dataConquista || 'hoje'}.`
                  : `Bloqueada. Dica: ${conquista.dica}`
              }`}
            >
              <IconeCirculo
                tipo={
                  conquista.desbloqueada
                    ? iconeDaConquista(conquista.id)
                    : 'cadeado'
                }
                corFundo={
                  conquista.desbloqueada ? cores.superficie : cores.fundo
                }
                corIcone={
                  conquista.desbloqueada
                    ? cores.primaria
                    : cores.textoSecundario
                }
                tamanho={56}
                tamanhoIcone={28}
              />

              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(28),
                  fontWeight: '700',
                  color: cores.texto,
                }}
              >
                {conquista.titulo}
              </Text>

              {conquista.desbloqueada ? (
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '700',
                    color: cores.sucessoTexto,
                  }}
                >
                  ✓ {conquista.dataConquista || 'Conquistada'} · +
                  {conquista.pontos} pts
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '500',
                    color: cores.textoSecundario,
                  }}
                >
                  {conquista.dica} (+{conquista.pontos} pts)
                </Text>
              )}
            </View>
          ))}
        </View>
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
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  cabecalho: {
    gap: 6,
  },
  cardCena: {
    borderRadius: tema.formas.raioCard,
    overflow: 'hidden',
  },
  blocoProgresso: {
    padding: tema.formas.paddingCard,
    gap: 10,
  },
  trilhoProgresso: {
    height: 14,
    width: '100%',
    borderRadius: 7,
    overflow: 'hidden',
  },
  preenchimentoProgresso: {
    height: 14,
    borderRadius: 7,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: tema.espacamento.m,
  },
  chipSequencia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  linhaSemana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  linhaSemanaQuebrada: {
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  colunaDia: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  circuloDia: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMensagemFamilia: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 12,
  },
  linhaCabecalhoMensagem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textosCabecalhoMensagem: {
    flex: 1,
    gap: 2,
  },
  seloCuidador: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  cardAcolhimento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
  },
  secaoConquistas: {
    gap: 12,
  },
  gradeConquistas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardConquista: {
    flexGrow: 1,
    borderRadius: tema.formas.raioCard,
    padding: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
});
