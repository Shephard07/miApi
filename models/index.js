const sequelize = require('../config/db');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Movimiento = require('./Movimiento');

// Relaciones Categoria <-> Producto
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });

// Relaciones Proveedor <-> Producto
Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

// Relaciones Producto <-> Movimiento
Producto.hasMany(Movimiento, { foreignKey: 'producto_id', as: 'movimientos', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Movimiento.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

// Relaciones Usuario <-> Movimiento
Usuario.hasMany(Movimiento, { foreignKey: 'usuario_id', as: 'movimientos', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
Movimiento.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = {
  sequelize,
  Categoria,
  Proveedor,
  Usuario,
  Producto,
  Movimiento
};

