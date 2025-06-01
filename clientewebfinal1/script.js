// =======================
// VALIDACIONES
// =======================

// 1. Campo vacío
function isEmpty(value) {
  return !value.trim();
}

// 2. Longitud mínima
function hasMinLength(value, length) {
  return value.trim().length >= length;
}

// 3. Usuario válido (solo letras, números, guiones bajos)
function isValidUsername(username) {
  return /^[a-zA-Z0-9_]+$/.test(username);
}

// 4. Contraseña segura (mínimo 6 caracteres, 1 letra y 1 número)
function isSecurePassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);
}

// 5. Fecha futura
function isFutureDate(dateString) {
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate > today;
}

// 6. Mínimo 2 opciones válidas
function hasMinimumOptions(options) {
  return options.filter(opt => opt.trim() !== "").length >= 2;
}

// =======================
// LÓGICA DE LA APP
// =======================

let users = JSON.parse(localStorage.getItem('users') || '[]'); 
let polls = JSON.parse(localStorage.getItem('polls') || '[]');
let votes = JSON.parse(localStorage.getItem('votes') || '{}');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

function saveData() {
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('polls', JSON.stringify(polls));
  localStorage.setItem('votes', JSON.stringify(votes));
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

function register() {
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;
  const faculty = document.getElementById('register-faculty').value;

  if (isEmpty(username) || isEmpty(password)) {
    alert("Usuario y contraseña son obligatorios");
    return;
  }

  if (!isValidUsername(username)) {
    alert("Nombre de usuario inválido. Solo letras, números y guiones bajos.");
    return;
  }

  if (!isSecurePassword(password)) {
    alert("Contraseña insegura. Mínimo 6 caracteres, al menos una letra y un número.");
    return;
  }

  if (users.some(u => u.username === username)) {
    alert("El usuario ya existe");
    return;
  }

  users.push({ username, password, role, faculty });
  saveData();
  alert("Registro exitoso. Inicia sesión.");
  showScreen('login-screen');
}

function login() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    alert("Credenciales incorrectas");
    return;
  }

  currentUser = user;
  saveData();
  if (user.role === 'profesor') {
    showProfesorView();
  } else {
    showEstudianteView();
  }
}

function logout() {
  currentUser = null;
  saveData();
  showScreen('login-screen');
}

function addPoll() {
  const title = document.getElementById('poll-title').value;
  const options = document.getElementById('poll-options').value.split(',').map(s => s.trim());
  const deadline = document.getElementById('poll-deadline').value;

  if (isEmpty(title) || isEmpty(deadline)) {
    alert("Completa todos los campos");
    return;
  }

  if (!hasMinimumOptions(options)) {
    alert("Debes ingresar al menos 2 opciones válidas separadas por coma");
    return;
  }

  if (!isFutureDate(deadline)) {
    alert("La fecha límite debe ser en el futuro");
    return;
  }

  const poll = {
    title,
    options,
    deadline,
    faculty: currentUser.faculty,
    results: options.reduce((obj, opt) => { obj[opt] = 0; return obj; }, {})
  };

  polls.push(poll);
  saveData();
  updatePollList();
}

function showProfesorView() {
  showScreen('profesor-screen');
  document.getElementById('profesor-info').textContent = `Profesor: ${currentUser.username} | Facultad: ${currentUser.faculty}`;
  updatePollList();
}

function updatePollList() {
  const list = document.getElementById('prof-poll-list');
  list.innerHTML = '';

  polls
    .filter(p => p.faculty === currentUser.faculty)
    .forEach(poll => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${poll.title}</strong> (hasta ${poll.deadline})<br/>
        ${Object.entries(poll.results).map(([opt, count]) => `${opt}: ${count} votos`).join('<br/>')}`;
      list.appendChild(li);
    });
}

function showEstudianteView() {
  showScreen('estudiante-screen');
  document.getElementById('estudiante-info').textContent = `Estudiante: ${currentUser.username} | Facultad: ${currentUser.faculty}`;

  const pendingList = document.getElementById('student-pending-list');
  const doneList = document.getElementById('student-done-list');
  pendingList.innerHTML = '';
  doneList.innerHTML = '';

  const userVotes = votes[currentUser.username] || [];

  polls
    .filter(p => p.faculty === currentUser.faculty)
    .forEach((poll, index) => {
      const li = document.createElement('li');
      if (userVotes.includes(index)) {
        li.innerHTML = `<strong>${poll.title}</strong> - Ya votaste`;
        doneList.appendChild(li);
      } else {
        li.innerHTML = `
          <strong>${poll.title}</strong> (hasta ${poll.deadline})<br/>
          ${poll.options.map(opt => `<label><input type="radio" name="poll-${index}" value="${opt}"/> ${opt}</label>`).join('<br/>')}
          <br/><button onclick="submitVote(${index})">Votar</button>
        `;
        pendingList.appendChild(li);
      }
    });
}

function submitVote(index) {
  const selected = document.querySelector(`input[name="poll-${index}"]:checked`);
  if (!selected) {
    alert("Selecciona una opción");
    return;
  }

  const option = selected.value;
  polls[index].results[option]++;
  votes[currentUser.username] = votes[currentUser.username] || [];
  votes[currentUser.username].push(index);

  saveData();
  alert("Gracias por tu voto.");
  showEstudianteView();
}

// Mostrar pantalla inicial
if (currentUser) {
  currentUser.role === 'profesor' ? showProfesorView() : showEstudianteView();
} else {
  showScreen('login-screen');
}
