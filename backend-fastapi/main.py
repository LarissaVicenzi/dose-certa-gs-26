"""
Dose Certa - Back-end Oficial em FastAPI (Global Solution FIAP - CitizenTech)
Banco relacional em 3FN (SQLite pronto para rodar localmente ou migrar para PostgreSQL)
+ Integracao real com Google Gemini (google-genai) + Endpoints de Metricas de Impacto e LGPD.
"""
from __future__ import annotations

import base64
import json
import os
import sqlite3
from datetime import datetime
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

DB_PATH = os.getenv("DOSE_CERTA_DB", "dose_certa.db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODELO_GEMINI = os.getenv("GEMINI_MODEL", "gemini-4-hydrogen")

PONTOS = {
    "DOSE_NO_HORARIO": 10,
    "DOSE_COM_ATRASO": 6,
    "DOCUMENTO_LIDO": 8,
    "DIA_COMPLETO": 15,
    "SEMANA_COMPLETA": 40,
}

ESTAGIOS = [
    ("semente", "Semente", "🌱", 0, "Broto", "virar Broto", 30),
    ("broto", "Broto", "🌿", 30, "Planta", "virar Planta", 80),
    ("planta", "Planta", "🪴", 80, "Flor", "dar Flor", 160),
    ("flor", "Flor", "🌸", 160, "Jardim Florido", "virar Jardim Florido", 300),
    ("jardim_florido", "Jardim Florido", "🌳🌸", 300, None, "continuar florescendo", None),
]

CATALOGO_CONQUISTAS = [
    ("c1", "PRIMEIRO_PASSO", "Primeiro Passo", "Você confirmou sua primeira dose no aplicativo.", 10, "🌱"),
    ("c2", "MANHA_EM_DIA", "Manhã em Dia", "Tomou todas as doses da manhã por 5 dias seguidos.", 20, "🌅"),
    ("c3", "SEMANA_FIRME", "Semana Firme", "Completou 7 dias seguidos cuidando da sua saúde.", 40, "🗓️"),
    ("c4", "CURIOSA", "Curiosa", "Leu 5 bulas ou receitas para entender seus remédios.", 25, "📖"),
    ("c5", "SEM_PRESSA", "Sem Pressa", "Tomou uma dose atrasada sem desistir do cuidado.", 15, "🌤️"),
    ("c6", "RECOMECAR", "Recomeço", "Voltou a registrar suas doses depois de um dia de descanso.", 15, "🌿"),
    ("c7", "EM_FAMILIA", "Em Família", "Recebeu carinho de um familiar cuidador pelo aplicativo.", 15, "💛"),
    ("c8", "MES_DE_CUIDADO", "Mês de Cuidado", "Completou 30 dias cuidando bem dos seus remédios.", 100, "🌳"),
]

TEXTOS_BULA_EXEMPLO = {
    "losartana": (
        "Losartana Potássica 50 mg, uso oral. Indicação: controle da pressão arterial e "
        "proteção do coração e rins. Como tomar: 1 comprimido ao dia com água, no mesmo horário. "
        "Cuidados: levantar-se devagar para evitar tontura; não interromper sem falar com o médico."
    ),
    "metformina": (
        "Cloridrato de Metformina 850 mg, uso oral. Indicação: controle do açúcar (glicose) no sangue. "
        "Como tomar: durante ou logo após o almoço/jantar com água para proteger o estômago. "
        "Cuidados: manter boa hidratação e evitar excesso de bebidas alcoólicas."
    ),
    "sinvastatina": (
        "Sinvastatina 20 mg, uso oral. Indicação: redução do colesterol alto e proteção do coração. "
        "Como tomar: 1 comprimido à noite antes de dormir com água. "
        "Cuidados: evitar suco de toranja e avisar o médico se houver dor muscular forte."
    ),
}

app = FastAPI(
    title="Dose Certa API (CitizenTech FIAP)",
    description=(
        "API REST compartilhada entre o App Mobile do Idoso (60+) e o Portal Web do Familiar Cuidador. "
        "Inclui agenda de medicamentos, gamificação ética (Jardim da Saúde), leitura de bulas com IA Gemini, "
        "controles LGPD e métricas de impacto."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Persistencia 3FN em SQLite ----------


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hora_agora() -> str:
    return datetime.now().strftime("%H:%M")


def data_hoje() -> str:
    return datetime.now().strftime("%d/%m/%Y")


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS usuario (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            apelido TEXT NOT NULL,
            cuidador_nome TEXT NOT NULL,
            cuidador_parentesco TEXT NOT NULL,
            cuidador_ativo INTEGER NOT NULL DEFAULT 1,
            dias_vinculo_cuidador INTEGER NOT NULL DEFAULT 12,
            pontos INTEGER NOT NULL DEFAULT 92,
            sequencia_dias INTEGER NOT NULL DEFAULT 5,
            documentos_lidos INTEGER NOT NULL DEFAULT 3,
            documentos_lidos_hoje INTEGER NOT NULL DEFAULT 0,
            dia_completo_premiado INTEGER NOT NULL DEFAULT 0,
            doses_atrasadas_tomadas INTEGER NOT NULL DEFAULT 0,
            ultimo_ganho_mensagem TEXT
        );

        CREATE TABLE IF NOT EXISTS medicamento_dose (
            id TEXT PRIMARY KEY,
            horario TEXT NOT NULL,
            periodo TEXT NOT NULL,
            nome TEXT NOT NULL,
            dose TEXT NOT NULL,
            instrucao TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            horario_tomado TEXT
        );

        CREATE TABLE IF NOT EXISTS tipo_conquista (
            id TEXT PRIMARY KEY,
            codigo TEXT UNIQUE NOT NULL,
            titulo TEXT NOT NULL,
            dica TEXT NOT NULL,
            pontos INTEGER NOT NULL,
            emoji TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS usuario_conquista (
            codigo_conquista TEXT PRIMARY KEY,
            data_conquista TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS mensagem_cuidador (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remetente TEXT NOT NULL,
            parentesco TEXT NOT NULL,
            texto TEXT NOT NULL,
            data_envio TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS evento_impacto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            descricao TEXT NOT NULL,
            pontos INTEGER NOT NULL DEFAULT 0,
            registrado_em TEXT NOT NULL
        );
        """
    )

    # Seed inicial caso o banco esteja vazio
    if cur.execute("SELECT COUNT(*) FROM usuario").fetchone()[0] == 0:
        cur.execute(
            """
            INSERT INTO usuario (
                id, apelido, cuidador_nome, cuidador_parentesco, cuidador_ativo,
                dias_vinculo_cuidador, pontos, sequencia_dias, documentos_lidos
            ) VALUES (1, 'Dona Maria', 'Ana', 'Filha', 1, 12, 92, 5, 3)
            """
        )

    if cur.execute("SELECT COUNT(*) FROM tipo_conquista").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO tipo_conquista (id, codigo, titulo, dica, pontos, emoji) VALUES (?, ?, ?, ?, ?, ?)",
            CATALOGO_CONQUISTAS,
        )

    if cur.execute("SELECT COUNT(*) FROM medicamento_dose").fetchone()[0] == 0:
        cur.executemany(
            """
            INSERT INTO medicamento_dose (id, horario, periodo, nome, dose, instrucao, status, horario_tomado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                ("dose-1", "08:00", "Manhã", "Losartana 50 mg", "1 comprimido", "Tomar com um copo de água", "tomada", "08:05"),
                ("dose-2", "12:00", "Tarde", "Metformina 850 mg", "1 comprimido", "Tomar logo após o almoço", "atrasada", None),
                ("dose-3", "20:00", "Noite", "Sinvastatina 20 mg", "1 comprimido", "Tomar antes de dormir", "pendente", None),
            ],
        )

    if cur.execute("SELECT COUNT(*) FROM usuario_conquista").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO usuario_conquista (codigo_conquista, data_conquista) VALUES (?, ?)",
            [
                ("PRIMEIRO_PASSO", "10/11/2026"),
                ("MANHA_EM_DIA", "14/11/2026"),
                ("EM_FAMILIA", "12/11/2026"),
            ],
        )

    if cur.execute("SELECT COUNT(*) FROM mensagem_cuidador").fetchone()[0] == 0:
        cur.execute(
            """
            INSERT INTO mensagem_cuidador (remetente, parentesco, texto, data_envio)
            VALUES ('Ana', 'Filha', 'Oi mãe! Vi que o seu jardim está lindo. Te amo, qualquer coisa me liga!', 'Hoje, 08:20')
            """
        )

    if cur.execute("SELECT COUNT(*) FROM evento_impacto").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO evento_impacto (tipo, descricao, pontos, registrado_em) VALUES (?, ?, ?, ?)",
            [
                ("DOSE_CONFIRMADA", "Losartana 50 mg confirmada no horário", 10, "08:05"),
                ("MENSAGEM_CUIDADOR", "Ana (Filha) enviou um recado de carinho", 0, "08:20"),
            ],
        )

    conn.commit()
    conn.close()


init_db()


# ---------- Schemas Pydantic ----------


class NovaDoseIn(BaseModel):
    nome: str = Field(..., min_length=2)
    dose: str = "1 comprimido"
    horario: str = Field(..., min_length=4)
    periodo: Literal["Manhã", "Tarde", "Noite"] = "Manhã"
    instrucao: str = "Tomar com um copo de água"


class ConfirmarDoseIn(BaseModel):
    horarioConfirmacao: Optional[str] = None


class LerDocumentoIn(BaseModel):
    fotoUri: str = ""
    fotoBase64: Optional[str] = None
    mimeType: Optional[str] = None
    codigoDocumento: str = "losartana"


class DocumentoBase(BaseModel):
    nomeRemedio: str
    resumoSimples: str
    paraQueServe: str
    comoTomar: str
    cuidados: str


class PerguntarDocumentoIn(BaseModel):
    documento: DocumentoBase
    pergunta: str = Field(..., min_length=2)


class MensagemCuidadorIn(BaseModel):
    texto: str = Field(..., min_length=1, max_length=140)
    remetente: str = "Ana"
    parentesco: str = "Filha"


class AtualizarCuidadorIn(BaseModel):
    ativo: Optional[bool] = None
    apelido: Optional[str] = None


# ---------- Helpers de dominio ----------


def calcular_estagio(pontos: int):
    atual = ESTAGIOS[0]
    for item in ESTAGIOS:
        if pontos >= item[3]:
            atual = item
    return atual


def registrar_evento(conn: sqlite3.Connection, tipo: str, descricao: str, pontos: int) -> None:
    conn.execute(
        "INSERT INTO evento_impacto (tipo, descricao, pontos, registrado_em) VALUES (?, ?, ?, ?)",
        (tipo, descricao, pontos, hora_agora()),
    )


def avaliar_conquistas(conn: sqlite3.Connection) -> list[str]:
    user = conn.execute("SELECT * FROM usuario WHERE id = 1").fetchone()
    doses_tomadas = conn.execute(
        "SELECT COUNT(*) FROM medicamento_dose WHERE status = 'tomada'"
    ).fetchone()[0]
    existentes = {
        row["codigo_conquista"]
        for row in conn.execute("SELECT codigo_conquista FROM usuario_conquista").fetchall()
    }
    novas: list[str] = []

    def liberar(codigo: str):
        if codigo not in existentes:
            row = conn.execute(
                "SELECT titulo, pontos FROM tipo_conquista WHERE codigo = ?", (codigo,)
            ).fetchone()
            if row:
                conn.execute(
                    "INSERT INTO usuario_conquista (codigo_conquista, data_conquista) VALUES (?, ?)",
                    (codigo, data_hoje()),
                )
                conn.execute(
                    "UPDATE usuario SET pontos = pontos + ? WHERE id = 1", (row["pontos"],)
                )
                registrar_evento(conn, "CONQUISTA", f"Conquista liberada: {row['titulo']}", row["pontos"])
                novas.append(row["titulo"])
                existentes.add(codigo)

    if doses_tomadas >= 1:
        liberar("PRIMEIRO_PASSO")
    if user["doses_atrasadas_tomadas"] >= 1:
        liberar("SEM_PRESSA")
    if user["documentos_lidos"] >= 5:
        liberar("CURIOSA")
    if user["sequencia_dias"] >= 7:
        liberar("SEMANA_FIRME")
    if user["sequencia_dias"] >= 30:
        liberar("MES_DE_CUIDADO")
    if user["cuidador_ativo"] == 1:
        liberar("EM_FAMILIA")

    return novas


# ---------- Endpoints MVP ----------


@app.get("/v1/health")
def health():
    return {
        "ok": True,
        "servico": "Dose Certa FastAPI",
        "modeloIA": MODELO_GEMINI,
        "iaConfigurada": bool(GEMINI_API_KEY),
    }


@app.get("/v1/agenda")
def listar_agenda():
    conn = get_conn()
    rows = conn.execute("SELECT * FROM medicamento_dose ORDER BY horario ASC").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "horario": r["horario"],
            "periodo": r["periodo"],
            "nome": r["nome"],
            "dose": r["dose"],
            "instrucao": r["instrucao"],
            "status": r["status"],
            "horarioTomado": r["horario_tomado"],
        }
        for r in rows
    ]


@app.post("/v1/doses", status_code=201)
def criar_dose(payload: NovaDoseIn):
    conn = get_conn()
    novo_id = f"dose-{int(datetime.now().timestamp() * 1000)}"
    conn.execute(
        """
        INSERT INTO medicamento_dose (id, horario, periodo, nome, dose, instrucao, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pendente')
        """,
        (novo_id, payload.horario.strip(), payload.periodo, payload.nome.strip(), payload.dose.strip(), payload.instrucao.strip()),
    )
    registrar_evento(conn, "MEDICAMENTO_ADICIONADO", f"{payload.nome.strip()} ({payload.horario}) incluído na agenda", 0)
    conn.commit()
    conn.close()
    return {
        "id": novo_id,
        "horario": payload.horario.strip(),
        "periodo": payload.periodo,
        "nome": payload.nome.strip(),
        "dose": payload.dose.strip(),
        "instrucao": payload.instrucao.strip(),
        "status": "pendente",
    }


@app.post("/v1/doses/{dose_id}/confirmar")
def confirmar_dose(dose_id: str, payload: ConfirmarDoseIn):
    conn = get_conn()
    dose = conn.execute("SELECT * FROM medicamento_dose WHERE id = ?", (dose_id,)).fetchone()
    if not dose:
        conn.close()
        raise HTTPException(status_code=404, detail="Dose não encontrada.")

    horario_conf = payload.horarioConfirmacao or hora_agora()
    if dose["status"] != "tomada":
        atrasada = dose["status"] == "atrasada"
        ganho = PONTOS["DOSE_COM_ATRASO"] if atrasada else PONTOS["DOSE_NO_HORARIO"]
        conn.execute(
            "UPDATE medicamento_dose SET status = 'tomada', horario_tomado = ? WHERE id = ?",
            (horario_conf, dose_id),
        )
        conn.execute(
            "UPDATE usuario SET pontos = pontos + ?, doses_atrasadas_tomadas = doses_atrasadas_tomadas + ? WHERE id = 1",
            (ganho, 1 if atrasada else 0),
        )
        msg = (
            f"+{ganho} pontos · Ainda deu tempo! Seu jardim agradece."
            if atrasada
            else f"+{ganho} pontos · Dose confirmada no horário!"
        )
        registrar_evento(conn, "DOSE_CONFIRMADA", f"{dose['nome']} confirmada ({'com atraso' if atrasada else 'no horário'})", ganho)

        pendentes = conn.execute(
            "SELECT COUNT(*) FROM medicamento_dose WHERE status != 'tomada'"
        ).fetchone()[0]
        user = conn.execute("SELECT dia_completo_premiado FROM usuario WHERE id = 1").fetchone()
        if pendentes == 0 and user["dia_completo_premiado"] == 0:
            conn.execute(
                "UPDATE usuario SET dia_completo_premiado = 1, pontos = pontos + ?, sequencia_dias = sequencia_dias + 1 WHERE id = 1",
                (PONTOS["DIA_COMPLETO"],),
            )
            msg = f"+{ganho + PONTOS['DIA_COMPLETO']} pontos · Dia completo! Seu jardim floresceu hoje."
            registrar_evento(conn, "DIA_COMPLETO", "Todas as doses do dia foram confirmadas", PONTOS["DIA_COMPLETO"])

        novas = avaliar_conquistas(conn)
        if novas:
            msg = f"{msg} Nova conquista: {novas[0]}!"
        conn.execute("UPDATE usuario SET ultimo_ganho_mensagem = ? WHERE id = 1", (msg,))
        conn.commit()

    atualizada = conn.execute("SELECT * FROM medicamento_dose WHERE id = ?", (dose_id,)).fetchone()
    conn.close()
    return {
        "id": atualizada["id"],
        "horario": atualizada["horario"],
        "periodo": atualizada["periodo"],
        "nome": atualizada["nome"],
        "dose": atualizada["dose"],
        "instrucao": atualizada["instrucao"],
        "status": atualizada["status"],
        "horarioTomado": atualizada["horario_tomado"],
    }


@app.post("/v1/documentos/ler")
def ler_documento(payload: LerDocumentoIn):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY não configurada no servidor FastAPI.",
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        instrucao = (
            "Você explica bulas e receitas para idosos (60+) no Brasil em linguagem simples, "
            "calorosa e respeitosa, tratando por 'você'. Nunca mude a dose nem faça diagnósticos. "
            "Responda em JSON com os campos: nomeRemedio, resumoSimples, paraQueServe, comoTomar, cuidados."
        )

        contents = []
        if payload.fotoBase64 and payload.mimeType in ("image/jpeg", "image/png", "image/webp"):
            contents.append(
                types.Part.from_bytes(
                    data=base64.b64decode(payload.fotoBase64),
                    mime_type=payload.mimeType,
                )
            )
            contents.append("Explique esta bula ou receita de forma simples para um idoso.")
        else:
            texto_exemplo = TEXTOS_BULA_EXEMPLO.get(
                payload.codigoDocumento.lower(), TEXTOS_BULA_EXEMPLO["losartana"]
            )
            contents.append(f"Explique esta bula em palavras simples:\n{texto_exemplo}")

        resp = client.models.generate_content(
            model=MODELO_GEMINI,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=instrucao,
                response_mime_type="application/json",
            ),
        )
        dados = json.loads(resp.text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao chamar Gemini AI: {exc}") from exc

    conn = get_conn()
    user = conn.execute("SELECT documentos_lidos_hoje FROM usuario WHERE id = 1").fetchone()
    ganho = PONTOS["DOCUMENTO_LIDO"] if user["documentos_lidos_hoje"] < 2 else 0
    conn.execute(
        """
        UPDATE usuario
        SET documentos_lidos = documentos_lidos + 1,
            documentos_lidos_hoje = documentos_lidos_hoje + ?,
            pontos = pontos + ?
        WHERE id = 1
        """,
        (1 if ganho > 0 else 0, ganho),
    )
    if ganho > 0:
        conn.execute(
            "UPDATE usuario SET ultimo_ganho_mensagem = ? WHERE id = 1",
            (f"+{ganho} pontos · Que bom entender melhor o seu remédio!",),
        )
    registrar_evento(conn, "BULA_LIDA_IA", f"Bula explicada por IA: {dados.get('nomeRemedio', 'Medicamento')}", ganho)
    avaliar_conquistas(conn)
    conn.commit()
    conn.close()

    return {
        "id": f"doc-{int(datetime.now().timestamp() * 1000)}",
        "nomeRemedio": dados.get("nomeRemedio", "Medicamento"),
        "fotoUri": payload.fotoUri,
        "resumoSimples": dados.get("resumoSimples", ""),
        "paraQueServe": dados.get("paraQueServe", ""),
        "comoTomar": dados.get("comoTomar", ""),
        "cuidados": dados.get("cuidados", ""),
        "lidoEm": hora_agora(),
        "origemIA": MODELO_GEMINI,
    }


@app.post("/v1/documentos/perguntar")
def perguntar_sobre_documento(payload: PerguntarDocumentoIn):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY não configurada no servidor FastAPI.",
        )

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        instrucao = (
            "Responda EXCLUSIVAMENTE com base no texto da bula fornecida. "
            "Se a pergunta pedir alteração de dose, tomar 2 comprimidos, diagnóstico, sintomas "
            "ou qualquer informação fora da bula, responda EXATAMENTE: "
            "'Pergunte ao seu médico ou farmacêutico.'"
        )
        contexto = (
            f"Remédio: {payload.documento.nomeRemedio}\n"
            f"Resumo: {payload.documento.resumoSimples}\n"
            f"Para que serve: {payload.documento.paraQueServe}\n"
            f"Como tomar: {payload.documento.comoTomar}\n"
            f"Cuidados: {payload.documento.cuidados}\n\n"
            f"Pergunta: {payload.pergunta}"
        )
        resp = client.models.generate_content(
            model=MODELO_GEMINI,
            contents=contexto,
            config=types.GenerateContentConfig(system_instruction=instrucao),
        )
        resposta_texto = (resp.text or "").strip() or "Pergunte ao seu médico ou farmacêutico."
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Erro ao consultar Gemini AI: {exc}") from exc

    return {"resposta": resposta_texto}


@app.get("/v1/gamificacao")
def obter_gamificacao(cuidadorAtivo: Optional[bool] = Query(default=None)):
    conn = get_conn()
    user = conn.execute("SELECT * FROM usuario WHERE id = 1").fetchone()
    ativo = bool(user["cuidador_ativo"]) if cuidadorAtivo is None else cuidadorAtivo
    est = calcular_estagio(user["pontos"])

    conquistas_map = {
        r["codigo_conquista"]: r["data_conquista"]
        for r in conn.execute("SELECT * FROM usuario_conquista").fetchall()
    }
    conquistas = [
        {
            "id": r["id"],
            "codigo": r["codigo"],
            "titulo": r["titulo"],
            "dica": r["dica"],
            "pontos": r["pontos"],
            "emoji": r["emoji"],
            "desbloqueada": r["codigo"] in conquistas_map,
            "dataConquista": conquistas_map.get(r["codigo"]),
        }
        for r in conn.execute("SELECT * FROM tipo_conquista").fetchall()
    ]

    msg_row = conn.execute(
        "SELECT * FROM mensagem_cuidador ORDER BY id DESC LIMIT 1"
    ).fetchone()
    doses_tomadas = conn.execute(
        "SELECT COUNT(*) FROM medicamento_dose WHERE status = 'tomada'"
    ).fetchone()[0]
    conn.close()

    return {
        "pontos": user["pontos"],
        "estagio": est[0],
        "nomeEstagio": est[1],
        "emojiEstagio": est[2],
        "pontosEstagioAtualMin": est[3],
        "proximoEstagioNome": est[4],
        "verboProximoEstagio": est[5],
        "pontosProximoEstagio": est[6],
        "sequenciaDias": user["sequencia_dias"],
        "diasSemana": [
            {"sigla": "Seg", "nomeDia": "Segunda-feira", "cumprido": True, "hoje": False},
            {"sigla": "Ter", "nomeDia": "Terça-feira", "cumprido": True, "hoje": False},
            {"sigla": "Qua", "nomeDia": "Quarta-feira", "cumprido": True, "hoje": False},
            {"sigla": "Qui", "nomeDia": "Quinta-feira", "cumprido": True, "hoje": False},
            {"sigla": "Sex", "nomeDia": "Sexta-feira", "cumprido": doses_tomadas > 0, "hoje": True},
            {"sigla": "Sáb", "nomeDia": "Sábado", "cumprido": False, "hoje": False},
            {"sigla": "Dom", "nomeDia": "Domingo", "cumprido": False, "hoje": False},
        ],
        "conquistas": conquistas,
        "mensagemFamilia": (
            {
                "remetente": msg_row["remetente"],
                "parentesco": msg_row["parentesco"],
                "texto": msg_row["texto"],
                "data": msg_row["data_envio"],
            }
            if ativo and msg_row
            else None
        ),
        "cuidadorPresente": ativo and user["dias_vinculo_cuidador"] >= 7,
        "relatorioSemanalLiberado": ativo and user["dias_vinculo_cuidador"] >= 7,
        "ultimoGanhoMensagem": user["ultimo_ganho_mensagem"],
    }


@app.post("/v1/cuidador/mensagem", status_code=201)
def enviar_mensagem_cuidador(payload: MensagemCuidadorIn):
    conn = get_conn()
    data_str = f"Hoje, {hora_agora()}"
    conn.execute(
        "INSERT INTO mensagem_cuidador (remetente, parentesco, texto, data_envio) VALUES (?, ?, ?, ?)",
        (payload.remetente.strip(), payload.parentesco.strip(), payload.texto.strip(), data_str),
    )
    registrar_evento(conn, "MENSAGEM_CUIDADOR", f"{payload.remetente.strip()} enviou um recado afetivo", 0)
    conn.commit()
    conn.close()
    return {
        "remetente": payload.remetente.strip(),
        "parentesco": payload.parentesco.strip(),
        "texto": payload.texto.strip(),
        "data": data_str,
    }


@app.patch("/v1/privacidade/cuidador")
def atualizar_cuidador(payload: AtualizarCuidadorIn):
    conn = get_conn()
    if payload.ativo is not None:
        conn.execute("UPDATE usuario SET cuidador_ativo = ? WHERE id = 1", (1 if payload.ativo else 0,))
        registrar_evento(
            conn,
            "LGPD_VINCULO",
            "Idoso autorizou o acompanhamento do familiar cuidador"
            if payload.ativo
            else "Idoso pausou o acesso do familiar cuidador (LGPD)",
            0,
        )
    if payload.apelido and payload.apelido.strip():
        conn.execute("UPDATE usuario SET apelido = ? WHERE id = 1", (payload.apelido.strip(),))
    conn.commit()
    user = conn.execute("SELECT apelido, cuidador_ativo FROM usuario WHERE id = 1").fetchone()
    conn.close()
    return {"cuidadorAtivo": bool(user["cuidador_ativo"]), "apelido": user["apelido"]}


@app.get("/v1/metricas/impacto")
def metricas_impacto():
    conn = get_conn()
    user = conn.execute("SELECT * FROM usuario WHERE id = 1").fetchone()
    doses = conn.execute("SELECT status FROM medicamento_dose").fetchall()
    total_doses = len(doses)
    tomadas = sum(1 for d in doses if d["status"] == "tomada")
    pendentes = sum(1 for d in doses if d["status"] == "pendente")
    atrasadas = sum(1 for d in doses if d["status"] == "atrasada")
    conquistas_desb = conn.execute("SELECT COUNT(*) FROM usuario_conquista").fetchone()[0]
    total_conquistas = conn.execute("SELECT COUNT(*) FROM tipo_conquista").fetchone()[0]
    eventos = conn.execute(
        "SELECT tipo, descricao, pontos, registrado_em FROM evento_impacto ORDER BY id DESC LIMIT 8"
    ).fetchall()
    conn.close()

    est = calcular_estagio(user["pontos"])
    return {
        "apelidoIdoso": user["apelido"],
        "cuidadorAtivo": bool(user["cuidador_ativo"]),
        "cuidadorNome": f"{user['cuidador_nome']} ({user['cuidador_parentesco']})",
        "diasVinculoCuidador": user["dias_vinculo_cuidador"],
        "totalDosesHoje": total_doses,
        "dosesTomadasHoje": tomadas,
        "dosesPendentesHoje": pendentes,
        "dosesAtrasadasHoje": atrasadas,
        "taxaAdesaoHoje": round((tomadas / total_doses) * 100) if total_doses > 0 else 0,
        "documentosLidosComIA": user["documentos_lidos"],
        "pontosJardim": user["pontos"],
        "estagioJardim": f"{est[2]} {est[1]}",
        "sequenciaDias": user["sequencia_dias"],
        "conquistasDesbloqueadas": conquistas_desb,
        "totalConquistas": total_conquistas,
        "eventosRecentes": [
            {
                "tipo": e["tipo"],
                "descricao": e["descricao"],
                "pontos": e["pontos"],
                "registradoEm": e["registrado_em"],
            }
            for e in eventos
        ],
    }


@app.get("/v1/privacidade/dados")
def ver_dados_lgpd():
    conn = get_conn()
    user = conn.execute("SELECT * FROM usuario WHERE id = 1").fetchone()
    doses = conn.execute("SELECT status FROM medicamento_dose").fetchall()
    conn.close()
    return {
        "apelido": user["apelido"],
        "cuidadorNome": f"{user['cuidador_nome']} ({user['cuidador_parentesco']})",
        "cuidadorAtivo": bool(user["cuidador_ativo"]),
        "consentimentoAceitoEm": data_hoje(),
        "totalDosesHoje": len(doses),
        "dosesTomadasHoje": sum(1 for d in doses if d["status"] == "tomada"),
        "pontosJardim": user["pontos"],
        "sequenciaDias": user["sequencia_dias"],
        "documentosLidos": user["documentos_lidos"],
        "itensNaFilaOffline": 0,
    }


@app.delete("/v1/privacidade/dados")
def apagar_dados_lgpd():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()
    return {"ok": True}
