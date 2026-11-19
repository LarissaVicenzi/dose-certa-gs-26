/**
 * Dose Certa (Fase 2 - React Native / Expo Snack)
 * Tokens oficiais de cores (WCAG AA/AAA), tipografia escalavel e espacamento.
 * 3 paletas: Claro, Escuro (confortavel) e Alto Contraste + suporte a Automatico.
 */

export type ModoTema = 'claro' | 'escuro' | 'alto_contraste' | 'automatico';
export type TemaResolvido = 'claro' | 'escuro' | 'alto_contraste';

export interface PaletaCores {
  azulBrasil: string;
  verdeBrasil: string;
  amareloBrasil: string;
  fundo: string;
  superficie: string;
  borda: string;
  texto: string;
  textoSecundario: string;
  primaria: string;
  primariaClara: string;
  textoSobrePrimaria: string;
  acento: string;
  acentoClaro: string;
  textoSobreAcento: string;
  sucessoFundo: string;
  sucessoTexto: string;
  pendenteFundo: string;
  pendenteTexto: string;
  atrasadaFundo: string;
  atrasadaTexto: string;
  ceuJardim: string;
  chaoJardim: string;
  bloqueadoFundo: string;
  transparente: string;
}

export const PALETAS: Record<TemaResolvido, PaletaCores> = {
  claro: {
    azulBrasil: '#1351B4',
    verdeBrasil: '#0B6E4F',
    amareloBrasil: '#F2A541',
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
    ceuJardim: '#E3F2FA',
    chaoJardim: '#C2E5CE',
    bloqueadoFundo: '#F1ECE4',
    transparente: 'transparent',
  },
  escuro: {
    azulBrasil: '#74B2FF',
    verdeBrasil: '#5FD3A3',
    amareloBrasil: '#F7B955',
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
    ceuJardim: '#192B33',
    chaoJardim: '#1C382B',
    bloqueadoFundo: '#222E29',
    transparente: 'transparent',
  },
  alto_contraste: {
    azulBrasil: '#FFD60A',
    verdeBrasil: '#52FF9A',
    amareloBrasil: '#FFD60A',
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
    ceuJardim: '#000000',
    chaoJardim: '#000000',
    bloqueadoFundo: '#000000',
    transparente: 'transparent',
  },
};

export const ESCALAS_TEXTO = [
  { valor: 1.0, rotulo: 'Normal', descricao: '1,0x' },
  { valor: 1.25, rotulo: 'Grande', descricao: '1,25x' },
  { valor: 1.5, rotulo: 'Muito grande', descricao: '1,5x' },
  { valor: 1.75, rotulo: 'Máximo', descricao: '1,75x' },
] as const;

export type EscalaTextoValor = (typeof ESCALAS_TEXTO)[number]['valor'];

export function fonte(
  tamanhoBase: number,
  escala: number = 1.0,
  maximo?: number
): number {
  const calculado = Math.round(tamanhoBase * escala);
  return maximo !== undefined ? Math.min(calculado, maximo) : calculado;
}

export function obterPaleta(modo: TemaResolvido): PaletaCores {
  return PALETAS[modo];
}

export function obterEspessuraBorda(modo: TemaResolvido): number {
  return modo === 'alto_contraste' ? 2 : 1.5;
}

export const tema = {
  espacamento: {
    p: 8,
    m: 16,
    tela: 20,
    g: 24,
  },
  formas: {
    raioCard: 24,
    paddingCard: 20,
    alturaBotaoPrincipal: 72,
    raioBotaoPrincipal: 36,
    alturaBotaoSecundario: 60,
    toqueMinimo: 56,
    toqueMaior: 72,
  },
};
