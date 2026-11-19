/**
 * Botao grande acessivel com escala dinamica de texto, altura adaptavel (botoes maiores)
 * e suporte completo aos temas Claro, Escuro e Alto Contraste.
 */
import React, { useRef } from 'react';
import { Ilustracao2D, TipoIlustracao2D } from './Ilustracao2D';
import { Animated, Pressable, StyleSheet, Text, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { tema } from '../theme/tema';

export type VarianteBotao =
  | 'primario'
  | 'secundario'
  | 'acento'
  | 'perigo'
  | 'perigoSolido';

interface BotaoGrandeProps {
  titulo: string;
  icone?: TipoIlustracao2D;
  simbolo?: string;
  onPress: () => void;
  variante?: VarianteBotao;
  desabilitado?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function BotaoGrande({
  titulo,
  icone,
  simbolo,
  onPress,
  variante = 'primario',
  desabilitado = false,
  accessibilityLabel,
  accessibilityHint,
}: BotaoGrandeProps) {
  const {
    cores,
    fonte,
    alturaBotaoPrincipal,
    alturaBotaoSecundario,
    altoContraste,
  } = useAcessibilidade();

  const escala = useRef(new Animated.Value(1)).current;

  function aoPressionar() {
    Animated.timing(escala, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }

  function aoSoltar() {
    Animated.timing(escala, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }

  const ehPrincipal = variante === 'primario' || variante === 'acento';
  const alturaMinima = ehPrincipal
    ? alturaBotaoPrincipal
    : alturaBotaoSecundario;

  const fundo =
    variante === 'primario'
      ? cores.primaria
      : variante === 'acento'
      ? cores.acentoClaro
      : variante === 'perigo'
      ? cores.atrasadaFundo
      : variante === 'perigoSolido'
      ? cores.atrasadaTexto
      : cores.transparente;

  const corBorda =
    variante === 'primario'
      ? altoContraste
        ? cores.borda
        : cores.primaria
      : variante === 'acento'
      ? cores.acento
      : variante === 'perigo' || variante === 'perigoSolido'
      ? cores.atrasadaTexto
      : cores.primaria;

  const corTexto =
    variante === 'primario' || variante === 'perigoSolido'
      ? cores.textoSobrePrimaria
      : variante === 'acento'
      ? cores.textoSobreAcento
      : variante === 'perigo'
      ? cores.atrasadaTexto
      : cores.primaria;

  const tamanhoTexto = ehPrincipal ? fonte(22) : fonte(20);

  return (
    <Animated.View style={{ transform: [{ scale: escala }], width: '100%' }}>
      <Pressable
        onPress={onPress}
        onPressIn={aoPressionar}
        onPressOut={aoSoltar}
        disabled={desabilitado}
        style={[
          styles.base,
          {
            minHeight: alturaMinima,
            borderRadius: Math.min(alturaMinima / 2, 36),
            backgroundColor: fundo,
            borderWidth: 2,
            borderColor: corBorda,
          },
          variante === 'primario' && !altoContraste && tema.sombraCard,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || titulo}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: desabilitado }}
      >
        <View style={styles.linhaConteudo}>
          {icone && (
            <Ilustracao2D
              tipo={icone}
              tamanho={26}
              corPrincipal={corTexto}
              corSecundaria={cores.amareloBrasil}
            />
          )}
          <Text
            style={{
              fontSize: tamanhoTexto,
              lineHeight: Math.round(tamanhoTexto * 1.3),
              fontWeight: ehPrincipal ? '800' : '700',
              color: corTexto,
              textAlign: 'center',
              flexShrink: 1,
            }}
          >
            {simbolo ? `${simbolo}  ${titulo}` : titulo}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tema.espacamento.tela,
    paddingVertical: 14,
  },
  linhaConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
});
