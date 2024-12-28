// models/Subtask.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Subtask = sequelize.define('Subtask', {
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default Subtask;
