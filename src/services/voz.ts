/**
 * Modulo de leitura em voz alta (pt-BR) com controle de velocidade e estado reativo.
 * Exporta falar(texto, velocidade, onFinalizar), parar(), estaFalando() e assinarEstadoVoz().
 * Fase 2 (Expo Snack): sera substituido por expo-speech.
 */

export type VelocidadeVoz = 'lenta' | 'normal' | 'rapida';

const TAXA_VELOCIDADE: Record<VelocidadeVoz, number> = {
  lenta: 0.75,
  normal: 0.95,
  rapida: 1.2,
};

let falandoAtualmente = false;
let temporizadorFallback: ReturnType<typeof setTimeout> | null = null;
const ouvintes = new Set<(falando: boolean) => void>();

function notificar(ativo: boolean) {
  falandoAtualmente = ativo;
  ouvintes.forEach((cb) => cb(ativo));
}

export function estaFalando(): boolean {
  return falandoAtualmente;
}

export function assinarEstadoVoz(cb: (falando: boolean) => void): () => void {
  ouvintes.add(cb);
  cb(falandoAtualmente);
  return () => {
    ouvintes.delete(cb);
  };
}

export function falar(
  texto: string,
  velocidade: VelocidadeVoz = 'normal',
  onFinalizar?: () => void
): void {
  parar();
  const textoLimpo = texto.trim();
  if (!textoLimpo) return;

  notificar(true);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const fala = new SpeechSynthesisUtterance(textoLimpo);
      fala.lang = 'pt-BR';
      fala.rate = TAXA_VELOCIDADE[velocidade] ?? 0.95;
      fala.pitch = 1.0;

      fala.onend = () => {
        notificar(false);
        onFinalizar?.();
      };
      fala.onerror = () => {
        notificar(false);
        onFinalizar?.();
      };

      window.speechSynthesis.speak(fala);
      return;
    } catch {
      // Fallback caso o navegador bloqueie sintese de voz
    }
  }

  const duracaoEstimada = Math.min(
    Math.max(textoLimpo.length * 45, 2200),
    7000
  );
  temporizadorFallback = setTimeout(() => {
    notificar(false);
    onFinalizar?.();
  }, duracaoEstimada);
}

export function parar(): void {
  if (temporizadorFallback) {
    clearTimeout(temporizadorFallback);
    temporizadorFallback = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignora erro de cancelamento
    }
  }

  if (falandoAtualmente) {
    notificar(false);
  }
}
