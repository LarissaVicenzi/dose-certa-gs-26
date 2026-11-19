/**
 * Modulo de voz nativo para React Native (Expo Snack) usando expo-speech.
 * Suporta velocidades Lenta (0.75), Normal (0.95) e Rapida (1.2) em pt-BR.
 */
import * as Speech from 'expo-speech';

export type VelocidadeVoz = 'lenta' | 'normal' | 'rapida';

const TAXA: Record<VelocidadeVoz, number> = {
  lenta: 0.75,
  normal: 0.95,
  rapida: 1.2,
};

let falandoAtual = false;
const ouvintes = new Set<(ativo: boolean) => void>();

function notificar(ativo: boolean) {
  falandoAtual = ativo;
  ouvintes.forEach((cb) => cb(ativo));
}

export function assinarEstadoVoz(cb: (ativo: boolean) => void): () => void {
  ouvintes.add(cb);
  cb(falandoAtual);
  return () => {
    ouvintes.delete(cb);
  };
}

export function parar(): void {
  try {
    Speech.stop();
  } catch {
    // ignora se nao houver leitura ativa
  }
  if (falandoAtual) {
    notificar(false);
  }
}

export function falar(
  texto: string,
  velocidade: VelocidadeVoz = 'normal',
  onFinalizar?: () => void
): void {
  parar();
  const limpo = texto.trim();
  if (!limpo) return;

  notificar(true);
  Speech.speak(limpo, {
    language: 'pt-BR',
    rate: TAXA[velocidade] ?? 0.95,
    pitch: 1.0,
    onDone: () => {
      notificar(false);
      onFinalizar?.();
    },
    onStopped: () => {
      notificar(false);
    },
    onError: () => {
      notificar(false);
      onFinalizar?.();
    },
  });
}
