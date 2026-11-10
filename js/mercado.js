import { listarCarteira } from "./carteira.js?v=3";
import { centavos } from "./jogador.js?v=3";

const ARQUIVOS = [
  "dados/cartas/investimentos/acoes.json?v=5",
  "dados/cartas/investimentos/criptoativos.json?v=4",
  "dados/cartas/investimentos/fiis.json?v=6",
  "dados/cartas/investimentos/renda-fixa.json?v=5",
];

const VOLATILIDADE = {
  "Muito Baixo": 0.004,
  Baixo: 0.02,
  Médio: 0.04,
  "Médio-Alto": 0.055,
  Alto: 0.08,
  "Muito Alto": 0.11,
};

const FICHAS = {
  "acao-mineracao": ["mineracao", "acao", 0.001, "semestral"],
  "acao-petroleo": ["petroleo", "acao", 0.001, "trimestral"],
  "acao-banco": ["banco", "acao", 0.001, "mensal"],
  "acao-bebidas": ["bebidas", "acao", 0.001, "anual"],
  "acao-metalurgica": ["industria", "acao", 0.001, "trimestral"],
  "acao-varejo": ["varejo", "acao", 0.0012, null],
  "acao-aeroespacial": ["aeroespacial", "acao", 0.0012, null],
  "cripto-btc": ["btc", "cripto", 0.0015, null],
  "cripto-eth": ["cripto-rede", "cripto", 0.0015, null],
  "cripto-sol": ["cripto-rede", "cripto", 0.0015, null],
  "cripto-link": ["cripto-rede", "cripto", 0.0015, null],
  "cripto-uni": ["cripto-rede", "cripto", 0.0015, null],
  "cripto-doge": ["cripto-meme", "cripto", 0.0015, null],
  "cripto-shib": ["cripto-meme", "cripto", 0.0015, null],
  "fii-logistica": ["logistica", "fii", 0, null],
  "fii-shoppings": ["shopping", "fii", 0, null],
  "fii-predios": ["predios", "fii", 0, null],
  "fii-hoteis": ["hoteis", "fii", 0, null],
  "fii-agro": ["agro", "fii", 0, null],
  "fii-papel": ["papel", "fii", 0, null],
  "fii-papel-high-yield": ["papel", "fii", 0, null],
  "renda-poupanca": ["renda-flutuante", "renda-flutuante", 0, null],
  "renda-cdb-diario": ["renda-flutuante", "renda-flutuante", 0, null],
  "renda-tesouro-selic": ["renda-flutuante", "renda-flutuante", 0, null],
  "renda-cdb-1-ano": ["renda-prefixada", "renda-prefixada", 0, null],
  "renda-cdb-2-anos": ["renda-prefixada", "renda-prefixada", 0, null],
  "renda-cdb-3-anos": ["renda-prefixada", "renda-prefixada", 0, null],
  "renda-cdb-5-anos": ["renda-prefixada", "renda-prefixada", 0, null],
};

const DIVIDENDO = {
  mensal: { intervalo: 1 },
  trimestral: { intervalo: 3 },
  semestral: { intervalo: 6 },
  anual: { intervalo: 12 },
};

const BETA = { acao: 1, cripto: 1.35, fii: 0.55 };

const FAIXA_DO_RETORNO = {
  "Muito Baixo": [0.97, 1.03],
  Baixo: [0.9, 1.1],
  Médio: [0.82, 1.18],
  "Médio-Alto": [0.75, 1.25],
  Alto: [0.68, 1.38],
  "Muito Alto": [0.55, 1.55],
};

let ativos = new Map();
let cenarios = [];
let exibidas = new Set();
let mes = 0;
let choque = null;
let pronto = false;
let aoAtualizar = () => {};

export function observarMercado(ouvinte) {
  aoAtualizar = ouvinte;
}

export async function prepararMercado() {
  const baralhos = await Promise.all(ARQUIVOS.map(carregarJson));
  let arquivoCenarios = { cenarios: [] };
  try {
    arquivoCenarios = await carregarJson("dados/cenarios.json?v=15");
  } catch {
    arquivoCenarios = { cenarios: [] };
  }

  cenarios = arquivoCenarios.cenarios ?? [];
  ativos = new Map();
  for (const baralho of baralhos) {
    for (const carta of baralho.cartas) {
      ativos.set(carta.id, criarAtivo(carta, baralho.id));
    }
  }
  pronto = true;
}

export function reiniciarMercado() {
  mes = 0;
  choque = null;
  exibidas = new Set();
  for (const ativo of ativos.values()) {
    ativo.preco = ativo.carta.precoBase;
    ativo.percentualMes = taxaInicial(ativo);
  }
  aoAtualizar();
}

export function precoDe(id) {
  return ativos.get(id)?.preco ?? null;
}

export function percentualDe(id) {
  const ativo = ativos.get(id);
  if (!ativo || !geraDividendo(ativo)) {
    return null;
  }
  return ativo.percentualMes;
}

const CENARIOS_POR_PARTIDA = 4;

export function abrirCenarioDaPartida() {
  if (choque || !pronto) {
    return null;
  }
  return sortearCenario();
}

const NOMES = {
  mineracao: "mineração",
  petroleo: "petróleo",
  banco: "bancos",
  bebidas: "bebidas",
  industria: "indústria",
  varejo: "varejo",
  aeroespacial: "aeroespacial",
  acao: "ações",
  btc: "bitcoin",
  "cripto-rede": "redes de cripto",
  "cripto-meme": "moedas meme",
  cripto: "criptomoedas",
  logistica: "galpões logísticos",
  shopping: "shoppings",
  predios: "prédios comerciais",
  hoteis: "hotéis",
  agro: "agro",
  papel: "fundos de papel",
  fii: "fundos imobiliários",
};

export function resumoDaNoticia(noticia) {
  const entradas = Object.entries(noticia.preco ?? {});
  return {
    sobem: entradas.filter(([, valor]) => valor >= 0.02).map(([tag]) => NOMES[tag] ?? tag),
    descem: entradas.filter(([, valor]) => valor <= -0.02).map(([tag]) => NOMES[tag] ?? tag),
  };
}

export function fecharMes() {
  if (!pronto) {
    return { proventos: 0, noticia: null };
  }

  mes += 1;
  const humor = (Math.random() + Math.random() + Math.random() - 1.5) * 0.012;
  const vigente = choque;

  for (const ativo of ativos.values()) {
    if (ativo.grupo.startsWith("renda")) {
      ativo.preco = ativo.carta.precoBase;
    }
  }

  for (const ativo of ativos.values()) {
    if (ativo.grupo.startsWith("renda")) {
      continue;
    }
    ativo.preco = proximoPreco(ativo, humor, vigente);
    if (!geraDividendo(ativo)) {
      ativo.percentualMes = null;
    }
  }

  for (const ativo of ativos.values()) {
    if (geraDividendo(ativo)) {
      ativo.percentualMes = sortearPercentual(ativo);
    }
  }

  const proventos = centavos(somarProventos());

  if (vigente) {
    vigente.restante -= 1;
    if (vigente.restante <= 0) {
      choque = null;
    }
  }

  let noticia = null;
  if (!choque) {
    noticia = sortearCenario();
  }

  aoAtualizar();
  return { proventos, noticia };
}

function criarAtivo(carta, baralho) {
  const ficha = FICHAS[carta.id] ?? [carta.id, baralho, 0, null];
  const ativo = {
    carta,
    preco: carta.precoBase,
    etiqueta: ficha[0],
    grupo: ficha[1],
    deriva: ficha[2],
    dividendo: DIVIDENDO[ficha[3]] ?? null,
    classe: baralho,
    percentualMes: 0,
  };
  ativo.percentualMes = taxaInicial(ativo);
  return ativo;
}

function proximoPreco(ativo, humor, vigente) {
  const beta = BETA[ativo.grupo] ?? 1;
  const volatilidade = VOLATILIDADE[ativo.carta.risco] ?? 0.04;
  const ancora = ativo.carta.precoBase * (1 + ativo.deriva) ** mes;
  const elastico = ((ancora - ativo.preco) / ativo.preco) * 0.06;
  const proprio = (Math.random() + Math.random() + Math.random() - 1.5) * volatilidade;
  let variacao = humor * beta + proprio + elastico + vies(ativo, vigente?.noticia.preco);
  variacao = Math.max(-0.22, Math.min(0.25, variacao));

  const piso = ativo.carta.precoBase * 0.2;
  const teto = ativo.carta.precoBase * 5;
  const proximo = ativo.preco * (1 + variacao);
  return centavos(Math.min(teto, Math.max(piso, proximo)));
}

function somarProventos() {
  let total = 0;
  for (const posicao of listarCarteira()) {
    const ativo = ativos.get(posicao.id);
    if (!ativo) {
      continue;
    }
    total += provento(ativo, posicao.quantidade);
  }
  return total;
}

function provento(ativo, quantidade) {
  const vezes = vezesDoDividendo(ativo);
  if (vezes === 0) {
    return 0;
  }
  return quantidade * ativo.preco * (ativo.percentualMes / 100) * vezes;
}

function vezesDoDividendo(ativo) {
  if (!geraDividendo(ativo)) {
    return 0;
  }
  if (!ativo.dividendo) {
    return 1;
  }
  if (mes % ativo.dividendo.intervalo !== 0) {
    return 0;
  }
  return ativo.dividendo.intervalo;
}

function geraDividendo(ativo) {
  return ativo.grupo.startsWith("renda") || ativo.classe === "fiis" || ativo.dividendo !== null;
}

function taxaInicial(ativo) {
  if (!geraDividendo(ativo)) {
    return 0;
  }
  return Number(ativo.carta.retornoPercentualAoMes) || 0;
}

function sortearPercentual(ativo) {
  const base = Number(ativo.carta.retornoPercentualAoMes) || 0;
  const [minimo, maximo] = FAIXA_DO_RETORNO[ativo.carta.risco] ?? [0.9, 1.1];
  const fator = minimo + Math.random() * (maximo - minimo);
  return Math.round(base * fator * 100) / 100;
}

function vies(ativo, efeitos) {
  if (!efeitos) {
    return 0;
  }

  let total = efeitos[ativo.etiqueta] ?? 0;
  if (ativo.grupo !== ativo.etiqueta) {
    total += efeitos[ativo.grupo] ?? 0;
  }
  return total;
}

function sortearCenario() {
  if (exibidas.size >= CENARIOS_POR_PARTIDA) {
    return null;
  }

  const restantes = cenarios.filter((cenario) => !exibidas.has(cenario.id));
  if (restantes.length === 0) {
    return null;
  }

  const cenario = restantes[Math.floor(Math.random() * restantes.length)];
  exibidas.add(cenario.id);
  choque = { noticia: cenario, restante: cenario.duracaoMeses };
  return cenario;
}

async function carregarJson(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) {
    throw new Error(caminho);
  }
  return resposta.json();
}
