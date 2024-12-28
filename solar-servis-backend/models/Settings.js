import { DataTypes } from 'sequelize';
import sequelize from '../database.js'; // Přidání správného importu databáze

const Settings = sequelize.define('Settings', {
  hourlyRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 1500, // Výchozí hodnota
  },
  kilometerRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 8, // Výchozí hodnota
  },
  travelTimeRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 100, // Výchozí hodnota
  },
}, {
  tableName: 'settings',
  timestamps: false, // Vypnutí časových razítek, pokud nejsou potřeba
});

export default Settings;
