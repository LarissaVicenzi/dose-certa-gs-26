/**
 * Tela 3: Hoje (tela principal) com ilustracoes 2D planas, temas dinamicos
 * e texto natural para leitura em voz alta.
 */
import React from 'react';
import { BotaoGrande } from '../components/BotaoGrande';
import { CartaoDose } from '../components/CartaoDose';
import { IconeCirculo } from '../components/IconeCirculo';
import { Ilustracao2D, TipoIlustracao2D } from '../components/Ilustracao2D';
import { ScrollView, StyleSheet, Text, View } from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { tema } from '../theme/tema';
import { Dose, PeriodoDia } from '../types/modelos';

function obterSaudacaoPorHorario(): { texto: string; icone: TipoIlustracao2D } {
  const hora = new Date().getHours();
  if (hora < 12) return { texto: 'Bom dia', icone: 'manha' };
  if (hora < 18) return { texto: 'Boa tarde', icone: 'tarde' };
  return { texto: 'Boa noite', icone: 'noite' };
}

function obterDataPorExtenso(): string {
  const agora = new Date();
  const formatada = agora.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return formatada.charAt(0).toUpperCase() + formatada.slice(1);
}

export function textoParaLerHoje(apelido: string, agenda: Dose[]): string {
  const saudacao = obterSaudacaoPorHorario().texto;
  const nome = apelido || 'você';
  const total = agenda.length;
  const tomadas = agenda.filter((d) => d.status === 'tomada').length;
  const proximo =
    agenda.find((d) => d.status === 'pendente') ||
    agenda.find((d) => d.status === 'atrasada') ||
    null;

  if (total === 0) {
    return `${saudacao}, ${nome}. Nenhum remédio marcado para hoje.`;
  }

  if (tomadas === total) {
    return `${saudacao}, ${nome}. Hoje você já tomou todos os ${total} remédios. Tudo certo por hoje, agora é só descansar.`;
  }

  const textoProximo = proximo
    ? ` O próximo é ${proximo.nome}, ${proximo.dose}, às ${proximo.horario}. Toque em TOMEI quando tomar.`
    : '';

  return `${saudacao}, ${nome}. Hoje você já tomou ${tomadas} de ${total} remédios.${textoProximo}`;
}

export function TelaHoje() {
  const {
    apelido,
    agenda,
    carregandoAgenda,
    ultimoIdConfirmado,
    registrarDoseTomada,
    modoOffline,
  } = useApp();

  const { cores, fonte, espessuraBorda, altoContraste } = useAcessibilidade();

  const saudacao = obterSaudacaoPorHorario();
  const dataExtenso = obterDataPorExtenso();

  const periodos: Array<{
    periodo: PeriodoDia;
    icone: TipoIlustracao2D;
    corCirculo: string;
  }> = [
    { periodo: 'Manhã', icone: 'manha', corCirculo: cores.acentoClaro },
    { periodo: 'Tarde', icone: 'tarde', corCirculo: cores.acentoClaro },
    { periodo: 'Noite', icone: 'noite', corCirculo: cores.primariaClara },
  ];

  const totalDoses = agenda.length;
  const totalTomadas = agenda.filter((d) => d.status === 'tomada').length;
  const percentual =
    totalDoses > 0 ? Math.round((totalTomadas / totalDoses) * 100) : 0;

  const proximoRemedio =
    agenda.find((d) => d.status === 'pendente') ||
    agenda.find((d) => d.status === 'atrasada') ||
    null;

  const tudoConcluido = totalDoses > 0 && totalTomadas === totalDoses;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={styles.conteudo}
      accessibilityLabel="Tela Hoje: seus medicamentos do dia"
    >
      <View style={styles.cabecalho}>
        <View style={styles.linhaSaudacao}>
          <Text
            style={{
              fontSize: fonte(30),
              lineHeight: fonte(38),
              fontWeight: '800',
              color: cores.texto,
              flex: 1,
            }}
            accessibilityRole="header"
          >
            {saudacao.texto}, {apelido || 'você'}
          </Text>
          <IconeCirculo
            tipo={saudacao.icone}
            corFundo={
              saudacao.icone === 'noite'
                ? cores.primariaClara
                : cores.acentoClaro
            }
            tamanho={44}
            tamanhoIcone={24}
          />
        </View>
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(30),
            fontWeight: '500',
            color: cores.textoSecundario,
          }}
        >
          {dataExtenso}
        </Text>

        {modoOffline && (
          <View
            style={[
              styles.chipOffline,
              {
                backgroundColor: cores.pendenteFundo,
                borderWidth: altoContraste ? 2 : 0,
                borderColor: cores.pendenteTexto,
              },
            ]}
            accessibilityRole="alert"
          >
            <Ilustracao2D
              tipo="sinalOffline"
              tamanho={18}
              corPrincipal={cores.pendenteTexto}
            />
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '700',
                color: cores.pendenteTexto,
              }}
            >
              Modo offline
            </Text>
          </View>
        )}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: cores.superficie,
            borderWidth: espessuraBorda,
            borderColor: cores.borda,
          },
          !altoContraste && tema.sombraCard,
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel={`${totalTomadas} de ${totalDoses} remedios tomados hoje`}
      >
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(28),
            fontWeight: '700',
            color: cores.texto,
          }}
        >
          {totalTomadas} de {totalDoses} remédios tomados
        </Text>
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
              { width: `${percentual}%`, backgroundColor: cores.verdeBrasil },
            ]}
          />
        </View>
      </View>

      {tudoConcluido ? (
        <View
          style={[
            styles.cardConcluido,
            {
              backgroundColor: cores.sucessoFundo,
              borderWidth: espessuraBorda,
              borderColor: cores.verdeBrasil,
            },
          ]}
          accessibilityLabel="Tudo certo por hoje. Todos os remedios foram tomados."
        >
          <IconeCirculo
            tipo="planta"
            corFundo={cores.superficie}
            tamanho={76}
            tamanhoIcone={42}
          />
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.sucessoTexto,
              textAlign: 'center',
            }}
          >
            Tudo certo por hoje
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.texto,
              textAlign: 'center',
            }}
          >
            Você cuidou direitinho de todos os seus remédios. Agora é só
            descansar.
          </Text>
        </View>
      ) : proximoRemedio ? (
        <View
          style={[
            styles.cardDestaque,
            {
              backgroundColor: cores.superficie,
              borderColor: cores.primaria,
            },
            !altoContraste && tema.sombraCard,
          ]}
          accessibilityLabel={`Proximo remedio: ${proximoRemedio.nome}, ${proximoRemedio.dose}, as ${proximoRemedio.horario}`}
        >
          <View style={styles.linhaTopoDestaque}>
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '700',
                color: cores.primaria,
              }}
            >
              Próximo remédio
            </Text>
            <View
              style={[
                styles.chipHorarioDestaque,
                {
                  backgroundColor: cores.acentoClaro,
                  borderWidth: altoContraste ? 2 : 0,
                  borderColor: cores.acento,
                },
              ]}
            >
              <Ilustracao2D tipo="relogio" tamanho={20} />
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(26),
                  fontWeight: '700',
                  color: cores.textoSobreAcento,
                }}
              >
                {proximoRemedio.horario}
              </Text>
            </View>
          </View>

          <View style={styles.linhaInfoDestaque}>
            <IconeCirculo
              tipo="capsula"
              corFundo={cores.primariaClara}
              tamanho={64}
              tamanhoIcone={34}
            />
            <View style={styles.textosDestaque}>
              <Text
                style={{
                  fontSize: fonte(24),
                  lineHeight: fonte(32),
                  fontWeight: '700',
                  color: cores.texto,
                }}
              >
                {proximoRemedio.nome}
              </Text>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(30),
                  fontWeight: '500',
                  color: cores.textoSecundario,
                }}
              >
                {proximoRemedio.dose} · {proximoRemedio.instrucao}
              </Text>
            </View>
          </View>

          <BotaoGrande
            titulo="TOMEI"
            simbolo="✓"
            variante="primario"
            onPress={() => registrarDoseTomada(proximoRemedio.id)}
            accessibilityLabel={`Confirmar que tomei ${proximoRemedio.nome}`}
            accessibilityHint="Marca este remedio como tomado e atualiza seu progresso do dia"
          />
        </View>
      ) : (
        <View
          style={[
            styles.cardVazio,
            {
              backgroundColor: cores.superficie,
              borderWidth: espessuraBorda,
              borderColor: cores.borda,
            },
          ]}
        >
          <IconeCirculo
            tipo="planta"
            corFundo={cores.sucessoFundo}
            tamanho={72}
            tamanhoIcone={38}
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
            {carregandoAgenda
              ? 'Preparando seus remédios de hoje...'
              : 'Nenhum remédio marcado para hoje.'}
          </Text>
        </View>
      )}

      {periodos.map(({ periodo, icone, corCirculo }) => {
        const dosesDoPeriodo = agenda.filter((d) => d.periodo === periodo);
        if (dosesDoPeriodo.length === 0) return null;

        return (
          <View key={periodo} style={styles.secaoPeriodo}>
            <View style={styles.cabecalhoPeriodo}>
              <IconeCirculo
                tipo={icone}
                corFundo={corCirculo}
                tamanho={48}
                tamanhoIcone={26}
              />
              <Text
                style={{
                  fontSize: fonte(24),
                  lineHeight: fonte(32),
                  fontWeight: '700',
                  color: cores.texto,
                }}
                accessibilityRole="header"
              >
                {periodo}
              </Text>
            </View>

            <View style={styles.listaPeriodo}>
              {dosesDoPeriodo.map((dose) => (
                <CartaoDose
                  key={dose.id}
                  dose={dose}
                  recemConfirmado={ultimoIdConfirmado === dose.id}
                  aoConfirmar={registrarDoseTomada}
                />
              ))}
            </View>
          </View>
        );
      })}
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
  linhaSaudacao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chipOffline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tema.formas.raioChip,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 12,
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
  cardDestaque: {
    borderRadius: tema.formas.raioCard,
    borderWidth: 2,
    padding: tema.formas.paddingCard,
    gap: tema.espacamento.m,
  },
  linhaTopoDestaque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  chipHorarioDestaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: tema.formas.raioChip,
  },
  linhaInfoDestaque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  textosDestaque: {
    flex: 1,
    gap: 4,
  },
  cardConcluido: {
    borderRadius: tema.formas.raioCard,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  cardVazio: {
    borderRadius: tema.formas.raioCard,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  secaoPeriodo: {
    gap: 12,
    marginTop: 8,
  },
  cabecalhoPeriodo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listaPeriodo: {
    gap: tema.espacamento.m,
  },
});
