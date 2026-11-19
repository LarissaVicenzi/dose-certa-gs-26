/**
 * Tela 2: Entrada simplificada com ilustracao 2D acolhedora, um unico campo de apelido
 * e dica para usar o microfone do teclado.
 */
import React, { useState } from 'react';
import { BotaoGrande } from '../components/BotaoGrande';
import { IconeCirculo } from '../components/IconeCirculo';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { tema } from '../theme/tema';

const EXEMPLOS = ['Dona Maria', 'Seu João', 'Vó Tereza'];

export function textoParaLerEntrada(): string {
  return (
    'Que bom ter você aqui. Não precisa de senha nem cadastro complicado. ' +
    'Escreva como podemos te chamar, ou toque em um dos nomes de exemplo, como Dona Maria, Seu João ou Vó Tereza. ' +
    'Depois toque em Começar.'
  );
}

export function TelaEntrada() {
  const { entrarComApelido } = useApp();
  const { cores, fonte, espessuraBorda, toqueMinimo, altoContraste } =
    useAcessibilidade();
  const [apelidoInput, setApelidoInput] = useState('');
  const [erro, setErro] = useState('');

  async function handleComecar() {
    if (!apelidoInput.trim()) {
      setErro('Escreva seu apelido ou toque em um dos nomes acima.');
      return;
    }
    setErro('');
    await entrarComApelido(apelidoInput);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={styles.conteudo}
      accessibilityLabel="Tela de entrada simplificada"
    >
      <View style={styles.topo}>
        <IconeCirculo
          tipo="aceno"
          corFundo={cores.acentoClaro}
          tamanho={84}
          tamanhoIcone={44}
          accessibilityLabel="Boas-vindas"
        />
        <Text
          style={{
            fontSize: fonte(30),
            lineHeight: fonte(38),
            fontWeight: '800',
            color: cores.texto,
            textAlign: 'center',
          }}
          accessibilityRole="header"
        >
          Que bom ter você aqui
        </Text>
        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(30),
            fontWeight: '500',
            color: cores.textoSecundario,
            textAlign: 'center',
          }}
        >
          Não precisa de senha nem cadastro complicado.
        </Text>
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
      >
        <Text
          style={{
            fontSize: fonte(24),
            lineHeight: fonte(32),
            fontWeight: '700',
            color: cores.texto,
          }}
        >
          Como podemos te chamar?
        </Text>
        <TextInput
          value={apelidoInput}
          onChangeText={(texto) => {
            setApelidoInput(texto);
            if (erro) setErro('');
          }}
          placeholder="Ex: Dona Maria"
          maxLength={32}
          style={[
            styles.campo,
            {
              minHeight: Math.max(64, toqueMinimo),
              backgroundColor: cores.fundo,
              borderColor: cores.borda,
              fontSize: fonte(22),
              color: cores.texto,
            },
          ]}
          accessibilityLabel="Como podemos te chamar?"
          accessibilityHint="Digite o apelido pelo qual voce prefere ser chamado"
        />

        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(28),
            fontWeight: '500',
            color: cores.textoSecundario,
          }}
        >
          Dica: use o microfone do seu teclado para falar em vez de digitar.
        </Text>

        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(28),
            fontWeight: '700',
            color: cores.textoSecundario,
          }}
        >
          Ou toque para preencher:
        </Text>
        <View style={styles.linhaSugestoes}>
          {EXEMPLOS.map((nome) => {
            const ativo = apelidoInput === nome;
            return (
              <Pressable
                key={nome}
                onPress={() => {
                  setApelidoInput(nome);
                  setErro('');
                }}
                style={[
                  styles.chipExemplo,
                  {
                    minHeight: toqueMinimo,
                    borderRadius: Math.min(toqueMinimo / 2, 28),
                    backgroundColor: ativo ? cores.primariaClara : cores.fundo,
                    borderWidth: ativo ? 2.5 : espessuraBorda,
                    borderColor: ativo ? cores.primaria : cores.borda,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={`Preencher com ${nome}`}
              >
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '700',
                    color: ativo ? cores.primaria : cores.texto,
                  }}
                >
                  {ativo ? `✓ ${nome}` : nome}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {erro ? (
          <View
            style={[
              styles.caixaErro,
              {
                backgroundColor: cores.atrasadaFundo,
                borderWidth: altoContraste ? 2 : 0,
                borderColor: cores.atrasadaTexto,
              },
            ]}
            accessibilityRole="alert"
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(28),
                fontWeight: '700',
                color: cores.atrasadaTexto,
              }}
            >
              {erro}
            </Text>
          </View>
        ) : null}
      </View>

      <BotaoGrande
        titulo="Começar"
        variante="primario"
        onPress={handleComecar}
        accessibilityLabel="Comecar a usar o Dose Certa"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    padding: tema.espacamento.tela,
    gap: tema.espacamento.g,
    paddingBottom: tema.espacamento.xg,
  },
  topo: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: tema.espacamento.m,
  },
  campo: {
    borderWidth: 2,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontWeight: '600',
  },
  linhaSugestoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipExemplo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caixaErro: {
    borderRadius: 16,
    padding: 14,
  },
});
