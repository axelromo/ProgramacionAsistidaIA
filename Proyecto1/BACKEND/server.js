const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken } = require('@clerk/backend');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Permitir todos los orígenes para desarrollo
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Middleware de autenticación de Clerk (manual)
const authenticateClerk = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'No autorizado - Token missing' });
    }
    
    const token = authHeader.substring(7);
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    req.auth = { userId: payload.sub };
    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    return res.status(401).json({ mensaje: 'No autorizado - Token invalid' });
  }
};

// Conexión a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Verificar conexión
supabase.from('eventos').select('count')
  .then(() => console.log('Conectado a Supabase'))
  .catch(err => console.error('Error conectando a Supabase:', err));

//mi endpoint de prueba
app.get('/api/saludo',(req, res)=>{
  res.json('Hola Mundo');
});

// GET - Obtener todos los eventos (protegido)
app.get('/api/eventos', authenticateClerk, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener eventos' });
  }
});

// GET - Obtener un evento por ID
app.get('/api/eventos/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener evento' });
  }
});

// POST - Crear nuevo evento (protegido)
app.post('/api/eventos', authenticateClerk, async (req, res) => {
  try {
    const { titulo, fecha, hora, descripcion } = req.body;
    const userId = req.auth.userId;
    
    if (!titulo || !fecha) {
      return res.status(400).json({ mensaje: 'Título y fecha son requeridos' });
    }
    
    const { data, error } = await supabase
      .from('eventos')
      .insert({
        titulo,
        fecha,
        hora: hora || '',
        descripcion: descripcion || '',
        user_id: userId
      })
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear evento' });
  }
});

// PUT - Actualizar evento
app.put('/api/eventos/:id', async (req, res) => {
  try {
    const { titulo, fecha, hora, descripcion } = req.body;
    
    const { data, error } = await supabase
      .from('eventos')
      .update({
        titulo,
        fecha,
        hora,
        descripcion
      })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ mensaje: 'Evento no encontrado' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar evento' });
  }
});

// DELETE - Eliminar evento (protegido)
app.delete('/api/eventos/:id', authenticateClerk, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);
    
    if (error) throw error;
    res.json({ mensaje: 'Evento eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar evento' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
