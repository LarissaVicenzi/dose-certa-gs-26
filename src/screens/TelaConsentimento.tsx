/**
 * Tela 1: Consentimento LGPD acolhedor e transparente com ilustracoes 2D planas.
 */
import React, { useState } from 'react';
import { BotaoGrande } from '../components/BotaoGrande';
import { IconeCirculo } from '../components/IconeCirculo';
import { TipoIlustracao2D } from '../components/Ilustracao2D';
import { ScrollView, StyleSheet, Text, View } from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import { tema } from '../theme/tema';

export function textoParaLerConsentimento(): string {
  return (
    'Seus dados, suas regras. Cuidamos das suas informações de saúde com respeito e clareza. ' +
    'Só guardamos o necessário: seu apelido, seus horários de remédio e as bulas que você ler. ' +
    'Seu familiar só vê o que você autorizar. Você pode apagar tudo quando quiser na aba Ajustes. ' +
    'Toque em Aceito e quero continuar para seguir, ou em Agora não se preferir não salvar dados.'
  );
}

export function TelaConsentimento() {
  const { aceitarConsentimento } = useApp();
  const { cores, fonte, espessuraBorda, altoContraste } = useAcessibilidade();
  const [recusado, setRecusado] = useState(false);

  const itensLgpd: Array<{
    icone: TipoIlustracao2D;
    corFundo: string;
    corIcone: string;
    titulo: string;
    descricao: string;
  }> = [
    {
      icone: 'documento',
      corFundo: cores.primariaClara,
      corIcone: cores.primaria,
      titulo: 'Só guardamos o necessário',
      descricao:
        'Seu apelido, seus horários de remédio e as bulas que você ler.',
    },
    {
      icone: 'familia',
      corFundo: cores.acentoClaro,
      corIcone: cores.primaria,
      titulo: 'Seu familiar só vê o que você autorizar',
      descricao: 'Você escolhe quem acompanha e pode cancelar quando quiser.',
    },
    {
      icone: 'lixeira',
      corFundo: cores.atrasadaFundo,
      corIcone: cores.atrasadaTexto,
      titulo: 'Você pode apagar tudo quando quiser',
      descricao: 'Com dois toques na aba Ajustes, removemos todos os dados.',
    },
  ];

  const estiloCard = [
    styles.card,
    {
      backgroundColor: cores.superficie,
      borderWidth: espessuraBorda,
      borderColor: cores.borda,
    },
    !altoContraste && tema.sombraCard,
  ];

  if (recusado) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: cores.fundo }}
        contentContainerStyle={styles.conteudo}
        accessibilityLabel="Aviso de privacidade"
      >
        <View style={styles.topo}>
          <IconeCirculo
            tipo="aceno"
            corFundo={cores.acentoClaro}
            tamanho={84}
            tamanhoIcone={44}
            accessibilityLabel="Respeitamos sua escolha"
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
            Tudo bem, você decide
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
            Nada foi guardado. Sem a sua autorização, não salvamos seus horários
            nem avisamos sua família.
          </Text>
        </View>

        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.texto,
            }}
          >
            Quando quiser começar, é só tocar abaixo para rever as regras com
            calma.
          </Text>
        </View>

        <BotaoGrande
          titulo="Voltar e ler novamente"
          variante="primario"
          onPress={() => setRecusado(false)}
          accessibilityLabel="Voltar para ler o consentimento novamente"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      contentContainerStyle={styles.conteudo}
      accessibilityLabel="Tela de consentimento LGPD"
    >
      <View style={styles.topo}>
        <IconeCirculo
          tipo="cadeado"
          corFundo={cores.primariaClara}
          corIcone={cores.primaria}
          tamanho={84}
          tamanhoIcone={42}
          accessibilityLabel="Cadeado representando seguranca dos seus dados"
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
          Seus dados, suas regras
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
          Cuidamos das suas informações de saúde com respeito e clareza.
        </Text>
      </View>

      <View style={estiloCard}>
        {itensLgpd.map((item, indice) => (
          <View
            key={item.titulo}
            style={[
              styles.linhaItem,
              indice > 0 && {
                borderTopWidth: 1,
                borderColor: cores.borda,
                paddingTop: tema.espacamento.m,
              },
            ]}
          >
            <IconeCirculo
              tipo={item.icone}
              corFundo={item.corFundo}
              corIcone={item.corIcone}
              tamanho={56}
              tamanhoIcone={28}
            />
            <View style={styles.textoItem}>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(28),
                  fontWeight: '700',
                  color: cores.texto,
                }}
              >
                {item.titulo}
              </Text>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(30),
                  fontWeight: '500',
                  color: cores.textoSecundario,
                }}
              >
                {item.descricao}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.acoes}>
        <BotaoGrande
          titulo="Aceito e quero continuar"
          variante="primario"
          onPress={aceitarConsentimento}
          accessibilityLabel="Aceito as regras de privacidade e quero continuar"
        />

        <BotaoGrande
          titulo="Agora não"
          variante="secundario"
          onPress={() => setRecusado(true)}
          accessibilityLabel="Agora nao, nao quero aceitar neste momento"
        />
      </View>
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
    paddingTop: 8,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: tema.espacamento.m,
  },
  linhaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  textoItem: {
    flex: 1,
    gap: 4,
  },
  acoes: {
    gap: 14,
  },
});
