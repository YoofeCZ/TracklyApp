// models/Warehouse.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Warehouse = sequelize.define('Warehouse', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

export default Warehouse;
