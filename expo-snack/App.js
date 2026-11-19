/**
 * DOSE CERTA — App Mobile do Idoso (60+) em React Native (Expo Snack)
 * Global Solution FIAP — CitizenTech
 *
 * COMO USAR NO EXPO SNACK (https://snack.expo.dev):
 * 1. Abra https://snack.expo.dev e crie um novo Snack.
 * 2. Apague tudo que esta no arquivo App.js e cole este arquivo inteiro.
 * 3. Quando aparecer o aviso azul embaixo para adicionar "expo-speech", clique em "Add dependency".
 * 4. Pronto! Teste no celular com o app Expo Go (QR Code) ou no simulador Web/Android/iOS ao lado.
 *
 * Para conectar ao back-end real (FastAPI ou servidor publicado):
 * Troque USE_MOCK para false e coloque a URL em BASE_URL.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import * as Speech from 'expo-speech';

// ======================== CONFIGURACAO DA API ========================
const BASE_URL = 'https://sua-api-dose-certa.exemplo.com/v1';
const USE_MOCK = true;

// ======================== TEMAS E TOKENS (WCAG AA/AAA) ========================
const PALETAS = {
  claro: {
    verdeBrasil: '#0B6E4F',
    amareloBrasil: '#F2A541',
    azulBrasil: '#1351B4',
    fundo: '#FBF7F1',
    superficie: '#FFFFFF',
    borda: '#E8DFD2',
    texto: '#1F2933',
    textoSecundario: '#4A5560',
    primaria: '#0B6E4F',
    primariaClara: '#DFF3E8',
    textoSobrePrimaria: '#FFFFFF',
    acento: '#F2A541',
    acentoClaro: '#FFF1D6',
    textoSobreAcento: '#5C3B00',
    sucessoFundo: '#DFF3E8',
    sucessoTexto: '#0B6E4F',
    pendenteFundo: '#FFF1D6',
    pendenteTexto: '#8A5A00',
    atrasadaFundo: '#FDE8E4',
    atrasadaTexto: '#9B2C1F',
  },
  escuro: {
    verdeBrasil: '#5FD3A3',
    amareloBrasil: '#F7B955',
    azulBrasil: '#74B2FF',
    fundo: '#121A17',
    superficie: '#1C2622',
    borda: '#2E3B36',
    texto: '#F2F5F3',
    textoSecundario: '#C5D0CB',
    primaria: '#5FD3A3',
    primariaClara: '#1F3D32',
    textoSobrePrimaria: '#06281B',
    acento: '#F7B955',
    acentoClaro: '#3A2E14',
    textoSobreAcento: '#FFE3A8',
    sucessoFundo: '#1A3A2D',
    sucessoTexto: '#7CE4B8',
    pendenteFundo: '#3A2E14',
    pendenteTexto: '#FFD479',
    atrasadaFundo: '#3D1E1C',
    atrasadaTexto: '#FFB3AA',
  },
  alto_contraste: {
    verdeBrasil: '#52FF9A',
    amareloBrasil: '#FFD60A',
    azulBrasil: '#FFD60A',
    fundo: '#000000',
    superficie: '#000000',
    borda: '#FFFFFF',
    texto: '#FFFFFF',
    textoSecundario: '#FFFFFF',
    primaria: '#FFD60A',
    primariaClara: '#1A1A00',
    textoSobrePrimaria: '#000000',
    acento: '#FFD60A',
    acentoClaro: '#000000',
    textoSobreAcento: '#FFD60A',
    sucessoFundo: '#000000',
    sucessoTexto: '#52FF9A',
    pendenteFundo: '#000000',
    pendenteTexto: '#FFD60A',
    atrasadaFundo: '#000000',
    atrasadaTexto: '#FF8A80',
  },
};

const ESCALAS = [
  { valor: 1.0, rotulo: 'Normal' },
  { valor: 1.25, rotulo: 'Grande' },
  { valor: 1.5, rotulo: 'Muito grande' },
  { valor: 1.75, rotulo: 'Máximo' },
];

const TAXA_VOZ = { lenta: 0.75, normal: 0.95, rapida: 1.2 };

// ======================== DADOS INICIAIS E GAMIFICACAO ========================
const AGENDA_INICIAL = [
  {
    id: 'dose-1',
    horario: '08:00',
    periodo: 'Manhã',
    nome: 'Losartana 50 mg',
    dose: '1 comprimido',
    instrucao: 'Tomar com um copo de água',
    status: 'tomada',
    horarioTomado: '08:05',
  },
  {
    id: 'dose-2',
    horario: '12:00',
    periodo: 'Tarde',
    nome: 'Metformina 850 mg',
    dose: '1 comprimido',
    instrucao: 'Tomar logo após o almoço',
    status: 'atrasada',
  },
  {
    id: 'dose-3',
    horario: '20:00',
    periodo: 'Noite',
    nome: 'Sinvastatina 20 mg',
    dose: '1 comprimido',
    instrucao: 'Tomar antes de dormir',
    status: 'pendente',
  },
];

const BULAS_EXEMPLO = {
  losartana: {
    nomeRemedio: 'Losartana Potássica 50 mg',
    resumoSimples: 'Ajuda a manter sua pressão controlada e protege o coração.',
    paraQueServe: 'Serve para controlar a pressão alta e cuidar do coração e dos rins.',
    comoTomar: 'Geralmente 1 comprimido ao dia com água, no mesmo horário, seguindo sua receita.',
    cuidados: 'Levante-se devagar da cama ou cadeira para evitar tontura. Não pare sem falar com o médico.',
  },
  metformina: {
    nomeRemedio: 'Metformina 850 mg',
    resumoSimples: 'Ajuda a equilibrar o açúcar (glicose) no sangue.',
    paraQueServe: 'Serve para ajudar no controle da diabetes tipo 2 ao longo do dia.',
    comoTomar: 'Tomar durante ou logo após o almoço ou jantar, com água, para proteger o estômago.',
    cuidados: 'Beba água durante o dia e evite excesso de bebidas alcoólicas.',
  },
  sinvastatina: {
    nomeRemedio: 'Sinvastatina 20 mg',
    resumoSimples: 'Ajuda a baixar o colesterol e proteger o coração.',
    paraQueServe: 'Serve para controlar o colesterol alto e cuidar da circulação.',
    comoTomar: 'Geralmente 1 comprimido à noite, com um copo de água, antes de dormir.',
    cuidados: 'Avise seu médico se sentir dor ou fraqueza muscular forte e fora do comum.',
  },
};

const ESTAGIOS = [
  { nome: 'Semente', emoji: '🌱', min: 0, proxNome: 'Broto', proxMin: 30 },
  { nome: 'Broto', emoji: '🌿', min: 30, proxNome: 'Planta', proxMin: 80 },
  { nome: 'Planta', emoji: '🪴', min: 80, proxNome: 'Flor', proxMin: 160 },
  { nome: 'Flor', emoji: '🌸', min: 160, proxNome: 'Jardim Florido', proxMin: 300 },
  { nome: 'Jardim Florido', emoji: '🌳🌸', min: 300, proxNome: null, proxMin: null },
];

const CONQUISTAS_BASE = [
  { codigo: 'PRIMEIRO_PASSO', emoji: '🌱', titulo: 'Primeiro Passo', dica: 'Confirmou sua primeira dose.', pontos: 10 },
  { codigo: 'MANHA_EM_DIA', emoji: '🌅', titulo: 'Manhã em Dia', dica: 'Doses da manhã em dia por 5 dias.', pontos: 20 },
  { codigo: 'SEMANA_FIRME', emoji: '🗓️', titulo: 'Semana Firme', dica: '7 dias seguidos de cuidado.', pontos: 40 },
  { codigo: 'CURIOSA', emoji: '📖', titulo: 'Curiosa', dica: 'Leu 5 bulas ou receitas.', pontos: 25 },
  { codigo: 'SEM_PRESSA', emoji: '🌤️', titulo: 'Sem Pressa', dica: 'Tomou uma dose atrasada sem desistir.', pontos: 15 },
  { codigo: 'RECOMECAR', emoji: '🌿', titulo: 'Recomeço', dica: 'Voltou depois de um dia de descanso.', pontos: 15 },
  { codigo: 'EM_FAMILIA', emoji: '💛', titulo: 'Em Família', dica: 'Recebeu carinho da família no app.', pontos: 15 },
  { codigo: 'MES_DE_CUIDADO', emoji: '🌳', titulo: 'Mês de Cuidado', dica: '30 dias cuidando bem dos remédios.', pontos: 100 },
];

function obterEstagio(pontos) {
  let atual = ESTAGIOS[0];
  for (const e of ESTAGIOS) {
    if (pontos >= e.min) atual = e;
  }
  return atual;
}

function horaAgora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ======================== COMPONENTE BOTAO GRANDE ========================
function BotaoGrande({ titulo, onPress, cores, fonte, altura, variante = 'primario', desabilitado = false }) {
  const escala = useRef(new Animated.Value(1)).current;
  const ehPrimario = variante === 'primario';

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <Pressable
        disabled={desabilitado}
        onPress={onPress}
        onPressIn={() => Animated.timing(escala, { toValue: 0.97, duration: 120, useNativeDriver: true }).start()}
        onPressOut={() => Animated.timing(escala, { toValue: 1, duration: 140, useNativeDriver: true }).start()}
        accessibilityRole="button"
        accessibilityLabel={titulo}
        style={[
          styles.botaoGrande,
          {
            minHeight: altura,
            borderRadius: altura / 2,
            backgroundColor: ehPrimario ? cores.primaria : 'transparent',
            borderWidth: 2,
            borderColor: cores.primaria,
            opacity: desabilitado ? 0.55 : 1,
          },
        ]}
      >
        <Text
          style={{
            fontSize: fonte(21),
            fontWeight: '800',
            color: ehPrimario ? cores.textoSobrePrimaria : cores.primaria,
            textAlign: 'center',
          }}
        >
          {titulo}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ======================== APP PRINCIPAL ========================
export default function App() {
  const esquemaSistema = useColorScheme();

  // Preferencias de acessibilidade (salvas localmente em memoria no Snack)
  const [escalaFonte, setEscalaFonte] = useState(1.0);
  const [modoTema, setModoTema] = useState('claro');
  const [botoesMaiores, setBotoesMaiores] = useState(false);
  const [velocidadeVoz, setVelocidadeVoz] = useState('normal');
  const [lerAuto, setLerAuto] = useState(false);
  const [reduzirMovimento, setReduzirMovimento] = useState(false);
  const [falando, setFalando] = useState(false);

  // Navegacao e estado do usuario
  const [tela, setTela] = useState('splash');
  const [telaAnterior, setTelaAnterior] = useState('hoje');
  const [apelido, setApelido] = useState('');
  const [cuidadorAtivo, setCuidadorAtivo] = useState(true);
  const [agenda, setAgenda] = useState(AGENDA_INICIAL);
  const [pontos, setPontos] = useState(92);
  const [sequenciaDias, setSequenciaDias] = useState(5);
  const [docsLidos, setDocsLidos] = useState(3);
  const [conquistasOk, setConquistasOk] = useState(['PRIMEIRO_PASSO', 'MANHA_EM_DIA', 'EM_FAMILIA']);
  const [avisoPontos, setAvisoPontos] = useState('');

  // Offline simulado
  const [offline, setOffline] = useState(false);
  const [filaOffline, setFilaOffline] = useState([]);
  const [avisoSync, setAvisoSync] = useState('');

  // Ler bula
  const [bulaAtual, setBulaAtual] = useState(null);
  const [pergunta, setPergunta] = useState('');
  const [respostaDuvida, setRespostaDuvida] = useState('');

  // Confirmacao de apagar dados
  const [mostrarMeusDados, setMostrarMeusDados] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((ativo) => {
      if (ativo) setReduzirMovimento(true);
    });
  }, []);

  useEffect(() => {
    if (tela === 'splash') {
      const id = setTimeout(() => setTela('consentimento'), 1800);
      return () => clearTimeout(id);
    }
  }, [tela]);

  const temaAtivo = useMemo(() => {
    if (modoTema === 'automatico') {
      return esquemaSistema === 'dark' ? 'escuro' : 'claro';
    }
    return modoTema;
  }, [modoTema, esquemaSistema]);

  const cores = PALETAS[temaAtivo];
  const bordaW = temaAtivo === 'alto_contraste' ? 2 : 1.5;
  const toqueMin = botoesMaiores ? 72 : 56;
  const alturaPrincipal = botoesMaiores ? 84 : 72;
  const alturaSecundaria = botoesMaiores ? 72 : 60;
  const fonte = (base, max) => {
    const val = Math.round(base * escalaFonte);
    return max ? Math.min(val, max) : val;
  };

  function pararVoz() {
    try {
      Speech.stop();
    } catch {}
    setFalando(false);
  }

  function falarTexto(texto) {
    pararVoz();
    if (!texto) return;
    setFalando(true);
    try {
      Speech.speak(texto, {
        language: 'pt-BR',
        rate: TAXA_VOZ[velocidadeVoz] || 0.95,
        onDone: () => setFalando(false),
        onStopped: () => setFalando(false),
        onError: () => setFalando(false),
      });
    } catch {
      setFalando(false);
    }
  }

  const estagio = obterEstagio(pontos);

  function textoParaLerTela() {
    if (tela === 'consentimento') {
      return 'Seus dados, suas regras. Só guardamos seu apelido, seus horários de remédio e as bulas que você ler. Toque em Aceito e quero continuar.';
    }
    if (tela === 'preferencias') {
      return 'Como prefere ver este aplicativo? Escolha o tamanho da letra e as cores da tela. Depois toque em Continuar.';
    }
    if (tela === 'entrada') {
      return 'Que bom ter você aqui. Escreva como podemos te chamar ou toque em Dona Maria, Seu João ou Vó Tereza.';
    }
    if (tela === 'acessibilidade') {
      return 'Tela de Acessibilidade. Mude o tamanho da letra, as cores da tela, botões maiores ou teste a voz.';
    }
    if (tela === 'hoje') {
      const tomadas = agenda.filter((d) => d.status === 'tomada').length;
      return `Olá, ${apelido || 'Dona Maria'}. Você já confirmou ${tomadas} de ${agenda.length} remédios hoje.`;
    }
    if (tela === 'ler') {
      if (!bulaAtual) return 'Tela Ler Bula. Escolha uma bula de exemplo para ouvir em palavras simples.';
      return `${bulaAtual.nomeRemedio}. Para que serve: ${bulaAtual.paraQueServe} Como tomar: ${bulaAtual.comoTomar} Cuidados: ${bulaAtual.cuidados}`;
    }
    if (tela === 'jardim') {
      return `Jardim da Saúde. Seu jardim está no estágio ${estagio.nome}, com ${pontos} pontos e ${sequenciaDias} dias em dia. O jardim só descansa, nunca perde pontos.`;
    }
    if (tela === 'ajustes') {
      return `Tela Ajustes e Privacidade. Acompanhamento da sua filha Ana está ${cuidadorAtivo ? 'autorizado' : 'pausado'}.`;
    }
    return '';
  }

  useEffect(() => {
    if (lerAuto && tela !== 'splash') {
      const id = setTimeout(() => falarTexto(textoParaLerTela()), 250);
      return () => clearTimeout(id);
    }
  }, [tela, lerAuto]);

  async function confirmarDose(dose) {
    const hora = horaAgora();
    falarTexto(`Pronto, ${dose.nome} registrada.`);

    if (offline) {
      setFilaOffline((f) => [...f, { id: dose.id, hora }]);
      setAgenda((lista) =>
        lista.map((item) =>
          item.id === dose.id
            ? { ...item, status: 'tomada', horarioTomado: hora, pendenteSync: true }
            : item
        )
      );
      setAvisoSync('Guardado no celular. Quando a internet voltar, enviamos automaticamente.');
      return;
    }

    if (!USE_MOCK) {
      try {
        await fetch(`${BASE_URL}/doses/${dose.id}/confirmar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ horarioConfirmacao: hora }),
        });
      } catch {}
    }

    const eraAtrasada = dose.status === 'atrasada';
    const ganho = eraAtrasada ? 6 : 10;
    const novaLista = agenda.map((item) =>
      item.id === dose.id
        ? { ...item, status: 'tomada', horarioTomado: hora, pendenteSync: false }
        : item
    );
    setAgenda(novaLista);

    let totalGanho = ganho;
    if (novaLista.every((d) => d.status === 'tomada')) {
      totalGanho += 15;
      setSequenciaDias((s) => s + 1);
    }
    setPontos((p) => p + totalGanho);
    if (eraAtrasada && !conquistasOk.includes('SEM_PRESSA')) {
      setConquistasOk((c) => [...c, 'SEM_PRESSA']);
    }
    setAvisoPontos(
      eraAtrasada
        ? `+${totalGanho} pontos · Ainda deu tempo! Seu jardim agradece.`
        : `+${totalGanho} pontos · Dose confirmada!`
    );
  }

  function alternarOffline() {
    if (offline) {
      setOffline(false);
      if (filaOffline.length > 0) {
        const qtd = filaOffline.length;
        setAgenda((l) => l.map((d) => ({ ...d, pendenteSync: false })));
        setPontos((p) => p + qtd * 8);
        setFilaOffline([]);
        setAvisoSync(`${qtd} registro(s) sincronizado(s) com sucesso ✓`);
      } else {
        setAvisoSync('');
      }
    } else {
      setOffline(true);
      setAvisoSync('Sem internet: pode confirmar normalmente que guardamos aqui.');
    }
  }

  function lerExemploBula(codigo) {
    pararVoz();
    setBulaAtual(BULAS_EXEMPLO[codigo]);
    setRespostaDuvida('');
    setPergunta('');
    setDocsLidos((n) => {
      const prox = n + 1;
      if (prox >= 5 && !conquistasOk.includes('CURIOSA')) {
        setConquistasOk((c) => [...c, 'CURIOSA']);
      }
      return prox;
    });
    setPontos((p) => p + 8);
  }

  function perguntarBula(textoFixo) {
    if (!bulaAtual) return;
    const q = (textoFixo || pergunta).toLowerCase().trim();
    if (!q) return;
    setPergunta(textoFixo || pergunta);

    const termosBloqueados = ['2', 'dobrar', 'aumentar', 'parar', 'trocar', 'dor', 'febre', 'misturar', 'álcool'];
    if (termosBloqueados.some((t) => q.includes(t))) {
      setRespostaDuvida('Pergunte ao seu médico ou farmacêutico.');
      return;
    }
    if (q.includes('tomar') || q.includes('como') || q.includes('horário')) {
      setRespostaDuvida(`Na bula: ${bulaAtual.comoTomar}`);
      return;
    }
    if (q.includes('serve') || q.includes('para que')) {
      setRespostaDuvida(`Na bula: ${bulaAtual.paraQueServe}`);
      return;
    }
    if (q.includes('cuidado')) {
      setRespostaDuvida(`Na bula: ${bulaAtual.cuidados}`);
      return;
    }
    setRespostaDuvida('Pergunte ao seu médico ou farmacêutico.');
  }

  const cardStyle = {
    backgroundColor: cores.superficie,
    borderColor: cores.borda,
    borderWidth: bordaW,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  };

  // ======================== TELA SPLASH ========================
  if (tela === 'splash') {
    return (
      <SafeAreaView style={[styles.flex1, { backgroundColor: cores.fundo }]}>
        <StatusBar barStyle={temaAtivo === 'claro' ? 'dark-content' : 'light-content'} />
        <View style={styles.faixaBrasil}>
          <View style={[styles.flex1, { backgroundColor: cores.verdeBrasil }]} />
          <View style={[styles.flex1, { backgroundColor: cores.amareloBrasil }]} />
          <View style={[styles.flex1, { backgroundColor: cores.azulBrasil }]} />
        </View>
        <Pressable
          onPress={() => setTela('consentimento')}
          style={[styles.flex1, styles.centro, { padding: 24, gap: 16 }]}
          accessibilityLabel="Dose Certa. Toque para entrar."
        >
          <View style={[styles.logoCirculo, { backgroundColor: cores.primariaClara, borderColor: cores.primaria }]}>
            <Text style={{ fontSize: 56 }}>💊</Text>
          </View>
          <Text style={{ fontSize: 38, fontWeight: '800', color: cores.azulBrasil }}>Dose Certa</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: cores.textoSecundario, textAlign: 'center' }}>
            Cuidado simples no seu tempo
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const estaNasAbas = ['hoje', 'ler', 'jardim', 'ajustes'].includes(tela);

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: cores.fundo }]}>
      <StatusBar barStyle={temaAtivo === 'claro' ? 'dark-content' : 'light-content'} />

      {/* Faixa Brasil + Barra Superior Fixa */}
      <View style={styles.faixaBrasil}>
        <View style={[styles.flex1, { backgroundColor: cores.verdeBrasil }]} />
        <View style={[styles.flex1, { backgroundColor: cores.amareloBrasil }]} />
        <View style={[styles.flex1, { backgroundColor: cores.azulBrasil }]} />
      </View>

      <View style={[styles.topo, { backgroundColor: cores.superficie, borderBottomColor: cores.borda, borderBottomWidth: bordaW }]}>
        <Text style={{ fontSize: fonte(21, 26), fontWeight: '800', color: cores.azulBrasil }}>💊 Dose Certa</Text>

        <View style={styles.linhaGap8}>
          <Pressable
            onPress={() => {
              pararVoz();
              if (tela === 'acessibilidade') {
                setTela(telaAnterior);
              } else {
                setTelaAnterior(tela);
                setTela('acessibilidade');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Abrir acessibilidade"
            style={[
              styles.botaoTopoIcone,
              {
                minWidth: toqueMin,
                minHeight: toqueMin,
                borderRadius: toqueMin / 2,
                backgroundColor: tela === 'acessibilidade' ? cores.primaria : cores.acentoClaro,
                borderColor: cores.acento,
              },
            ]}
          >
            <Text style={{ fontSize: fonte(22, 26) }}>♿</Text>
          </Pressable>

          <Pressable
            onPress={() => (falando ? pararVoz() : falarTexto(textoParaLerTela()))}
            accessibilityRole="button"
            accessibilityLabel={falando ? 'Parar leitura' : 'Ouvir esta tela'}
            style={[
              styles.botaoOuvir,
              {
                minHeight: toqueMin,
                borderRadius: toqueMin / 2,
                backgroundColor: falando ? cores.acento : cores.primaria,
              },
            ]}
          >
            <Text
              style={{
                fontSize: fonte(18, 22),
                fontWeight: '800',
                color: falando ? cores.textoSobreAcento : cores.textoSobrePrimaria,
              }}
            >
              {falando ? '⏹ Parar' : '🔊 Ouvir'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Controle Online/Offline nas abas principais */}
      {estaNasAbas && (
        <View style={[styles.barraConexao, { backgroundColor: cores.fundo, borderBottomColor: cores.borda }]}>
          <Text style={{ fontSize: fonte(18, 22), fontWeight: '700', color: cores.textoSecundario, flex: 1 }}>
            {offline ? 'Sem internet (simulado)' : 'Conexão normal'}
          </Text>
          <Pressable
            onPress={alternarOffline}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: offline ? cores.acento : cores.primaria,
              backgroundColor: offline ? cores.acentoClaro : cores.sucessoFundo,
            }}
          >
            <Text style={{ fontSize: fonte(18, 22), fontWeight: '800', color: offline ? cores.textoSobreAcento : cores.sucessoTexto }}>
              {offline ? 'Offline' : 'Online'}
            </Text>
          </Pressable>
        </View>
      )}

      {avisoSync ? (
        <View style={{ backgroundColor: cores.pendenteFundo, padding: 12 }}>
          <Text style={{ fontSize: fonte(18, 22), fontWeight: '700', color: cores.pendenteTexto }}>{avisoSync}</Text>
        </View>
      ) : null}

      {/* CONTEUDO ROLAVEL */}
      <ScrollView style={styles.flex1} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}>
        {/* 1. CONSENTIMENTO LGPD */}
        {tela === 'consentimento' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>Seus dados, suas regras</Text>
            <View style={cardStyle}>
              <Text style={{ fontSize: fonte(20), lineHeight: fonte(30), color: cores.texto }}>
                • Guardamos só o necessário: seu apelido, seus remédios e as bulas que você ler.
              </Text>
              <Text style={{ fontSize: fonte(20), lineHeight: fonte(30), color: cores.texto }}>
                • Seu familiar só vê o que você autorizar.
              </Text>
              <Text style={{ fontSize: fonte(20), lineHeight: fonte(30), color: cores.texto }}>
                • Você pode apagar tudo quando quiser na aba Ajustes.
              </Text>
            </View>
            <BotaoGrande
              titulo="Aceito e quero continuar"
              onPress={() => setTela('preferencias')}
              cores={cores}
              fonte={fonte}
              altura={alturaPrincipal}
            />
          </>
        )}

        {/* 2. PREFERENCIAS INICIAIS */}
        {tela === 'preferencias' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>Como prefere ver este app?</Text>
            <View style={cardStyle}>
              <Text style={{ fontSize: fonte(24), fontWeight: '700', color: cores.texto }}>Tamanho da letra</Text>
              <View style={styles.wrapGap10}>
                {ESCALAS.map((op) => {
                  const ativo = escalaFonte === op.valor;
                  return (
                    <Pressable
                      key={op.rotulo}
                      onPress={() => setEscalaFonte(op.valor)}
                      style={[
                        styles.chip,
                        {
                          minHeight: toqueMin,
                          backgroundColor: ativo ? cores.primaria : cores.fundo,
                          borderColor: ativo ? cores.primaria : cores.borda,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: fonte(20, 26), fontWeight: '800', color: ativo ? cores.textoSobrePrimaria : cores.texto }}>
                        {op.rotulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={cardStyle}>
              <Text style={{ fontSize: fonte(24), fontWeight: '700', color: cores.texto }}>Cores da tela</Text>
              <View style={styles.wrapGap10}>
                {[
                  ['claro', 'Claro'],
                  ['escuro', 'Escuro'],
                  ['alto_contraste', 'Alto contraste'],
                ].map(([val, rot]) => {
                  const ativo = modoTema === val;
                  return (
                    <Pressable
                      key={val}
                      onPress={() => setModoTema(val)}
                      style={[
                        styles.chip,
                        {
                          minHeight: toqueMin,
                          backgroundColor: ativo ? cores.primaria : cores.fundo,
                          borderColor: ativo ? cores.primaria : cores.borda,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: fonte(20, 26), fontWeight: '800', color: ativo ? cores.textoSobrePrimaria : cores.texto }}>
                        {rot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <BotaoGrande
              titulo="Continuar"
              onPress={() => setTela('entrada')}
              cores={cores}
              fonte={fonte}
              altura={alturaPrincipal}
            />
          </>
        )}

        {/* 3. ENTRADA SEM SENHA */}
        {tela === 'entrada' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>Como podemos te chamar?</Text>
            <View style={cardStyle}>
              <Text style={{ fontSize: fonte(20), color: cores.textoSecundario }}>
                Não precisa de senha nem cadastro complicado.
              </Text>
              <TextInput
                value={apelido}
                onChangeText={setApelido}
                placeholder="Ex: Dona Maria"
                placeholderTextColor={cores.textoSecundario}
                style={[
                  styles.input,
                  {
                    minHeight: Math.max(60, toqueMin),
                    borderColor: cores.borda,
                    backgroundColor: cores.fundo,
                    color: cores.texto,
                    fontSize: fonte(22),
                  },
                ]}
              />
              <View style={styles.wrapGap10}>
                {['Dona Maria', 'Seu João', 'Vó Tereza'].map((nome) => (
                  <Pressable
                    key={nome}
                    onPress={() => setApelido(nome)}
                    style={[styles.chip, { minHeight: toqueMin, backgroundColor: cores.primariaClara, borderColor: cores.primaria }]}
                  >
                    <Text style={{ fontSize: fonte(20, 24), fontWeight: '700', color: cores.primaria }}>{nome}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <BotaoGrande
              titulo="Começar"
              onPress={() => {
                if (!apelido.trim()) setApelido('Dona Maria');
                setTela('hoje');
              }}
              cores={cores}
              fonte={fonte}
              altura={alturaPrincipal}
            />
          </>
        )}

        {/* 4. ACESSIBILIDADE COMPLETA */}
        {tela === 'acessibilidade' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>Acessibilidade ♿</Text>

            <View style={[cardStyle, { backgroundColor: cores.primariaClara, borderColor: cores.primaria }]}>
              <Text style={{ fontSize: fonte(18, 24), fontWeight: '800', color: cores.primaria }}>PRÉVIA AO VIVO</Text>
              <Text style={{ fontSize: fonte(24), fontWeight: '700', color: cores.texto }}>Losartana 50 mg · 08:00</Text>
              <Text style={{ fontSize: fonte(20), color: cores.texto }}>
                Bom dia! É assim que os textos vão aparecer para você.
              </Text>
            </View>

            <View style={cardStyle}>
              <Text style={{ fontSize: fonte(24), fontWeight: '700', color: cores.texto }}>Tamanho da letra</Text>
              <View style={styles.wrapGap10}>
                {ESCALAS.map((op) => {
                  const ativo = escalaFonte === op.valor;
                  return (
                    <Pressable
                      key={op.rotulo}
                      onPress={() => setEscalaFonte(op.valor)}
                      style={[
                        styles.chip,
                        {
                          minHeight: toqueMin,
                          backgroundColor: ativo ? cores.primaria : cores.fundo,
                          borderColor: ativo ? cores.primaria : cores.borda,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: fonte(20, 26), fontWeight: '800', color: ativo ? cores.textoSobrePrimaria : cores.texto }}>
                        {op.rotulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={cardStyle}>
              <Text style={{ fontSize: fonte(24), fontWeight: '700', color: cores.texto }}>Tema</Text>
              {[
                ['claro', 'Claro (creme suave)'],
                ['escuro', 'Escuro (confortável)'],
                ['alto_contraste', 'Alto contraste (preto e amarelo)'],
                ['automatico', 'Automático (segue o celular)'],
              ].map(([val, rot]) => {
                const ativo = modoTema === val;
                return (
                  <Pressable
                    key={val}
                    onPress={() => setModoTema(val)}
                    style={[
                      styles.chip,
                      {
                        minHeight: toqueMin,
                        backgroundColor: ativo ? cores.primariaClara : cores.fundo,
                        borderColor: ativo ? cores.primaria : cores.borda,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: fonte(20), fontWeight: '800', color: ativo ? cores.primaria : cores.texto }}>
                      {ativo ? '✓ ' : ''}{rot}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={cardStyle}>
              <BotaoGrande
                titulo={botoesMaiores ? '✓ Botões maiores: Ligado' : 'Botões maiores: Desligado'}
                variante="secundario"
                onPress={() => setBotoesMaiores((v) => !v)}
                cores={cores}
                fonte={fonte}
                altura={alturaSecundaria}
              />
              <BotaoGrande
                titulo={lerAuto ? '✓ Ler tela ao abrir: Ligado' : 'Ler tela ao abrir: Desligado'}
                variante="secundario"
                onPress={() => setLerAuto((v) => !v)}
                cores={cores}
                fonte={fonte}
                altura={alturaSecundaria}
              />
              <BotaoGrande
                titulo={reduzirMovimento ? '✓ Reduzir movimento: Ligado' : 'Reduzir movimento: Desligado'}
                variante="secundario"
                onPress={() => setReduzirMovimento((v) => !v)}
                cores={cores}
                fonte={fonte}
                altura={alturaSecundaria}
              />
              <BotaoGrande
                titulo="🔊 Testar voz"
                variante="secundario"
                onPress={() => falarTexto('Olá! Assim é a voz do Dose Certa.')}
                cores={cores}
                fonte={fonte}
                altura={alturaSecundaria}
              />
              <BotaoGrande
                titulo="Voltar ao padrão"
                variante="secundario"
                onPress={() => {
                  setEscalaFonte(1.0);
                  setModoTema('claro');
                  setBotoesMaiores(false);
                  setVelocidadeVoz('normal');
                  setLerAuto(false);
                  setReduzirMovimento(false);
                }}
                cores={cores}
                fonte={fonte}
                altura={alturaSecundaria}
              />
              <BotaoGrande
                titulo="Pronto, voltar"
                onPress={() => setTela(telaAnterior)}
                cores={cores}
                fonte={fonte}
                altura={alturaPrincipal}
              />
            </View>
          </>
        )}

        {/* 5. ABA HOJE */}
        {tela === 'hoje' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>
              Bom dia, {apelido || 'Dona Maria'}
            </Text>
            <Text style={{ fontSize: fonte(20), color: cores.textoSecundario }}>
              {agenda.filter((d) => d.status === 'tomada').length} de {agenda.length} remédios confirmados hoje.
            </Text>

            {avisoPontos ? (
              <View style={[cardStyle, { backgroundColor: cores.sucessoFundo, borderColor: cores.primaria }]}>
                <Text style={{ fontSize: fonte(20), fontWeight: '800', color: cores.sucessoTexto }}>{avisoPontos}</Text>
              </View>
            ) : null}

            {agenda.map((dose) => {
              const tomada = dose.status === 'tomada';
              const atrasada = dose.status === 'atrasada';
              const fundoTag = tomada ? cores.sucessoFundo : atrasada ? cores.atrasadaFundo : cores.pendenteFundo;
              const textoTag = tomada ? cores.sucessoTexto : atrasada ? cores.atrasadaTexto : cores.pendenteTexto;

              return (
                <View key={dose.id} style={[cardStyle, tomada && { backgroundColor: cores.sucessoFundo }]}>
                  <View style={styles.linhaEntre}>
                    <Text style={{ fontSize: fonte(22), fontWeight: '800', color: cores.primaria }}>
                      ⏰ {dose.horario} · {dose.periodo}
                    </Text>
                    <View style={{ backgroundColor: fundoTag, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                      <Text style={{ fontSize: fonte(18, 22), fontWeight: '800', color: textoTag }}>
                        {tomada ? `✓ Tomada ${dose.horarioTomado || ''}` : atrasada ? 'Ainda dá tempo' : 'Pendente'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: fonte(24), fontWeight: '800', color: cores.texto }}>{dose.nome}</Text>
                  <Text style={{ fontSize: fonte(20), color: cores.textoSecundario }}>
                    {dose.dose} · {dose.instrucao}
                  </Text>

                  {!tomada && (
                    <BotaoGrande
                      titulo="Tomei ✓"
                      onPress={() => confirmarDose(dose)}
                      cores={cores}
                      fonte={fonte}
                      altura={alturaPrincipal}
                    />
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* 6. ABA LER BULA */}
        {tela === 'ler' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>Ler bula juntos</Text>
            <Text style={{ fontSize: fonte(20), color: cores.textoSecundario }}>
              Escolha um medicamento para ler e ouvir em palavras simples:
            </Text>

            <View style={styles.wrapGap10}>
              {[
                ['losartana', '💊 Losartana 50 mg'],
                ['metformina', '💊 Metformina 850 mg'],
                ['sinvastatina', '💊 Sinvastatina 20 mg'],
              ].map(([cod, rot]) => (
                <Pressable
                  key={cod}
                  onPress={() => lerExemploBula(cod)}
                  style={[styles.chip, { minHeight: toqueMin, backgroundColor: cores.superficie, borderColor: cores.primaria }]}
                >
                  <Text style={{ fontSize: fonte(20), fontWeight: '800', color: cores.primaria }}>{rot}</Text>
                </Pressable>
              ))}
            </View>

            {!bulaAtual ? (
              <View style={[cardStyle, styles.centro]}>
                <Text style={{ fontSize: 48 }}>📄</Text>
                <Text style={{ fontSize: fonte(24), fontWeight: '700', color: cores.texto, textAlign: 'center' }}>
                  Que tal ler a bula juntos?
                </Text>
              </View>
            ) : (
              <>
                <View style={cardStyle}>
                  <Text style={{ fontSize: fonte(24), fontWeight: '800', color: cores.texto }}>{bulaAtual.nomeRemedio}</Text>
                  <Text style={{ fontSize: fonte(20), fontWeight: '700', color: cores.primaria }}>{bulaAtual.resumoSimples}</Text>
                  <Text style={{ fontSize: fonte(20), fontWeight: '800', color: cores.texto }}>🎯 Para que serve</Text>
                  <Text style={{ fontSize: fonte(20), color: cores.texto }}>{bulaAtual.paraQueServe}</Text>
                  <Text style={{ fontSize: fonte(20), fontWeight: '800', color: cores.texto }}>⏰ Como tomar</Text>
                  <Text style={{ fontSize: fonte(20), color: cores.texto }}>{bulaAtual.comoTomar}</Text>
                  <Text style={{ fontSize: fonte(20), fontWeight: '800', color: cores.atrasadaTexto }}>⚠️ Cuidados</Text>
                  <Text style={{ fontSize: fonte(20), color: cores.texto }}>{bulaAtual.cuidados}</Text>

                  <BotaoGrande
                    titulo={falando ? '⏹ Parar leitura' : '🔊 Ouvir explicação'}
                    onPress={() =>
                      falando
                        ? pararVoz()
                        : falarTexto(`${bulaAtual.nomeRemedio}. ${bulaAtual.paraQueServe} ${bulaAtual.comoTomar} ${bulaAtual.cuidados}`)
                    }
                    cores={cores}
                    fonte={fonte}
                    altura={alturaPrincipal}
                  />
                </View>

                <View style={cardStyle}>
                  <Text style={{ fontSize: fonte(22), fontWeight: '800', color: cores.texto }}>Dúvida sobre esta bula?</Text>
                  <TextInput
                    value={pergunta}
                    onChangeText={setPergunta}
                    placeholder="Ex: Como devo tomar?"
                    placeholderTextColor={cores.textoSecundario}
                    style={[
                      styles.input,
                      { minHeight: toqueMin, borderColor: cores.borda, backgroundColor: cores.fundo, color: cores.texto, fontSize: fonte(20) },
                    ]}
                  />
                  <View style={styles.wrapGap10}>
                    <Pressable
                      onPress={() => perguntarBula('Como tomar?')}
                      style={[styles.chip, { minHeight: toqueMin, backgroundColor: cores.fundo, borderColor: cores.borda }]}
                    >
                      <Text style={{ fontSize: fonte(18, 22), fontWeight: '700', color: cores.texto }}>Como tomar?</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => perguntarBula('Posso tomar 2?')}
                      style={[styles.chip, { minHeight: toqueMin, backgroundColor: cores.fundo, borderColor: cores.borda }]}
                    >
                      <Text style={{ fontSize: fonte(18, 22), fontWeight: '700', color: cores.texto }}>Posso tomar 2?</Text>
                    </Pressable>
                  </View>
                  <BotaoGrande
                    titulo="Perguntar"
                    variante="secundario"
                    onPress={() => perguntarBula()}
                    cores={cores}
                    fonte={fonte}
                    altura={alturaSecundaria}
                  />
                  {respostaDuvida ? (
                    <View style={{ backgroundColor: cores.acentoClaro, padding: 14, borderRadius: 16 }}>
                      <Text style={{ fontSize: fonte(20), fontWeight: '800', color: cores.textoSobreAcento }}>{respostaDuvida}</Text>
                    </View>
                  ) : null}
                </View>
              </>
            )}
          </>
        )}

        {/* 7. ABA JARDIM DA SAUDE */}
        {tela === 'jardim' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>Jardim da Saúde</Text>

            <View style={[cardStyle, styles.centro, { backgroundColor: cores.primariaClara, borderColor: cores.primaria }]}>
              <Text style={{ fontSize: 64 }}>{estagio.emoji}</Text>
              <Text style={{ fontSize: fonte(28), fontWeight: '800', color: cores.texto }}>{estagio.nome}</Text>
              <Text style={{ fontSize: fonte(22), fontWeight: '800', color: cores.primaria }}>
                {pontos} pontos · {sequenciaDias} dias seguidos
              </Text>
              {estagio.proxNome && (
                <Text style={{ fontSize: fonte(20), color: cores.texto, textAlign: 'center' }}>
                  Faltam {Math.max(0, estagio.proxMin - pontos)} pontos para virar {estagio.proxNome}.
                </Text>
              )}
              <Text style={{ fontSize: fonte(18, 22), color: cores.textoSecundario, textAlign: 'center' }}>
                Se um dia falhar, seu jardim só descansa. Seus pontos nunca diminuem.
              </Text>
            </View>

            {cuidadorAtivo && (
              <View style={[cardStyle, { backgroundColor: cores.acentoClaro, borderColor: cores.acento }]}>
                <Text style={{ fontSize: fonte(22), fontWeight: '800', color: cores.textoSobreAcento }}>
                  💌 Recado da Ana (Filha)
                </Text>
                <Text style={{ fontSize: fonte(20), color: cores.texto }}>
                  “Oi mãe! Vi que o seu jardim está lindo. Te amo, qualquer coisa me liga!”
                </Text>
              </View>
            )}

            <Text style={{ fontSize: fonte(24), fontWeight: '800', color: cores.texto }}>
              Suas conquistas ({conquistasOk.length}/{CONQUISTAS_BASE.length})
            </Text>

            {CONQUISTAS_BASE.map((c) => {
              const ok = conquistasOk.includes(c.codigo);
              return (
                <View key={c.codigo} style={[cardStyle, !ok && { opacity: 0.7 }]}>
                  <Text style={{ fontSize: fonte(22), fontWeight: '800', color: cores.texto }}>
                    {c.emoji} {c.titulo} (+{c.pontos} pts)
                  </Text>
                  <Text style={{ fontSize: fonte(20), color: cores.textoSecundario }}>{c.dica}</Text>
                  <Text style={{ fontSize: fonte(18, 22), fontWeight: '800', color: ok ? cores.primaria : cores.textoSecundario }}>
                    {ok ? '✓ Conquistada!' : 'Em andamento'}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        {/* 8. ABA AJUSTES / PRIVACIDADE LGPD */}
        {tela === 'ajustes' && (
          <>
            <Text style={{ fontSize: fonte(30), fontWeight: '800', color: cores.texto }}>Ajustes ⚙️</Text>

            <View style={[cardStyle, { borderColor: cores.primaria }]}>
              <Text style={{ fontSize: fonte(24), fontWeight: '800', color: cores.texto }}>♿ Acessibilidade</Text>
              <Text style={{ fontSize: fonte(20), color: cores.textoSecundario }}>
                Mude tamanho da letra, cores da tela, botões maiores e voz.
              </Text>
              <BotaoGrande
                titulo="Abrir Acessibilidade"
                onPress={() => {
                  setTelaAnterior('ajustes');
                  setTela('acessibilidade');
                }}
                cores={cores}
                fonte={fonte}
                altura={alturaPrincipal}
              />
            </View>

            <View style={cardStyle}>
              <Text style={{ fontSize: fonte(24), fontWeight: '800', color: cores.texto }}>
                👨‍👩‍👧 Familiar cuidador (LGPD)
              </Text>
              <Text style={{ fontSize: fonte(20), color: cores.texto }}>
                Ana (Filha) · {cuidadorAtivo ? 'Autorizada a acompanhar' : 'Acesso pausado por você'}
              </Text>
              <BotaoGrande
                titulo={cuidadorAtivo ? 'Pausar acesso da Ana' : 'Autorizar acesso da Ana'}
                variante="secundario"
                onPress={() => setCuidadorAtivo((v) => !v)}
                cores={cores}
                fonte={fonte}
                altura={alturaSecundaria}
              />
            </View>

            <View style={cardStyle}>
              <BotaoGrande
                titulo={mostrarMeusDados ? 'Ocultar meus dados' : 'Ver meus dados salvos'}
                variante="secundario"
                onPress={() => setMostrarMeusDados((v) => !v)}
                cores={cores}
                fonte={fonte}
                altura={alturaSecundaria}
              />
              {mostrarMeusDados && (
                <Text style={{ fontSize: fonte(20), color: cores.texto }}>
                  Apelido: {apelido || 'Dona Maria'}{'\n'}
                  Doses hoje: {agenda.length}{'\n'}
                  Pontos no jardim: {pontos}{'\n'}
                  Bulas lidas: {docsLidos}
                </Text>
              )}

              {!confirmarApagar ? (
                <BotaoGrande
                  titulo="Apagar todos os meus dados"
                  variante="secundario"
                  onPress={() => setConfirmarApagar(true)}
                  cores={cores}
                  fonte={fonte}
                  altura={alturaSecundaria}
                />
              ) : (
                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: fonte(20), fontWeight: '800', color: cores.atrasadaTexto }}>
                    Tem certeza que deseja apagar tudo e recomeçar?
                  </Text>
                  <BotaoGrande
                    titulo="Sim, apagar tudo"
                    onPress={() => {
                      setAgenda(AGENDA_INICIAL);
                      setPontos(0);
                      setSequenciaDias(0);
                      setDocsLidos(0);
                      setConquistasOk([]);
                      setApelido('');
                      setConfirmarApagar(false);
                      setTela('consentimento');
                    }}
                    cores={cores}
                    fonte={fonte}
                    altura={alturaSecundaria}
                  />
                  <BotaoGrande
                    titulo="Cancelar"
                    variante="secundario"
                    onPress={() => setConfirmarApagar(false)}
                    cores={cores}
                    fonte={fonte}
                    altura={alturaSecundaria}
                  />
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* BARRA DE ABAS INFERIOR */}
      {estaNasAbas && (
        <View style={[styles.barraAbas, { backgroundColor: cores.superficie, borderTopColor: cores.borda, borderTopWidth: bordaW }]}>
          {[
            ['hoje', '💊', 'Hoje'],
            ['ler', '📄', 'Ler Bula'],
            ['jardim', '🪴', 'Jardim'],
            ['ajustes', '⚙️', 'Ajustes'],
          ].map(([id, emoji, rotulo]) => {
            const ativo = tela === id;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  pararVoz();
                  setTela(id);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativo }}
                style={[
                  styles.itemAba,
                  {
                    minHeight: toqueMin,
                    backgroundColor: ativo ? cores.primariaClara : 'transparent',
                  },
                ]}
              >
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
                <Text
                  style={{
                    fontSize: fonte(15, 20),
                    fontWeight: '800',
                    color: ativo ? cores.primaria : cores.textoSecundario,
                    textAlign: 'center',
                  }}
                >
                  {rotulo}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  centro: { alignItems: 'center', justifyContent: 'center' },
  faixaBrasil: { flexDirection: 'row', height: 6, width: '100%' },
  logoCirculo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  linhaGap8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linhaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  wrapGap10: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  botaoTopoIcone: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  botaoOuvir: { paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  barraConexao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  botaoGrande: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  barraAbas: { flexDirection: 'row', padding: 6, gap: 4 },
  itemAba: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, paddingHorizontal: 4 },
});
