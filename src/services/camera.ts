/**
 * Modulo de camera e escolha de foto de bula/receita.
 * Suporta envio de foto REAL do aparelho/computador (JPEG/PNG/WEBP em base64)
 * para leitura multimodal pela IA Gemini, alem de 3 exemplos rapidos.
 * Fase 2 (Expo Snack): sera substituido por expo-image-picker.
 */
import { tema } from '../theme/tema';

export interface FotoSelecionada {
  uri: string;
  nomeArquivo: string;
  codigoDocumento?: 'losartana' | 'metformina' | 'sinvastatina';
  base64?: string;
  mimeType?: string;
}

function criarImagemBulaSvg(
  titulo: string,
  dosagem: string,
  subtitulo: string,
  corFaixa: string
): string {
  const { superficie, borda, texto, textoSecundario, fundo } = tema.cores;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="340" height="176" viewBox="0 0 340 176">
  <rect width="340" height="176" rx="18" fill="${superficie}" stroke="${borda}" stroke-width="3"/>
  <rect x="0" y="0" width="340" height="44" rx="16" fill="${corFaixa}"/>
  <rect x="0" y="26" width="340" height="18" fill="${corFaixa}"/>
  <text x="18" y="30" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="16" font-weight="700">BULA DO MEDICAMENTO</text>
  <text x="18" y="82" fill="${texto}" font-family="system-ui, sans-serif" font-size="22" font-weight="800">${titulo}</text>
  <text x="18" y="110" fill="${textoSecundario}" font-family="system-ui, sans-serif" font-size="18" font-weight="600">${dosagem}</text>
  <rect x="18" y="124" width="304" height="36" rx="10" fill="${fundo}" stroke="${borda}" stroke-width="1.5"/>
  <text x="30" y="148" fill="${texto}" font-family="system-ui, sans-serif" font-size="16" font-weight="600">${subtitulo}</text>
</svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const EXEMPLOS_FOTO: FotoSelecionada[] = [
  {
    codigoDocumento: 'losartana',
    nomeArquivo: 'bula_losartana_50mg.jpg',
    uri: criarImagemBulaSvg(
      'Losartana Potássica',
      '50 mg · 30 comprimidos',
      'Uso oral · Controle da pressão',
      tema.cores.primaria
    ),
  },
  {
    codigoDocumento: 'metformina',
    nomeArquivo: 'bula_metformina_850mg.jpg',
    uri: criarImagemBulaSvg(
      'Metformina',
      '850 mg · 30 comprimidos',
      'Uso oral · Controle da glicose',
      tema.cores.textoSobreAcento
    ),
  },
  {
    codigoDocumento: 'sinvastatina',
    nomeArquivo: 'bula_sinvastatina_20mg.jpg',
    uri: criarImagemBulaSvg(
      'Sinvastatina',
      '20 mg · 30 comprimidos',
      'Uso oral · Controle do colesterol',
      tema.cores.atrasadaTexto
    ),
  },
];

let indiceAtual = 0;

export async function escolherFoto(
  codigoEspecifico?: 'losartana' | 'metformina' | 'sinvastatina'
): Promise<FotoSelecionada> {
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (codigoEspecifico) {
    const encontrado = EXEMPLOS_FOTO.find(
      (item) => item.codigoDocumento === codigoEspecifico
    );
    if (encontrado) return encontrado;
  }

  const foto = EXEMPLOS_FOTO[indiceAtual % EXEMPLOS_FOTO.length];
  indiceAtual += 1;
  return foto;
}

/**
 * Abre o seletor de camera/galeria do dispositivo para enviar uma foto real
 * de bula, caixa de remedio ou receita para analise multimodal com Gemini AI.
 */
export async function escolherFotoReal(): Promise<FotoSelecionada | null> {
  if (typeof document === 'undefined') {
    return escolherFoto();
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.setAttribute('capture', 'environment');

    let resolvido = false;
    const finalizar = (resultado: FotoSelecionada | null) => {
      if (resolvido) return;
      resolvido = true;
      resolve(resultado);
    };

    input.onchange = () => {
      const arquivo = input.files?.[0];
      if (!arquivo) {
        finalizar(null);
        return;
      }

      const leitor = new FileReader();
      leitor.onload = () => {
        const dataUrl = String(leitor.result || '');
        const partes = dataUrl.split(',');
        const base64 = partes.length > 1 ? partes[1] : '';
        const mimeType =
          arquivo.type === 'image/png' || arquivo.type === 'image/webp'
            ? arquivo.type
            : 'image/jpeg';

        finalizar({
          uri: dataUrl,
          nomeArquivo: arquivo.name || 'bula_foto.jpg',
          base64,
          mimeType,
        });
      };
      leitor.onerror = () => finalizar(null);
      leitor.readAsDataURL(arquivo);
    };

    input.oncancel = () => finalizar(null);
    input.click();
  });
}

export function listarExemplosBula(): Array<{
  codigo: 'losartana' | 'metformina' | 'sinvastatina';
  rotulo: string;
}> {
  return [
    { codigo: 'losartana', rotulo: 'Losartana 50 mg' },
    { codigo: 'metformina', rotulo: 'Metformina 850 mg' },
    { codigo: 'sinvastatina', rotulo: 'Sinvastatina 20 mg' },
  ];
}
