/**
 * Painel de geracao oficial dos documentos PDF (Framework Application e Gamification)
 * diretamente no Google Docs do usuario, com exportacao automatica em PDF.
 * Inclui botao oficial "Sign in with Google" e dialogo explicito de confirmacao antes
 * de criar documentos na conta Google do usuario.
 */
import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import {
  baixarPdfDeDocExistente,
  gerarDocFrameworkNoGoogle,
  gerarDocGamificacaoNoGoogle,
  googleSignIn,
  initAuth,
  logoutGoogle,
  MetadadosEntregaGrupo,
  ResultadoDocCriado,
} from '../services/googleDocs';
import { tema } from '../theme/tema';

type TipoConfirmacao = 'framework' | 'gamificacao' | 'ambos' | null;

export function PainelGoogleDocsPDF() {
  const { cores, fonte, espessuraBorda, toqueMinimo, altoContraste } =
    useAcessibilidade();

  const [usuarioGoogle, setUsuarioGoogle] = useState<User | null>(null);
  const [conectado, setConectado] = useState(false);
  const [entrando, setEntrando] = useState(false);

  const [integrantes, setIntegrantes] = useState('');
  const [turma, setTurma] = useState('2TWDPF');
  const [linkGithubFastApi, setLinkGithubFastApi] = useState('');
  const [linkPlataformaWeb, setLinkPlataformaWeb] = useState(
    typeof window !== 'undefined' ? window.location.origin : ''
  );
  const [linkVideoDemo, setLinkVideoDemo] = useState('');

  const [confirmacaoAberta, setConfirmacaoAberta] =
    useState<TipoConfirmacao>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [docsCriados, setDocsCriados] = useState<ResultadoDocCriado[]>([]);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setUsuarioGoogle(user);
        setConectado(true);
      },
      () => {
        setUsuarioGoogle(null);
        setConectado(false);
      }
    );
    return () => unsub();
  }, []);

  async function handleLoginGoogle() {
    setErro(null);
    setEntrando(true);
    try {
      const res = await googleSignIn();
      setUsuarioGoogle(res.user);
      setConectado(true);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível entrar com sua conta Google.'
      );
    } finally {
      setEntrando(false);
    }
  }

  async function handleSairGoogle() {
    await logoutGoogle();
    setUsuarioGoogle(null);
    setConectado(false);
    setConfirmacaoAberta(null);
  }

  async function executarCriacaoConfirmada() {
    if (!confirmacaoAberta) return;
    const alvo = confirmacaoAberta;
    setConfirmacaoAberta(null);
    setErro(null);
    setGerando(true);

    const meta: MetadadosEntregaGrupo = {
      integrantes,
      turma,
      linkGithubFastApi,
      linkPlataformaWeb,
      linkVideoDemo,
    };

    try {
      const novos: ResultadoDocCriado[] = [];
      if (alvo === 'framework' || alvo === 'ambos') {
        novos.push(await gerarDocFrameworkNoGoogle(meta));
      }
      if (alvo === 'gamificacao' || alvo === 'ambos') {
        novos.push(await gerarDocGamificacaoNoGoogle(meta));
      }
      setDocsCriados((prev) => [...novos, ...prev]);
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Erro ao criar o documento no Google Docs.'
      );
    } finally {
      setGerando(false);
    }
  }

  async function handleBaixarPdfNovamente(doc: ResultadoDocCriado) {
    setErro(null);
    try {
      await baixarPdfDeDocExistente(doc.documentId, doc.nomeArquivoPdf);
    } catch (err) {
      setErro(
        err instanceof Error ? err.message : 'Erro ao exportar o PDF.'
      );
    }
  }

  function handleCopiarLink(doc: ResultadoDocCriado) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(doc.docUrl).catch(() => {});
      setCopiadoId(doc.documentId);
      setTimeout(() => setCopiadoId(null), 2500);
    }
  }

  const descricaoConfirmacao =
    confirmacaoAberta === 'ambos'
      ? 'Criar 2 novos documentos no seu Google Docs ("Dose Certa — Entrega Framework Application" e "Dose Certa — Entrega Gamification Citizen Flow") e baixar automaticamente os 2 arquivos em PDF?'
      : confirmacaoAberta === 'framework'
        ? 'Criar o documento "Dose Certa — Entrega Framework Application (FIAP GS CitizenTech)" no seu Google Docs e baixar automaticamente o arquivo PDF?'
        : 'Criar o documento "Dose Certa — Entrega Gamification Citizen Flow (FIAP GS CitizenTech)" no seu Google Docs e baixar automaticamente o arquivo PDF?';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cores.superficie,
          borderWidth: espessuraBorda,
          borderColor: cores.azulBrasil,
        },
        !altoContraste && tema.sombraCard,
      ]}
    >
      <View style={styles.topo}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{
              fontSize: fonte(24),
              lineHeight: fonte(32),
              fontWeight: '800',
              color: cores.azulBrasil,
            }}
          >
            📄 Gerar Documentos no Google Docs e Exportar PDF
          </Text>
          <Text
            style={{
              fontSize: fonte(18, 22),
              lineHeight: fonte(26, 30),
              fontWeight: '500',
              color: cores.textoSecundario,
            }}
          >
            Cria os relatórios oficiais de Framework Application (Bruno Maia) e
            Gamification Citizen Flow (Felipe Facio) direto no seu Google Docs e
            baixa o PDF pronto para entrega na FIAP.
          </Text>
        </View>

        {conectado && usuarioGoogle && (
          <View style={styles.usuarioBox}>
            <Text
              style={{
                fontSize: fonte(16, 20),
                lineHeight: fonte(22, 26),
                fontWeight: '700',
                color: cores.sucessoTexto,
              }}
            >
              ✓ Conectado: {usuarioGoogle.email}
            </Text>
            <Pressable
              onPress={handleSairGoogle}
              style={[
                styles.botaoSair,
                {
                  borderColor: cores.borda,
                  backgroundColor: cores.fundo,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Desconectar conta Google"
            >
              <Text
                style={{
                  fontSize: fonte(16, 18),
                  lineHeight: fonte(20, 24),
                  fontWeight: '700',
                  color: cores.textoSecundario,
                }}
              >
                Sair
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {!conectado ? (
        <View style={styles.areaLogin}>
          <Text
            style={{
              fontSize: fonte(18, 22),
              lineHeight: fonte(26, 30),
              fontWeight: '600',
              color: cores.texto,
            }}
          >
            Entre com sua conta Google para criar os documentos no Google Docs e
            baixar os PDFs automaticamente:
          </Text>

          <button
            type="button"
            onClick={handleLoginGoogle}
            disabled={entrando}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#FFFFFF',
              color: '#1F1F1F',
              border: '1px solid #747775',
              borderRadius: '24px',
              padding: '12px 24px',
              minHeight: '52px',
              fontSize: '18px',
              fontWeight: 600,
              fontFamily: 'system-ui, -apple-system, Roboto, sans-serif',
              cursor: entrando ? 'wait' : 'pointer',
              alignSelf: 'flex-start',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
            }}
          >
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24"
              height="24"
              style={{ display: 'block' }}
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>
              {entrando ? 'Conectando ao Google...' : 'Sign in with Google'}
            </span>
          </button>
        </View>
      ) : (
        <View style={styles.formulario}>
          <Text
            style={{
              fontSize: fonte(18, 22),
              lineHeight: fonte(26, 30),
              fontWeight: '700',
              color: cores.texto,
            }}
          >
            Dados opcionais do grupo (já entram preenchidos no cabeçalho do PDF):
          </Text>

          <TextInput
            value={integrantes}
            onChangeText={setIntegrantes}
            placeholder="Integrantes em ordem alfabética + RMs (ex: Ana Silva RM123456; João Costa RM654321)"
            style={[
              styles.campo,
              {
                minHeight: Math.max(52, toqueMinimo),
                backgroundColor: cores.fundo,
                borderColor: cores.borda,
                fontSize: fonte(18, 20),
                color: cores.texto,
              },
            ]}
            accessibilityLabel="Nomes e RMs do grupo em ordem alfabética"
          />

          <View style={styles.linhaCampos}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <TextInput
                value={turma}
                onChangeText={setTurma}
                placeholder="Turma (ex: 2TWDPF)"
                style={[
                  styles.campo,
                  {
                    minHeight: Math.max(52, toqueMinimo),
                    backgroundColor: cores.fundo,
                    borderColor: cores.borda,
                    fontSize: fonte(18, 20),
                    color: cores.texto,
                  },
                ]}
                accessibilityLabel="Turma FIAP"
              />
            </View>
            <View style={{ flex: 2, minWidth: 260 }}>
              <TextInput
                value={linkGithubFastApi}
                onChangeText={setLinkGithubFastApi}
                placeholder="Link do GitHub (repositório FastAPI)"
                style={[
                  styles.campo,
                  {
                    minHeight: Math.max(52, toqueMinimo),
                    backgroundColor: cores.fundo,
                    borderColor: cores.borda,
                    fontSize: fonte(18, 20),
                    color: cores.texto,
                  },
                ]}
                accessibilityLabel="Link do repositório GitHub do back-end FastAPI"
              />
            </View>
          </View>

          <View style={styles.linhaCampos}>
            <View style={{ flex: 1, minWidth: 240 }}>
              <TextInput
                value={linkPlataformaWeb}
                onChangeText={setLinkPlataformaWeb}
                placeholder="Link da Plataforma Web (Vercel / URL publicada)"
                style={[
                  styles.campo,
                  {
                    minHeight: Math.max(52, toqueMinimo),
                    backgroundColor: cores.fundo,
                    borderColor: cores.borda,
                    fontSize: fonte(18, 20),
                    color: cores.texto,
                  },
                ]}
                accessibilityLabel="Link da plataforma web publicada"
              />
            </View>
            <View style={{ flex: 1, minWidth: 240 }}>
              <TextInput
                value={linkVideoDemo}
                onChangeText={setLinkVideoDemo}
                placeholder="Link do vídeo de demonstração (até 3 min)"
                style={[
                  styles.campo,
                  {
                    minHeight: Math.max(52, toqueMinimo),
                    backgroundColor: cores.fundo,
                    borderColor: cores.borda,
                    fontSize: fonte(18, 20),
                    color: cores.texto,
                  },
                ]}
                accessibilityLabel="Link do vídeo de demonstração"
              />
            </View>
          </View>

          <View style={styles.linhaBotoes}>
            <Pressable
              disabled={gerando}
              onPress={() => setConfirmacaoAberta('ambos')}
              style={[
                styles.botaoAcao,
                {
                  minHeight: Math.max(56, toqueMinimo),
                  backgroundColor: cores.primaria,
                  borderColor: cores.primaria,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Gerar ambos os documentos no Google Docs e baixar em PDF"
            >
              <Text
                style={{
                  fontSize: fonte(18, 20),
                  lineHeight: fonte(24, 26),
                  fontWeight: '800',
                  color: cores.textoSobrePrimaria,
                  textAlign: 'center',
                }}
              >
                {gerando
                  ? 'Gerando no Google Docs e PDF...'
                  : '✨ Gerar os 2 Docs + Baixar 2 PDFs'}
              </Text>
            </Pressable>

            <Pressable
              disabled={gerando}
              onPress={() => setConfirmacaoAberta('framework')}
              style={[
                styles.botaoAcao,
                {
                  minHeight: Math.max(56, toqueMinimo),
                  backgroundColor: cores.fundo,
                  borderColor: cores.azulBrasil,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Gerar apenas documento Framework Application no Google Docs e PDF"
            >
              <Text
                style={{
                  fontSize: fonte(18, 20),
                  lineHeight: fonte(24, 26),
                  fontWeight: '800',
                  color: cores.azulBrasil,
                  textAlign: 'center',
                }}
              >
                Só Framework (PDF)
              </Text>
            </Pressable>

            <Pressable
              disabled={gerando}
              onPress={() => setConfirmacaoAberta('gamificacao')}
              style={[
                styles.botaoAcao,
                {
                  minHeight: Math.max(56, toqueMinimo),
                  backgroundColor: cores.fundo,
                  borderColor: cores.primaria,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Gerar apenas documento Gamification no Google Docs e PDF"
            >
              <Text
                style={{
                  fontSize: fonte(18, 20),
                  lineHeight: fonte(24, 26),
                  fontWeight: '800',
                  color: cores.primaria,
                  textAlign: 'center',
                }}
              >
                Só Gamification (PDF)
              </Text>
            </Pressable>
          </View>

          {/* Dialogo explicito de confirmacao antes de gravar no Google Docs/Drive */}
          {confirmacaoAberta && (
            <View
              style={[
                styles.caixaConfirmacao,
                {
                  backgroundColor: cores.acentoClaro,
                  borderColor: cores.acento,
                },
              ]}
              accessibilityRole="alert"
            >
              <Text
                style={{
                  fontSize: fonte(20),
                  lineHeight: fonte(28),
                  fontWeight: '800',
                  color: cores.textoSobreAcento,
                }}
              >
                Confirmar criação no Google Docs
              </Text>
              <Text
                style={{
                  fontSize: fonte(18, 22),
                  lineHeight: fonte(26, 30),
                  fontWeight: '500',
                  color: cores.texto,
                }}
              >
                {descricaoConfirmacao}
              </Text>
              <View style={styles.linhaBotoes}>
                <Pressable
                  onPress={executarCriacaoConfirmada}
                  style={[
                    styles.botaoAcao,
                    {
                      minHeight: 52,
                      backgroundColor: cores.primaria,
                      borderColor: cores.primaria,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Confirmar e criar no Google Docs"
                >
                  <Text
                    style={{
                      fontSize: fonte(18, 20),
                      lineHeight: fonte(24, 26),
                      fontWeight: '800',
                      color: cores.textoSobrePrimaria,
                    }}
                  >
                    ✓ Confirmar e criar
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirmacaoAberta(null)}
                  style={[
                    styles.botaoAcao,
                    {
                      minHeight: 52,
                      backgroundColor: cores.superficie,
                      borderColor: cores.borda,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar criação de documento"
                >
                  <Text
                    style={{
                      fontSize: fonte(18, 20),
                      lineHeight: fonte(24, 26),
                      fontWeight: '700',
                      color: cores.texto,
                    }}
                  >
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      )}

      {erro ? (
        <View
          style={[
            styles.caixaErro,
            {
              backgroundColor: cores.atrasadaFundo,
              borderColor: cores.atrasadaTexto,
            },
          ]}
          accessibilityRole="alert"
        >
          <Text
            style={{
              fontSize: fonte(18, 22),
              lineHeight: fonte(26, 30),
              fontWeight: '700',
              color: cores.atrasadaTexto,
            }}
          >
            {erro}
          </Text>
        </View>
      ) : null}

      {docsCriados.length > 0 && (
        <View style={styles.listaResultados}>
          <Text
            style={{
              fontSize: fonte(20),
              lineHeight: fonte(28),
              fontWeight: '800',
              color: cores.sucessoTexto,
            }}
          >
            Documentos gerados na sua conta Google:
          </Text>
          {docsCriados.map((doc) => (
            <View
              key={doc.documentId}
              style={[
                styles.itemResultado,
                {
                  backgroundColor: cores.sucessoFundo,
                  borderColor: cores.primaria,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: fonte(18, 22),
                  lineHeight: fonte(26, 30),
                  fontWeight: '800',
                  color: cores.texto,
                }}
              >
                ✓ {doc.titulo}
              </Text>
              <Text
                style={{
                  fontSize: fonte(16, 20),
                  lineHeight: fonte(24, 28),
                  fontWeight: '500',
                  color: cores.textoSecundario,
                }}
              >
                {doc.pdfBaixado
                  ? `PDF "${doc.nomeArquivoPdf}" baixado automaticamente.`
                  : 'Documento criado no Google Docs. Toque abaixo para baixar o PDF.'}
              </Text>
              <View style={styles.linhaBotoes}>
                <Pressable
                  onPress={() => handleBaixarPdfNovamente(doc)}
                  style={[
                    styles.botaoPequeno,
                    {
                      backgroundColor: cores.primaria,
                      borderColor: cores.primaria,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Baixar PDF de ${doc.titulo}`}
                >
                  <Text
                    style={{
                      fontSize: fonte(16, 18),
                      lineHeight: fonte(22, 24),
                      fontWeight: '800',
                      color: cores.textoSobrePrimaria,
                    }}
                  >
                    ⬇ Baixar PDF
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleCopiarLink(doc)}
                  style={[
                    styles.botaoPequeno,
                    {
                      backgroundColor: cores.superficie,
                      borderColor: cores.primaria,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Copiar link do Google Docs de ${doc.titulo}`}
                >
                  <Text
                    style={{
                      fontSize: fonte(16, 18),
                      lineHeight: fonte(22, 24),
                      fontWeight: '800',
                      color: cores.primaria,
                    }}
                  >
                    {copiadoId === doc.documentId
                      ? '✓ Link copiado!'
                      : '🔗 Copiar link do Google Docs'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: tema.formas.raioCard,
    padding: tema.formas.paddingCard,
    gap: 16,
  },
  topo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  usuarioBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  botaoSair: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  areaLogin: {
    gap: 12,
  },
  formulario: {
    gap: 12,
  },
  linhaCampos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  campo: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontWeight: '500',
  },
  linhaBotoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  botaoAcao: {
    flexGrow: 1,
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaConfirmacao: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  caixaErro: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
  },
  listaResultados: {
    gap: 12,
  },
  itemResultado: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  botaoPequeno: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
