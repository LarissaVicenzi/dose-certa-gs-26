/**
 * Contexto global do Dose Certa (navegacao, fila offline, sincronizacao, vinculo familiar e voz).
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAcessibilidade } from './AcessibilidadeContext';
import {
  apagarDados as apiApagarDados,
  atualizarAcessoCuidador,
  confirmarDose as apiConfirmarDose,
  getAgenda,
  getGamificacao,
  lerDocumento as apiLerDocumento,
  verDados as apiVerDados,
} from '../services/api';
import {
  CHAVES_STORAGE,
  getItem,
  removeItem,
  setItem,
} from '../services/storage';
import {
  AbaNavegacao,
  DadosUsuario,
  DocumentoLido,
  Dose,
  Gamificacao,
  ItemFilaOffline,
  TelaAtiva,
  VinculoCuidador,
} from '../types/modelos';

interface AppContextoTipo {
  telaAtual: TelaAtiva;
  telaAnterior: TelaAtiva;
  irParaAba: (aba: AbaNavegacao) => void;
  sairDaSplash: () => void;
  abrirAcessibilidade: () => void;
  fecharAcessibilidade: () => void;

  consentimentoAceitoEm: string;
  aceitarConsentimento: () => Promise<void>;
  concluirPreferenciasIniciais: () => Promise<void>;

  apelido: string;
  entrarComApelido: (novoApelido: string) => Promise<void>;

  cuidador: VinculoCuidador;
  revogarCuidador: () => Promise<void>;
  reativarCuidador: () => Promise<void>;

  agenda: Dose[];
  carregandoAgenda: boolean;
  ultimoIdConfirmado: string | null;
  registrarDoseTomada: (doseId: string) => Promise<void>;

  gamificacao: Gamificacao | null;

  documentoAtual: DocumentoLido | null;
  processarFotoBula: (
    fotoUri: string,
    codigoDocumento?: string,
    extras?: { fotoBase64?: string; mimeType?: string }
  ) => Promise<DocumentoLido>;

  recarregarDados: () => Promise<void>;

  modoOffline: boolean;
  alternarModoOffline: () => void;
  filaOffline: ItemFilaOffline[];
  avisoSincronizacao: string | null;
  limparAvisoSincronizacao: () => void;

  buscarMeusDados: () => Promise<DadosUsuario>;
  apagarTodosOsDados: () => Promise<void>;
}

const AppContext = createContext<AppContextoTipo | null>(null);

const CUIDADOR_INICIAL: VinculoCuidador = {
  nome: 'Ana',
  parentesco: 'Filha',
  ativo: true,
  desde: '10/11/2026',
};

function horarioAgora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { lerTexto, pararLeitura } = useAcessibilidade();

  const [telaAtual, setTelaAtual] = useState<TelaAtiva>('splash');
  const [telaAnterior, setTelaAnterior] = useState<TelaAtiva>('consentimento');
  const [consentimentoAceitoEm, setConsentimentoAceitoEm] = useState('');
  const [preferenciasIniciaisVistas, setPreferenciasIniciaisVistas] =
    useState(false);
  const [apelido, setApelido] = useState('');
  const [cuidador, setCuidador] = useState<VinculoCuidador>(CUIDADOR_INICIAL);

  const [agenda, setAgenda] = useState<Dose[]>([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);
  const [ultimoIdConfirmado, setUltimoIdConfirmado] = useState<string | null>(
    null
  );
  const [gamificacao, setGamificacao] = useState<Gamificacao | null>(null);
  const [documentoAtual, setDocumentoAtual] = useState<DocumentoLido | null>(
    null
  );

  const [modoOffline, setModoOffline] = useState(false);
  const [filaOffline, setFilaOffline] = useState<ItemFilaOffline[]>([]);
  const [avisoSincronizacao, setAvisoSincronizacao] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function iniciar() {
      const consent = await getItem(CHAVES_STORAGE.CONSENTIMENTO);
      const prefVistas = await getItem(CHAVES_STORAGE.PREFERENCIAS_INICIAIS);
      const nomeSalvo = await getItem(CHAVES_STORAGE.APELIDO);
      const cuidadorSalvo = await getItem(CHAVES_STORAGE.CUIDADOR);
      const filaSalva = await getItem(CHAVES_STORAGE.FILA_OFFLINE);

      if (filaSalva) {
        try {
          setFilaOffline(JSON.parse(filaSalva));
        } catch {
          setFilaOffline([]);
        }
      }

      if (cuidadorSalvo) {
        try {
          setCuidador(JSON.parse(cuidadorSalvo));
        } catch {
          setCuidador(CUIDADOR_INICIAL);
        }
      }

      if (consent) setConsentimentoAceitoEm(consent);
      if (prefVistas) setPreferenciasIniciaisVistas(true);
      if (nomeSalvo) setApelido(nomeSalvo);
    }
    iniciar();
  }, []);

  function sairDaSplash() {
    setTelaAtual((atual) => {
      if (atual !== 'splash') return atual;
      if (consentimentoAceitoEm && apelido) return 'hoje';
      if (consentimentoAceitoEm && preferenciasIniciaisVistas) return 'entrada';
      if (consentimentoAceitoEm) return 'preferencias_iniciais';
      return 'consentimento';
    });
  }

  function abrirAcessibilidade() {
    pararLeitura();
    if (telaAtual === 'acessibilidade') {
      setTelaAtual(telaAnterior);
      return;
    }
    setTelaAnterior(telaAtual);
    setTelaAtual('acessibilidade');
  }

  function fecharAcessibilidade() {
    pararLeitura();
    setTelaAtual(telaAnterior);
  }

  useEffect(() => {
    if (telaAtual === 'hoje' || telaAtual === 'jardim') {
      carregarDadosPrincipais(cuidador.ativo);
    }
  }, [telaAtual, cuidador.ativo]);

  useEffect(() => {
    if (!modoOffline && filaOffline.length > 0) {
      sincronizarFila();
    }
  }, [modoOffline]);

  async function carregarDadosPrincipais(cuidadorAtivoAtual: boolean) {
    setCarregandoAgenda(true);
    try {
      const [listaAgenda, dadosJardim] = await Promise.all([
        getAgenda(),
        getGamificacao(cuidadorAtivoAtual),
      ]);

      const agendaMesclada = listaAgenda.map((dose) => {
        const pendente = filaOffline.find((f) => f.doseId === dose.id);
        if (pendente) {
          return {
            ...dose,
            status: 'tomada' as const,
            horarioTomado: pendente.horarioConfirmacao,
            pendenteSincronizacao: true,
          };
        }
        return dose;
      });

      setAgenda(agendaMesclada);
      setGamificacao(dadosJardim);
    } finally {
      setCarregandoAgenda(false);
    }
  }

  async function sincronizarFila() {
    const itensParaEnviar = [...filaOffline];
    if (itensParaEnviar.length === 0) return;

    setAvisoSincronizacao('Sincronizando seus registros...');

    for (const item of itensParaEnviar) {
      await apiConfirmarDose(item.doseId, item.horarioConfirmacao);
    }

    setFilaOffline([]);
    await setItem(CHAVES_STORAGE.FILA_OFFLINE, JSON.stringify([]));

    const [novaAgenda, novoJardim] = await Promise.all([
      getAgenda(),
      getGamificacao(cuidador.ativo),
    ]);

    setAgenda(novaAgenda);
    setGamificacao(novoJardim);
    setAvisoSincronizacao(
      `${itensParaEnviar.length} ${
        itensParaEnviar.length === 1
          ? 'registro sincronizado'
          : 'registros sincronizados'
      } com sucesso ✓`
    );
  }

  function irParaAba(aba: AbaNavegacao) {
    pararLeitura();
    setTelaAtual(aba);
  }

  async function aceitarConsentimento() {
    pararLeitura();
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    setConsentimentoAceitoEm(dataHoje);
    await setItem(CHAVES_STORAGE.CONSENTIMENTO, dataHoje);
    setTelaAtual(
      preferenciasIniciaisVistas ? 'entrada' : 'preferencias_iniciais'
    );
  }

  async function concluirPreferenciasIniciais() {
    pararLeitura();
    setPreferenciasIniciaisVistas(true);
    await setItem(CHAVES_STORAGE.PREFERENCIAS_INICIAIS, 'sim');
    setTelaAtual('entrada');
  }

  async function entrarComApelido(novoApelido: string) {
    pararLeitura();
    const apelidoLimpo = novoApelido.trim();
    setApelido(apelidoLimpo);
    await setItem(CHAVES_STORAGE.APELIDO, apelidoLimpo);
    try {
      await atualizarAcessoCuidador({ apelido: apelidoLimpo });
    } catch {
      // ignora se estiver offline
    }
    setTelaAtual('hoje');
  }

  async function revogarCuidador() {
    const atualizado: VinculoCuidador = { ...cuidador, ativo: false };
    setCuidador(atualizado);
    await setItem(CHAVES_STORAGE.CUIDADOR, JSON.stringify(atualizado));
    try {
      await atualizarAcessoCuidador({ ativo: false });
    } catch {
      // ignora se estiver offline
    }
    const novoJardim = await getGamificacao(false);
    setGamificacao(novoJardim);
  }

  async function reativarCuidador() {
    const atualizado: VinculoCuidador = { ...cuidador, ativo: true };
    setCuidador(atualizado);
    await setItem(CHAVES_STORAGE.CUIDADOR, JSON.stringify(atualizado));
    try {
      await atualizarAcessoCuidador({ ativo: true });
    } catch {
      // ignora se estiver offline
    }
    const novoJardim = await getGamificacao(true);
    setGamificacao(novoJardim);
  }

  async function registrarDoseTomada(doseId: string) {
    const hora = horarioAgora();
    const doseAlvo = agenda.find((d) => d.id === doseId);
    const nomeDose = doseAlvo?.nome || 'dose';

    setUltimoIdConfirmado(doseId);
    lerTexto(`Pronto, ${nomeDose} registrada.`);

    if (modoOffline) {
      const jaExiste = filaOffline.some((item) => item.doseId === doseId);
      const novaFila = jaExiste
        ? filaOffline
        : [...filaOffline, { doseId, horarioConfirmacao: hora }];

      setFilaOffline(novaFila);
      await setItem(CHAVES_STORAGE.FILA_OFFLINE, JSON.stringify(novaFila));

      setAgenda((atual) =>
        atual.map((dose) =>
          dose.id === doseId
            ? {
                ...dose,
                status: 'tomada',
                horarioTomado: hora,
                pendenteSincronizacao: true,
              }
            : dose
        )
      );
      setAvisoSincronizacao(
        'Guardado no celular. Quando a internet voltar, enviamos automaticamente.'
      );
      return;
    }

    const doseAtualizada = await apiConfirmarDose(doseId, hora);
    setAgenda((atual) =>
      atual.map((dose) => (dose.id === doseId ? doseAtualizada : dose))
    );
    const novoJardim = await getGamificacao(cuidador.ativo);
    setGamificacao(novoJardim);
  }

  async function processarFotoBula(
    fotoUri: string,
    codigoDocumento?: string,
    extras?: { fotoBase64?: string; mimeType?: string }
  ): Promise<DocumentoLido> {
    const doc = await apiLerDocumento(fotoUri, codigoDocumento, extras);
    setDocumentoAtual(doc);
    const novoJardim = await getGamificacao(cuidador.ativo);
    setGamificacao(novoJardim);
    return doc;
  }

  async function recarregarDados() {
    await carregarDadosPrincipais(cuidador.ativo);
  }

  function alternarModoOffline() {
    setModoOffline((anterior) => {
      const proximo = !anterior;
      if (proximo) {
        setAvisoSincronizacao(
          'Você está sem internet. Pode confirmar normalmente que guardamos aqui.'
        );
      }
      return proximo;
    });
  }

  function limparAvisoSincronizacao() {
    setAvisoSincronizacao(null);
  }

  async function buscarMeusDados(): Promise<DadosUsuario> {
    return apiVerDados({
      apelido,
      cuidadorNome: `${cuidador.nome} (${cuidador.parentesco})`,
      cuidadorAtivo: cuidador.ativo,
      consentimentoAceitoEm,
      itensNaFilaOffline: filaOffline.length,
    });
  }

  async function apagarTodosOsDados() {
    pararLeitura();
    await apiApagarDados();
    await Promise.all([
      removeItem(CHAVES_STORAGE.CONSENTIMENTO),
      removeItem(CHAVES_STORAGE.PREFERENCIAS_INICIAIS),
      removeItem(CHAVES_STORAGE.APELIDO),
      removeItem(CHAVES_STORAGE.CUIDADOR),
      removeItem(CHAVES_STORAGE.FILA_OFFLINE),
    ]);
    setConsentimentoAceitoEm('');
    setPreferenciasIniciaisVistas(false);
    setApelido('');
    setCuidador(CUIDADOR_INICIAL);
    setAgenda([]);
    setUltimoIdConfirmado(null);
    setGamificacao(null);
    setDocumentoAtual(null);
    setFilaOffline([]);
    setModoOffline(false);
    setAvisoSincronizacao(null);
    setTelaAtual('consentimento');
  }

  return (
    <AppContext.Provider
      value={{
        telaAtual,
        telaAnterior,
        irParaAba,
        sairDaSplash,
        abrirAcessibilidade,
        fecharAcessibilidade,
        consentimentoAceitoEm,
        aceitarConsentimento,
        concluirPreferenciasIniciais,
        apelido,
        entrarComApelido,
        cuidador,
        revogarCuidador,
        reativarCuidador,
        agenda,
        carregandoAgenda,
        ultimoIdConfirmado,
        registrarDoseTomada,
        gamificacao,
        documentoAtual,
        processarFotoBula,
        recarregarDados,
        modoOffline,
        alternarModoOffline,
        filaOffline,
        avisoSincronizacao,
        limparAvisoSincronizacao,
        buscarMeusDados,
        apagarTodosOsDados,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return ctx;
}
