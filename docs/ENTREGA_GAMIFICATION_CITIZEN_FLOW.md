# Entrega — Game Dev & Gamification (Prof. Felipe Facio)
## Citizen Flow: Estratégia de Gamificação Ética — Projeto "Dose Certa"

> **Instrução de entrega:** Este documento está pronto para ser exportado em **PDF** ou diagramado em slides/Canva. Preencha os nomes em ordem alfabética, os RMs e o link final da plataforma publicada.

---

## 1. Identificação do Grupo (Ordem Alfabética)

| Nome Completo (ordem alfabética) | RM | Turma |
| :--- | :--- | :--- |
| [Preencher Nome Integrante 1] | RM000000 | 2TWDPF |
| [Preencher Nome Integrante 2] | RM000000 | 2TWDPF |
| [Preencher Nome Integrante 3] | RM000000 | 2TWDPF |

- **Link da Plataforma Integrada (Jardim da Saúde ao vivo):** `[Inserir link da URL hospedada]`

---

## 2. Ficha de Produto — CitizenTech

1. **Nome do produto:** Dose Certa
2. **Tema:** CitizenTech — Saúde, Inclusão Digital e Autonomia da Pessoa Idosa (60+)
3. **Desafio central:** Reduzir o abandono e o erro no uso contínuo de medicamentos por idosos com baixa visão e baixo letramento digital, sem criar ansiedade ou vigilância familiar invasiva.
4. **Metáfora gamificada:** **Jardim da Saúde** — um jardim vivo que cresce com cada gesto real de autocuidado e nunca morre.
5. **Público principal:** Idosos (60+) em tratamento contínuo.
6. **Público secundário:** Familiares cuidadores (filhos, netos, cônjuges).
7. **Core Loop (Citizen Flow):** Lembrete gentil → Confirmação em 1 toque (ou leitura de bula) → Feedback imediato (animação suave de ✓ + pontos) → Crescimento visual do Jardim → Carinho do familiar cuidador.
8. **Diferencial ético:** Zero punição, zero ranking competitivo, zero linguagem infantilizada, pontos exclusivos para ações reais de saúde.
9. **Integração tecnológica:** Interface gamificada 2D (`CenaJardim2D`) integrada em tempo real à API REST e ao Portal Web do Cuidador.
10. **Impacto mensurável:** Adesão semanal ao tratamento, retenção em 30 dias, bulas compreendidas, conquistas alcançadas e recados afetivos trocados.

---

## 3. Manifesto Ético da Gamificação

Projetar gamificação para pessoas idosas exige responsabilidade clínica e emocional. Nossas 5 regras inegociáveis:

1. **Sem punição:** Uma dose esquecida **nunca** tira pontos e **nunca** faz o jardim murchar. Quando um dia falha, o aplicativo acolhe: *"Seu jardim descansou; hoje a gente recomeça."*
2. **Sem ranking nem competição:** Saúde não é disputa. O único referencial é o bem-estar da própria pessoa.
3. **Tom adulto, caloroso e direto:** Tratamos o usuário por *"você"*, sem termos infantilizados e sem frases de culpa (trocamos *"Você esqueceu"* por *"Ainda dá tempo de tomar"*).
4. **Gamificação a serviço da saúde, não do tempo de tela:** O objetivo é abrir, confirmar a dose com segurança e voltar para a vida real.
5. **Pontos apenas por ações saudáveis reais:** Nunca premiamos "abrir o aplicativo", anúncios ou toques vazios.

---

## 4. Metáfora Central e Progressão — "Jardim da Saúde"

Cada ação saudável rega e fortalece o jardim em 5 estágios claros, representados por ilustrações 2D acessíveis de alto contraste:

| Estágio | Ilustração / Emoji | Faixa de Pontos | Mensagem de Acolhimento | Benefício Real para a Adesão |
| :--- | :---: | :---: | :--- | :--- |
| **1. Semente** | 🌱 | `0 a 29 pts` | *"Seu cuidado começou a brotar."* | Reduz a barreira inicial nos primeiros dias de uso. |
| **2. Broto** | 🌿 | `30 a 79 pts` | *"Seu jardim já mostra folhas firmes!"* | Reforça a formação do hábito na primeira semana. |
| **3. Planta** | 🪴 | `80 a 159 pts` | *"Que constância bonita no seu cuidado."* | Sustenta o engajamento após a novidade inicial. |
| **4. Flor** | 🌸 | `160 a 299 pts` | *"Seu cuidado está florescendo!"* | Consolida a rotina quinzenal/mensal de medicamentos. |
| **5. Jardim Florido** | 🌳🌸 | `300+ pts` | *"Um jardim cheio de vida e saúde."* | Gera orgulho duradouro e senso de conquista contínua. |

---

## 5. Tabela de Pontuação por Ação Saudável

| Ação Real de Saúde | Pontos | Regra / Limite | Benefício Real para a Adesão |
| :--- | :---: | :--- | :--- |
| **Dose confirmada no horário** | **+10 pts** | Registrada dentro da janela do horário previsto | Incentiva pontualidade terapêutica para eficácia do remédio. |
| **Dose confirmada com atraso** | **+6 pts** | Nunca vale zero (*"Ainda dá tempo"*) | Evita o efeito "tudo ou nada" que leva ao abandono da dose. |
| **Bula ou receita compreendida (IA)** | **+8 pts** | Limite de **2 por dia** (evita farm de pontos) | Aumenta o letramento em saúde e reduz erros de uso. |
| **Dia completo** | **+15 pts** | Todas as doses do dia confirmadas | Fecha o ciclo diário com sensação positiva de dever cumprido. |
| **Semana completa** | **+40 pts** | 7 dias consecutivos com registro de cuidado | Consolida o hábito de médio prazo com recompensa celebrativa. |

---

## 6. Sequência de Dias e Recuperação Gentil

- **Como funciona:** Conta os dias consecutivos em que o idoso confirmou suas doses (visualizados nos 7 círculos da semana `Seg` a `Dom`).
- **Quando há uma pausa:** A sequência reinicia suavemente sem mensagens negativas (*"Seu jardim descansou, hoje a gente recomeça"*), **preservando 100% dos pontos acumulados e o estágio atual do jardim**.
- **Benefício para a adesão:** Elimina a frustração que costuma fazer usuários desistirem de aplicativos após quebrar um *streak* punitivo.

---

## 7. Catálogo Oficial das 8 Conquistas (`tipo_conquista`)

| Código | Nome Acolhedor | Emoji | Regra de Desbloqueio | Pontos | Benefício para a Adesão |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `PRIMEIRO_PASSO` | **Primeiro Passo** | 🌱 | Confirmar a 1ª dose no aplicativo | +10 | Quebra o medo inicial da tecnologia. |
| `MANHA_EM_DIA` | **Manhã em Dia** | 🌅 | Tomar todas as doses da manhã por 5 dias | +20 | Cria âncora matinal de rotina. |
| `SEMANA_FIRME` | **Semana Firme** | 🗓️ | Completar 7 dias seguidos de cuidado | +40 | Valida a primeira semana completa. |
| `CURIOSA` | **Curiosa** | 📖 | Ler 5 bulas ou receitas com a IA | +25 | Promove autonomia e compreensão do tratamento. |
| `SEM_PRESSA` | **Sem Pressa** | 🌤️ | Confirmar uma dose atrasada sem desistir | +15 | Normaliza pequenos atrasos sem culpa. |
| `RECOMECAR` | **Recomeço** | 🌿 | Retomar registros após uma pausa | +15 | Celebra a retomada do tratamento. |
| `EM_FAMILIA` | **Em Família** | 💛 | Receber um recado afetivo do cuidador | +15 | Fortalece o vínculo familiar positivo. |
| `MES_DE_CUIDADO` | **Mês de Cuidado** | 🌳 | Completar 30 dias de cuidado contínuo | +100 | Marca a consolidação do hábito terapêutico. |

---

## 8. Recompensa Afetiva e Mecânica para o Cuidador

- **Recado de Carinho (até 140 caracteres):** Pelo Portal Web, o familiar cuidador pode enviar uma mensagem curta e carinhosa sempre que o idoso avança no jardim ou conquista um marco. A mensagem aparece destacada em um cartão acolhedor dentro do *Jardim da Saúde*.
  - *Benefício:* Transforma o acompanhamento médico em gesto de afeto intergeracional.
- **Selo "Cuidador Presente" & Relatório Semanal:** Após **7 dias de vínculo ativo** (e sempre mediante autorização LGPD do idoso), o cuidador desbloqueia o selo **🏅 Cuidador Presente** e o resumo semanal de adesão no Portal Web.
  - *Benefício:* Engaja o familiar de forma saudável e constante, sem notificações intrusivas.

---

## 9. Riscos Mapeados e Mitigações

| Risco Identificado | Como Evitamos no Dose Certa |
| :--- | :--- |
| Idoso se sentir cobrado ou ansioso por esquecer uma dose | Sem perda de pontos, sem alertas vermelhos estridentes e texto acolhedor (*"Ainda dá tempo"*). |
| Cuidador usar o portal como ferramenta de vigilância | Controle explícito de LGPD no celular do idoso (`Pausar acesso`), bloqueando imediatamente o Portal Web. |
| Marcar dose falsa apenas para ganhar pontos | Sem ranking competitivo, limite diário de pontos por leitura de bula e feedback calmo sem euforia artificial. |
| Dificuldade visual impedir de aproveitar a gamificação | Ilustrações 2D limpas que se adaptam aos temas Claro, Escuro e Alto Contraste + narração completa em voz alta (`🔊 Ouvir`). |

---

## 10. Indicadores (KPIs) para o Business Blueprint

1. **Taxa de Adesão Semanal (%):** Percentual de doses confirmadas frente às doses programadas (exposto ao vivo em `/v1/metricas/impacto`).
2. **Retenção em 30 Dias (%):** Idosos que continuam registrando doses após 30 dias da primeira confirmação.
3. **Bulas Compreendidas por Usuário:** Média mensal de documentos lidos e ouvidos com auxílio da IA Gemini.
4. **Engajamento Afetivo Familiar:** Quantidade de recados de carinho enviados por cuidadores por semana.
5. **Conquistas por Usuário Ativo:** Média de conquistas desbloqueadas nos primeiros 30 dias (indicador de progressão saudável).

---

## 11. Declaração do Uso de Inteligência Artificial Generativa

Declaramos que ferramentas de IA Generativa (Google AI Studio) foram utilizadas como apoio na estruturação técnica dos componentes visuais do *Jardim da Saúde*, na validação dos cálculos de pontuação e na revisão redacional deste documento. Todo o conceito ético, definição de estágios, conquistas e alinhamento com o público idoso (60+) foram definidos, revisados e aprovados pela equipe.
