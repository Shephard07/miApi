const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Movimiento = sequelize.define('Movimiento', {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tipo_movimiento: {
    type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste'),
    allowNull: false,
    defaultValue: 'Entrada'
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha_hora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'movimientos',
  timestamps: true
});

module.exports = Movimiento;

