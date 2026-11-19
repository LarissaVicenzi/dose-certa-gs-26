/**
 * Tela 4: Ler Bula com ilustracoes 2D planas, temas dinamicos, escala de texto
 * e dica de microfone do teclado no campo de pergunta.
 */
import React, { useEffect, useState } from 'react';
import { BotaoGrande } from '../components/BotaoGrande';
import { IconeCirculo } from '../components/IconeCirculo';
import { TipoIlustracao2D } from '../components/Ilustracao2D';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from '../components/RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { useApp } from '../context/AppContext';
import {
  analisarRotinaMedicamentos,
  perguntarSobreDocumento,
} from '../services/api';
import {
  escolherFoto,
  escolherFotoReal,
  listarExemplosBula,
} from '../services/camera';
import { tema } from '../theme/tema';
import { AnaliseRotinaMedicamentos, DocumentoLido } from '../types/modelos';

export function textoParaLerBula(documentoAtual: DocumentoLido | null): string {
  if (!documentoAtual) {
    return (
      'Tela Ler bula juntos. Explicamos o que está escrito na bula em palavras simples. ' +
      'Toque em Fotografar bula ou receita, ou escolha um exemplo como Losartana, Metformina ou Sinvastatina.'
    );
  }

  return (
    `Tela Ler bula. Remédio lido: ${documentoAtual.nomeRemedio}. ` +
    `${documentoAtual.resumoSimples} ` +
    `Para que serve: ${documentoAtual.paraQueServe} ` +
    `Como tomar: ${documentoAtual.comoTomar} ` +
    `Cuidados: ${documentoAtual.cuidados}`
  );
}

export function TelaLerBula() {
  const { agenda, documentoAtual, processarFotoBula } = useApp();
  const {
    cores,
    fonte,
    espessuraBorda,
    toqueMinimo,
    altoContraste,
    falandoAgora,
    lerTexto,
    pararLeitura,
  } = useAcessibilidade();

  const [carregando, setCarregando] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);
  const [pergunta, setPergunta] = useState('');
  const [respostaDuvida, setRespostaDuvida] = useState('');
  const [erroPergunta, setErroPergunta] = useState<string | null>(null);
  const [respondendo, setRespondendo] = useState(false);

  const [remedioExtra, setRemedioExtra] = useState('');
  const [analisandoRotina, setAnalisandoRotina] = useState(false);
  const [erroRotina, setErroRotina] = useState<string | null>(null);
  const [analiseRotina, setAnaliseRotina] =
    useState<AnaliseRotinaMedicamentos | null>(null);

  const exemplos = listarExemplosBula();

  const passos: Array<{
    numero: string;
    rotulo: string;
    icone: TipoIlustracao2D;
    cor: string;
  }> = [
    { numero: '1', rotulo: 'Fotografe', icone: 'camera', cor: cores.primariaClara },
    { numero: '2', rotulo: 'Leia', icone: 'olho', cor: cores.acentoClaro },
    { numero: '3', rotulo: 'Ouça', icone: 'som', cor: cores.sucessoFundo },
  ];

  useEffect(() => {
    return () => {
      pararLeitura();
    };
  }, [pararLeitura]);

  async function handleFotografarReal() {
    pararLeitura();
    setErroIA(null);
    setErroPergunta(null);
    setRespostaDuvida('');
    setPergunta('');

    const foto = await escolherFotoReal();
    if (!foto) return;

    setCarregando(true);
    try {
      await processarFotoBula(foto.uri, foto.codigoDocumento, {
        fotoBase64: foto.base64,
        mimeType: foto.mimeType,
      });
    } catch (err) {
      setErroIA(
        err instanceof Error
          ? err.message
          : 'Não foi possível ler a imagem agora. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function handleEscolherExemplo(
    codigo: 'losartana' | 'metformina' | 'sinvastatina'
  ) {
    pararLeitura();
    setErroIA(null);
    setErroPergunta(null);
    setRespostaDuvida('');
    setPergunta('');
    setCarregando(true);
    try {
      const foto = await escolherFoto(codigo);
      await processarFotoBula(foto.uri, foto.codigoDocumento);
    } catch (err) {
      setErroIA(
        err instanceof Error
          ? err.message
          : 'Não foi possível ler o exemplo agora. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }

  function handleOuvirExplicacao() {
    if (!documentoAtual) return;
    if (falandoAgora) {
      pararLeitura();
      return;
    }

    const textoCompleto = `${documentoAtual.nomeRemedio}. Para que serve: ${documentoAtual.paraQueServe} Como tomar: ${documentoAtual.comoTomar} Cuidados: ${documentoAtual.cuidados}`;
    lerTexto(textoCompleto);
  }

  async function handlePerguntar(textoPergunta?: string) {
    if (!documentoAtual) return;
    const consulta = (textoPergunta ?? pergunta).trim();
    if (!consulta) return;

    setPergunta(consulta);
    setErroPergunta(null);
    setRespondendo(true);
    try {
      const resposta = await perguntarSobreDocumento(documentoAtual, consulta);
      setRespostaDuvida(resposta);
    } catch (err) {
      setErroPergunta(
        err instanceof Error
          ? err.message
          : 'Não foi possível responder agora. Tente novamente.'
      );
    } finally {
      setRespondendo(false);
    }
  }

  async function handleAnalisarRotinaMobile() {
    pararLeitura();
    setErroRotina(null);
    const lista = agenda.map((d) => ({
      nome: d.nome,
      dose: d.dose,
      horario: d.horario,
      periodo: d.periodo,
    }));
    const extraLimpo = remedioExtra.trim();
    if (extraLimpo) {
      lista.push({
        nome: extraLimpo,
        dose: '',
        horario: '',
        periodo: 'Manhã',
      });
    }
    if (
      documentoAtual &&
      !lista.some((m) =>
        m.nome
          .toLowerCase()
          .includes(documentoAtual.nomeRemedio.split(' ')[0].toLowerCase())
      )
    ) {
      lista.push({
        nome: documentoAtual.nomeRemedio,
        dose: '',
        horario: '',
        periodo: 'Manhã',
      });
    }

    setAnalisandoRotina(true);
    try {
      const resultado = await analisarRotinaMedicamentos(lista);
      setAnaliseRotina(resultado);
    } catch (err) {
      setErroRotina(
        err instanceof Error
          ? err.message
          : 'Não foi possível verificar seus remédios juntos agora.'
      );
    } finally {
      setAnalisandoRotina(false);
    }
  }

  function handleOuvirRotinaMobile() {
    if (!analiseRotina) return;
    if (falandoAgora) {
      pararLeitura();
      return;
    }
    const alertas = analiseRotina.interacoes
      .map(
        (i) =>
          `${i.tituloAlerta}. Efeito possível: ${i.efeitoColateralPrejudicial}. O que fazer: ${i.orientacaoPratica}`
      )
      .join(' ');
    lerTexto(
      `Análise dos seus remédios juntos. ${analiseRotina.resumoGeral} ${alertas} ${analiseRotina.avisoMedico}`
    );
  }

  const estiloCard = [
    styles.card,
    {
      backgroundColor: cores.superficie,
      borderWidth: espessuraBorda,
      borderColor: cores.borda,
    },
    !altoContraste && tema.sombraCard,
  ];

  return (
    <View style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView
        style={styles.rolagem}
        contentContainerStyle={styles.conteudo}
        accessibilityLabel="Tela Ler Bula"
      >
        <View style={styles.cabecalho}>
          <Text
            style={{
              fontSize: fonte(30),
              lineHeight: fonte(38),
              fontWeight: '800',
              color: cores.texto,
            }}
            accessibilityRole="header"
          >
            Ler bula juntos
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Explicamos o que está escrito na bula em palavras simples.
          </Text>
        </View>

        <View
          style={[
            styles.cardPassos,
            {
              backgroundColor: cores.superficie,
              borderWidth: espessuraBorda,
              borderColor: cores.borda,
            },
            !altoContraste && tema.sombraCard,
          ]}
          accessibilityLabel="Tres passos: 1 Fotografe, 2 Leia, 3 Ouca"
        >
          {passos.map((passo) => (
            <View key={passo.numero} style={styles.itemPasso}>
              <IconeCirculo
                tipo={passo.icone}
                corFundo={passo.cor}
                tamanho={56}
                tamanhoIcone={28}
              />
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(26),
                  fontWeight: '700',
                  color: cores.texto,
                  textAlign: 'center',
                }}
              >
                {passo.numero}. {passo.rotulo}
              </Text>
            </View>
          ))}
        </View>

        <BotaoGrande
          titulo={
            carregando
              ? 'Lendo com inteligência...'
              : 'Fotografar ou escolher foto da bula'
          }
          icone="camera"
          variante="primario"
          desabilitado={carregando}
          onPress={handleFotografarReal}
          accessibilityLabel="Fotografar ou escolher uma foto de bula ou receita do medicamento"
        />

        {erroIA ? (
          <View
            style={[
              styles.cardInfoColorido,
              {
                backgroundColor: cores.atrasadaFundo,
                borderWidth: espessuraBorda,
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
              {erroIA}
            </Text>
          </View>
        ) : null}

        <View style={styles.blocoExemplos}>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(28),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Ou teste agora com uma bula de exemplo (lida pela IA):
          </Text>
          <View style={styles.linhaChips}>
            {exemplos.map((ex) => (
              <Pressable
                key={ex.codigo}
                disabled={carregando}
                onPress={() => handleEscolherExemplo(ex.codigo)}
                style={[
                  styles.chipExemplo,
                  {
                    minHeight: toqueMinimo,
                    borderRadius: Math.min(toqueMinimo / 2, 28),
                    backgroundColor: cores.superficie,
                    borderWidth: espessuraBorda,
                    borderColor: cores.borda,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Testar bula de ${ex.rotulo}`}
              >
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '700',
                    color: cores.texto,
                  }}
                >
                  {ex.rotulo}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {!documentoAtual ? (
          <View style={[estiloCard, styles.cardVazio]}>
            <IconeCirculo
              tipo="bula"
              corFundo={cores.primariaClara}
              tamanho={80}
              tamanhoIcone={42}
            />
            <Text
              style={{
                fontSize: fonte(24),
                lineHeight: fonte(32),
                fontWeight: '700',
                color: cores.texto,
                textAlign: 'center',
              }}
            >
              Que tal ler a bula juntos?
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
              Toque em "Fotografar bula ou receita" acima para ver e ouvir as
              informações com letra grande.
            </Text>
          </View>
        ) : (
          <View style={styles.blocoResultado}>
            <View style={estiloCard}>
              <Image
                source={{ uri: documentoAtual.fotoUri }}
                style={styles.imagemBula}
                resizeMode="contain"
                accessibilityLabel={`Foto da bula de ${documentoAtual.nomeRemedio}`}
              />
              <Text
                style={{
                  fontSize: fonte(24),
                  lineHeight: fonte(32),
                  fontWeight: '700',
                  color: cores.texto,
                }}
              >
                {documentoAtual.nomeRemedio}
              </Text>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(30),
                  fontWeight: '700',
                  color: cores.primaria,
                }}
              >
                {documentoAtual.resumoSimples}
              </Text>
            </View>

            <View
              style={[
                styles.cardInfoColorido,
                {
                  backgroundColor: cores.primariaClara,
                  borderWidth: altoContraste ? 2 : 0,
                  borderColor: cores.primaria,
                },
              ]}
            >
              <View style={styles.linhaTituloCardInfo}>
                <IconeCirculo
                  tipo="alvo"
                  corFundo={cores.superficie}
                  tamanho={52}
                  tamanhoIcone={28}
                />
                <Text
                  style={{
                    fontSize: fonte(24),
                    lineHeight: fonte(32),
                    fontWeight: '700',
                    color: cores.primaria,
                    flex: 1,
                  }}
                >
                  Para que serve
                </Text>
              </View>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(30),
                  fontWeight: '500',
                  color: cores.texto,
                }}
              >
                {documentoAtual.paraQueServe}
              </Text>
            </View>

            <View
              style={[
                styles.cardInfoColorido,
                {
                  backgroundColor: cores.acentoClaro,
                  borderWidth: altoContraste ? 2 : 0,
                  borderColor: cores.acento,
                },
              ]}
            >
              <View style={styles.linhaTituloCardInfo}>
                <IconeCirculo
                  tipo="relogio"
                  corFundo={cores.superficie}
                  tamanho={52}
                  tamanhoIcone={28}
                />
                <Text
                  style={{
                    fontSize: fonte(24),
                    lineHeight: fonte(32),
                    fontWeight: '700',
                    color: cores.textoSobreAcento,
                    flex: 1,
                  }}
                >
                  Como tomar
                </Text>
              </View>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(30),
                  fontWeight: '500',
                  color: cores.texto,
                }}
              >
                {documentoAtual.comoTomar}
              </Text>
            </View>

            <View
              style={[
                styles.cardInfoColorido,
                {
                  backgroundColor: cores.atrasadaFundo,
                  borderWidth: altoContraste ? 2 : 0,
                  borderColor: cores.atrasadaTexto,
                },
              ]}
            >
              <View style={styles.linhaTituloCardInfo}>
                <IconeCirculo
                  tipo="cuidado"
                  corFundo={cores.superficie}
                  tamanho={52}
                  tamanhoIcone={28}
                />
                <Text
                  style={{
                    fontSize: fonte(24),
                    lineHeight: fonte(32),
                    fontWeight: '700',
                    color: cores.atrasadaTexto,
                    flex: 1,
                  }}
                >
                  Cuidados
                </Text>
              </View>
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(30),
                  fontWeight: '500',
                  color: cores.texto,
                }}
              >
                {documentoAtual.cuidados}
              </Text>
            </View>

            <View style={estiloCard}>
              <Text
                style={{
                  fontSize: fonte(24),
                  lineHeight: fonte(32),
                  fontWeight: '700',
                  color: cores.texto,
                }}
              >
                Ficou alguma dúvida sobre esta bula?
              </Text>
              <TextInput
                value={pergunta}
                onChangeText={setPergunta}
                placeholder="Ex: Como devo tomar?"
                style={[
                  styles.campoPergunta,
                  {
                    minHeight: Math.max(60, toqueMinimo),
                    backgroundColor: cores.fundo,
                    borderColor: cores.borda,
                    fontSize: fonte(20),
                    color: cores.texto,
                  },
                ]}
                accessibilityLabel="Escreva uma duvida sobre esta bula"
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

              <View style={styles.linhaChips}>
                <Pressable
                  onPress={() => handlePerguntar('Como tomar?')}
                  style={[
                    styles.chipExemplo,
                    {
                      minHeight: toqueMinimo,
                      borderRadius: Math.min(toqueMinimo / 2, 28),
                      backgroundColor: cores.fundo,
                      borderWidth: espessuraBorda,
                      borderColor: cores.borda,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Perguntar: Como tomar?"
                >
                  <Text
                    style={{
                      fontSize: fonte(20),
                      lineHeight: fonte(28),
                      fontWeight: '700',
                      color: cores.texto,
                    }}
                  >
                    Como tomar?
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePerguntar('Posso tomar 2 comprimidos?')}
                  style={[
                    styles.chipExemplo,
                    {
                      minHeight: toqueMinimo,
                      borderRadius: Math.min(toqueMinimo / 2, 28),
                      backgroundColor: cores.fundo,
                      borderWidth: espessuraBorda,
                      borderColor: cores.borda,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Testar pergunta fora da bula: Posso tomar 2?"
                >
                  <Text
                    style={{
                      fontSize: fonte(20),
                      lineHeight: fonte(28),
                      fontWeight: '700',
                      color: cores.texto,
                    }}
                  >
                    Posso tomar 2?
                  </Text>
                </Pressable>
              </View>

              <BotaoGrande
                titulo={respondendo ? 'Buscando na bula...' : 'Perguntar'}
                variante="secundario"
                desabilitado={respondendo || !pergunta.trim()}
                onPress={() => handlePerguntar()}
                accessibilityLabel="Enviar pergunta sobre a bula"
              />

              {erroPergunta ? (
                <View
                  style={[
                    styles.caixaResposta,
                    {
                      backgroundColor: cores.atrasadaFundo,
                      borderWidth: espessuraBorda,
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
                    {erroPergunta}
                  </Text>
                </View>
              ) : null}

              {respostaDuvida ? (
                <View
                  style={[
                    styles.caixaResposta,
                    {
                      backgroundColor: cores.acentoClaro,
                      borderWidth: altoContraste ? 2 : 0,
                      borderColor: cores.acento,
                    },
                  ]}
                  accessibilityRole="alert"
                >
                  <Text
                    style={{
                      fontSize: fonte(20),
                      lineHeight: fonte(30),
                      fontWeight: '700',
                      color: cores.textoSobreAcento,
                    }}
                  >
                    {respostaDuvida}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Bloco: Analisar rotina completa de medicamentos com IA */}
        <View style={estiloCard}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '800',
              color: cores.texto,
            }}
          >
            Meus remédios combinam?
          </Text>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(28),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            A inteligência artificial compara todos os {agenda.length} remédios da
            sua agenda para avisar sobre efeitos colaterais prejudiciais.
          </Text>

          <TextInput
            value={remedioExtra}
            onChangeText={setRemedioExtra}
            placeholder="Quer testar outro remédio? (ex: Ibuprofeno)"
            style={[
              styles.campoPergunta,
              {
                minHeight: Math.max(60, toqueMinimo),
                backgroundColor: cores.fundo,
                borderColor: cores.borda,
                fontSize: fonte(20),
                color: cores.texto,
              },
            ]}
            accessibilityLabel="Digite o nome de outro medicamento para testar junto com sua rotina"
          />

          <BotaoGrande
            titulo={
              analisandoRotina
                ? 'Verificando sua rotina...'
                : 'Analisar minha rotina (IA)'
            }
            variante="primario"
            desabilitado={analisandoRotina}
            onPress={handleAnalisarRotinaMobile}
            accessibilityLabel="Analisar toda a rotina de medicamentos com inteligência artificial"
          />

          {erroRotina ? (
            <View
              style={[
                styles.caixaResposta,
                {
                  backgroundColor: cores.atrasadaFundo,
                  borderWidth: espessuraBorda,
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
                {erroRotina}
              </Text>
            </View>
          ) : null}

          {analiseRotina ? (
            <View style={{ gap: 12 }}>
              <View
                style={[
                  styles.caixaResposta,
                  {
                    backgroundColor:
                      analiseRotina.nivelGeral === 'alto'
                        ? cores.atrasadaFundo
                        : analiseRotina.nivelGeral === 'atencao'
                          ? cores.acentoClaro
                          : cores.sucessoFundo,
                    borderWidth: espessuraBorda,
                    borderColor:
                      analiseRotina.nivelGeral === 'alto'
                        ? cores.atrasadaTexto
                        : analiseRotina.nivelGeral === 'atencao'
                          ? cores.acento
                          : cores.sucessoTexto,
                  },
                ]}
                accessibilityRole="alert"
              >
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '800',
                    color:
                      analiseRotina.nivelGeral === 'alto'
                        ? cores.atrasadaTexto
                        : analiseRotina.nivelGeral === 'atencao'
                          ? cores.textoSobreAcento
                          : cores.sucessoTexto,
                  }}
                >
                  {analiseRotina.nivelGeral === 'alto'
                    ? 'Alerta importante'
                    : analiseRotina.nivelGeral === 'atencao'
                      ? 'Atenção recomendada'
                      : 'Rotina compatível'}
                </Text>
                <Text
                  style={{
                    fontSize: fonte(20),
                    lineHeight: fonte(28),
                    fontWeight: '500',
                    color: cores.texto,
                    marginTop: 4,
                  }}
                >
                  {analiseRotina.resumoGeral}
                </Text>
              </View>

              {analiseRotina.interacoes.map((item, idx) => (
                <View
                  key={`${item.tituloAlerta}-${idx}`}
                  style={[
                    styles.caixaResposta,
                    {
                      backgroundColor: cores.fundo,
                      borderWidth: espessuraBorda,
                      borderColor: cores.borda,
                      gap: 6,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: fonte(18, 22),
                      lineHeight: fonte(24, 28),
                      fontWeight: '800',
                      color: cores.primaria,
                    }}
                  >
                    {item.medicamentosEnvolvidos.join(' + ')}
                  </Text>
                  <Text
                    style={{
                      fontSize: fonte(20),
                      lineHeight: fonte(28),
                      fontWeight: '800',
                      color: cores.texto,
                    }}
                  >
                    {item.tituloAlerta}
                  </Text>
                  <Text
                    style={{
                      fontSize: fonte(20),
                      lineHeight: fonte(28),
                      fontWeight: '500',
                      color: cores.texto,
                    }}
                  >
                    {item.efeitoColateralPrejudicial}
                  </Text>
                  <Text
                    style={{
                      fontSize: fonte(18, 22),
                      lineHeight: fonte(26, 30),
                      fontWeight: '700',
                      color: cores.textoSecundario,
                    }}
                  >
                    Orientação: {item.orientacaoPratica}
                  </Text>
                </View>
              ))}

              <BotaoGrande
                titulo={
                  falandoAgora ? 'Parar leitura' : 'Ouvir resultado da rotina'
                }
                icone={falandoAgora ? 'parar' : 'som'}
                variante="secundario"
                onPress={handleOuvirRotinaMobile}
                accessibilityLabel="Ouvir em voz alta o resultado da análise dos seus medicamentos"
              />
            </View>
          ) : null}
        </View>

        <Text
          style={{
            fontSize: fonte(20),
            lineHeight: fonte(28),
            fontWeight: '500',
            color: cores.textoSecundario,
            textAlign: 'center',
            paddingHorizontal: 8,
          }}
        >
          Isto é uma explicação da bula. Em caso de dúvida, pergunte ao seu
          médico ou farmacêutico.
        </Text>
      </ScrollView>

      {documentoAtual && (
        <View
          style={[
            styles.rodapeFixo,
            {
              backgroundColor: cores.superficie,
              borderTopWidth: espessuraBorda,
              borderColor: cores.borda,
            },
          ]}
        >
          <BotaoGrande
            titulo={
              falandoAgora ? 'Falando… toque para parar' : 'Ouvir explicação'
            }
            icone={falandoAgora ? 'parar' : 'som'}
            variante={falandoAgora ? 'acento' : 'primario'}
            onPress={handleOuvirExplicacao}
            accessibilityLabel={
              falandoAgora
                ? 'Falando explicacao. Toque para parar.'
                : 'Ouvir explicacao da bula em voz alta'
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
  },
  rolagem: {
    flex: 1,
  },
  conteudo: {
    padding: tema.espacamento.tela,
    gap: tema.espacamento.m,
    paddingBottom: tema.espacamento.g,
  },
  cabecalho: {
    gap: 6,
  },
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 12,
  },
  cardPassos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    borderRadius: tema.formas.raioCard,
    padding: 16,
    gap: 12,
  },
  itemPasso: {
    minWidth: 92,
    flexGrow: 1,
    alignItems: 'center',
    gap: 8,
  },
  blocoExemplos: {
    gap: 10,
  },
  linhaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipExemplo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardVazio: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  blocoResultado: {
    gap: tema.espacamento.m,
  },
  imagemBula: {
    width: '100%',
    height: 168,
    borderRadius: 16,
  },
  cardInfoColorido: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 12,
  },
  linhaTituloCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  campoPergunta: {
    borderWidth: 2,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '500',
  },
  caixaResposta: {
    borderRadius: 18,
    padding: 16,
  },
  rodapeFixo: {
    paddingHorizontal: tema.espacamento.tela,
    paddingVertical: 12,
  },
});
