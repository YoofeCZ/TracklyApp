import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  severity: { // Nové pole pro závažnost
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
    defaultValue: 1, // Výchozí hodnota
  },
}, {
  timestamps: true,
});

export default Topic;
