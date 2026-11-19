/**
 * Sistema de temas e tipografia escalavel do Dose Certa.
 * 3 paletas oficiais com contraste WCAG AA/AAA: Claro, Escuro e Alto Contraste.
 * Todos os tamanhos de texto devem vir da funcao fonte(tamanhoBase, escala, maximo?).
 */

export type ModoTema = 'claro' | 'escuro' | 'alto_contraste' | 'automatico';
export type TemaResolvido = 'claro' | 'escuro' | 'alto_contraste';

export interface PaletaCores {
  azulBrasil: string;
  verdeBrasil: string;
  amareloBrasil: string;

  fundo: string;
  fundoExterno: string;
  molduraCelular: string;

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
  solJardim: string;
  chaoJardim: string;
  chaoBordaJardim: string;

  bloqueadoFundo: string;
  bloqueadoBorda: string;

  focoBorda: string;
  transparente: string;
  sombra: string;
}

export const PALETAS: Record<TemaResolvido, PaletaCores> = {
  claro: {
    azulBrasil: '#1351B4',
    verdeBrasil: '#0B6E4F',
    amareloBrasil: '#F2A541',

    fundo: '#FBF7F1',
    fundoExterno: '#EDE4D7',
    molduraCelular: '#1F2933',

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
    solJardim: '#F9D67A',
    chaoJardim: '#C2E5CE',
    chaoBordaJardim: '#0B6E4F',

    bloqueadoFundo: '#F1ECE4',
    bloqueadoBorda: '#DDD4C7',

    focoBorda: '#0B6E4F',
    transparente: 'transparent',
    sombra: 'rgba(31, 41, 51, 0.07)',
  },

  escuro: {
    azulBrasil: '#74B2FF',
    verdeBrasil: '#5FD3A3',
    amareloBrasil: '#F7B955',

    fundo: '#121A17',
    fundoExterno: '#0A0F0D',
    molduraCelular: '#2E3B36',

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
    solJardim: '#F7B955',
    chaoJardim: '#1C382B',
    chaoBordaJardim: '#5FD3A3',

    bloqueadoFundo: '#222E29',
    bloqueadoBorda: '#394A43',

    focoBorda: '#5FD3A3',
    transparente: 'transparent',
    sombra: 'rgba(0, 0, 0, 0.25)',
  },

  alto_contraste: {
    azulBrasil: '#FFD60A',
    verdeBrasil: '#52FF9A',
    amareloBrasil: '#FFD60A',

    fundo: '#000000',
    fundoExterno: '#0D0D0D',
    molduraCelular: '#FFFFFF',

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
    solJardim: '#FFD60A',
    chaoJardim: '#000000',
    chaoBordaJardim: '#FFFFFF',

    bloqueadoFundo: '#000000',
    bloqueadoBorda: '#FFFFFF',

    focoBorda: '#FFD60A',
    transparente: 'transparent',
    sombra: 'rgba(255, 255, 255, 0.0)',
  },
};

export const ESCALAS_TEXTO = [
  { valor: 1.0, rotulo: 'Normal', descricao: '1,0x' },
  { valor: 1.25, rotulo: 'Grande', descricao: '1,25x' },
  { valor: 1.5, rotulo: 'Muito grande', descricao: '1,5x' },
  { valor: 1.75, rotulo: 'Máximo', descricao: '1,75x' },
] as const;

export type EscalaTextoValor = (typeof ESCALAS_TEXTO)[number]['valor'];

/**
 * Calcula tamanho de fonte proporcional a escala escolhida pelo usuario.
 */
export function fonte(
  tamanhoBase: number,
  escala = 1.0,
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
  cores: PALETAS.claro,
  espacamento: {
    base: 8,
    p: 8,
    m: 16,
    tela: 20,
    g: 24,
    xg: 32,
  },
  formas: {
    raioCard: 24,
    paddingCard: 20,
    alturaBotaoPrincipal: 72,
    raioBotaoPrincipal: 36,
    alturaBotaoSecundario: 60,
    raioBotaoSecundario: 30,
    toqueMinimo: 56,
    toqueMaior: 72,
    raioChip: 20,
  },
  sombraCard: {
    shadowColor: '#1F2933',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};
