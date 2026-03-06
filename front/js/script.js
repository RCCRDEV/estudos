function login(){

const email = document.getElementById("email").value
const senha = document.getElementById("senha").value

console.log(email, senha)

}



async function register() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!nome || !email || !senha) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  // Aqui, por enquanto, só um alert simples:
  alert(`Cadastro efetuado para ${nome} (${email})`);

  // Depois, conectaremos com o backend para salvar no banco.
}

async function register() {
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  if (!nome || !email || !senha) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const res = await fetch("http://localhost:3000/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });

  const data = await res.json();

  if (res.status === 201) {
    alert(data.message);
    window.location.href = "login.html";
  } else {
    alert(data.message);
  }
}