import { alterarJogador, centavos, obterJogador, reiniciarJogador, salarioDaVolta, VOLTAS_DO_JOGO } from "./jogador.js?v=3";
import { fecharMes, reiniciarMercado } from "./mercado.js?v=25";
import { ehImprevisto, mesDaCasa, TOTAL_DE_CASAS } from "./tabuleiro.js?v=5";
import { reiniciarImprevistos } from "./imprevistos.js?v=3";

const CASA_INICIAL = 1;

let casaAtual = CASA_INICIAL;
let encerrada = false;
let aguardandoCompra = false;
let aguardandoImprevisto = false;
let casasRestantes = [];
let caminhoDaRolagem = [];
let aoMudar = () => {};
let aoEncerrar = () => {};
let aoNoticias = () => {};
let aoCaminho = () => {};
let aoCompra = () => {};
let aoImprevisto = () => {};

export function configurarPartida(ganchos) {
  aoMudar = ganchos.aoMudar;
  aoEncerrar = ganchos.aoEncerrar;
  aoNoticias = ganchos.aoNoticias ?? (() => {});
  aoCaminho = ganchos.aoCaminho ?? (() => {});
  aoCompra = ganchos.aoCompra ?? (() => {});
  aoImprevisto = ganchos.aoImprevisto ?? (() => {});
}

export function obterCasaAtual() {
  return casaAtual;
}

export function avancarCasas(quantidade) {
  if (encerrada || aguardandoCompra || aguardandoImprevisto || quantidade <= 0) {
    return;
  }

  caminhoDaRolagem = preverCaminho(quantidade);
  casasRestantes = [...caminhoDaRolagem];
  andarProximoTrecho();
}

export function seguirImprevisto() {
  if (!aguardandoImprevisto) {
    return;
  }

  aguardandoImprevisto = false;
  aoCaminho([]);
  if (encerrada) {
    aoEncerrar();
  }
}

export function seguirCompra() {
  if (!aguardandoCompra) {
    return;
  }

  aguardandoCompra = false;
  if (casasRestantes.length > 0) {
    andarProximoTrecho();
    return;
  }

  concluirParada();
}

export function reiniciarPartida() {
  casaAtual = CASA_INICIAL;
  encerrada = false;
  aguardandoCompra = false;
  aguardandoImprevisto = false;
  casasRestantes = [];
  caminhoDaRolagem = [];
  reiniciarMercado();
  reiniciarImprevistos();
  reiniciarJogador();
  aoCaminho([]);
  aoMudar(casaAtual);
}

function preverCaminho(quantidade) {
  let casa = casaAtual;
  let volta = obterJogador().volta;
  const caminho = [];

  for (let passo = 0; passo < quantidade; passo += 1) {
    casa = (casa % TOTAL_DE_CASAS) + 1;
    caminho.push(casa);
    if (casa === CASA_INICIAL && volta >= VOLTAS_DO_JOGO) {
      break;
    }
    if (casa === CASA_INICIAL) {
      volta += 1;
    }
  }

  return caminho;
}

function andarProximoTrecho() {
  const parada = casasRestantes.findIndex((casa) => mesDaCasa(casa));
  const fim = parada === -1 ? casasRestantes.length : parada + 1;
  const trecho = casasRestantes.slice(0, fim);
  casasRestantes = casasRestantes.slice(fim);
  aplicarTrecho(trecho);
}

function aplicarTrecho(trecho) {
  const estado = obterJogador();
  let volta = estado.volta;
  let salario = estado.salario;
  let dinheiro = estado.dinheiro;
  let parcelaUltimoMes = estado.parcelaUltimoMes;
  let pagouMes = false;

  for (const casa of trecho) {
    casaAtual = casa;

    if (casa === CASA_INICIAL) {
      if (volta >= VOLTAS_DO_JOGO) {
        encerrada = true;
        break;
      }

      volta += 1;
      salario = salarioDaVolta(volta);
    }

    if (!encerrada && mesDaCasa(casa)) {
      dinheiro += salario;
      parcelaUltimoMes = salario;
      pagouMes = true;
    }
  }

  alterarJogador((atual) => {
    atual.volta = volta;
    atual.salario = salario;
    atual.dinheiro = centavos(dinheiro);
    atual.parcelaUltimoMes = parcelaUltimoMes;
  });
  aoMudar(casaAtual);
  aoCaminho(caminhoDaRolagem);

  if (pagouMes) {
    pagarRendimentoDoMes();
    return;
  }

  concluirParada();
}

function pagarRendimentoDoMes() {
  const fechamento = fecharMes();
  alterarJogador((atual) => {
    atual.dinheiro = centavos(atual.dinheiro + fechamento.proventos);
    atual.dividendosUltimoMes = centavos(fechamento.proventos);
  });

  if (fechamento.noticia) {
    aoNoticias([fechamento.noticia], abrirPausa);
    return;
  }

  abrirPausa();
}

function abrirPausa() {
  aguardandoCompra = true;
  aoCompra(1);
}

function concluirParada() {
  if (!encerrada && casasRestantes.length === 0 && ehImprevisto(casaAtual)) {
    aguardandoImprevisto = true;
    aoImprevisto();
    return;
  }

  aoCaminho([]);
  if (encerrada) {
    aoEncerrar();
  }
}
