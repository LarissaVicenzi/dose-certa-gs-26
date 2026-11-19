/**
 * Biblioteca de ilustracoes 2D planas feitas 100% com Views do React Native.
 * Reage imediatamente ao tema ativo (Claro, Escuro ou Alto Contraste).
 */
import React from 'react';
import { StyleSheet, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';

export type TipoIlustracao2D =
  | 'capsula'
  | 'cadeado'
  | 'engrenagem'
  | 'acessibilidade'
  | 'check'
  | 'manha'
  | 'tarde'
  | 'noite'
  | 'camera'
  | 'bula'
  | 'som'
  | 'parar'
  | 'alvo'
  | 'relogio'
  | 'cuidado'
  | 'familia'
  | 'carta'
  | 'lixeira'
  | 'olho'
  | 'fogo'
  | 'planta'
  | 'documento'
  | 'aceno'
  | 'estrela'
  | 'sinalOnline'
  | 'sinalOffline';

interface Ilustracao2DProps {
  tipo: TipoIlustracao2D;
  tamanho?: number;
  corPrincipal?: string;
  corSecundaria?: string;
}

export function Ilustracao2D({
  tipo,
  tamanho = 28,
  corPrincipal,
  corSecundaria,
}: Ilustracao2DProps) {
  const { cores } = useAcessibilidade();
  const s = tamanho;
  const cor1 = corPrincipal ?? cores.primaria;
  const cor2 = corSecundaria ?? cores.verdeBrasil;

  switch (tipo) {
    case 'capsula':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.88,
              height: s * 0.46,
              borderRadius: s * 0.23,
              flexDirection: 'row',
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: cores.azulBrasil,
              backgroundColor: cores.superficie,
            }}
          >
            <View style={{ flex: 1, backgroundColor: cor2 }} />
            <View style={{ flex: 1, backgroundColor: cores.amareloBrasil }} />
          </View>
        </View>
      );

    case 'cadeado':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.46,
              height: s * 0.34,
              borderTopLeftRadius: s * 0.23,
              borderTopRightRadius: s * 0.23,
              borderWidth: Math.max(2.5, s * 0.1),
              borderBottomWidth: 0,
              borderColor: cor1,
              marginBottom: -2,
            }}
          />
          <View
            style={{
              width: s * 0.68,
              height: s * 0.5,
              borderRadius: s * 0.14,
              backgroundColor: cor1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.16,
                height: s * 0.16,
                borderRadius: s * 0.08,
                backgroundColor: cores.superficie,
              }}
            />
          </View>
        </View>
      );

    case 'engrenagem':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.78,
              height: s * 0.78,
              borderRadius: s * 0.24,
              borderWidth: Math.max(3, s * 0.14),
              borderColor: cor1,
              backgroundColor: cores.transparente,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.28,
                height: s * 0.28,
                borderRadius: s * 0.14,
                backgroundColor: cor1,
              }}
            />
          </View>
        </View>
      );

    case 'acessibilidade':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.86,
              height: s * 0.86,
              borderRadius: s * 0.43,
              borderWidth: Math.max(2, s * 0.09),
              borderColor: cor1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <View
              style={{
                width: s * 0.18,
                height: s * 0.18,
                borderRadius: s * 0.09,
                backgroundColor: cor1,
              }}
            />
            <View
              style={{
                width: s * 0.46,
                height: Math.max(2.5, s * 0.1),
                borderRadius: 2,
                backgroundColor: cor1,
              }}
            />
            <View style={{ flexDirection: 'row', gap: s * 0.1 }}>
              <View
                style={{
                  width: Math.max(2.5, s * 0.1),
                  height: s * 0.22,
                  borderRadius: 2,
                  backgroundColor: cor1,
                }}
              />
              <View
                style={{
                  width: Math.max(2.5, s * 0.1),
                  height: s * 0.22,
                  borderRadius: 2,
                  backgroundColor: cor1,
                }}
              />
            </View>
          </View>
        </View>
      );

    case 'check':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.62,
              height: s * 0.34,
              borderLeftWidth: Math.max(3, s * 0.14),
              borderBottomWidth: Math.max(3, s * 0.14),
              borderColor: cor1,
              marginTop: -s * 0.08,
              borderBottomLeftRadius: 2,
            }}
          />
        </View>
      );

    case 'manha':
      return (
        <View
          style={[
            styles.centro,
            {
              width: s,
              height: s,
              justifyContent: 'flex-end',
              paddingBottom: s * 0.14,
            },
          ]}
        >
          <View
            style={{
              width: s * 0.58,
              height: s * 0.3,
              borderTopLeftRadius: s * 0.3,
              borderTopRightRadius: s * 0.3,
              backgroundColor: cores.amareloBrasil,
              borderWidth: 2,
              borderBottomWidth: 0,
              borderColor: cores.textoSobreAcento,
            }}
          />
          <View
            style={{
              width: s * 0.86,
              height: Math.max(3, s * 0.12),
              borderRadius: 4,
              backgroundColor: cores.verdeBrasil,
            }}
          />
        </View>
      );

    case 'tarde':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.82,
              height: s * 0.82,
              borderRadius: s * 0.41,
              backgroundColor: cores.acentoClaro,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: cores.amareloBrasil,
            }}
          >
            <View
              style={{
                width: s * 0.5,
                height: s * 0.5,
                borderRadius: s * 0.25,
                backgroundColor: cores.amareloBrasil,
              }}
            />
          </View>
        </View>
      );

    case 'noite':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.68,
              height: s * 0.68,
              borderRadius: s * 0.34,
              backgroundColor: cores.azulBrasil,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: s * 0.56,
                height: s * 0.56,
                borderRadius: s * 0.28,
                backgroundColor: cores.primariaClara,
                marginLeft: s * 0.26,
                marginTop: -s * 0.08,
              }}
            />
          </View>
        </View>
      );

    case 'camera':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.34,
              height: s * 0.14,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              backgroundColor: cor1,
              marginBottom: -1,
            }}
          />
          <View
            style={{
              width: s * 0.82,
              height: s * 0.56,
              borderRadius: s * 0.14,
              backgroundColor: cor1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.34,
                height: s * 0.34,
                borderRadius: s * 0.17,
                backgroundColor: cores.superficie,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: s * 0.16,
                  height: s * 0.16,
                  borderRadius: s * 0.08,
                  backgroundColor: cores.amareloBrasil,
                }}
              />
            </View>
          </View>
        </View>
      );

    case 'bula':
    case 'documento':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.68,
              height: s * 0.82,
              borderRadius: s * 0.14,
              backgroundColor: cores.superficie,
              borderWidth: 2,
              borderColor: cor1,
              padding: s * 0.12,
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                height: Math.max(3, s * 0.1),
                width: '70%',
                borderRadius: 2,
                backgroundColor: cores.verdeBrasil,
              }}
            />
            <View
              style={{
                height: Math.max(2.5, s * 0.08),
                width: '100%',
                borderRadius: 2,
                backgroundColor: cor1,
              }}
            />
            <View
              style={{
                height: Math.max(2.5, s * 0.08),
                width: '85%',
                borderRadius: 2,
                backgroundColor: cor1,
              }}
            />
          </View>
        </View>
      );

    case 'olho':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.84,
              height: s * 0.5,
              borderRadius: s * 0.25,
              borderWidth: 2.5,
              borderColor: cor1,
              backgroundColor: cores.superficie,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.28,
                height: s * 0.28,
                borderRadius: s * 0.14,
                backgroundColor: cor1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: s * 0.1,
                  height: s * 0.1,
                  borderRadius: s * 0.05,
                  backgroundColor: cores.superficie,
                }}
              />
            </View>
          </View>
        </View>
      );

    case 'som':
      return (
        <View
          style={[
            styles.centro,
            { width: s, height: s, flexDirection: 'row', gap: 3 },
          ]}
        >
          <View
            style={{
              width: s * 0.22,
              height: s * 0.34,
              borderRadius: 3,
              backgroundColor: cor1,
            }}
          />
          <View
            style={{
              width: s * 0.18,
              height: s * 0.54,
              borderRadius: 4,
              backgroundColor: cor1,
            }}
          />
          <View
            style={{
              width: s * 0.14,
              height: s * 0.38,
              borderRadius: 6,
              borderRightWidth: 2.5,
              borderColor: cor1,
            }}
          />
          <View
            style={{
              width: s * 0.14,
              height: s * 0.62,
              borderRadius: 8,
              borderRightWidth: 2.5,
              borderColor: cor1,
            }}
          />
        </View>
      );

    case 'parar':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.56,
              height: s * 0.56,
              borderRadius: s * 0.12,
              backgroundColor: cor1,
            }}
          />
        </View>
      );

    case 'alvo':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.82,
              height: s * 0.82,
              borderRadius: s * 0.41,
              borderWidth: 3,
              borderColor: cores.azulBrasil,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.46,
                height: s * 0.46,
                borderRadius: s * 0.23,
                backgroundColor: cores.verdeBrasil,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: s * 0.18,
                  height: s * 0.18,
                  borderRadius: s * 0.09,
                  backgroundColor: cores.superficie,
                }}
              />
            </View>
          </View>
        </View>
      );

    case 'relogio':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.8,
              height: s * 0.8,
              borderRadius: s * 0.4,
              borderWidth: 2.5,
              borderColor: cores.textoSobreAcento,
              backgroundColor: cores.superficie,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 3,
                height: s * 0.24,
                backgroundColor: cores.textoSobreAcento,
                borderRadius: 2,
                marginBottom: -2,
              }}
            />
            <View
              style={{
                width: s * 0.24,
                height: 3,
                backgroundColor: cores.azulBrasil,
                borderRadius: 2,
                marginLeft: s * 0.16,
              }}
            />
          </View>
        </View>
      );

    case 'cuidado':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.78,
              height: s * 0.78,
              borderRadius: s * 0.22,
              backgroundColor: cores.atrasadaTexto,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.42,
                height: s * 0.14,
                borderRadius: 3,
                backgroundColor: cores.superficie,
              }}
            />
            <View
              style={{
                width: s * 0.14,
                height: s * 0.42,
                borderRadius: 3,
                backgroundColor: cores.superficie,
                marginTop: -s * 0.28,
              }}
            />
          </View>
        </View>
      );

    case 'familia':
      return (
        <View
          style={[
            styles.centro,
            {
              width: s,
              height: s,
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 3,
              paddingBottom: 2,
            },
          ]}
        >
          <View style={{ alignItems: 'center', gap: 2 }}>
            <View
              style={{
                width: s * 0.28,
                height: s * 0.28,
                borderRadius: s * 0.14,
                backgroundColor: cores.azulBrasil,
              }}
            />
            <View
              style={{
                width: s * 0.38,
                height: s * 0.32,
                borderTopLeftRadius: s * 0.18,
                borderTopRightRadius: s * 0.18,
                backgroundColor: cores.azulBrasil,
              }}
            />
          </View>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <View
              style={{
                width: s * 0.24,
                height: s * 0.24,
                borderRadius: s * 0.12,
                backgroundColor: cores.verdeBrasil,
              }}
            />
            <View
              style={{
                width: s * 0.34,
                height: s * 0.26,
                borderTopLeftRadius: s * 0.16,
                borderTopRightRadius: s * 0.16,
                backgroundColor: cores.verdeBrasil,
              }}
            />
          </View>
        </View>
      );

    case 'carta':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.84,
              height: s * 0.58,
              borderRadius: s * 0.12,
              backgroundColor: cores.superficie,
              borderWidth: 2,
              borderColor: cores.textoSobreAcento,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <View
              style={{
                width: '72%',
                height: 2.5,
                backgroundColor: cores.textoSobreAcento,
                borderRadius: 2,
              }}
            />
            <View
              style={{
                width: s * 0.22,
                height: s * 0.22,
                borderRadius: s * 0.11,
                backgroundColor: cores.atrasadaTexto,
              }}
            />
          </View>
        </View>
      );

    case 'lixeira':
      return (
        <View style={[styles.centro, { width: s, height: s, gap: 2 }]}>
          <View
            style={{
              width: s * 0.72,
              height: Math.max(3, s * 0.11),
              borderRadius: 3,
              backgroundColor: cor1,
            }}
          />
          <View
            style={{
              width: s * 0.58,
              height: s * 0.58,
              borderBottomLeftRadius: s * 0.12,
              borderBottomRightRadius: s * 0.12,
              backgroundColor: cor1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <View
              style={{
                width: 2.5,
                height: s * 0.32,
                borderRadius: 2,
                backgroundColor: cores.superficie,
              }}
            />
            <View
              style={{
                width: 2.5,
                height: s * 0.32,
                borderRadius: 2,
                backgroundColor: cores.superficie,
              }}
            />
          </View>
        </View>
      );

    case 'planta':
      return (
        <View
          style={[
            styles.centro,
            { width: s, height: s, justifyContent: 'flex-end', paddingBottom: 2 },
          ]}
        >
          <View style={{ flexDirection: 'row', gap: 2, marginBottom: -2 }}>
            <View
              style={{
                width: s * 0.32,
                height: s * 0.24,
                borderTopLeftRadius: s * 0.16,
                borderBottomRightRadius: s * 0.16,
                backgroundColor: cores.verdeBrasil,
              }}
            />
            <View
              style={{
                width: s * 0.32,
                height: s * 0.24,
                borderTopRightRadius: s * 0.16,
                borderBottomLeftRadius: s * 0.16,
                backgroundColor: cores.verdeBrasil,
              }}
            />
          </View>
          <View
            style={{
              width: Math.max(3, s * 0.12),
              height: s * 0.34,
              backgroundColor: cores.sucessoTexto,
              borderRadius: 2,
            }}
          />
          <View
            style={{
              width: s * 0.58,
              height: s * 0.16,
              borderRadius: s * 0.08,
              backgroundColor: cores.chaoBordaJardim,
            }}
          />
        </View>
      );

    case 'fogo':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.6,
              height: s * 0.74,
              borderTopLeftRadius: s * 0.3,
              borderTopRightRadius: s * 0.3,
              borderBottomLeftRadius: s * 0.28,
              borderBottomRightRadius: s * 0.28,
              backgroundColor: cores.amareloBrasil,
              borderWidth: 2,
              borderColor: cores.textoSobreAcento,
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 4,
            }}
          >
            <View
              style={{
                width: s * 0.26,
                height: s * 0.34,
                borderRadius: s * 0.14,
                backgroundColor: cores.atrasadaTexto,
              }}
            />
          </View>
        </View>
      );

    case 'aceno':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.74,
              height: s * 0.74,
              borderRadius: s * 0.37,
              backgroundColor: cores.amareloBrasil,
              borderWidth: 2.5,
              borderColor: cores.textoSobreAcento,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <View style={{ flexDirection: 'row', gap: s * 0.16 }}>
              <View
                style={{
                  width: s * 0.1,
                  height: s * 0.1,
                  borderRadius: s * 0.05,
                  backgroundColor: cores.textoSobreAcento,
                }}
              />
              <View
                style={{
                  width: s * 0.1,
                  height: s * 0.1,
                  borderRadius: s * 0.05,
                  backgroundColor: cores.textoSobreAcento,
                }}
              />
            </View>
            <View
              style={{
                width: s * 0.32,
                height: s * 0.14,
                borderBottomLeftRadius: s * 0.16,
                borderBottomRightRadius: s * 0.16,
                borderWidth: 2.5,
                borderTopWidth: 0,
                borderColor: cores.textoSobreAcento,
              }}
            />
          </View>
        </View>
      );

    case 'estrela':
      return (
        <View style={[styles.centro, { width: s, height: s }]}>
          <View
            style={{
              width: s * 0.76,
              height: s * 0.76,
              borderRadius: s * 0.38,
              backgroundColor: cores.amareloBrasil,
              borderWidth: 2,
              borderColor: cores.textoSobreAcento,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: s * 0.32,
                height: s * 0.32,
                borderRadius: s * 0.08,
                backgroundColor: cores.azulBrasil,
              }}
            />
          </View>
        </View>
      );

    case 'sinalOnline':
      return (
        <View
          style={[
            styles.centro,
            {
              width: s,
              height: s,
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 3,
              paddingBottom: 3,
            },
          ]}
        >
          <View
            style={{
              width: 4,
              height: s * 0.28,
              borderRadius: 2,
              backgroundColor: cor1,
            }}
          />
          <View
            style={{
              width: 4,
              height: s * 0.48,
              borderRadius: 2,
              backgroundColor: cor1,
            }}
          />
          <View
            style={{
              width: 4,
              height: s * 0.7,
              borderRadius: 2,
              backgroundColor: cor1,
            }}
          />
        </View>
      );

    case 'sinalOffline':
      return (
        <View
          style={[
            styles.centro,
            {
              width: s,
              height: s,
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: 3,
              paddingBottom: 3,
            },
          ]}
        >
          <View
            style={{
              width: 4,
              height: s * 0.28,
              borderRadius: 2,
              backgroundColor: cor1,
            }}
          />
          <View
            style={{
              width: 4,
              height: s * 0.28,
              borderRadius: 2,
              backgroundColor: cores.borda,
            }}
          />
          <View
            style={{
              width: 4,
              height: s * 0.28,
              borderRadius: 2,
              backgroundColor: cores.borda,
            }}
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
