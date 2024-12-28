// models/Component.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';


const Component = sequelize.define('Component', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  systemId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Systems',
      key: 'id',
    },
    allowNull: false,
  },
});

export default Component;
