const CUSTOS_DE_VIDA = new Set([2, 6, 11, 15, 20, 24, 29, 33, 35, 36]);

const COLUNAS = 14;
const LINHAS = 6;
const INTERVALO_DE_MESES = 3;
const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function mesDaCasa(indice) {
  if ((indice - 1) % INTERVALO_DE_MESES !== 0) {
    return null;
  }

  return MESES[(indice - 1) / INTERVALO_DE_MESES] ?? null;
}

export const TOTAL_DE_CASAS = 2 * (COLUNAS + LINHAS - 2);

export function criarTabuleiro(elementoPai) {
  const tabuleiro = document.createElement("section");
  tabuleiro.className = "tabuleiro";
  tabuleiro.setAttribute("aria-label", "Tabuleiro");
  tabuleiro.style.setProperty("--colunas", String(COLUNAS));
  tabuleiro.style.setProperty("--linhas", String(LINHAS));

  for (const casa of calcularCasas(COLUNAS, LINHAS)) {
    tabuleiro.appendChild(criarCasa(casa));
  }

  tabuleiro.appendChild(criarCentro());
  elementoPai.appendChild(tabuleiro);
  return tabuleiro;
}

export function atualizarContadorDeVoltas(tabuleiro, volta, total) {
  tabuleiro.querySelector(".centro-volta").textContent = `Volta ${volta} de ${total}`;
}

export function ehImprevisto(indice) {
  return CUSTOS_DE_VIDA.has(indice);
}

export function obterCasa(tabuleiro, indice) {
  return tabuleiro.querySelector(`[data-indice="${indice}"]`);
}

function calcularCasas(colunas, linhas) {
  const casas = [];
  let indice = 1;

  const adicionar = (coluna, linha) => {
    casas.push({ indice, coluna, linha });
    indice += 1;
  };

  for (let coluna = 1; coluna <= colunas; coluna += 1) {
    adicionar(coluna, linhas);
  }

  for (let linha = linhas - 1; linha >= 1; linha -= 1) {
    adicionar(colunas, linha);
  }

  for (let coluna = colunas - 1; coluna >= 1; coluna -= 1) {
    adicionar(coluna, 1);
  }

  for (let linha = 2; linha <= linhas - 1; linha += 1) {
    adicionar(1, linha);
  }

  return casas;
}

function criarCasa(casa) {
  const elemento = document.createElement("div");
  elemento.className = "casa";
  elemento.style.gridColumn = String(casa.coluna);
  elemento.style.gridRow = String(casa.linha);
  elemento.dataset.indice = String(casa.indice);

  const mes = mesDaCasa(casa.indice);
  if (mes) {
    elemento.classList.add("casa-mes");
    const nome = document.createElement("span");
    nome.className = "casa-nome";
    nome.textContent = mes;
    elemento.appendChild(nome);
  }

  if (casa.indice === 1) {
    elemento.classList.add("casa-inicio");
    elemento.title = "Janeiro";
    elemento.setAttribute("aria-label", "Casa 1, Janeiro");
  }

  if (CUSTOS_DE_VIDA.has(casa.indice)) {
    elemento.classList.add("casa-custo");
    const nome = document.createElement("span");
    nome.className = "casa-nome";
    nome.textContent = "Imprevisto";
    elemento.appendChild(nome);
    elemento.setAttribute("aria-label", `Casa ${casa.indice}, Imprevisto`);
  }

  return elemento;
}

function criarCentro() {
  const centro = document.createElement("div");
  centro.className = "centro";
  centro.innerHTML = `
    <p class="centro-titulo">Momentum</p>
    <p class="centro-volta">Volta 1 de 10</p>
    <p class="centro-texto">cada volta é um ano</p>
  `;
  return centro;
}
