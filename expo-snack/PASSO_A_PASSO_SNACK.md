# Passo a Passo — Como colocar o App "Dose Certa" no Expo Snack

1. Acesse **[https://snack.expo.dev](https://snack.expo.dev)** e clique em **New Snack** (ou use o Snack padrão que já abre).
2. Renomeie o projeto no topo para **Dose Certa (FIAP GS CitizenTech)**.
3. No painel esquerdo, clique no arquivo **`App.js`**.
4. Apague todo o conteúdo atual do `App.js` e **cole o conteúdo completo do arquivo `expo-snack/App.js`** deste projeto.
5. Assim que colar, o Expo Snack vai mostrar uma barra azul na parte de baixo dizendo que falta a dependência **`expo-speech`** — clique em **"Add dependency"** (leva 2 segundos).
6. **Testando:**
   - No painel direito, clique em **Web**, **iOS** ou **Android** para testar na hora.
   - Para testar no seu celular físico, baixe o app **Expo Go** e leia o **QR Code** da aba **My Device**.
7. **Salvar e pegar o link de entrega:**
   - Faça login no Expo (pode usar GitHub ou Google) e clique em **Save** no canto superior direito.
   - Copie a URL gerada (ex.: `https://snack.expo.dev/@seuusuario/dose-certa`) e cole no PDF de entrega da disciplina de **Mobile Development**.

## Opcional: Conectar o Snack à sua API real (FastAPI / Express)
No topo do arquivo `expo-snack/App.js`:
```js
const BASE_URL = 'https://sua-api-publicada.com/v1';
const USE_MOCK = false;
```
Enquanto `USE_MOCK = true`, o app funciona 100% sozinho no Expo Snack mesmo sem internet ou servidor ligado.
