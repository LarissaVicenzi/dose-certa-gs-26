/**
 * Ilustracao 2D plana (ou simbolo simples) dentro de um circulo de cor suave.
 * Adapta-se ao tema ativo e adiciona borda visivel no modo Alto Contraste.
 */
import React from 'react';
import { Ilustracao2D, TipoIlustracao2D } from './Ilustracao2D';
import { StyleSheet, Text, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';

interface IconeCirculoProps {
  tipo?: TipoIlustracao2D;
  simbolo?: string;
  corFundo?: string;
  corIcone?: string;
  corSecundaria?: string;
  tamanho?: number;
  tamanhoIcone?: number;
  accessibilityLabel?: string;
}

export function IconeCirculo({
  tipo,
  simbolo,
  corFundo,
  corIcone,
  corSecundaria,
  tamanho = 56,
  tamanhoIcone = 28,
  accessibilityLabel,
}: IconeCirculoProps) {
  const { cores, altoContraste } = useAcessibilidade();
  const fundo = corFundo ?? cores.primariaClara;
  const iconeCor = corIcone ?? cores.primaria;
  const secCor = corSecundaria ?? cores.verdeBrasil;

  return (
    <View
      style={[
        styles.circulo,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: fundo,
          borderWidth: altoContraste ? 2 : 0,
          borderColor: cores.borda,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : 'none'}
    >
      {tipo ? (
        <Ilustracao2D
          tipo={tipo}
          tamanho={tamanhoIcone}
          corPrincipal={iconeCor}
          corSecundaria={secCor}
        />
      ) : (
        <Text
          style={{
            fontSize: tamanhoIcone,
            lineHeight: tamanhoIcone + 6,
            textAlign: 'center',
            color: iconeCor,
            fontWeight: '800',
          }}
        >
          {simbolo || ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
