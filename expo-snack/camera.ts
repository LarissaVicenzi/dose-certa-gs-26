/**
 * Modulo de camera/galeria nativo para React Native (Expo Snack) usando expo-image-picker.
 * Permite tirar foto real de bula ou receita (com base64 para enviar a IA Gemini na API)
 * e tambem disponibiliza 3 exemplos rapidos para testes imediatos.
 */
import * as ImagePicker from 'expo-image-picker';

export interface FotoCapturada {
  uri: string;
  base64?: string;
  mimeType?: string;
  codigoDocumento?: 'losartana' | 'metformina' | 'sinvastatina';
}

export async function fotografarOuEscolherBula(): Promise<FotoCapturada | null> {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) {
    return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.75,
    base64: true,
  });

  if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) {
    return null;
  }

  const asset = resultado.assets[0];
  return {
    uri: asset.uri,
    base64: asset.base64 ?? undefined,
    mimeType: asset.mimeType || 'image/jpeg',
  };
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
