const API_URL = window.API_URL || 'http://localhost:3000/api';
const AUTH_URL = window.API_URL ? `${window.API_URL}/usuarios` : 'http://localhost:3000/api/usuarios';

let currentUser = null;
let clerk = null;

// Inicializar Clerk (con CDN + data-clerk-publishable-key, NO usar "new Clerk()")
async function initClerk() {
  try {
    if (!window.Clerk) {
      throw new Error('El script de Clerk no se cargó. Revisa la consola de red.');
    }

    clerk = window.Clerk;
    await clerk.load();

    console.log('Clerk inicializado correctamente');
    
    // Verificar si hay sesión activa
    if (clerk.user) {
      console.log('Usuario autenticado:', clerk.user);
      currentUser = {
        email: clerk.user.primaryEmailAddress?.emailAddress,
        nombre: clerk.user.firstName || clerk.user.primaryEmailAddress?.emailAddress,
        userId: clerk.user.id
      };
      showMainScreen();
    } else {
      console.log('No hay usuario, mostrando login');
      // Mostrar formulario de autenticación de Clerk
      clerk.mountSignIn(document.getElementById('clerk-auth'), {
        appearance: {
          elements: {
            card: {
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              borderRadius: '0.5rem'
            }
          }
        }
      });
      
      // Escuchar cambios de autenticación
      clerk.addListener(() => {
        console.log('Estado de autenticación cambiado');
        if (clerk.user) {
          currentUser = {
            email: clerk.user.primaryEmailAddress?.emailAddress,
            nombre: clerk.user.firstName || clerk.user.primaryEmailAddress?.emailAddress,
            userId: clerk.user.id
          };
          showMainScreen();
        }
      });
    }
  } catch (error) {
    console.error('Error al inicializar Clerk:', error);
    document.getElementById('clerk-auth').innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
  }
}

// Iniciar cuando el DOM y el script de Clerk estén listos
window.addEventListener('load', () => {
  initClerk();
});

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
async function logout() {
  if (clerk) {
    await clerk.signOut();
  }
  currentUser = null;
  showAuthScreen();
  if (clerk) {
    clerk.mountSignIn(document.getElementById('clerk-auth'), {
      appearance: {
        elements: {
          card: {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            borderRadius: '0.5rem'
          }
        }
      }
    });
  }
}

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
    const token = await clerk.session?.getToken();
    const response = await fetch(`${API_URL}/eventos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
    const token = await clerk.session?.getToken();
    const response = await fetch(`${API_URL}/eventos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
    const token = await clerk.session?.getToken();
    const response = await fetch(`${API_URL}/eventos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
