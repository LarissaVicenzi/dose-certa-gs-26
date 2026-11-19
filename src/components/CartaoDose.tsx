/**
 * Card individual de medicamento na tela Hoje com animacao suave de ✓ via Animated.
 * Adapta-se totalmente a escala de texto, botoes maiores e temas Claro/Escuro/Alto Contraste.
 */
import React, { useEffect, useRef } from 'react';
import { IconeCirculo } from './IconeCirculo';
import { Animated, Pressable, StyleSheet, Text, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { tema } from '../theme/tema';
import { Dose } from '../types/modelos';

interface CartaoDoseProps {
  dose: Dose;
  recemConfirmado: boolean;
  aoConfirmar: (doseId: string) => void;
}

export function CartaoDose({
  dose,
  recemConfirmado,
  aoConfirmar,
}: CartaoDoseProps) {
  const { cores, fonte, espessuraBorda, toqueMinimo, altoContraste } =
    useAcessibilidade();

  const escalaCheck = useRef(new Animated.Value(1)).current;
  const tomada = dose.status === 'tomada';
  const atrasada = dose.status === 'atrasada';

  useEffect(() => {
    if (recemConfirmado && tomada) {
      escalaCheck.setValue(0.65);
      Animated.sequence([
        Animated.timing(escalaCheck, {
          toValue: 1.15,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(escalaCheck, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [recemConfirmado, tomada, escalaCheck]);

  const corChipFundo = tomada
    ? cores.sucessoFundo
    : atrasada
    ? cores.atrasadaFundo
    : cores.pendenteFundo;

  const corChipTexto = tomada
    ? cores.sucessoTexto
    : atrasada
    ? cores.atrasadaTexto
    : cores.pendenteTexto;

  const rotuloStatus = tomada
    ? `Tomada ✓${dose.horarioTomado ? ` · ${dose.horarioTomado}` : ''}`
    : atrasada
    ? 'Ainda dá tempo'
    : 'Pendente';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tomada ? cores.sucessoFundo : cores.superficie,
          borderWidth: espessuraBorda,
          borderColor: tomada ? cores.verdeBrasil : cores.borda,
        },
        !altoContraste && tema.sombraCard,
      ]}
      accessibilityLabel={`${dose.nome}, ${dose.dose}, horario ${dose.horario}. Status: ${rotuloStatus}`}
    >
      <View style={styles.linhaSuperior}>
        <Animated.View style={{ transform: [{ scale: escalaCheck }] }}>
          {tomada ? (
            <IconeCirculo
              simbolo="✓"
              corFundo={cores.verdeBrasil}
              corIcone={cores.textoSobrePrimaria}
              tamanho={56}
              tamanhoIcone={28}
            />
          ) : (
            <IconeCirculo
              tipo="capsula"
              corFundo={atrasada ? cores.atrasadaFundo : cores.primariaClara}
              tamanho={56}
              tamanhoIcone={30}
            />
          )}
        </Animated.View>

        <View style={styles.textos}>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(28),
              fontWeight: '700',
              color: cores.primaria,
            }}
          >
            {dose.horario}
          </Text>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            {dose.nome}
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            {dose.dose} · {dose.instrucao}
          </Text>
        </View>
      </View>

      <View style={styles.linhaRodape}>
        <View
          style={[
            styles.chipStatus,
            {
              backgroundColor: corChipFundo,
              borderWidth: altoContraste ? 2 : 0,
              borderColor: corChipTexto,
            },
          ]}
          accessibilityLabel={`Status ${rotuloStatus}`}
        >
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(28),
              fontWeight: '700',
              color: corChipTexto,
            }}
          >
            {rotuloStatus}
          </Text>
        </View>

        {!tomada && (
          <Pressable
            onPress={() => aoConfirmar(dose.id)}
            style={[
              styles.botaoConfirmarMenor,
              {
                minHeight: toqueMinimo,
                borderRadius: Math.min(toqueMinimo / 2, 32),
                backgroundColor: cores.primaria,
                borderWidth: altoContraste ? 2 : 0,
                borderColor: cores.borda,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Confirmar que tomei ${dose.nome} das ${dose.horario}`}
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '800',
                color: cores.textoSobrePrimaria,
              }}
            >
              TOMEI
            </Text>
          </Pressable>
        )}
      </View>

      {dose.pendenteSincronizacao && (
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(28),
            fontWeight: '700',
            color: cores.pendenteTexto,
          }}
        >
          Guardado no celular · envia ao voltar a internet
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: tema.espacamento.m,
  },
  linhaSuperior: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  textos: {
    flex: 1,
    gap: 4,
  },
  linhaRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  chipStatus: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tema.formas.raioChip,
    alignSelf: 'flex-start',
  },
  botaoConfirmarMenor: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
