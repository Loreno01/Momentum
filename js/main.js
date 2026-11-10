import { criarAreaDeDados } from "./dados.js?v=2";
import { formatarReais, observarJogador, obterJogador, gastar, VOLTAS_DO_JOGO } from "./jogador.js?v=3";
import { abrirCarteira, criarPlataformaDeInvestimentos, reiniciarPlataforma } from "./investimentos.js?v=33";
import { atualizarDicaDoPeao, criarPeao } from "./peao.js";
import { abrirCenarioDaPartida, prepararMercado, resumoDaNoticia } from "./mercado.js?v=25";
import { avancarCasas, configurarPartida, obterCasaAtual, reiniciarPartida, seguirCompra, seguirImprevisto } from "./partida.js?v=36";
import { atualizarContadorDeVoltas, criarTabuleiro, mesDaCasa, obterCasa } from "./tabuleiro.js?v=5";
import { prepararImprevistos, sortearImprevisto } from "./imprevistos.js?v=3";

const app = document.querySelector("#app");
const cena = document.createElement("div");
cena.className = "cena";
app.appendChild(cena);

const linhaTabuleiro = document.createElement("div");
linhaTabuleiro.className = "linha-tabuleiro";
cena.appendChild(linhaTabuleiro);

const peao = criarPeao();
const tabuleiro = criarTabuleiro(linhaTabuleiro);
criarPlataformaDeInvestimentos(linhaTabuleiro);
const colunaTabuleiro = document.createElement("div");
colunaTabuleiro.className = "coluna-tabuleiro";
colunaTabuleiro.append(linhaTabuleiro.querySelector(".acoes-laterais"), tabuleiro);
linhaTabuleiro.prepend(colunaTabuleiro);
linhaTabuleiro.append(criarResumo());
const fimDeJogo = criarFimDeJogo();
const jornal = criarJornal();
const imprevisto = criarImprevisto();
const pausaCompra = criarPausaCompra();
const boasVindas = criarBoasVindas();
let leituraAberta = false;
let compraAberta = false;
let imprevistoAberto = false;
let mercadoPronto = false;
let cenarioApresentado = false;
let comDicas = false;

configurarPartida({
  aoMudar: posicionarPeao,
  aoEncerrar: mostrarFimDeJogo,
  aoNoticias: mostrarNoticias,
  aoCaminho: pintarCaminho,
  aoCompra: mostrarPausaCompra,
  aoImprevisto: mostrarImprevisto,
});
posicionarPeao(obterCasaAtual());

const dados = criarAreaDeDados(
  (rolagem) => avancarCasas(rolagem.total),
  () => mercadoPronto && !leituraAberta && !compraAberta && !imprevistoAberto && fimDeJogo.hidden && boasVindas.hidden,
);
linhaTabuleiro.append(dados);

prepararMercado()
  .then(() => prepararImprevistos())
  .then(() => {
    mercadoPronto = true;
    if (boasVindas.hidden) {
      apresentarCenarioInicial();
    }
  });

function posicionarPeao(casa) {
  const mes = mesDaCasa(casa);
  obterCasa(tabuleiro, casa).appendChild(peao);
  peao.setAttribute("aria-label", mes ? `Peão na casa ${casa}, ${mes}` : `Peão na casa ${casa}`);
  atualizarDicaDoPeao(peao, mes);
  atualizarContadorDeVoltas(tabuleiro, obterJogador().volta, VOLTAS_DO_JOGO);
}

function criarResumo() {
  const caixa = document.createElement("section");
  caixa.className = "resumo-jogador";
  caixa.setAttribute("aria-label", "Dinheiro do jogador");

  const disponivel = document.createElement("p");
  disponivel.className = "resumo-rotulo";
  disponivel.textContent = "Valor disponível";

  const dinheiro = document.createElement("p");
  dinheiro.className = "resumo-dinheiro";

  const parcela = criarLinhaResumo("30% do salário");
  const dividendos = criarLinhaResumo("Dividendos");
  const recebido = criarLinhaResumo("Valor recebido no último mês");
  const detalhes = document.createElement("div");
  detalhes.className = "resumo-detalhes";
  detalhes.append(parcela.linha, dividendos.linha, recebido.linha);

  caixa.append(disponivel, dinheiro, detalhes);
  observarJogador((estado) => {
    dinheiro.textContent = formatarReais(estado.dinheiro);
    parcela.valor.textContent = formatarReais(estado.salario);
    dividendos.valor.textContent = formatarReais(estado.dividendosUltimoMes);
    recebido.valor.textContent = formatarReais(estado.parcelaUltimoMes + estado.dividendosUltimoMes);
    atualizarContadorDeVoltas(tabuleiro, estado.volta, VOLTAS_DO_JOGO);
  });
  return caixa;
}

function criarLinhaResumo(rotulo) {
  const linha = document.createElement("p");
  linha.className = "resumo-linha";
  const nome = document.createElement("span");
  nome.className = "resumo-rotulo";
  nome.textContent = rotulo;
  const valor = document.createElement("span");
  valor.className = "resumo-valor";
  linha.append(nome, valor);
  return { linha, valor };
}

function criarFimDeJogo() {
  const overlay = document.createElement("div");
  overlay.className = "fim-de-jogo";
  overlay.hidden = true;

  const painel = document.createElement("div");
  painel.className = "fim-de-jogo-painel";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-modal", "true");
  painel.setAttribute("aria-label", "Fim de jogo");

  const titulo = document.createElement("h1");
  titulo.textContent = "O jogo foi finalizado";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-fechar";
  botao.textContent = "Jogar novamente";
  botao.addEventListener("click", () => {
    compraAberta = false;
    imprevistoAberto = false;
    pausaCompra.hidden = true;
    imprevisto.hidden = true;
    reiniciarPartida();
    reiniciarPlataforma();
    overlay.hidden = true;
    cenarioApresentado = false;
    apresentarCenarioInicial();
  });

  painel.append(titulo, botao);
  overlay.append(painel);
  document.body.append(overlay);
  return overlay;
}

function criarBoasVindas() {
  const overlay = document.createElement("div");
  overlay.className = "boas-vindas";

  const painel = document.createElement("section");
  painel.className = "boas-vindas-painel";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-modal", "true");
  painel.setAttribute("aria-label", "Bem-vindo");

  const titulo = document.createElement("h1");
  titulo.textContent = "Bem-vindo, jogador";

  const texto = document.createElement("p");
  texto.className = "boas-vindas-texto";
  texto.textContent = "Neste jogo você vai viver a rotina de um trabalhador comum, que separa uma parte do seu salário para investir, mais especificamente 30% do salário. O jogo dura 10 anos, representados por 10 voltas. Assim que o jogo começa, você será apresentado a um cenário do mundo ou do Brasil. Cada cenário vai acompanhar você por 2 anos e meio, totalizando quatro cenários do mundo ou do Brasil em cada partida. Cada cenário afeta os investimentos de forma diferente, beneficiando ou prejudicando. A cada mês que você passar, o jogo para e permite que você compre seus ativos, se desejar. Caso queira seguir em frente sem comprar nada, também é possível. Aqui você mesmo faz as suas escolhas, e elas determinam o seu resultado. É um jogo focado principalmente em tomada de decisão, então tenha um bom jogo e aproveite com calma!";

  let experiencia = null;

  const comecar = document.createElement("button");
  comecar.type = "button";
  comecar.className = "botao-fechar";
  comecar.textContent = "Começar";
  comecar.disabled = true;

  const modo = criarGrupoEscolha("Que experiência de jogo você quer?", [
    [
      "real",
      "Experiência real",
      "O jornal do jogo vai anunciar o cenário do mundo ou do Brasil, com uma breve descrição do cenário atual. Você mesmo descobre quais áreas serão prejudicadas ou beneficiadas por esse cenário.",
      "Este modo de jogo é melhor para testar seu conhecimento em macroeconomia.",
    ],
    [
      "dicas",
      "Experiência com dicas",
      "O jornal do jogo vai anunciar o cenário do mundo ou do Brasil, com uma breve descrição do cenário atual. Ele também informa quais áreas serão afetadas, de forma positiva ou negativa, e explica brevemente o motivo de cada uma.",
      "Este modo de jogo é melhor para aprender sobre macroeconomia.",
    ],
  ], (valor) => {
    experiencia = valor;
    comDicas = valor === "dicas";
    liberarComeço();
  });

  comecar.addEventListener("click", () => {
    if (experiencia === null) {
      return;
    }
    overlay.hidden = true;
    apresentarCenarioInicial();
  });

  painel.append(titulo, texto, modo, comecar);
  overlay.append(painel);
  document.body.append(overlay);

  function liberarComeço() {
    comecar.disabled = experiencia === null;
  }

  return overlay;
}

function criarGrupoEscolha(pergunta, opcoes, aoEscolher) {
  const grupo = document.createElement("fieldset");
  grupo.className = "grupo-escolha";

  const legenda = document.createElement("legend");
  legenda.textContent = pergunta;

  const lista = document.createElement("div");
  lista.className = "opcoes-escolha";
  const botoes = [];

  for (const [valor, rotulo, dica, extra] of opcoes) {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "escolha";
    botao.textContent = rotulo;
    botao.setAttribute("aria-pressed", "false");
    if (dica) {
      const explicacao = document.createElement("span");
      explicacao.className = "dica-escolha";
      explicacao.setAttribute("role", "tooltip");
      const principal = document.createElement("span");
      principal.textContent = dica;
      explicacao.append(principal);
      if (extra) {
        const linha = document.createElement("span");
        linha.className = "dica-extra";
        linha.textContent = extra;
        explicacao.append(linha);
      }
      botao.append(explicacao);
    }
    botao.addEventListener("click", () => {
      for (const outro of botoes) {
        outro.classList.remove("escolha-ativa");
        outro.setAttribute("aria-pressed", "false");
      }
      botao.classList.add("escolha-ativa");
      botao.setAttribute("aria-pressed", "true");
      aoEscolher(valor);
    });
    botoes.push(botao);
    lista.append(botao);
  }

  grupo.append(legenda, lista);
  return grupo;
}

function mostrarFimDeJogo() {
  fimDeJogo.hidden = false;
  fimDeJogo.querySelector("button").focus();
}

function pintarCaminho(casas) {
  for (const casa of tabuleiro.querySelectorAll(".casa-caminho")) {
    casa.classList.remove("casa-caminho", "casa-parada");
  }

  casas.forEach((indice, posicao) => {
    const casa = obterCasa(tabuleiro, indice);
    casa.classList.add("casa-caminho");
    if (posicao === casas.length - 1) {
      casa.classList.add("casa-parada");
    }
  });
}

function criarPausaCompra() {
  const painel = document.createElement("section");
  painel.className = "pausa-compra";
  painel.hidden = true;
  painel.setAttribute("aria-label", "Por que o jogo foi pausado");

  const titulo = document.createElement("h2");
  titulo.textContent = "O jogo foi pausado";

  const motivo = document.createElement("p");
  const detalhe = document.createElement("p");
  detalhe.textContent = "O salário já entrou, compre ativos para maximizar seus rendimentos, quando estiver satisfeito, pode clicar em continuar para dar seguimento ao jogo.";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-fechar";
  botao.textContent = "Continuar";
  botao.addEventListener("click", () => {
    compraAberta = false;
    painel.hidden = true;
    seguirCompra();
  });

  painel.append(titulo, motivo, detalhe, botao);
  tabuleiro.querySelector(".centro").append(painel);
  painel.motivo = motivo;
  return painel;
}

function mostrarPausaCompra() {
  const mes = mesDaCasa(obterCasaAtual());
  const nome = mes ? mes.toLocaleLowerCase("pt-BR") : "um mês";
  compraAberta = true;
  pausaCompra.motivo.textContent = `Você recebeu o salário de ${nome}.`;
  pausaCompra.hidden = false;
}

let valorDoEvento = 0;

function criarImprevisto() {
  const overlay = document.createElement("div");
  overlay.className = "imprevisto";
  overlay.hidden = true;

  const painel = document.createElement("div");
  painel.className = "imprevisto-painel";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-modal", "true");
  painel.setAttribute("aria-label", "Imprevisto");

  const cabecalho = document.createElement("p");
  cabecalho.className = "imprevisto-cabecalho";
  cabecalho.textContent = "Imprevisto";

  const nome = document.createElement("h1");
  const texto = document.createElement("p");
  const valor = document.createElement("p");
  valor.className = "imprevisto-valor";
  const aviso = document.createElement("p");
  aviso.className = "imprevisto-aviso";
  aviso.hidden = true;

  const acoes = document.createElement("div");
  acoes.className = "imprevisto-acoes";

  const carteira = document.createElement("button");
  carteira.type = "button";
  carteira.className = "botao-fechar";
  carteira.textContent = "Abrir carteira";
  carteira.addEventListener("click", () => abrirCarteira());

  const pagar = document.createElement("button");
  pagar.type = "button";
  pagar.className = "botao-fechar";
  pagar.textContent = "Pagar";
  pagar.addEventListener("click", () => {
    if (!gastar(valorDoEvento)) {
      atualizarAvisoDoImprevisto();
      return;
    }

    imprevistoAberto = false;
    overlay.hidden = true;
    seguirImprevisto();
  });

  acoes.append(carteira, pagar);
  painel.append(cabecalho, nome, texto, valor, aviso, acoes);
  overlay.append(painel);
  document.body.append(overlay);
  overlay.nome = nome;
  overlay.texto = texto;
  overlay.valor = valor;
  overlay.aviso = aviso;
  overlay.pagar = pagar;

  observarJogador(() => {
    if (!overlay.hidden) {
      atualizarAvisoDoImprevisto();
    }
  });
  return overlay;
}

function mostrarImprevisto() {
  const sorteio = sortearImprevisto(obterJogador().volta);
  valorDoEvento = sorteio.valor;
  imprevisto.nome.textContent = sorteio.carta.nome;
  imprevisto.texto.textContent = sorteio.carta.descricao;
  imprevisto.valor.textContent = `Pague ${formatarReais(sorteio.valor)}`;
  imprevistoAberto = true;
  imprevisto.hidden = false;
  atualizarAvisoDoImprevisto();
  imprevisto.pagar.focus();
}

function atualizarAvisoDoImprevisto() {
  const falta = obterJogador().dinheiro + 0.001 < valorDoEvento;
  imprevisto.aviso.hidden = !falta;
  imprevisto.aviso.textContent = falta
    ? "Falta dinheiro. Abra a carteira e venda algum ativo para conseguir pagar."
    : "";
}

function criarJornal() {
  const overlay = document.createElement("div");
  overlay.className = "jornal";
  overlay.hidden = true;

  const painel = document.createElement("div");
  painel.className = "jornal-painel";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-modal", "true");
  painel.setAttribute("aria-label", "Cenário");

  const cabecalho = document.createElement("p");
  cabecalho.className = "jornal-cabecalho";
  cabecalho.textContent = "Jornal do mercado";

  const manchete = document.createElement("h1");
  const texto = document.createElement("p");
  texto.className = "jornal-texto";
  const efeito = document.createElement("div");
  efeito.className = "jornal-efeito";
  const prazo = document.createElement("p");
  prazo.className = "jornal-prazo";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-fechar";
  botao.textContent = "Continuar";

  painel.append(cabecalho, manchete, texto, efeito, prazo, botao);
  overlay.append(painel);
  document.body.append(overlay);
  overlay.manchete = manchete;
  overlay.texto = texto;
  overlay.efeito = efeito;
  overlay.prazo = prazo;
  overlay.cabecalho = cabecalho;
  overlay.botao = botao;
  return overlay;
}

function apresentarCenarioInicial() {
  if (cenarioApresentado || !mercadoPronto) {
    return;
  }

  cenarioApresentado = true;
  const cenario = abrirCenarioDaPartida();
  if (cenario) {
    mostrarNoticias([cenario], () => {});
  }
}

function mostrarNoticias(lista, aoTerminar) {
  let indice = 0;
  leituraAberta = true;

  const abrirProxima = () => {
    const noticia = lista[indice];
    if (!noticia) {
      jornal.hidden = true;
      leituraAberta = false;
      aoTerminar();
      return;
    }

    indice += 1;
    const resumo = resumoDaNoticia(noticia);
    jornal.cabecalho.textContent = noticia.alcance === "Brasil" ? "Cenário do Brasil" : "Cenário do mundo";
    jornal.manchete.textContent = noticia.manchete;
    jornal.texto.textContent = noticia.texto;
    preencherEfeito(noticia, resumo);
    jornal.prazo.textContent = textoDoPrazo(noticia);
    jornal.hidden = false;
    jornal.botao.focus();
  };

  jornal.botao.onclick = abrirProxima;
  abrirProxima();
}

function textoDoPrazo(noticia) {
  if (noticia.duracaoMeses === 30) {
    return "Vale pelos próximos 2 anos e meio.";
  }

  const lugar = noticia.alcance === "Brasil" ? "No Brasil" : "No mundo";
  const meses = noticia.duracaoMeses;
  let tempo = `os próximos ${meses} meses`;
  if (meses === 12) {
    tempo = "o próximo ano";
  }
  if (meses === 18) {
    tempo = "o próximo ano e meio";
  }
  return `${lugar}. O efeito tende a durar ${tempo}.`;
}

function preencherEfeito(noticia, resumo) {
  jornal.efeito.replaceChildren();
  if (!comDicas) {
    return;
  }

  const linhas = [];
  if (resumo.sobem.length > 0) {
    linhas.push(`Tende a ajudar: ${resumo.sobem.join(", ")}.`);
  }
  if (resumo.descem.length > 0) {
    linhas.push(`Tende a prejudicar: ${resumo.descem.join(", ")}.`);
  }
  const bloco = document.createElement("div");
  bloco.className = "jornal-tende";
  for (const linha of linhas) {
    const paragrafo = document.createElement("p");
    paragrafo.textContent = linha;
    bloco.append(paragrafo);
  }
  jornal.efeito.append(bloco);

  if (noticia.complemento) {
    const complemento = document.createElement("p");
    complemento.className = "jornal-complemento";
    complemento.textContent = noticia.complemento;
    jornal.efeito.append(complemento);
  }
}
