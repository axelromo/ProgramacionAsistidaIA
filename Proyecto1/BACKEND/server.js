const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Almacenamiento en memoria (sin base de datos)
let agenda = [];

//mi endpoint de prueba
app.get('/api/saludo',(req, res)=>{
  res.json('Hola Mundo');
});

// GET - Obtener todos los eventos
app.get('/api/eventos', (req, res) => {
  res.json(agenda);
});

// GET - Obtener un evento por ID
app.get('/api/eventos/:id', (req, res) => {
  const evento = agenda.find(e => e.id === req.params.id);
  if (!evento) {
    return res.status(404).json({ mensaje: 'Evento no encontrado' });
  }
  res.json(evento);
});

// POST - Crear nuevo evento
app.post('/api/eventos', (req, res) => {
  const { titulo, fecha, hora, descripcion } = req.body;
  
  if (!titulo || !fecha) {
    return res.status(400).json({ mensaje: 'Título y fecha son requeridos' });
  }
  
  const nuevoEvento = {
    id: Date.now().toString(),
    titulo,
    fecha,
    hora: hora || '',
    descripcion: descripcion || ''
  };
  
  agenda.push(nuevoEvento);
  res.status(201).json(nuevoEvento);
});

// PUT - Actualizar evento
app.put('/api/eventos/:id', (req, res) => {
  const index = agenda.findIndex(e => e.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ mensaje: 'Evento no encontrado' });
  }
  
  const { titulo, fecha, hora, descripcion } = req.body;
  
  agenda[index] = {
    ...agenda[index],
    titulo: titulo || agenda[index].titulo,
    fecha: fecha || agenda[index].fecha,
    hora: hora !== undefined ? hora : agenda[index].hora,
    descripcion: descripcion !== undefined ? descripcion : agenda[index].descripcion
  };
  
  res.json(agenda[index]);
});

// DELETE - Eliminar evento
app.delete('/api/eventos/:id', (req, res) => {
  const index = agenda.findIndex(e => e.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ mensaje: 'Evento no encontrado' });
  }
  
  agenda.splice(index, 1);
  res.json({ mensaje: 'Evento eliminado' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
