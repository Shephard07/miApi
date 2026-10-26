require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// Importar Modelos para que Sequelize los registre
const Producto = require('./models/Producto');

const app = express();

// --- MIDDLEWARES ---
// Habilitar CORS para permitir peticiones desde el frontend (React)
app.use(cors());
// Parsear el body de las peticiones a JSON
app.use(express.json());

// --- RUTAS BÁSICAS DE PRUEBA ---
app.get('/', (req, res) => {
  res.send('¡API Backend funcionando exitosamente!');
});

// ==========================================
// --- RUTAS CRUD PARA PRODUCTOS (AQUÍ VAN) ---
// ==========================================

// 1. POST: Crear un nuevo producto (Hace funcionar el botón Guardar)
app.post('/productos', async (req, res) => {
  try {
    const nuevoProducto = await Producto.create(req.body);
    res.json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET: Obtener todos los productos (Hace funcionar la Lista de Productos)
app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT: Actualizar un producto existente (Hace funcionar el botón Editar)
app.put('/productos/:id', async (req, res) => {
  try {
    await Producto.update(req.body, {
      where: { id: req.params.id }
    });
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE: Eliminar un producto (Hace funcionar el botón Eliminar)
app.delete('/productos/:id', async (req, res) => {
  try {
    await Producto.destroy({
      where: { id: req.params.id }
    });
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- SINCRONIZACIÓN Y ARRANQUE ---
const PORT = process.env.PORT || 3000;

// force: false evita que se borren los datos cada vez que se reinicia el servidor
sequelize.sync({ force: false })
  .then(() => {
    console.log('Base de datos conectada y sincronizada.');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error al conectar con la base de datos:', error);
  });