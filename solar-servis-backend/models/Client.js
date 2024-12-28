// models/Client.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const Client = sequelize.define('Client', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  systemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Systems',
      key: 'id',
    },
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  files: {
    type: DataTypes.ARRAY(DataTypes.JSON),
    allowNull: false,
    defaultValue: [],
  },
  opCodes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: [],
    validate: {
      isArrayOfStrings(value) {
        if (!Array.isArray(value)) {
          throw new Error('opCodes musí být pole řetězců.');
        }
        value.forEach((op) => {
          if (!/^[a-zA-Z0-9-]+$/.test(op)) {
            throw new Error('Každý OP může obsahovat pouze písmena, čísla a pomlčky.');
          }
        });
      },
    },
  },
  userId: { // Nový sloupec pro asociaci s User
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  revisionExpirationDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  contractNextServiceDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
}, {
  // Další možnosti modelu
});



export default Client;
