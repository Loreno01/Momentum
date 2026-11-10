let cartas = [];
let aumentoPorVolta = 0.06;
let monte = [];

export async function prepararImprevistos() {
  const resposta = await fetch("dados/cartas/imprevistos/eventos.json?v=3");
  if (!resposta.ok) {
    throw new Error("imprevistos");
  }

  const dados = await resposta.json();
  cartas = dados.cartas ?? [];
  aumentoPorVolta = dados.aumentoPorVolta ?? 0.06;
  reiniciarImprevistos();
}

export function reiniciarImprevistos() {
  monte = embaralhar(cartas);
}

function valorDoImprevisto(carta, volta) {
  const fator = (1 + aumentoPorVolta) ** (Math.max(1, volta) - 1);
  return Math.round(carta.valor * fator);
}

export function sortearImprevisto(volta) {
  if (monte.length === 0) {
    monte = embaralhar(cartas);
  }

  const carta = monte.pop();
  return {
    carta,
    valor: valorDoImprevisto(carta, volta),
  };
}

function embaralhar(lista) {
  const copia = [...lista];
  for (let indice = copia.length - 1; indice > 0; indice -= 1) {
    const outro = Math.floor(Math.random() * (indice + 1));
    [copia[indice], copia[outro]] = [copia[outro], copia[indice]];
  }
  return copia;
}
