const PONTOS_POR_FACE = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function criarAreaDeDados(aoRolar, podeRolar = () => true) {
  const area = document.createElement("section");
  area.className = "area-dados";
  area.setAttribute("aria-label", "Dados");

  const bandeja = document.createElement("div");
  bandeja.className = "bandeja-dados";

  const primeiroDado = criarDado();
  const segundoDado = criarDado();
  mostrarValor(primeiroDado, 1);
  mostrarValor(segundoDado, 1);
  bandeja.append(primeiroDado, segundoDado);

  const resultado = document.createElement("p");
  resultado.className = "resultado-dados";
  resultado.setAttribute("aria-live", "polite");

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-rolar";
  botao.textContent = "Rolar dados";
  botao.addEventListener("click", () => {
    if (!podeRolar()) {
      return;
    }

    const rolagem = rolarDados();
    mostrarValor(primeiroDado, rolagem.primeiro);
    mostrarValor(segundoDado, rolagem.segundo);
    resultado.textContent = String(rolagem.total);
    aoRolar(rolagem);
  });

  area.append(bandeja, resultado, botao);
  return area;
}

function criarDado() {
  const dado = document.createElement("div");
  dado.className = "dado";
  dado.setAttribute("aria-label", "Dado");
  dado.appendChild(criarFace(0));
  return dado;
}

function mostrarValor(dado, valor) {
  dado.dataset.valor = String(valor);
  dado.setAttribute("aria-label", `Dado mostrando ${valor}`);
  dado.replaceChildren(criarFace(valor));
}

function criarFace(valor) {
  const face = document.createElement("div");
  face.className = "face-dado";
  const pontos = PONTOS_POR_FACE[valor] ?? [];

  for (let posicao = 0; posicao < 9; posicao += 1) {
    const celula = document.createElement("span");
    if (pontos.includes(posicao)) {
      celula.className = "pip";
    }
    face.appendChild(celula);
  }

  return face;
}

function rolarDados() {
  const primeiro = sortearFace();
  const segundo = sortearFace();
  return { primeiro, segundo, total: primeiro + segundo };
}

function sortearFace() {
  return Math.floor(Math.random() * 6) + 1;
}
