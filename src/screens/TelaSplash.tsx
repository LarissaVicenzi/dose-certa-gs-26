/**
 * Tela inicial (Splash) exibindo apenas o logo 2D plano do Dose Certa.
 * Avanca automaticamente apos uma pausa suave ou ao tocar na tela.
 */
import React, { useEffect, useRef } from 'react';
import { Ilustracao2D } from '../components/Ilustracao2D';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { tema } from '../theme/tema';

export function TelaSplash() {
  const { sairDaSplash } = useApp();
  const { cores, fonte } = useAcessibilidade();
  const opacidade = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.94)).current;
  const sairRef = useRef(sairDaSplash);
  sairRef.current = sairDaSplash;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(escala, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    const temporizador = setTimeout(() => {
      sairRef.current();
    }, 2200);

    return () => clearTimeout(temporizador);
  }, [opacidade, escala]);

  return (
    <Pressable
      onPress={sairDaSplash}
      style={[styles.tela, { backgroundColor: cores.primaria }]}
      accessibilityRole="button"
      accessibilityLabel="Logo Dose Certa. Toque para entrar."
    >
      <View style={styles.faixaBrasil} accessibilityRole="none">
        <View style={{ flex: 1, backgroundColor: cores.verdeBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.amareloBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.azulBrasil }} />
      </View>

      <View style={styles.centro}>
        <Animated.View
          style={[
            styles.blocoLogo,
            {
              opacity: opacidade,
              transform: [{ scale: escala }],
            },
          ]}
        >
          <View
            style={[
              styles.anelExterno,
              { backgroundColor: cores.verdeBrasil },
            ]}
          >
            <View
              style={[
                styles.anelAmarelo,
                { backgroundColor: cores.amareloBrasil },
              ]}
            >
              <View
                style={[
                  styles.circuloLogo,
                  { backgroundColor: cores.superficie },
                ]}
              >
                <Ilustracao2D tipo="capsula" tamanho={68} />
              </View>
            </View>
          </View>

          <Text
            style={{
              fontSize: fonte(36, 48),
              lineHeight: fonte(44, 56),
              fontWeight: '800',
              color: cores.textoSobrePrimaria,
              textAlign: 'center',
              letterSpacing: 0.4,
            }}
          >
            Dose Certa
          </Text>

          <View style={styles.tracoBrasil}>
            <View style={{ flex: 1, backgroundColor: cores.verdeBrasil }} />
            <View style={{ flex: 1, backgroundColor: cores.amareloBrasil }} />
            <View style={{ flex: 1, backgroundColor: cores.primariaClara }} />
          </View>
        </Animated.View>
      </View>

      <View style={styles.faixaBrasil} accessibilityRole="none">
        <View style={{ flex: 1, backgroundColor: cores.verdeBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.amareloBrasil }} />
        <View style={{ flex: 1, backgroundColor: cores.azulBrasil }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  },
  faixaBrasil: {
    flexDirection: 'row',
    height: 8,
    width: '100%',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tema.espacamento.xg,
  },
  blocoLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  anelExterno: {
    width: 156,
    height: 156,
    borderRadius: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anelAmarelo: {
    width: 138,
    height: 138,
    borderRadius: 69,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tracoBrasil: {
    flexDirection: 'row',
    width: 144,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
