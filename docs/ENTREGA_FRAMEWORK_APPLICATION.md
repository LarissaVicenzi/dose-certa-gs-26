# Entrega — Framework Application (Prof. Bruno Maia)
## Global Solution FIAP — Tema: CitizenTech

> **Instrução de entrega:** Exporte este documento para **PDF** após preencher os nomes em ordem alfabética, os RMs e colar os links finais (GitHub do back-end FastAPI, URL hospedada na Vercel e link do vídeo de até 3 minutos).

---

## 1. Identificação do Grupo (Ordem Alfabética)

| Nome Completo (ordem alfabética) | RM | Turma |
| :--- | :--- | :--- |
| [Preencher Nome Integrante 1] | RM000000 | 2TWDPF |
| [Preencher Nome Integrante 2] | RM000000 | 2TWDPF |
| [Preencher Nome Integrante 3] | RM000000 | 2TWDPF |

---

## 2. Ficha de Produto — CitizenTech

1. **Nome do projeto:** Dose Certa
2. **Problema cívico / social:** Pessoas idosas (60+) com baixa visão, baixo letramento digital e múltiplas prescrições enfrentam alta taxa de esquecimento ou uso incorreto de medicamentos, agravada por bulas com letras minúsculas e linguagem técnica inacessível.
3. **Público-alvo:** Idosos (60+) com celulares de entrada e conexão instável + familiares cuidadores que precisam acompanhar o tratamento à distância com respeito.
4. **Proposta de valor:** Aplicativo móvel ultrassimples, acessível e offline-first para o idoso confirmar doses e ouvir bulas traduzidas por IA, conectado ao vivo a um Portal Web para o familiar cuidador acompanhar com carinho — sem vigilância nem punição.
5. **ODS / Impacto público:** ODS 3 (Saúde e Bem-Estar) e ODS 10 (Redução das Desigualdades Digitais).
6. **Diferencial CitizenTech:** Acessibilidade nativa (4 níveis de fonte até 1,75x, tema escuro e alto contraste WCAG AA/AAA, leitura integral da tela em voz alta pt-BR), gamificação ética (*Jardim da Saúde* sem punições) e soberania de dados LGPD (o idoso pode pausar o acesso do familiar a qualquer momento).
7. **Stack tecnológica:** Front-end React/TypeScript (pronto para Expo Snack React Native no mobile e responsivo no Portal Web), Back-end REST em FastAPI (Python) + SQLite/PostgreSQL em 3FN e IA Multimodal com Google Gemini (`gemini-4-hydrogen`).
8. **Segurança e Privacidade (LGPD):** Coleta mínima (apenas apelido, sem CPF ou senha complexa), consentimento explícito em tela inicial, preferências de acessibilidade salvas apenas localmente, revogação instantânea do vínculo familiar e botão de exclusão completa de dados.
9. **Métricas de impacto:** Taxa de adesão diária (%), total de bulas explicadas por IA, dias de sequência no Jardim da Saúde, recados afetivos trocados e taxa de sincronização offline.
10. **Sustentabilidade:** Arquitetura leve (baixo consumo de dados e bateria), preparada para integração futura com unidades básicas de saúde (UBS / SUS Digital).

---

## 3. Links Oficiais da Entrega

- **Repositório Back-end FastAPI (GitHub):** `[Inserir link do repo contendo a pasta backend-fastapi/]`
- **Plataforma Web Funcional (Vercel / Hospedada):** `[Inserir link da URL publicada — App do Idoso + Portal do Cuidador]`
- **Vídeo de Demonstração (até 3 min — YouTube não listado / Drive):** `[Inserir link do vídeo]`

---

## 4. Arquitetura e Justificativas Técnicas

- **API Única Compartilhada (Mobile + Web):** Tanto o App do Idoso quanto o Portal Web do Familiar Cuidador consomem os mesmos endpoints REST, garantindo sincronização imediata: quando o cuidador inclui um medicamento ou envia um recado no Portal Web, o idoso vê na hora no celular; quando o idoso confirma uma dose ou pausa o vínculo LGPD no celular, o Portal Web reflete imediatamente.
- **FastAPI + 3FN:** Escolhemos FastAPI pela validação automática de contratos com Pydantic, documentação OpenAPI/Swagger nativa (`/docs`) e alta performance. O banco relacional respeita a 3ª Forma Normal (`usuario`, `medicamento_dose`, `tipo_conquista`, `usuario_conquista`, `mensagem_cuidador`, `evento_impacto`).
- **Offline-First e Resiliência:** No app do idoso, a fila local guarda confirmações feitas sem internet e sincroniza automaticamente quando a conexão retorna.
- **IA Segura no Servidor (Server-Side Proxy):** A chave `GEMINI_API_KEY` nunca vai ao front-end. O back-end aplica *guardrails* rigorosos: a IA explica apenas o conteúdo da bula/receita fotografada e responde `"Pergunte ao seu médico ou farmacêutico."` para qualquer pergunta fora do documento.

---

## 5. Mapa Funcionalidade do MVP → Endpoint

| Funcionalidade do MVP | Método | Endpoint (FastAPI) |
| :--- | :---: | :--- |
| Status da API e configuração de IA | `GET` | `/v1/health` |
| Agenda diária de medicamentos | `GET` | `/v1/agenda` |
| Cadastrar novo remédio (Portal Cuidador) | `POST` | `/v1/doses` |
| Confirmar dose tomada e pontuar jardim | `POST` | `/v1/doses/{dose_id}/confirmar` |
| Ler foto de bula/receita com IA Gemini | `POST` | `/v1/documentos/ler` |
| Tirar dúvida restrita à bula com IA | `POST` | `/v1/documentos/perguntar` |
| Jardim da Saúde, sequência e conquistas | `GET` | `/v1/gamificacao` |
| Enviar recado de carinho (até 140 chars) | `POST` | `/v1/cuidador/mensagem` |
| Pausar / reativar acesso do cuidador (LGPD) | `PATCH` | `/v1/privacidade/cuidador` |
| Métricas de impacto CitizenTech ao vivo | `GET` | `/v1/metricas/impacto` |
| Transparência e exclusão total de dados (LGPD) | `GET` / `DELETE` | `/v1/privacidade/dados` |

---

## 6. Roteiro Sugerido para o Vídeo (Máximo 3 Minutos)

1. **0:00 – 0:30 (Contexto e Acessibilidade):** Abrir o App do Idoso, mostrar a barra de acessibilidade (`♿` e `🔊 Ouvir`), testar aumento de letra (1,5x) e tema Alto Contraste.
2. **0:30 – 1:15 (Fluxo do Idoso — Hoje + Offline + Jardim):** Confirmar a dose atrasada (`Metformina 850 mg`), mostrar o feedback acolhedor (*"Ainda dá tempo"* + pontos no Jardim da Saúde) e alternar rapidamente o modo Offline/Online para demonstrar a fila de sincronização.
3. **1:15 – 1:55 (IA Real na Bula):** Abrir a aba *Ler Bula*, enviar uma foto real (ou testar um exemplo com Gemini AI), ouvir a explicação em voz alta e testar uma pergunta segura (`"Como tomar?"`) e uma pergunta fora da bula (`"Posso tomar 2?"` → `"Pergunte ao seu médico ou farmacêutico."`).
4. **1:55 – 2:40 (Plataforma Web do Cuidador + API ao vivo):** Alternar para o **Portal do Cuidador (Web)**, mostrar as Métricas de Impacto atualizadas ao vivo, enviar um recado de carinho de até 140 caracteres e cadastrar um novo remédio — voltar ao App do Idoso mostrando ambos aparecendo na hora!
5. **2:40 – 3:00 (LGPD e FastAPI):** Pausar o acesso do cuidador na aba *Ajustes* e mostrar o Portal Web respeitando a privacidade instantaneamente + tela do Swagger `/docs` do FastAPI.

---

## 7. Declaração do Uso de Inteligência Artificial Generativa

Em conformidade com as diretrizes da Global Solution FIAP, declaramos de forma transparente o uso de ferramentas de IA Generativa no desenvolvimento do projeto **Dose Certa**:

- **Apoio no desenvolvimento (Google AI Studio / LLMs):** Utilizado para prototipação assistida de componentes React/TypeScript acessíveis, estruturação inicial dos endpoints REST (Express e FastAPI), revisão de contraste WCAG AA/AAA e organização da documentação técnica. Todo o código, regras de negócio, fluxos éticos de gamificação e testes foram revisados, validados e adaptados pela equipe.
- **IA embarcada no produto (Google Gemini API — `gemini-4-hydrogen`):** Integrada exclusivamente no lado do servidor (`/api/documentos/ler` e `/api/documentos/perguntar` no Express; `/v1/documentos/ler` e `/v1/documentos/perguntar` no FastAPI) para leitura multimodal de fotos de bulas/receitas e respostas restritas ao texto do documento com trava de segurança clínica.
