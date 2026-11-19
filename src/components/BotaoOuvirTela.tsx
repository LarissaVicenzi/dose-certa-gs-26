/**
 * Botao fixo "Ouvir esta tela" (🔊 / Parar) presente no cabecalho de todas as telas.
 * Le em voz alta o resumo natural da tela atual ou interrompe a leitura em andamento.
 */
import React from 'react';
import { Ilustracao2D } from './Ilustracao2D';
import { Pressable, StyleSheet, Text, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';

interface BotaoOuvirTelaProps {
  textoParaLer: string;
}

export function BotaoOuvirTela({ textoParaLer }: BotaoOuvirTelaProps) {
  const {
    cores,
    fonte,
    toqueMinimo,
    falandoAgora,
    lerTexto,
    pararLeitura,
  } = useAcessibilidade();

  function aoPressionar() {
    if (falandoAgora) {
      pararLeitura();
      return;
    }
    if (textoParaLer.trim()) {
      lerTexto(textoParaLer);
    }
  }

  return (
    <Pressable
      onPress={aoPressionar}
      style={[
        styles.botao,
        {
          minHeight: toqueMinimo,
          minWidth: toqueMinimo,
          borderRadius: toqueMinimo / 2,
          backgroundColor: falandoAgora ? cores.acento : cores.primaria,
          borderColor: falandoAgora ? cores.textoSobreAcento : cores.primaria,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        falandoAgora
          ? 'Parar leitura em voz alta'
          : 'Ouvir esta tela em voz alta'
      }
      accessibilityState={{ selected: falandoAgora }}
    >
      <View style={styles.linha}>
        <Ilustracao2D
          tipo={falandoAgora ? 'parar' : 'som'}
          tamanho={20}
          corPrincipal={
            falandoAgora ? cores.textoSobreAcento : cores.textoSobrePrimaria
          }
        />
        <Text
          style={{
            fontSize: fonte(18, 22),
            lineHeight: fonte(22, 26),
            fontWeight: '800',
            color: falandoAgora
              ? cores.textoSobreAcento
              : cores.textoSobrePrimaria,
          }}
        >
          {falandoAgora ? 'Parar' : 'Ouvir'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
