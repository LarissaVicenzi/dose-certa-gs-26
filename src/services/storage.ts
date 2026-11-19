/**
 * Modulo de persistencia local assincrona.
 * Preferencias de acessibilidade ficam SOMENTE no aparelho (LGPD - minimizacao de dados).
 * Fase 2 (Expo Snack): sera substituido por @react-native-async-storage/async-storage.
 */

const memoria = new Map<string, string>();

export const CHAVES_STORAGE = {
  CONSENTIMENTO: '@dose_certa:consentimento',
  PREFERENCIAS_INICIAIS: '@dose_certa:preferencias_iniciais',
  APELIDO: '@dose_certa:apelido',
  CUIDADOR: '@dose_certa:cuidador',
  FILA_OFFLINE: '@dose_certa:fila_offline',
  ACESSIBILIDADE: '@dose_certa:acessibilidade',
};

export async function getItem(chave: string): Promise<string | null> {
  return memoria.has(chave) ? memoria.get(chave)! : null;
}

export async function setItem(chave: string, valor: string): Promise<void> {
  memoria.set(chave, valor);
}

export async function removeItem(chave: string): Promise<void> {
  memoria.delete(chave);
}

export async function clear(): Promise<void> {
  memoria.clear();
}
