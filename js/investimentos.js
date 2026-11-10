import { limparCarteira, adicionarNaCarteira, listarCarteira, venderDaCarteira } from "./carteira.js?v=3";
import { centavos, formatarReais, gastar, obterJogador, observarJogador, receber } from "./jogador.js?v=3";
import { observarMercado, percentualDe, precoDe } from "./mercado.js?v=25";

const BARALHOS = [
  "dados/cartas/investimentos/acoes.json?v=5",
  "dados/cartas/investimentos/criptoativos.json?v=4",
  "dados/cartas/investimentos/fiis.json?v=6",
  "dados/cartas/investimentos/renda-fixa.json?v=5",
];

const CAMPOS = [
  ["sigla", "Sigla"],
  ["categoria", "Categoria"],
  ["precoBase", "Preço base"],
  ["risco", "Risco"],
  ["rendimento", "Rendimento"],
  ["retornoPercentualAoMes", "Percentual ao mês"],
];

const OCULTOS_NA_CARTEIRA = new Set(["sigla", "categoria", "precoBase"]);

export function criarPlataformaDeInvestimentos(elementoPai) {
  const laterais = garantirLaterais(elementoPai);
  const botaoCarteira = criarBotao("botao-carteira", "Carteira de investimentos");
  const botao = criarBotao("botao-investimentos", "Bolsa de valores");
  laterais.append(botao, botaoCarteira);

  const plataforma = criarPainel(
    "Plataforma de investimentos",
    "Selecione um ativo para comprar",
  );
  const carteira = criarPainel(
    "Carteira de investimentos",
    "Selecione um ativo para vender",
  );
  const conteudo = plataforma.conteudo;
  const listaCarteira = carteira.conteudo;

  const corpo = document.createElement("div");
  corpo.className = "plataforma-corpo";
  detalheCompra = document.createElement("aside");
  detalheCompra.className = "detalhe-compra";
  plataforma.painel.classList.add("plataforma-compra");
  corpo.append(conteudo, detalheCompra);
  plataforma.painel.append(corpo);
  limparSelecao();

  const corpoCarteira = document.createElement("div");
  corpoCarteira.className = "plataforma-corpo";
  detalheVenda = document.createElement("aside");
  detalheVenda.className = "detalhe-compra";
  carteira.painel.classList.add("plataforma-compra");
  corpoCarteira.append(listaCarteira, detalheVenda);
  carteira.painel.append(corpoCarteira);
  limparVenda();

  observarJogador((estado) => {
    const saldo = detalheCompra.querySelector(".saldo-compra strong");
    if (saldo) {
      saldo.textContent = formatarReais(estado.dinheiro);
    }
    if (estado.volta !== voltaVista && idVenda && overlayCarteira && !overlayCarteira.overlay.hidden) {
      voltaVista = estado.volta;
      const posicao = listarCarteira().find((item) => item.id === idVenda);
      if (posicao) {
        desenharDetalheVenda(posicao);
      }
    }
    voltaVista = estado.volta;
  });

  overlayInvestimentos = plataforma;
  overlayCarteira = carteira;
  destinoCarteira = listaCarteira;
  observarMercado(() => {
    if (!overlayCarteira.overlay.hidden) {
      atualizarValoresDaCarteira();
    }

    const cotacao = detalheCompra.querySelector(".cotacao-atual");
    const campoValor = detalheCompra.querySelector(".campo-valor");
    if (cotacao && artigoSelecionado) {
      const carta = artigoSelecionado.carta;
      cotacao.textContent = `Cotação ${formatarReais(cotacaoDe(carta))}`;
      if (campoValor && document.activeElement !== campoValor) {
        const quantidade = detalheCompra.querySelector(".campo-quantidade");
        const unidades = limitarCompra(carta, Number(quantidade.value) || 0);
        if (document.activeElement !== quantidade) {
          quantidade.value = String(unidades);
        }
        campoValor.value = centavos(unidades * cotacaoDe(carta)).toFixed(2);
      }
    }

    atualizarPercentuais();
  });
  document.body.append(plataforma.overlay, carteira.overlay);

  botao.addEventListener("click", () => {
    fecharPainel(carteira, botaoCarteira);
    abrir(plataforma, conteudo, plataforma.fechar);
  });
  botaoCarteira.addEventListener("click", () => {
    fecharPainel(plataforma, botao);
    abrirCarteira();
  });

  plataforma.fechar.addEventListener("click", () => fecharPainel(plataforma, botao));
  carteira.fechar.addEventListener("click", () => fecharCarteira(botaoCarteira));

  plataforma.overlay.addEventListener("click", (evento) => {
    if (evento.target === plataforma.overlay) {
      fecharPainel(plataforma, botao);
    }
  });
  carteira.overlay.addEventListener("click", (evento) => {
    if (evento.target === carteira.overlay) {
      fecharCarteira(botaoCarteira);
    }
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") {
      return;
    }
    if (!plataforma.overlay.hidden) {
      fecharPainel(plataforma, botao);
    } else if (!carteira.overlay.hidden) {
      fecharCarteira(botaoCarteira);
    }
  });
}

let detalheCompra;
let detalheVenda;
let artigoSelecionado = null;
let artigoVenda = null;
let idVenda = null;
let voltaVista = 0;
let baralhosCarregados = null;
let overlayInvestimentos;
let overlayCarteira;
let destinoCarteira;

export function reiniciarPlataforma() {
  limparSelecao();
  limparVenda();
  limparCarteira();
  if (destinoCarteira) {
    desenharCarteira(destinoCarteira);
  }
  if (overlayInvestimentos) {
    overlayInvestimentos.overlay.hidden = true;
  }
  if (overlayCarteira) {
    overlayCarteira.overlay.hidden = true;
  }
}

function garantirLaterais(elementoPai) {
  const existente = elementoPai.querySelector(".acoes-laterais");
  if (existente) {
    return existente;
  }

  const laterais = document.createElement("div");
  laterais.className = "acoes-laterais";
  elementoPai.prepend(laterais);
  return laterais;
}

function criarBotao(classe, texto) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classe;
  botao.textContent = texto;
  return botao;
}

function criarPainel(tituloTexto, dicaTexto) {
  const overlay = document.createElement("div");
  overlay.className = "plataforma";
  overlay.hidden = true;

  const painel = document.createElement("div");
  painel.className = "plataforma-painel";
  painel.setAttribute("role", "dialog");
  painel.setAttribute("aria-modal", "true");
  painel.setAttribute("aria-label", tituloTexto);

  const cabecalho = document.createElement("div");
  cabecalho.className = "plataforma-cabecalho";

  const grupo = document.createElement("div");
  grupo.className = "plataforma-titulo-grupo";

  const titulo = document.createElement("h1");
  titulo.className = "plataforma-titulo";
  titulo.textContent = tituloTexto;
  grupo.append(titulo);

  if (dicaTexto) {
    const dica = document.createElement("p");
    dica.className = "plataforma-dica";
    dica.textContent = dicaTexto;
    grupo.append(dica);
  }

  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "botao-fechar";
  fechar.textContent = "Fechar";

  const conteudo = document.createElement("div");
  conteudo.className = "plataforma-conteudo";

  cabecalho.append(grupo, fechar);
  painel.append(cabecalho, conteudo);
  overlay.append(painel);
  return { overlay, painel, fechar, conteudo, cabecalho };
}

function fecharCarteira(botao) {
  overlayCarteira.overlay.classList.remove("plataforma-acima");
  fecharPainel(overlayCarteira, botao);
}

export async function abrirCarteira() {
  if (!overlayCarteira || !destinoCarteira) {
    return;
  }

  overlayCarteira.overlay.classList.add("plataforma-acima");
  overlayCarteira.overlay.hidden = false;
  try {
    await desenharCarteira(destinoCarteira);
  } catch {
    destinoCarteira.textContent = "Não foi possível carregar a carteira.";
  }
  overlayCarteira.fechar.focus();
}

function fecharPainel(painel, botao) {
  painel.overlay.hidden = true;
  botao.focus();
}

async function abrir(plataforma, conteudo, fechar) {
  plataforma.overlay.hidden = false;
  fechar.focus();

  if (conteudo.dataset.carregado === "sim") {
    return;
  }

  try {
    const baralhos = await garantirBaralhos();
    conteudo.replaceChildren();
    for (const baralho of baralhos) {
      conteudo.appendChild(criarFileira(baralho));
    }
    conteudo.dataset.carregado = "sim";
  } catch {
    conteudo.textContent = "Não foi possível carregar as cartas.";
  }
}

async function garantirBaralhos() {
  if (!baralhosCarregados) {
    baralhosCarregados = await Promise.all(BARALHOS.map(carregarBaralho));
  }
  return baralhosCarregados;
}

async function carregarBaralho(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) {
    throw new Error(caminho);
  }
  return resposta.json();
}

function criarFileira(baralho) {
  const secao = document.createElement("section");
  secao.className = "fileira";

  const titulo = document.createElement("h2");
  titulo.className = "fileira-titulo";
  titulo.textContent = baralho.nome;

  const lista = document.createElement("div");
  lista.className = "fileira-cartas";

  for (const carta of baralho.cartas) {
    lista.appendChild(criarCarta(carta));
  }

  secao.append(titulo, lista);
  return secao;
}

function criarCarta(carta, aoClicar = selecionar, posicao = null) {
  const artigo = document.createElement("article");
  artigo.className = "carta-ativo";
  artigo.carta = carta;
  artigo.posicao = posicao;
  if (posicao) {
    artigo.dataset.id = posicao.id;
  }
  artigo.setAttribute("aria-pressed", "false");
  artigo.append(...criarConteudoDaCarta(carta, posicao));
  artigo.addEventListener("click", () => aoClicar(artigo));
  return artigo;
}

function criarConteudoDaCarta(carta, posicao = null) {
  const nome = document.createElement("h3");
  nome.className = "carta-nome";
  nome.textContent = carta.nome;

  const imagem = document.createElement("div");
  imagem.className = "carta-imagem";
  imagem.setAttribute("aria-hidden", "true");

  const info = document.createElement("dl");
  info.className = "carta-info";

  for (const [campo, rotulo] of CAMPOS) {
    if (!(campo in carta) || carta[campo] === null) {
      continue;
    }
    if (posicao && OCULTOS_NA_CARTEIRA.has(campo)) {
      continue;
    }
    info.appendChild(criarLinha(rotulo, valorDoCampo(carta, campo), campo));
  }

  if (posicao) {
    const cotacao = precoDe(posicao.id) ?? posicao.precoUnitario;
    info.appendChild(criarLinha("Quantidade", String(posicao.quantidade)));
    info.appendChild(criarLinha("Preço médio por ativo", formatarReais(posicao.precoUnitario)));
    info.appendChild(criarLinha("Valor total", formatarReais(centavos(cotacao * posicao.quantidade)), "valor-posicao"));
  }

  return [nome, imagem, info];
}

function selecionar(artigo) {
  if (artigoSelecionado === artigo) {
    limparSelecao();
    return;
  }

  if (artigoSelecionado) {
    artigoSelecionado.classList.remove("selecionada");
    artigoSelecionado.setAttribute("aria-pressed", "false");
  }

  artigoSelecionado = artigo;
  artigo.classList.add("selecionada");
  artigo.setAttribute("aria-pressed", "true");
  desenharDetalhe(artigo.carta);
}

function limparSelecao() {
  if (artigoSelecionado) {
    artigoSelecionado.classList.remove("selecionada");
    artigoSelecionado.setAttribute("aria-pressed", "false");
  }
  artigoSelecionado = null;
  desenharDetalhe(null);
}

function desenharDetalhe(carta) {
  detalheCompra.replaceChildren();

  if (!carta) {
    detalheCompra.classList.remove("com-ativo");
    return;
  }

  detalheCompra.classList.add("com-ativo");

  const saldo = document.createElement("p");
  saldo.className = "saldo-compra";
  const saldoRotulo = document.createElement("span");
  saldoRotulo.textContent = "Valor disponível";
  const saldoValor = document.createElement("strong");
  saldoValor.textContent = formatarReais(obterJogador().dinheiro);
  saldo.append(saldoRotulo, saldoValor);

  const grande = document.createElement("article");
  grande.className = "carta-ativo carta-grande";
  grande.append(...criarConteudoDaCarta(carta));

  const quantidade = document.createElement("input");
  quantidade.type = "number";
  quantidade.min = "1";
  quantidade.step = "1";
  quantidade.value = "1";
  quantidade.className = "campo-quantidade";
  quantidade.setAttribute("aria-label", `Quantidade de ${carta.nome}`);

  const rotulo = document.createElement("label");
  rotulo.className = "carta-quantidade";
  rotulo.append("Quantidade", quantidade);

  const campoValor = document.createElement("input");
  campoValor.type = "number";
  campoValor.min = "0";
  campoValor.step = "0.01";
  campoValor.className = "campo-quantidade campo-valor";
  campoValor.setAttribute("aria-label", `Valor de ${carta.nome}`);

  const rotuloValor = document.createElement("label");
  rotuloValor.className = "carta-quantidade";
  rotuloValor.append("Valor", campoValor);

  const cotacaoAtual = document.createElement("p");
  cotacaoAtual.className = "cotacao-atual";
  cotacaoAtual.textContent = `Cotação ${formatarReais(cotacaoDe(carta))}`;

  let ajustando = false;

  const escreverValor = (unidades) => {
    campoValor.value = centavos(unidades * cotacaoDe(carta)).toFixed(2);
  };

  const unidadesPeloValor = () => {
    const preco = cotacaoDe(carta);
    const total = Number(campoValor.value);
    if (!(preco > 0) || !(total > 0)) {
      return null;
    }
    const centavosTotal = Math.round(total * 100);
    const centavosPreco = Math.round(preco * 100);
    return limitarCompra(carta, centavosTotal / centavosPreco);
  };

  quantidade.addEventListener("input", () => {
    if (ajustando) {
      return;
    }
    const bruto = Number(quantidade.value);
    if (!Number.isFinite(bruto) || bruto < 0) {
      return;
    }
    ajustando = true;
    const unidades = limitarCompra(carta, bruto);
    quantidade.value = String(unidades);
    escreverValor(unidades);
    ajustando = false;
  });

  campoValor.addEventListener("input", () => {
    if (ajustando) {
      return;
    }
    const unidades = unidadesPeloValor();
    if (unidades == null) {
      return;
    }
    ajustando = true;
    quantidade.value = String(unidades);
    ajustando = false;
  });

  campoValor.addEventListener("change", () => {
    const unidades = unidadesPeloValor();
    if (unidades == null) {
      return;
    }
    ajustando = true;
    quantidade.value = String(unidades);
    escreverValor(unidades);
    ajustando = false;
  });

  escreverValor(1);

  const comprar = criarBotao("botao-comprar", "Comprar");
  const aviso = document.createElement("p");
  aviso.className = "aviso-compra";

  comprar.addEventListener("click", () => {
    const unidades = limitarCompra(carta, Number(quantidade.value) || 0);
    const preco = cotacaoDe(carta);
    quantidade.value = String(unidades);
    escreverValor(unidades);
    if (unidades < 1 || !gastar(centavos(preco * unidades))) {
      aviso.textContent = "Dinheiro insuficiente.";
      return;
    }

    adicionarNaCarteira(carta, unidades, preco);
    const custo = centavos(preco * unidades);
    const proxima = Math.min(1, maximoCompravel(carta));
    quantidade.value = String(proxima);
    escreverValor(proxima);
    cotacaoAtual.textContent = `Cotação ${formatarReais(cotacaoDe(carta))}`;
    aviso.textContent = unidades === 1
      ? `1 unidade comprada por ${formatarReais(custo)}.`
      : `${unidades} unidades compradas por ${formatarReais(custo)}.`;
  });

  const acoes = document.createElement("div");
  acoes.className = "detalhe-acoes";
  acoes.append(cotacaoAtual, rotulo, rotuloValor, comprar, aviso);
  detalheCompra.append(saldo, grande, acoes);
}

function cotacaoDe(carta) {
  return precoDe(carta.id) ?? carta.precoBase;
}

function maximoCompravel(carta) {
  const centavosPreco = Math.round(cotacaoDe(carta) * 100);
  const centavosDinheiro = Math.round(obterJogador().dinheiro * 100);
  if (centavosPreco <= 0) {
    return 0;
  }
  return Math.floor(centavosDinheiro / centavosPreco);
}

function limitarCompra(carta, unidades) {
  return Math.min(maximoCompravel(carta), Math.max(0, Math.floor(unidades)));
}

async function desenharCarteira(destino) {
  const baralhos = await garantirBaralhos();
  const itens = listarCarteira();
  const selecionado = idVenda;
  destino.replaceChildren();
  artigoVenda = null;

  if (itens.length === 0) {
    idVenda = null;
    limparVenda();
    const vazio = document.createElement("p");
    vazio.className = "carteira-vazia";
    vazio.textContent = "Nenhum ativo comprado ainda.";
    destino.append(vazio);
    return;
  }

  let aindaExiste = false;
  for (const baralho of baralhos) {
    const doGrupo = itens.filter((item) => baralho.cartas.some((carta) => carta.id === item.id));
    if (doGrupo.length === 0) {
      continue;
    }
    if (doGrupo.some((item) => item.id === selecionado)) {
      aindaExiste = true;
    }
    destino.appendChild(criarFileiraDaCarteira(baralho, doGrupo));
  }

  if (!aindaExiste) {
    idVenda = null;
    limparVenda();
    return;
  }

  const artigo = [...destino.querySelectorAll(".carta-ativo")].find((item) => item.posicao?.id === selecionado);
  if (artigo) {
    selecionarVenda(artigo);
  }
}

function criarFileiraDaCarteira(baralho, itens) {
  const secao = document.createElement("section");
  secao.className = "fileira";

  const titulo = document.createElement("h2");
  titulo.className = "fileira-titulo";
  titulo.textContent = baralho.nome;

  const lista = document.createElement("div");
  lista.className = "fileira-cartas";

  for (const item of itens) {
    const carta = baralho.cartas.find((atual) => atual.id === item.id);
    if (!carta) {
      continue;
    }
    lista.appendChild(criarCarta(carta, selecionarVenda, item));
  }

  secao.append(titulo, lista);
  return secao;
}

function selecionarVenda(artigo) {
  if (artigoVenda === artigo) {
    limparVenda();
    return;
  }

  if (artigoVenda) {
    artigoVenda.classList.remove("selecionada");
    artigoVenda.setAttribute("aria-pressed", "false");
  }

  artigoVenda = artigo;
  idVenda = artigo.posicao.id;
  artigo.classList.add("selecionada");
  artigo.setAttribute("aria-pressed", "true");
  desenharDetalheVenda(artigo.posicao);
}

function limparVenda() {
  if (artigoVenda) {
    artigoVenda.classList.remove("selecionada");
    artigoVenda.setAttribute("aria-pressed", "false");
  }
  artigoVenda = null;
  idVenda = null;
  desenharDetalheVenda(null);
}

function desenharDetalheVenda(posicao) {
  detalheVenda.replaceChildren();

  if (!posicao) {
    detalheVenda.classList.remove("com-ativo");
    return;
  }

  const carta = artigoVenda?.carta ?? posicao;
  detalheVenda.classList.add("com-ativo");

  const resumo = document.createElement("p");
  resumo.className = "saldo-compra";
  const resumoRotulo = document.createElement("span");
  resumoRotulo.textContent = "Na carteira";
  const resumoValor = document.createElement("strong");
  resumo.append(resumoRotulo, resumoValor);

  const grande = document.createElement("article");
  grande.className = "carta-ativo carta-grande";
  grande.carta = carta;
  grande.posicao = posicao;
  grande.append(...criarConteudoDaCarta(carta, posicao));

  const quantidade = document.createElement("input");
  quantidade.type = "number";
  quantidade.min = "1";
  quantidade.max = String(posicao.quantidade);
  quantidade.step = "1";
  quantidade.value = "1";
  quantidade.className = "campo-quantidade";
  quantidade.setAttribute("aria-label", `Quantidade de ${posicao.nome} para vender`);

  const rotulo = document.createElement("label");
  rotulo.className = "carta-quantidade";
  rotulo.append("Quantidade", quantidade);

  const campoValor = document.createElement("input");
  campoValor.type = "number";
  campoValor.min = "0";
  campoValor.step = "0.01";
  campoValor.className = "campo-quantidade campo-valor";
  campoValor.setAttribute("aria-label", `Valor de ${posicao.nome} para vender`);

  const rotuloValor = document.createElement("label");
  rotuloValor.className = "carta-quantidade";
  rotuloValor.append("Valor", campoValor);

  const vender = criarBotao("botao-vender", "Vender");
  const aviso = document.createElement("p");
  aviso.className = "aviso-venda";

  const escreverResumo = () => {
    const quantidadeDisponivel = posicao.quantidade;
    resumoValor.textContent = quantidadeDisponivel === 1
      ? "1 disponível para venda"
      : `${quantidadeDisponivel} disponíveis para venda`;
  };

  const escreverValor = (unidades) => {
    campoValor.value = centavos(unidades * cotacaoDe(carta)).toFixed(2);
  };

  const limitar = (unidades) => Math.min(posicao.quantidade, Math.max(1, Math.floor(unidades)));

  let ajustando = false;

  const unidadesPeloValor = () => {
    const preco = cotacaoDe(carta);
    const total = Number(campoValor.value);
    if (!(preco > 0) || !(total > 0)) {
      return null;
    }
    const centavosTotal = Math.round(total * 100);
    const centavosPreco = Math.round(preco * 100);
    return limitar(centavosTotal / centavosPreco);
  };

  quantidade.addEventListener("input", () => {
    if (ajustando) {
      return;
    }
    const bruto = Number(quantidade.value);
    if (!Number.isFinite(bruto) || bruto < 1) {
      return;
    }
    ajustando = true;
    const unidades = limitar(bruto);
    quantidade.value = String(unidades);
    escreverValor(unidades);
    ajustando = false;
  });

  campoValor.addEventListener("input", () => {
    if (ajustando) {
      return;
    }
    const unidades = unidadesPeloValor();
    if (unidades == null) {
      return;
    }
    ajustando = true;
    quantidade.value = String(unidades);
    ajustando = false;
  });

  campoValor.addEventListener("change", () => {
    const unidades = unidadesPeloValor();
    if (unidades == null) {
      return;
    }
    ajustando = true;
    quantidade.value = String(unidades);
    escreverValor(unidades);
    ajustando = false;
  });

  escreverResumo();
  escreverValor(1);

  const liberada = (posicao.voltaCompra ?? 1) + (posicao.bloqueioVendaRodadas ?? 0);
  if (obterJogador().volta < liberada) {
    quantidade.disabled = true;
    campoValor.disabled = true;
    vender.disabled = true;
    aviso.textContent = `Pode vender a partir da volta ${liberada}.`;
  }

  vender.addEventListener("click", () => {
    const unidades = limitar(Number(quantidade.value) || 1);
    const preco = cotacaoDe(carta);
    quantidade.value = String(unidades);
    escreverValor(unidades);
    if (!venderDaCarteira(posicao.id, unidades)) {
      aviso.textContent = "Não foi possível vender essa quantidade.";
      return;
    }

    receber(centavos(preco * unidades));
    desenharCarteira(destinoCarteira);
  });

  const acoes = document.createElement("div");
  acoes.className = "detalhe-acoes";
  acoes.append(rotulo, rotuloValor, vender, aviso);
  detalheVenda.append(resumo, grande, acoes);
}

function atualizarValoresDaCarteira() {
  const artigos = [
    ...destinoCarteira.querySelectorAll(".carta-ativo"),
    ...detalheVenda.querySelectorAll(".carta-ativo"),
  ];

  for (const artigo of artigos) {
    const posicao = artigo.posicao;
    if (!posicao) {
      continue;
    }
    const cotacao = precoDe(posicao.id) ?? posicao.precoUnitario;
    const linhaValor = artigo.querySelector("[data-campo='valor-posicao']");
    if (linhaValor) {
      linhaValor.textContent = formatarReais(centavos(cotacao * posicao.quantidade));
    }
  }

  const resumo = detalheVenda.querySelector(".saldo-compra strong");
  const campoValor = detalheVenda.querySelector(".campo-valor");
  if (!artigoVenda) {
    return;
  }

  const carta = artigoVenda.carta;
  const cotacao = cotacaoDe(carta);
  if (resumo) {
    const quantidadeDisponivel = artigoVenda.posicao.quantidade;
    resumo.textContent = quantidadeDisponivel === 1
      ? "1 disponível para venda"
      : `${quantidadeDisponivel} disponíveis para venda`;
  }
  if (campoValor && document.activeElement !== campoValor) {
    const quantidade = detalheVenda.querySelector(".campo-quantidade");
    const unidades = Math.min(
      artigoVenda.posicao.quantidade,
      Math.max(1, Math.floor(Number(quantidade.value) || 1)),
    );
    campoValor.value = centavos(unidades * cotacao).toFixed(2);
  }
}

function criarLinha(rotulo, valor, campo) {
  const linha = document.createElement("div");
  const termo = document.createElement("dt");
  termo.textContent = rotulo;
  const descricao = document.createElement("dd");
  descricao.textContent = valor;
  if (campo) {
    descricao.dataset.campo = campo;
  }
  linha.append(termo, descricao);
  return linha;
}

function valorDoCampo(carta, campo) {
  if (campo === "retornoPercentualAoMes") {
    return textoDoPercentual(carta);
  }
  return formatarValor(campo, carta[campo]);
}

function atualizarPercentuais() {
  for (const linha of document.querySelectorAll("[data-campo='retornoPercentualAoMes']")) {
    const artigo = linha.closest(".carta-ativo");
    if (!artigo?.carta) {
      continue;
    }
    linha.textContent = textoDoPercentual(artigo.carta);
  }
}

function textoDoPercentual(carta) {
  const percentual = percentualDe(carta.id);
  if (percentual == null) {
    const base = Number(carta.retornoPercentualAoMes) || 0;
    if (base === 0) {
      return "Não possui";
    }
    return formatarPercentual(base);
  }
  return formatarPercentual(percentual);
}

function formatarPercentual(valor) {
  return `${Number(valor || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatarValor(campo, valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "Variável";
  }

  if (campo === "precoBase") {
    return `R$ ${valor}`;
  }

  return String(valor);
}
