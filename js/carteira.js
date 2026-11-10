import { obterJogador } from "./jogador.js?v=3";

const posicoes = new Map();

export function adicionarNaCarteira(carta, quantidade, precoPago = carta.precoBase) {
  const atual = posicoes.get(carta.id);

  if (atual) {
    const quantidadeNova = atual.quantidade + quantidade;
    atual.precoUnitario = (atual.precoUnitario * atual.quantidade + precoPago * quantidade) / quantidadeNova;
    atual.quantidade = quantidadeNova;
    return atual;
  }

  const posicao = {
    id: carta.id,
    nome: carta.nome,
    precoUnitario: precoPago,
    quantidade,
    bloqueioVendaRodadas: carta.bloqueioVendaRodadas ?? 0,
    voltaCompra: obterJogador().volta,
  };
  posicoes.set(carta.id, posicao);
  return posicao;
}

export function venderDaCarteira(id, quantidade) {
  const atual = posicoes.get(id);
  const unidades = Math.floor(quantidade);
  if (!atual || unidades <= 0 || unidades > atual.quantidade) {
    return false;
  }

  const volta = obterJogador().volta;
  if (volta < atual.voltaCompra + atual.bloqueioVendaRodadas) {
    return false;
  }

  atual.quantidade -= unidades;
  if (atual.quantidade === 0) {
    posicoes.delete(id);
  }
  return true;
}

export function listarCarteira() {
  return [...posicoes.values()];
}

export function limparCarteira() {
  posicoes.clear();
}
