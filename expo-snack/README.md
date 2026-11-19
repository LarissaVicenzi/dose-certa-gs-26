# Dose Certa — Fase 2 (React Native / Expo Snack)

Projeto 100% nativo em **React Native** pronto para rodar imediatamente no **[Expo Snack](https://snack.expo.dev)** e no celular (Android/iOS) via aplicativo **Expo Go**.

## Como rodar no Expo Snack em 3 passos

1. Acesse [https://snack.expo.dev](https://snack.expo.dev) e crie um novo Snack.
2. Crie os 4 arquivos auxiliares no menu lateral esquerdo do Snack e cole o conteúdo desta pasta `expo-snack/`:
   - `tema.ts`
   - `voz.ts`
   - `camera.ts`
   - `api.ts`
3. Substitua o conteúdo de `App.tsx` pelo arquivo `expo-snack/App.tsx` e confirme as 3 dependências no `package.json` do Snack:
   - `@react-native-async-storage/async-storage`
   - `expo-speech`
   - `expo-image-picker`

Pronto! Escaneie o QR Code no celular com o **Expo Go** (ou teste no simulador Android/iOS do próprio navegador).

## Conectar à API real (FastAPI + Gemini AI)
Abra `api.ts` no Snack, altere:
```ts
export const BASE_URL = 'https://SUA-API-PUBLICADA/v1';
export const USE_MOCK = false;
```

## Recursos incluídos nesta versão React Native
- Splash com logo e cores do Brasil
- Consentimento LGPD + Preferências Iniciais de Acessibilidade (*"Como prefere ver este app?"*)
- Entrada sem senha (apenas apelido)
- Tela **Hoje** com animação `Animated` nativa ao confirmar dose e fila **Offline/Online** em `AsyncStorage`
- Tela **Ler Bula** com `expo-image-picker` (foto real), 3 exemplos rápidos, tira-dúvidas seguro e leitura em voz alta com `expo-speech`
- Tela **Jardim da Saúde** (5 estágios, 8 conquistas, sequência gentil, recado da família, sem punições)
- Tela **Ajustes & LGPD** (vínculo do cuidador, ver/apagar dados)
- Tela **Acessibilidade ♿** com prévia ao vivo, 4 tamanhos de texto (`1,0x` a `1,75x`), 4 temas (Claro, Escuro, Alto contraste, Automático via `useColorScheme`), botões maiores (`72px`), velocidade de voz (`expo-speech`), leitura automática ao abrir e reduzir movimento (`AccessibilityInfo.isReduceMotionEnabled`)
- Botão fixo **🔊 Ouvir** e **♿** no cabeçalho de todas as telas
