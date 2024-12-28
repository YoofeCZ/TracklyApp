// models/System.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const System = sequelize.define('System', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export default System;
