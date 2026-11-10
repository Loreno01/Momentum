export const VOLTAS_DO_JOGO = 10;

export const DINHEIRO_INICIAL = 3000;
export const SALARIO_INICIAL = 400;
export const AUMENTO_SALARIAL_POR_VOLTA = 0.06;

const ouvintes = new Set();

let jogador = estadoInicial();

function estadoInicial() {
  return {
    volta: 1,
    dinheiro: DINHEIRO_INICIAL,
    salario: SALARIO_INICIAL,
    parcelaUltimoMes: 0,
    dividendosUltimoMes: 0,
  };
}

export function obterJogador() {
  return jogador;
}

export function observarJogador(ouvinte) {
  ouvintes.add(ouvinte);
  ouvinte(jogador);
}

export function alterarJogador(mutacao) {
  mutacao(jogador);
  avisar();
}

export function reiniciarJogador() {
  jogador = estadoInicial();
  avisar();
}

export function receber(valor) {
  jogador.dinheiro = centavos(jogador.dinheiro + valor);
  avisar();
}

export function gastar(valor) {
  const custo = centavos(valor);
  if (centavos(jogador.dinheiro) + 0.001 < custo) {
    return false;
  }

  jogador.dinheiro = centavos(jogador.dinheiro - custo);
  avisar();
  return true;
}

export function salarioDaVolta(volta) {
  const fator = (1 + AUMENTO_SALARIAL_POR_VOLTA) ** (volta - 1);
  return Math.round(SALARIO_INICIAL * fator);
}

export function formatarReais(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function centavos(valor) {
  return Math.round(valor * 100) / 100;
}

function avisar() {
  for (const ouvinte of ouvintes) {
    ouvinte(jogador);
  }
}
