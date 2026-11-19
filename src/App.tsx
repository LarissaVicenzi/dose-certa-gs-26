/**
 * Dose Certa — Plataforma Web + Redirecionamento interno para o App do Idoso (/app).
 * Ambos compartilham a mesma API REST (/api/*) e a mesma IA Google Gemini no servidor.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BarraNavegacao } from './components/BarraNavegacao';
import { BarraTopo } from './components/BarraTopo';
import { Animated, StyleSheet, View } from './components/RNPrimitives';
import {
  AcessibilidadeProvider,
  useAcessibilidade,
} from './context/AcessibilidadeContext';
import { AppProvider, useApp } from './context/AppContext';
import { SiteDoseCerta } from './screens/SiteDoseCerta';
import {
  TelaAcessibilidade,
  textoParaLerAcessibilidade,
} from './screens/TelaAcessibilidade';
import {
  TelaConsentimento,
  textoParaLerConsentimento,
} from './screens/TelaConsentimento';
import { TelaEntrada, textoParaLerEntrada } from './screens/TelaEntrada';
import { TelaHoje, textoParaLerHoje } from './screens/TelaHoje';
import { TelaJardim, textoParaLerJardim } from './screens/TelaJardim';
import { TelaLerBula, textoParaLerBula } from './screens/TelaLerBula';
import {
  TelaPreferenciasIniciais,
  textoParaLerPreferenciasIniciais,
} from './screens/TelaPreferenciasIniciais';
import {
  TelaPrivacidade,
  textoParaLerAjustes,
} from './screens/TelaPrivacidade';
import { TelaSplash } from './screens/TelaSplash';
import { AbaNavegacao } from './types/modelos';

function VisaoAppIdoso({ onVoltarSite }: { onVoltarSite: () => void }) {
  const {
    telaAtual,
    irParaAba,
    apelido,
    agenda,
    documentoAtual,
    gamificacao,
    cuidador,
    recarregarDados,
  } = useApp();

  const { preferencias, cores, lerTexto, pararLeitura } = useAcessibilidade();
  const opacidadeTela = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    recarregarDados();
  }, []);

  const textoTelaAtual = useMemo(() => {
    switch (telaAtual) {
      case 'consentimento':
        return textoParaLerConsentimento();
      case 'preferencias_iniciais':
        return textoParaLerPreferenciasIniciais();
      case 'entrada':
        return textoParaLerEntrada();
      case 'acessibilidade':
        return textoParaLerAcessibilidade(preferencias);
      case 'hoje':
        return textoParaLerHoje(apelido, agenda);
      case 'ler':
        return textoParaLerBula(documentoAtual);
      case 'jardim':
        return textoParaLerJardim(gamificacao);
      case 'ajustes':
        return textoParaLerAjustes(cuidador);
      default:
        return '';
    }
  }, [
    telaAtual,
    preferencias,
    apelido,
    agenda,
    documentoAtual,
    gamificacao,
    cuidador,
  ]);

  const textoAtualRef = useRef(textoTelaAtual);
  textoAtualRef.current = textoTelaAtual;

  useEffect(() => {
    opacidadeTela.setValue(0.6);
    Animated.timing(opacidadeTela, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [telaAtual, opacidadeTela]);

  useEffect(() => {
    if (
      preferencias.lerAutomaticamente &&
      telaAtual !== 'splash' &&
      textoAtualRef.current
    ) {
      const id = setTimeout(() => {
        lerTexto(textoAtualRef.current);
      }, 250);
      return () => clearTimeout(id);
    }
  }, [telaAtual, preferencias.lerAutomaticamente, lerTexto]);

  const estaNaSplash = telaAtual === 'splash';
  const estaNasAbas =
    telaAtual === 'hoje' ||
    telaAtual === 'ler' ||
    telaAtual === 'jardim' ||
    telaAtual === 'ajustes';

  function renderizarTela() {
    switch (telaAtual) {
      case 'splash':
        return <TelaSplash />;
      case 'consentimento':
        return <TelaConsentimento />;
      case 'preferencias_iniciais':
        return <TelaPreferenciasIniciais />;
      case 'entrada':
        return <TelaEntrada />;
      case 'acessibilidade':
        return <TelaAcessibilidade />;
      case 'hoje':
        return <TelaHoje />;
      case 'ler':
        return <TelaLerBula />;
      case 'jardim':
        return <TelaJardim />;
      case 'ajustes':
        return <TelaPrivacidade />;
      default:
        return <TelaSplash />;
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center py-4 px-3 gap-3"
      style={{ backgroundColor: cores.fundoExterno }}
    >
      <div className="w-full max-w-[396px] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            pararLeitura();
            onVoltarSite();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-opacity hover:opacity-90 cursor-pointer"
          style={{
            backgroundColor: cores.superficie,
            color: cores.primaria,
            borderColor: cores.borda,
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para o Site Web</span>
        </button>
      </div>

      <View
        style={[
          styles.molduraCelular,
          {
            backgroundColor: cores.fundo,
            borderColor: cores.molduraCelular,
          },
        ]}
        accessibilityLabel="Aplicativo Dose Certa"
      >
        {!estaNaSplash && (
          <BarraTopo
            textoParaLer={textoTelaAtual}
            mostrarControleOffline={estaNasAbas}
          />
        )}

        <Animated.View style={[styles.areaConteudo, { opacity: opacidadeTela }]}>
          {renderizarTela()}
        </Animated.View>

        {estaNasAbas && (
          <BarraNavegacao
            abaAtiva={telaAtual as AbaNavegacao}
            aoSelecionar={irParaAba}
          />
        )}
      </View>
    </div>
  );
}

function RoteadorDoseCerta() {
  const [emModoApp, setEmModoApp] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === '/app';
  });

  useEffect(() => {
    const aoNavegarHistorico = () => {
      setEmModoApp(window.location.pathname === '/app');
    };
    window.addEventListener('popstate', aoNavegarHistorico);
    return () => window.removeEventListener('popstate', aoNavegarHistorico);
  }, []);

  function abrirAppIdoso() {
    if (typeof window !== 'undefined' && window.location.pathname !== '/app') {
      window.history.pushState({}, '', '/app');
    }
    setEmModoApp(true);
  }

  function voltarParaSite() {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setEmModoApp(false);
  }

  if (emModoApp) {
    return (
      <AppProvider>
        <VisaoAppIdoso onVoltarSite={voltarParaSite} />
      </AppProvider>
    );
  }

  return <SiteDoseCerta onAbrirAppIdoso={abrirAppIdoso} />;
}

export default function App() {
  return (
    <AcessibilidadeProvider>
      <RoteadorDoseCerta />
    </AcessibilidadeProvider>
  );
}

const styles = StyleSheet.create({
  molduraCelular: {
    width: '100%',
    maxWidth: 396,
    height: '88vh',
    maxHeight: 820,
    minHeight: 600,
    borderRadius: 32,
    borderWidth: 6,
    overflow: 'hidden',
    elevation: 6,
  },
  areaConteudo: {
    flex: 1,
    overflow: 'hidden',
  },
});
