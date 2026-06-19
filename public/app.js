const API_URL = '/api';
const AUTH_URL = '/api/usuarios';

let currentUser = null;

// Verificar si hay usuario logueado al iniciar
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainScreen();
  } else {
    showAuthScreen();
  }
});

// Mostrar pantalla de login
function showLogin() {
  document.getElementById('loginForm').classList.remove('hidden');
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginTab').classList.remove('bg-gray-200', 'text-gray-700');
  document.getElementById('loginTab').classList.add('bg-blue-500', 'text-white');
  document.getElementById('registerTab').classList.remove('bg-green-500', 'text-white');
  document.getElementById('registerTab').classList.add('bg-gray-200', 'text-gray-700');
  document.getElementById('authError').classList.add('hidden');
}

// Mostrar pantalla de registro
function showRegister() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
  document.getElementById('loginTab').classList.remove('bg-blue-500', 'text-white');
  document.getElementById('loginTab').classList.add('bg-gray-200', 'text-gray-700');
  document.getElementById('registerTab').classList.remove('bg-gray-200', 'text-gray-700');
  document.getElementById('registerTab').classList.add('bg-green-500', 'text-white');
  document.getElementById('authError').classList.add('hidden');
}

// Mostrar pantalla de autenticación
function showAuthScreen() {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('mainScreen').classList.add('hidden');
}

// Mostrar pantalla principal
function showMainScreen() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainScreen').classList.remove('hidden');
  document.getElementById('userName').textContent = currentUser.nombre || currentUser.email;
  cargarEventos();
}

// Cerrar sesión
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  showAuthScreen();
  showLogin();
}

// Manejar registro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Formulario de registro enviado');
    
    const nombre = document.getElementById('registerNombre').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    console.log('Datos del registro:', { email, nombre });
    
    try {
      const response = await fetch(`${AUTH_URL}/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, nombre })
      });
      
      console.log('Respuesta del servidor:', response.status);
      
      const data = await response.json();
      console.log('Datos de respuesta:', data);
      
      if (response.ok) {
        alert('Registro exitoso. Por favor inicia sesión.');
        showLogin();
        document.getElementById('registerForm').reset();
      } else {
        document.getElementById('authError').textContent = data.mensaje || 'Error en el registro';
        document.getElementById('authError').classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('authError').textContent = 'Error de conexión con el servidor';
      document.getElementById('authError').classList.remove('hidden');
    }
  });
} else {
  console.error('No se encontró el formulario de registro');
}

// Manejar login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showMainScreen();
      document.getElementById('loginForm').reset();
    } else {
      document.getElementById('authError').textContent = data.mensaje || 'Error al iniciar sesión';
      document.getElementById('authError').classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('authError').textContent = 'Error de conexión con el servidor';
    document.getElementById('authError').classList.remove('hidden');
  }
});

// Formulario para agregar evento
document.getElementById('eventoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const evento = {
    titulo: document.getElementById('titulo').value,
    fecha: document.getElementById('fecha').value,
    hora: document.getElementById('hora').value,
    descripcion: document.getElementById('descripcion').value
  };
  
  try {
    const response = await fetch(`${API_URL}/eventos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(evento)
    });
    
    if (response.ok) {
      document.getElementById('eventoForm').reset();
      cargarEventos();
    } else {
      alert('Error al agregar evento');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión con el servidor');
  }
});

// Cargar todos los eventos
async function cargarEventos() {
  try {
    const response = await fetch(`${API_URL}/eventos`);
    const eventos = await response.json();
    mostrarEventos(eventos);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('eventosList').innerHTML = 
      '<p class="text-red-500 text-center">Error al cargar eventos</p>';
  }
}

// Mostrar eventos en el DOM
function mostrarEventos(eventos) {
  const lista = document.getElementById('eventosList');
  
  if (eventos.length === 0) {
    lista.innerHTML = '<p class="text-gray-500 text-center">No hay eventos</p>';
    return;
  }
  
  lista.innerHTML = eventos.map(evento => `
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-semibold text-gray-800">${evento.titulo}</h3>
          <p class="text-sm text-gray-600">
            📅 ${evento.fecha} ${evento.hora ? '🕐 ' + evento.hora : ''}
          </p>
          ${evento.descripcion ? `<p class="text-sm text-gray-500 mt-1">${evento.descripcion}</p>` : ''}
        </div>
        <div class="flex gap-2 ml-4">
          <button onclick="eliminarEvento('${evento._id}')" 
            class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Eliminar evento
async function eliminarEvento(id) {
  if (!confirm('¿Estás seguro de eliminar este evento?')) return;
  
  try {
    const response = await fetch(`${API_URL}/eventos/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      cargarEventos();
    } else {
      alert('Error al eliminar evento');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión con el servidor');
  }
}
