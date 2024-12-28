// models/Report.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';



const Report = sequelize.define('Report', {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notEmpty: true,
      isDate: true,
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  technicianId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Technicians',
      key: 'id',
    },
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Clients',
      key: 'id',
    },
  },
  opCode: {
    type: DataTypes.STRING,
    allowNull: true, // Není povinné
    validate: {
        isValidFormat(value) {
            if (value && !/^[A-Z]{2}-\d{3}-\d{3}$/.test(value)) {
                throw new Error('OP musí být ve formátu XX-123-456.');
            }
        },
    },
},
  systemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Systems',
      key: 'id',
    },
  },
  componentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Components',
      key: 'id',
    },
  },
  materialUsed: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  totalWorkCost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  totalTravelCost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  totalMaterialCost: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
});


export default Report;
