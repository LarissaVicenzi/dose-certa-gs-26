/**
 * Contexto de Acessibilidade do Dose Certa.
 * Salva preferencias SOMENTE no aparelho (LGPD - minimizacao de dados),
 * sem enviar nada ao servidor.
 * Fornece: paleta ativa, funcao fonte(), tamanhos de toque, voz pt-BR e movimento reduzido.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  definirReduzirMovimentoGlobal,
  useColorScheme,
} from '../components/RNPrimitives';
import { CHAVES_STORAGE, getItem, setItem } from '../services/storage';
import {
  assinarEstadoVoz,
  falar,
  parar,
  VelocidadeVoz,
} from '../services/voz';
import {
  ESCALAS_TEXTO,
  EscalaTextoValor,
  fonte as calcularFonte,
  ModoTema,
  obterEspessuraBorda,
  obterPaleta,
  PaletaCores,
  tema,
  TemaResolvido,
} from '../theme/tema';

export interface PreferenciasAcessibilidade {
  escalaFonte: EscalaTextoValor;
  modoTema: ModoTema;
  botoesMaiores: boolean;
  velocidadeVoz: VelocidadeVoz;
  lerAutomaticamente: boolean;
  reduzirMovimento: boolean;
}

export const PREFERENCIAS_PADRAO: PreferenciasAcessibilidade = {
  escalaFonte: 1.0,
  modoTema: 'claro',
  botoesMaiores: false,
  velocidadeVoz: 'normal',
  lerAutomaticamente: false,
  reduzirMovimento: false,
};

interface AcessibilidadeContextoTipo {
  preferencias: PreferenciasAcessibilidade;
  temaResolvido: TemaResolvido;
  cores: PaletaCores;
  altoContraste: boolean;
  espessuraBorda: number;
  toqueMinimo: number;
  alturaBotaoPrincipal: number;
  alturaBotaoSecundario: number;
  reduzirMovimentoEfetivo: boolean;
  falandoAgora: boolean;
  fonte: (tamanhoBase: number, maximo?: number) => number;
  lerTexto: (texto: string, onFinalizar?: () => void) => void;
  pararLeitura: () => void;
  atualizarPreferencia: <K extends keyof PreferenciasAcessibilidade>(
    chave: K,
    valor: PreferenciasAcessibilidade[K]
  ) => Promise<void>;
  aumentarFonte: () => Promise<void>;
  diminuirFonte: () => Promise<void>;
  voltarAoPadrao: () => Promise<void>;
}

const AcessibilidadeContext = createContext<AcessibilidadeContextoTipo | null>(
  null
);

export function AcessibilidadeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const esquemaSistema = useColorScheme();
  const [preferencias, setPreferencias] =
    useState<PreferenciasAcessibilidade>(PREFERENCIAS_PADRAO);
  const [reduzirSistema, setReduzirSistema] = useState(false);
  const [falandoAgora, setFalandoAgora] = useState(false);

  useEffect(() => {
    async function carregarLocal() {
      const salvo = await getItem(CHAVES_STORAGE.ACESSIBILIDADE);
      if (salvo) {
        try {
          const parsed = JSON.parse(salvo);
          setPreferencias({ ...PREFERENCIAS_PADRAO, ...parsed });
        } catch {
          setPreferencias(PREFERENCIAS_PADRAO);
        }
      }

      const sistemaReduz = await AccessibilityInfo.isReduceMotionEnabled();
      setReduzirSistema(sistemaReduz);
    }

    carregarLocal();

    const subMovimento = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (ativo) => {
        setReduzirSistema(ativo);
      }
    );
    const cancelarVoz = assinarEstadoVoz((ativo) => {
      setFalandoAgora(ativo);
    });

    return () => {
      subMovimento.remove();
      cancelarVoz();
      parar();
    };
  }, []);

  const reduzirMovimentoEfetivo =
    preferencias.reduzirMovimento || reduzirSistema;

  useEffect(() => {
    definirReduzirMovimentoGlobal(reduzirMovimentoEfetivo);
  }, [reduzirMovimentoEfetivo]);

  const temaResolvido: TemaResolvido = useMemo(() => {
    if (preferencias.modoTema === 'automatico') {
      return esquemaSistema === 'dark' ? 'escuro' : 'claro';
    }
    return preferencias.modoTema;
  }, [preferencias.modoTema, esquemaSistema]);

  const cores = useMemo(() => obterPaleta(temaResolvido), [temaResolvido]);
  const altoContraste = temaResolvido === 'alto_contraste';
  const espessuraBorda = obterEspessuraBorda(temaResolvido);

  const toqueMinimo = preferencias.botoesMaiores
    ? tema.formas.toqueMaior
    : tema.formas.toqueMinimo;

  const alturaBotaoPrincipal = preferencias.botoesMaiores
    ? 84
    : tema.formas.alturaBotaoPrincipal;

  const alturaBotaoSecundario = preferencias.botoesMaiores
    ? 72
    : tema.formas.alturaBotaoSecundario;

  const fonte = useCallback(
    (tamanhoBase: number, maximo?: number) =>
      calcularFonte(tamanhoBase, preferencias.escalaFonte, maximo),
    [preferencias.escalaFonte]
  );

  const lerTexto = useCallback(
    (texto: string, onFinalizar?: () => void) => {
      falar(texto, preferencias.velocidadeVoz, onFinalizar);
    },
    [preferencias.velocidadeVoz]
  );

  const pararLeitura = useCallback(() => {
    parar();
  }, []);

  const salvarPreferencias = useCallback(
    async (proximas: PreferenciasAcessibilidade) => {
      setPreferencias(proximas);
      await setItem(CHAVES_STORAGE.ACESSIBILIDADE, JSON.stringify(proximas));
    },
    []
  );

  const atualizarPreferencia = useCallback(
    async <K extends keyof PreferenciasAcessibilidade>(
      chave: K,
      valor: PreferenciasAcessibilidade[K]
    ) => {
      const proximas = { ...preferencias, [chave]: valor };
      await salvarPreferencias(proximas);
    },
    [preferencias, salvarPreferencias]
  );

  const aumentarFonte = useCallback(async () => {
    const idx = ESCALAS_TEXTO.findIndex(
      (e) => e.valor === preferencias.escalaFonte
    );
    const proximo =
      ESCALAS_TEXTO[Math.min(idx + 1, ESCALAS_TEXTO.length - 1)].valor;
    await atualizarPreferencia('escalaFonte', proximo);
  }, [preferencias.escalaFonte, atualizarPreferencia]);

  const diminuirFonte = useCallback(async () => {
    const idx = ESCALAS_TEXTO.findIndex(
      (e) => e.valor === preferencias.escalaFonte
    );
    const anterior = ESCALAS_TEXTO[Math.max(idx - 1, 0)].valor;
    await atualizarPreferencia('escalaFonte', anterior);
  }, [preferencias.escalaFonte, atualizarPreferencia]);

  const voltarAoPadrao = useCallback(async () => {
    parar();
    await salvarPreferencias(PREFERENCIAS_PADRAO);
  }, [salvarPreferencias]);

  return (
    <AcessibilidadeContext.Provider
      value={{
        preferencias,
        temaResolvido,
        cores,
        altoContraste,
        espessuraBorda,
        toqueMinimo,
        alturaBotaoPrincipal,
        alturaBotaoSecundario,
        reduzirMovimentoEfetivo,
        falandoAgora,
        fonte,
        lerTexto,
        pararLeitura,
        atualizarPreferencia,
        aumentarFonte,
        diminuirFonte,
        voltarAoPadrao,
      }}
    >
      {children}
    </AcessibilidadeContext.Provider>
  );
}

export function useAcessibilidade() {
  const ctx = useContext(AcessibilidadeContext);
  if (!ctx) {
    throw new Error(
      'useAcessibilidade deve ser usado dentro de AcessibilidadeProvider'
    );
  }
  return ctx;
}
