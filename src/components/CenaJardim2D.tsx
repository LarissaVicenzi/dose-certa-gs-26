/**
 * Cena 2D plana do Jardim da Saude feita 100% com Views do React Native.
 * Reage imediatamente ao tema ativo e escala de fonte.
 */
import React from 'react';
import { StyleSheet, Text, View } from './RNPrimitives';
import { useAcessibilidade } from '../context/AcessibilidadeContext';
import { PaletaCores, tema } from '../theme/tema';
import { EstagioJardim } from '../types/modelos';

interface CenaJardim2DProps {
  estagio: EstagioJardim;
  nomeEstagio: string;
  pontos: number;
}

function PlantaEstagio2D({
  estagio,
  cores,
}: {
  estagio: EstagioJardim;
  cores: PaletaCores;
}) {
  if (estagio === 'semente') {
    return (
      <View style={styles.plantaArea}>
        <View
          style={[styles.sementeCorpo, { backgroundColor: cores.acento }]}
        >
          <View
            style={[styles.sementeBroto, { backgroundColor: cores.verdeBrasil }]}
          />
        </View>
        <View
          style={[styles.montinhoTerra, { backgroundColor: cores.acento }]}
        />
      </View>
    );
  }

  if (estagio === 'broto') {
    return (
      <View style={styles.plantaArea}>
        <View style={styles.parFolhas}>
          <View
            style={[
              styles.folhaEsquerda,
              { backgroundColor: cores.verdeBrasil },
            ]}
          />
          <View
            style={[
              styles.folhaDireita,
              { backgroundColor: cores.verdeBrasil },
            ]}
          />
        </View>
        <View
          style={[styles.cauleCurto, { backgroundColor: cores.sucessoTexto }]}
        />
        <View
          style={[styles.montinhoTerra, { backgroundColor: cores.acento }]}
        />
      </View>
    );
  }

  if (estagio === 'planta') {
    return (
      <View style={styles.plantaArea}>
        <View style={styles.parFolhas}>
          <View
            style={[
              styles.folhaEsquerdaGrande,
              { backgroundColor: cores.verdeBrasil },
            ]}
          />
          <View
            style={[
              styles.folhaDireitaGrande,
              { backgroundColor: cores.sucessoTexto },
            ]}
          />
        </View>
        <View style={styles.parFolhasBaixo}>
          <View
            style={[
              styles.folhaEsquerda,
              { backgroundColor: cores.verdeBrasil },
            ]}
          />
          <View
            style={[
              styles.folhaDireita,
              { backgroundColor: cores.verdeBrasil },
            ]}
          />
        </View>
        <View
          style={[styles.cauleMedio, { backgroundColor: cores.sucessoTexto }]}
        />
        <View
          style={[styles.vasoBorda, { backgroundColor: cores.azulBrasil }]}
        />
        <View
          style={[styles.vasoCorpo, { backgroundColor: cores.primaria }]}
        />
      </View>
    );
  }

  if (estagio === 'flor') {
    return (
      <View style={styles.plantaArea}>
        <View
          style={[
            styles.florCabeca,
            {
              backgroundColor: cores.amareloBrasil,
              borderColor: cores.superficie,
            },
          ]}
        >
          <View
            style={[styles.florMiolo, { backgroundColor: cores.azulBrasil }]}
          />
        </View>
        <View style={styles.parFolhasBaixo}>
          <View
            style={[
              styles.folhaEsquerdaGrande,
              { backgroundColor: cores.verdeBrasil },
            ]}
          />
          <View
            style={[
              styles.folhaDireitaGrande,
              { backgroundColor: cores.sucessoTexto },
            ]}
          />
        </View>
        <View
          style={[styles.cauleMedio, { backgroundColor: cores.sucessoTexto }]}
        />
        <View
          style={[styles.vasoBorda, { backgroundColor: cores.azulBrasil }]}
        />
        <View
          style={[styles.vasoCorpo, { backgroundColor: cores.primaria }]}
        />
      </View>
    );
  }

  return (
    <View style={styles.jardimCompletoArea}>
      <View style={styles.florLateral}>
        <View
          style={[
            styles.florPequenaAzul,
            {
              backgroundColor: cores.azulBrasil,
              borderColor: cores.superficie,
            },
          ]}
        >
          <View
            style={[
              styles.mioloPequeno,
              { backgroundColor: cores.amareloBrasil },
            ]}
          />
        </View>
        <View
          style={[styles.cauleCurto, { backgroundColor: cores.sucessoTexto }]}
        />
      </View>

      <View style={styles.arvoreCentral}>
        <View
          style={[styles.copaArvore, { backgroundColor: cores.verdeBrasil }]}
        >
          <View
            style={[
              styles.florCopa1,
              {
                backgroundColor: cores.amareloBrasil,
                borderColor: cores.superficie,
              },
            ]}
          />
          <View
            style={[
              styles.florCopa2,
              {
                backgroundColor: cores.superficie,
                borderColor: cores.azulBrasil,
              },
            ]}
          />
          <View
            style={[
              styles.florCopa3,
              {
                backgroundColor: cores.amareloBrasil,
                borderColor: cores.superficie,
              },
            ]}
          />
        </View>
        <View
          style={[styles.troncoArvore, { backgroundColor: cores.acento }]}
        />
      </View>

      <View style={styles.florLateral}>
        <View
          style={[
            styles.florPequenaOuro,
            {
              backgroundColor: cores.amareloBrasil,
              borderColor: cores.superficie,
            },
          ]}
        >
          <View
            style={[
              styles.mioloPequenoAzul,
              { backgroundColor: cores.azulBrasil },
            ]}
          />
        </View>
        <View
          style={[styles.cauleCurto, { backgroundColor: cores.sucessoTexto }]}
        />
      </View>
    </View>
  );
}

export function CenaJardim2D({
  estagio,
  nomeEstagio,
  pontos,
}: CenaJardim2DProps) {
  const { cores, fonte, espessuraBorda, altoContraste } = useAcessibilidade();

  return (
    <View
      style={styles.cena}
      accessibilityLabel={`Ilustracao do jardim no estagio ${nomeEstagio}, com ${pontos} pontos`}
    >
      <View style={[styles.ceu, { backgroundColor: cores.ceuJardim }]}>
        <View style={styles.topoCeu}>
          <View
            style={[
              styles.chipPontos,
              {
                backgroundColor: cores.superficie,
                borderWidth: espessuraBorda,
                borderColor: cores.borda,
              },
            ]}
          >
            <Text
              style={{
                fontSize: fonte(20),
                lineHeight: fonte(26),
                fontWeight: '800',
                color: cores.primaria,
              }}
            >
              {pontos} pontos
            </Text>
          </View>

          {!altoContraste && (
            <View style={styles.nuvem}>
              <View
                style={[
                  styles.nuvemBolaEsq,
                  { backgroundColor: cores.superficie },
                ]}
              />
              <View
                style={[
                  styles.nuvemBolaCentro,
                  { backgroundColor: cores.superficie },
                ]}
              />
              <View
                style={[
                  styles.nuvemBolaDir,
                  { backgroundColor: cores.superficie },
                ]}
              />
            </View>
          )}

          <View
            style={[
              styles.solHalo,
              {
                backgroundColor: cores.acentoClaro,
                borderWidth: altoContraste ? 2 : 0,
                borderColor: cores.solJardim,
              },
            ]}
          >
            <View
              style={[styles.solCentro, { backgroundColor: cores.solJardim }]}
            />
          </View>
        </View>

        <View style={styles.palcoPlanta}>
          <PlantaEstagio2D estagio={estagio} cores={cores} />
        </View>
      </View>

      <View
        style={[
          styles.chao,
          {
            backgroundColor: cores.chaoJardim,
            borderColor: cores.chaoBordaJardim,
          },
        ]}
      >
        <Text
          style={{
            fontSize: fonte(24),
            lineHeight: fonte(32),
            fontWeight: '800',
            color: cores.sucessoTexto,
            textAlign: 'center',
          }}
        >
          {nomeEstagio}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cena: {
    width: '100%',
    overflow: 'hidden',
  },
  ceu: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 0,
    minHeight: 204,
    justifyContent: 'space-between',
    gap: 10,
  },
  topoCeu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipPontos: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: tema.formas.raioChip,
  },
  nuvem: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  nuvemBolaEsq: {
    width: 24,
    height: 20,
    borderRadius: 12,
    marginRight: -8,
  },
  nuvemBolaCentro: {
    width: 34,
    height: 28,
    borderRadius: 16,
  },
  nuvemBolaDir: {
    width: 24,
    height: 20,
    borderRadius: 12,
    marginLeft: -8,
  },
  solHalo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solCentro: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  palcoPlanta: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  plantaArea: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 118,
  },
  sementeCorpo: {
    width: 38,
    height: 46,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    marginBottom: -8,
  },
  sementeBroto: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  montinhoTerra: {
    width: 96,
    height: 22,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
  },
  parFolhas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: -4,
  },
  parFolhasBaixo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: -12,
  },
  folhaEsquerda: {
    width: 30,
    height: 20,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  folhaDireita: {
    width: 30,
    height: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  folhaEsquerdaGrande: {
    width: 40,
    height: 26,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  folhaDireitaGrande: {
    width: 40,
    height: 26,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  cauleCurto: {
    width: 8,
    height: 30,
    borderRadius: 4,
  },
  cauleMedio: {
    width: 10,
    height: 36,
    borderRadius: 5,
  },
  vasoBorda: {
    width: 78,
    height: 14,
    borderRadius: 7,
  },
  vasoCorpo: {
    width: 64,
    height: 32,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  florCabeca: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -4,
  },
  florMiolo: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  jardimCompletoArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 18,
    minHeight: 120,
  },
  florLateral: {
    alignItems: 'center',
  },
  florPequenaAzul: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
  },
  florPequenaOuro: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
  },
  mioloPequeno: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  mioloPequenoAzul: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  arvoreCentral: {
    alignItems: 'center',
  },
  copaArvore: {
    width: 96,
    height: 76,
    borderRadius: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    marginBottom: -8,
  },
  florCopa1: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  florCopa2: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    marginTop: -18,
  },
  florCopa3: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  troncoArvore: {
    width: 22,
    height: 44,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  chao: {
    borderTopWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});
