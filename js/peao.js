export function criarPeao() {
  const peao = document.createElement("div");
  peao.className = "peao";
  peao.setAttribute("aria-label", "Peão na casa 1");
  peao.innerHTML = `
    <span class="peao-dica" hidden></span>
    <svg viewBox="0 0 48 64" aria-hidden="true">
      <circle cx="24" cy="10" r="7" fill="none" stroke="#111111" stroke-width="3.5"/>
      <path
        d="M24 17 V38 M8 26 H40 M14 58 L24 38 L34 58"
        fill="none"
        stroke="#111111"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
  return peao;
}

export function atualizarDicaDoPeao(peao, mes) {
  const dica = peao.querySelector(".peao-dica");
  dica.textContent = mes ?? "";
  dica.hidden = !mes;
}
