// models/TicketMessage.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Ticket from './Ticket.js';

const TicketMessage = sequelize.define('TicketMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sender: {
    type: DataTypes.ENUM('client', 'admin', 'user', 'system'), // Přidáno 'system'
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  TicketId: { // Přidáno pro asociaci s tiketem
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tickets',
      key: 'id',
    },
  },
}, {
  timestamps: true
});

// Asociace definované v associations.js, takže zde není potřeba je znovu definovat

export default TicketMessage;
