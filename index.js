require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Op } = require('sequelize');
const {
  sequelize,
  Categoria,
  Proveedor,
  Usuario,
  Producto,
  Movimiento
} = require('./models');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- RUTA BASE DE SALUDO ---
app.get('/', (req, res) => {
  res.json({
    message: '¡API Backend SENATI - Panel de Inventario funcionando exitosamente!',
    endpoints: [
      '/dashboard/stats',
      '/productos',
      '/categorias',
      '/proveedores',
      '/usuarios',
      '/movimientos'
    ]
  });
});

// ==========================================
// --- DASHBOARD / KPIS ---
// ==========================================
app.get('/dashboard/stats', async (req, res) => {
  try {
    const totalProductos = await Producto.count();
    const totalCategorias = await Categoria.count();
    const totalProveedores = await Proveedor.count();
    const productosBajoStock = await Producto.count({
      where: {
        stock: {
          [Op.lte]: 5
        }
      }
    });

    const movimientosRecientes = await Movimiento.findAll({
      limit: 6,
      order: [['createdAt', 'DESC']],
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'stock'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
      ]
    });

    // Distribución por categoría para el gráfico donut
    const categorias = await Categoria.findAll({
      include: [
        {
          model: Producto,
          as: 'productos',
          attributes: ['id', 'stock']
        }
      ]
    });

    const stockPorCategoria = categorias.map((cat) => {
      const totalStock = cat.productos ? cat.productos.reduce((acc, p) => acc + (p.stock || 0), 0) : 0;
      const totalItems = cat.productos ? cat.productos.length : 0;
      return {
        id: cat.id,
        nombre: cat.nombre,
        totalStock,
        totalItems
      };
    });

    res.json({
      totalProductos,
      totalCategorias,
      totalProveedores,
      productosBajoStock,
      movimientosRecientes,
      stockPorCategoria
    });
  } catch (error) {
    console.error('Error en /dashboard/stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- CRUD PRODUCTOS ---
// ==========================================
app.get('/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }
      ],
      order: [['id', 'ASC']]
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/productos', async (req, res) => {
  try {
    const { nombre, descripcion, precio, stock, categoria_id, proveedor_id } = req.body;
    const nuevoProducto = await Producto.create({
      nombre,
      descripcion,
      precio,
      stock: stock || 0,
      categoria_id: categoria_id || null,
      proveedor_id: proveedor_id || null
    });

    const productoCreado = await Producto.findByPk(nuevoProducto.id, {
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }
      ]
    });

    res.status(201).json(productoCreado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria_id, proveedor_id } = req.body;
    await Producto.update(
      {
        nombre,
        descripcion,
        precio,
        stock,
        categoria_id: categoria_id || null,
        proveedor_id: proveedor_id || null
      },
      { where: { id } }
    );

    const productoActualizado = await Producto.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social'] }
      ]
    });

    res.json(productoActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Producto.destroy({ where: { id } });
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- CRUD CATEGORÍAS ---
// ==========================================
app.get('/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      include: [
        {
          model: Producto,
          as: 'productos',
          attributes: ['id', 'nombre', 'stock']
        }
      ],
      order: [['id', 'ASC']]
    });

    // Añadir campo 'cantidadProductos' para facilitar la tabla
    const resultado = categorias.map(c => {
      const plain = c.get({ plain: true });
      return {
        ...plain,
        cantidadProductos: plain.productos ? plain.productos.length : 0
      };
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/categorias', async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const nuevaCategoria = await Categoria.create({ nombre, descripcion });
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    await Categoria.update({ nombre, descripcion }, { where: { id } });
    const actualizada = await Categoria.findByPk(id);
    res.json(actualizada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/categorias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Categoria.destroy({ where: { id } });
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- CRUD PROVEEDORES ---
// ==========================================
app.get('/proveedores', async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll({
      order: [['id', 'ASC']]
    });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/proveedores', async (req, res) => {
  try {
    const { razon_social, contacto, telefono, email } = req.body;
    const nuevo = await Proveedor.create({ razon_social, contacto, telefono, email });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { razon_social, contacto, telefono, email } = req.body;
    await Proveedor.update(
      { razon_social, contacto, telefono, email },
      { where: { id } }
    );
    const actualizado = await Proveedor.findByPk(id);
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/proveedores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Proveedor.destroy({ where: { id } });
    res.json({ message: 'Proveedor eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- CRUD USUARIOS ---
// ==========================================
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, email, password, rol, estado } = req.body;
    const nuevo = await Usuario.create({
      nombre,
      email,
      password: password || '123456',
      rol: rol || 'Almacenero',
      estado: estado || 'Activo'
    });
    res.status(201).json(nuevo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, estado } = req.body;
    
    const updateData = { nombre, email, rol, estado };
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    await Usuario.update(updateData, { where: { id } });
    const actualizado = await Usuario.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Usuario.destroy({ where: { id } });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// --- RETO TÉCNICO: MOVIMIENTOS (KARDEX) CON TRANSACCIÓN EN SEQUELIZE ---
// =========================================================================
app.get('/movimientos', async (req, res) => {
  try {
    const movimientos = await Movimiento.findAll({
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'stock', 'precio'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/movimientos', async (req, res) => {
  // Se inicia una transacción administrada por Sequelize
  const t = await sequelize.transaction();

  try {
    const { producto_id, usuario_id, tipo_movimiento, cantidad, observaciones } = req.body;

    const cantNum = parseInt(cantidad, 10);
    if (!cantNum || cantNum <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'La cantidad debe ser un número entero mayor a cero.' });
    }

    if (!['Entrada', 'Salida', 'Ajuste'].includes(tipo_movimiento)) {
      await t.rollback();
      return res.status(400).json({ error: 'Tipo de movimiento inválido. Debe ser Entrada, Salida o Ajuste.' });
    }

    // Buscar el producto bloqueando la fila para actualización concurrente segura
    const producto = await Producto.findByPk(producto_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!producto) {
      await t.rollback();
      return res.status(404).json({ error: 'El producto especificado no existe.' });
    }

    let nuevoStock = producto.stock;

    if (tipo_movimiento === 'Entrada') {
      // Sumar al stock
      nuevoStock = producto.stock + cantNum;
    } else if (tipo_movimiento === 'Salida') {
      // Validar si hay stock suficiente
      if (producto.stock < cantNum) {
        await t.rollback();
        return res.status(400).json({
          error: `Stock insuficiente. Stock actual: ${producto.stock}, cantidad solicitada: ${cantNum}`
        });
      }
      nuevoStock = producto.stock - cantNum;
    } else if (tipo_movimiento === 'Ajuste') {
      // Ajuste directo del stock a la cantidad especificada
      nuevoStock = cantNum;
    }

    // 1. Insertar el registro en la tabla Movimientos
    const nuevoMovimiento = await Movimiento.create(
      {
        producto_id,
        usuario_id: usuario_id || null,
        tipo_movimiento,
        cantidad: cantNum,
        fecha_hora: new Date(),
        observaciones: observaciones || ''
      },
      { transaction: t }
    );

    // 2. Actualizar simultáneamente el campo stock en la tabla Productos
    await producto.update({ stock: nuevoStock }, { transaction: t });

    // Confirmar la transacción (Commit)
    await t.commit();

    // Consultar el movimiento creado con sus relaciones para devolverlo al cliente
    const movimientoCompleto = await Movimiento.findByPk(nuevoMovimiento.id, {
      include: [
        { model: Producto, as: 'producto', attributes: ['id', 'nombre', 'stock'] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'rol'] }
      ]
    });

    res.status(201).json({
      message: 'Movimiento registrado y stock actualizado exitosamente con transacción.',
      movimiento: movimientoCompleto,
      nuevoStock
    });
  } catch (error) {
    // Revertir cambios ante cualquier error
    await t.rollback();
    console.error('Error al registrar movimiento con transacción:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// --- SEEDER INICIAL (DATOS DEL LABORATORIO) ---
// ==========================================
async function sembrarDatosIniciales() {
  const catCount = await Categoria.count();
  if (catCount === 0) {
    console.log('Sembrando categorías iniciales...');
    const cats = await Categoria.bulkCreate([
      { nombre: 'Periféricos', descripcion: 'Dispositivos de entrada y salida como mouse, teclados y auriculares' },
      { nombre: 'Laptops y PC', descripcion: 'Computadoras portátiles, de escritorio y todo en uno' },
      { nombre: 'Monitores', descripcion: 'Pantallas, displays y monitores para oficina y gaming' },
      { nombre: 'Impresoras', descripcion: 'Equipos de impresión, multifuncionales y suministros de tinta' },
      { nombre: 'Componentes', descripcion: 'Partes internas como memorias RAM, discos duros y placas' }
    ]);

    console.log('Sembrando proveedores iniciales...');
    const provs = await Proveedor.bulkCreate([
      { razon_social: 'Logitech Perú S.A.C.', contacto: 'Carlos Mendoza', telefono: '987 654 321', email: 'ventas@logitech.pe' },
      { razon_social: 'Tech Import S.A.', contacto: 'Ana Torres', telefono: '912 345 678', email: 'atorres@techimport.com' },
      { razon_social: 'Distribuidora del Norte', contacto: 'Luis Quispe', telefono: '945 876 213', email: 'lquispe@distnorte.pe' },
      { razon_social: 'Global Electrónicos', contacto: 'Marta Gómez', telefono: '981 234 567', email: 'mgomez@globalelec.com' },
      { razon_social: 'Asus Latinoamérica', contacto: 'Javier Soto', telefono: '955 432 109', email: 'jsoto@asus.la' }
    ]);

    console.log('Sembrando usuarios iniciales...');
    const users = await Usuario.bulkCreate([
      { nombre: 'Giancarlos Barboza N.', email: 'gbarboza@senati.pe', password: 'password123', rol: 'Administrador', estado: 'Activo' },
      { nombre: 'Marco Antonio Ruiz', email: 'mruiz@inventario.com', password: 'password123', rol: 'Almacenero', estado: 'Activo' },
      { nombre: 'Ana Torres Prado', email: 'atorres@inventario.com', password: 'password123', rol: 'Almacenero', estado: 'Activo' },
      { nombre: 'Carlos Mendoza R.', email: 'cmendoza@inventario.com', password: 'password123', rol: 'Administrador', estado: 'Activo' },
      { nombre: 'Sofía Rojas Silva', email: 'srojas@inventario.com', password: 'password123', rol: 'Supervisor', estado: 'Activo' }
    ]);

    console.log('Sembrando productos iniciales...');
    const prods = await Producto.bulkCreate([
      { nombre: 'Mouse Logitech G203', descripcion: 'Mouse óptico para juegos de 8000 DPI con iluminación RGB Lightsync', precio: 85.00, stock: 12, categoria_id: cats[0].id, proveedor_id: provs[0].id },
      { nombre: 'Teclado Mecánico Redragon', descripcion: 'Teclado mecánico gamer con switches azules y retroiluminación', precio: 180.00, stock: 8, categoria_id: cats[0].id, proveedor_id: provs[1].id },
      { nombre: 'Monitor LG 24" IPS', descripcion: 'Monitor Full HD de 24 pulgadas con tecnología IPS 75Hz', precio: 550.00, stock: 15, categoria_id: cats[2].id, proveedor_id: provs[2].id },
      { nombre: 'Laptop ASUS TUF Gaming', descripcion: 'Laptop potente con procesador AMD Ryzen 7 y tarjeta gráfica RTX', precio: 3499.00, stock: 5, categoria_id: cats[1].id, proveedor_id: provs[4].id },
      { nombre: 'Impresora HP Ink Tank', descripcion: 'Impresora multifuncional de tanque de tinta continua de alto rendimiento', precio: 650.00, stock: 3, categoria_id: cats[3].id, proveedor_id: provs[3].id }
    ]);

    console.log('Sembrando movimientos iniciales...');
    await Movimiento.bulkCreate([
      { producto_id: prods[0].id, usuario_id: users[1].id, tipo_movimiento: 'Entrada', cantidad: 15, observaciones: 'Recepción lote inicial de proveedores' },
      { producto_id: prods[3].id, usuario_id: users[0].id, tipo_movimiento: 'Salida', cantidad: 2, observaciones: 'Entrega a área de desarrollo' },
      { producto_id: prods[0].id, usuario_id: users[0].id, tipo_movimiento: 'Entrada', cantidad: 10, observaciones: 'Reposición de stock' },
      { producto_id: prods[1].id, usuario_id: users[1].id, tipo_movimiento: 'Entrada', cantidad: 10, observaciones: 'Ingreso orden de compra #102' },
      { producto_id: prods[3].id, usuario_id: users[0].id, tipo_movimiento: 'Salida', cantidad: 2, observaciones: 'Venta corporativa' }
    ]);

    console.log('¡Datos iniciales sembrados con éxito!');
  }
}

// ==========================================
// --- SINCRONIZACIÓN Y ARRANQUE ---
// ==========================================
const PORT = process.env.PORT || 3000;

// alter: true actualiza las columnas de las tablas sin borrar los datos existentes
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Base de datos conectada y tablas sincronizadas correctamente.');
    await sembrarDatosIniciales();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar con la base de datos:', error);
  });
