const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// POST - Registrar nuevo usuario
app.post('/api/usuarios/registro', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }
    
    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear usuario
    const { data, error } = await supabase
      .from('usuarios')
      .insert({
        email,
        password: hashedPassword,
        nombre: nombre || ''
      })
      .select('id, email, nombre, created_at')
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }
});

// POST - Login de usuario
app.post('/api/usuarios/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ mensaje: 'Email y contraseña son requeridos' });
    }
    
    // Buscar usuario por email
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }
    
    // Retornar datos del usuario (sin contraseña)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
});

// GET - Obtener todos los eventos
app.get('/api/eventos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
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

// POST - Crear nuevo evento
app.post('/api/eventos', async (req, res) => {
  try {
    const { titulo, fecha, hora, descripcion } = req.body;
    
    if (!titulo || !fecha) {
      return res.status(400).json({ mensaje: 'Título y fecha son requeridos' });
    }
    
    const { data, error } = await supabase
      .from('eventos')
      .insert({
        titulo,
        fecha,
        hora: hora || '',
        descripcion: descripcion || ''
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

// DELETE - Eliminar evento
app.delete('/api/eventos/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', req.params.id);
    
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
