// models/Usuario.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.STRING,
    defaultValue: 'Almacenero' // Administrador, Almacenero, etc.
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'Activo'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    // Antes de guardar o actualizar en la base de datos, ciframos la contraseña (Prevención contra brechas)
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    }
  }
});

module.exports = Usuario;
