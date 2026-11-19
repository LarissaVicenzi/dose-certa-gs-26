# Dose Certa — API Back-end (FastAPI)

> **Projeto:** Dose Certa (Global Solution FIAP — Tema *CitizenTech*)  
> **Disciplina:** Framework Application (Prof. Bruno Maia)  
> **Público:** Pessoas idosas (60+) com baixa visão, baixo letramento digital, celulares de entrada e conexão instável, acompanhadas por um familiar cuidador.

Esta API REST em **FastAPI** atende simultaneamente o **App Mobile do Idoso** e o **Portal Web do Familiar Cuidador**, garantindo persistência relacional em **3ª Forma Normal (3FN)**, leitura segura de bulas com **Google Gemini (`google-genai`)**, controles de privacidade **LGPD** e endpoints dedicados de **Métricas de Impacto CitizenTech**.

---

## Como executar localmente

### 1. Pré-requisitos
- Python **3.10+**

### 2. Instalar dependências
```bash
cd backend-fastapi
python -m venv .venv
# Linux / macOS:
source .venv/bin/activate
# Windows (PowerShell):
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env` na pasta `backend-fastapi/`:
```env
GEMINI_API_KEY=sua_chave_gemini_aqui
GEMINI_MODEL=gemini-4-hydrogen
DOSE_CERTA_DB=dose_certa.db
```

### 4. Subir o servidor FastAPI
```bash
uvicorn main:app --reload --port 8000
```

- **Documentação interativa (Swagger UI):** `http://localhost:8000/docs`
- **Health check:** `http://localhost:8000/v1/health`

---

## Mapa Funcionalidade do MVP → Endpoint

| Funcionalidade do MVP | Método | Endpoint | Quem consome | Descrição |
| :--- | :---: | :--- | :--- | :--- |
| Verificação de saúde da API e IA | `GET` | `/v1/health` | Web / Mobile / Monitoramento | Verifica status da API e se o modelo Gemini está configurado. |
| Agenda diária de medicamentos | `GET` | `/v1/agenda` | App Mobile & Portal Web | Retorna os horários do dia ordenados com status (`tomada`, `pendente`, `atrasada`). |
| Cadastrar novo medicamento | `POST` | `/v1/doses` | Portal Web do Cuidador | Permite que o familiar cuidador adicione um novo remédio na agenda do idoso. |
| Confirmar dose tomada | `POST` | `/v1/doses/{dose_id}/confirmar` | App Mobile (ou fila offline) | Marca dose como tomada, soma pontos éticos (`+10` no horário, `+6` com atraso, `+15` dia completo) e avalia conquistas. |
| Ler foto de bula/receita com IA | `POST` | `/v1/documentos/ler` | App Mobile | Envia imagem (JPEG/PNG/WEBP) ou exemplo ao Gemini e devolve resumo simples em pt-BR (`paraQueServe`, `comoTomar`, `cuidados`) + `+8 pts` (máx. 2/dia). |
| Tirar dúvida restrita à bula | `POST` | `/v1/documentos/perguntar` | App Mobile | Responde **apenas** com base na bula lida; para qualquer pergunta fora do documento, retorna `"Pergunte ao seu médico ou farmacêutico."`. |
| Consultar Jardim da Saúde | `GET` | `/v1/gamificacao` | App Mobile & Portal Web | Retorna pontuação, estágio (`Semente` a `Jardim Florido`), sequência de dias, 8 conquistas e recado do familiar (se autorizado). |
| Enviar recado afetivo (≤140) | `POST` | `/v1/cuidador/mensagem` | Portal Web do Cuidador | Envia mensagem curta de carinho exibida no Jardim da Saúde do idoso. |
| Pausar / reativar vínculo familiar (LGPD) | `PATCH` | `/v1/privacidade/cuidador` | App Mobile | Revoga ou reativa imediatamente o acesso do cuidador no Portal Web. |
| **Métricas de Impacto CitizenTech** | `GET` | `/v1/metricas/impacto` | Portal Web / Avaliação | Expõe taxa de adesão diária (%), bulas lidas com IA, estágio do jardim, conquistas e eventos recentes. |
| Ver e apagar dados (LGPD) | `GET` / `DELETE` | `/v1/privacidade/dados` | App Mobile | Garante transparência total dos dados armazenados e direito ao esquecimento em 1 fluxo seguro. |

---

## Modelo de Dados (3ª Forma Normal — 3FN)

As tabelas criadas automaticamente em `dose_certa.db` (compatíveis com migração direta para PostgreSQL):
1. `usuario` — perfil mínimo (apelido, vínculo do cuidador, pontos e contadores de cuidado).
2. `medicamento_dose` — agenda diária de doses (horário, período, dosagem, instrução e status).
3. `tipo_conquista` — catálogo normalizado das 8 conquistas oficiais.
4. `usuario_conquista` — relacionamento de conquistas desbloqueadas com data.
5. `mensagem_cuidador` — histórico de recados afetivos (até 140 caracteres).
6. `evento_impacto` — trilha de eventos reais de impacto para `/v1/metricas/impacto`.
