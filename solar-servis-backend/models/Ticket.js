// models/Ticket.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Client from './Client.js';
import KnowHow from './KnowHow.js';
import Technician from './Technician.js';
import TicketMessage from './TicketMessage.js';

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  system: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  severity: { // Nové pole pro závažnost
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10,
    },
    defaultValue: 1,
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    allowNull: false,
    defaultValue: 'open',
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Clients',
      key: 'id',
    },
  },
  knowHowId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'KnowHows',
      key: 'id',
    },
  },
  technicianId: { // Přidáno pro přiřazení technika
    type: DataTypes.INTEGER,
    allowNull: true, // Tiket nemusí být ihned přiřazen technikovi
    references: {
      model: 'Technicians',
      key: 'id',
    },
  },
  response: { // Pokud chcete ukládat odpovědi, jinak tento field můžete odstranit
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

// Asociace definované v associations.js, takže zde není potřeba je znovu definovat

export default Ticket;
