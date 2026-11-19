/**
 * Barra de navegacao inferior fixa com 4 abas (Hoje, Ler, Jardim, Ajustes).
 * Icone em cima, rotulo embaixo com ate 2 linhas e suporte a todos os temas e tamanhos de texto.
 */
import React from 'react';
import { Ilustracao2D, TipoIlustracao2D } from './Ilustracao2D';
import { Pressable, StyleSheet, Text, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { AbaNavegacao } from '../types/modelos';

interface BarraNavegacaoProps {
  abaAtiva: AbaNavegacao;
  aoSelecionar: (aba: AbaNavegacao) => void;
}

const ABAS: Array<{
  id: AbaNavegacao;
  rotulo: string;
  icone: TipoIlustracao2D;
  descricaoAcessivel: string;
}> = [
  {
    id: 'hoje',
    rotulo: 'Hoje',
    icone: 'capsula',
    descricaoAcessivel: 'Aba Hoje: seus remedios de hoje',
  },
  {
    id: 'ler',
    rotulo: 'Ler',
    icone: 'bula',
    descricaoAcessivel: 'Aba Ler: fotografar e ouvir a bula',
  },
  {
    id: 'jardim',
    rotulo: 'Jardim',
    icone: 'planta',
    descricaoAcessivel: 'Aba Jardim: acompanhar seu jardim da saude',
  },
  {
    id: 'ajustes',
    rotulo: 'Ajustes',
    icone: 'engrenagem',
    descricaoAcessivel:
      'Aba Ajustes: acessibilidade, privacidade e seus dados',
  },
];

export function BarraNavegacao({
  abaAtiva,
  aoSelecionar,
}: BarraNavegacaoProps) {
  const { cores, fonte, espessuraBorda, toqueMinimo, altoContraste } =
    useAcessibilidade();

  return (
    <View
      style={[
        styles.barra,
        {
          backgroundColor: cores.superficie,
          borderTopWidth: espessuraBorda,
          borderColor: cores.borda,
        },
      ]}
      accessibilityRole="tablist"
    >
      {ABAS.map((aba) => {
        const ativa = abaAtiva === aba.id;
        return (
          <Pressable
            key={aba.id}
            onPress={() => aoSelecionar(aba.id)}
            style={[styles.botaoAba, { minHeight: Math.max(68, toqueMinimo) }]}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            accessibilityLabel={aba.descricaoAcessivel}
          >
            <View
              style={[
                styles.pilula,
                {
                  minHeight: Math.max(64, toqueMinimo),
                  backgroundColor: ativa
                    ? cores.primariaClara
                    : cores.transparente,
                  borderWidth: ativa && altoContraste ? 2 : 0,
                  borderColor: cores.primaria,
                },
              ]}
            >
              <Ilustracao2D
                tipo={aba.icone}
                tamanho={24}
                corPrincipal={ativa ? cores.primaria : cores.textoSecundario}
              />
              <Text
                style={{
                  fontSize: fonte(20, 23),
                  lineHeight: fonte(24, 26),
                  fontWeight: ativa ? '800' : '600',
                  color: ativa ? cores.primaria : cores.textoSecundario,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {aba.rotulo}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 8,
    gap: 4,
  },
  botaoAba: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pilula: {
    width: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 4,
  },
});
