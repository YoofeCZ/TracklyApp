// models/Task.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import transporter from '../mailer.js'; // Import Nodemailer transporteru
import Technician from './Technician.js';
import Client from './Client.js';
import dayjs from 'dayjs';

const Task = sequelize.define('Task', {
  description: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  clientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  technicianId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('task', 'service'), // Typ úkolu: 'task' nebo 'service'
    allowNull: false,
    defaultValue: 'task',
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'in_progress', 'completed', 'missed'),
    allowNull: false,
    defaultValue: 'upcoming', // Výchozí stav
  },
  reason: {
    type: DataTypes.STRING, // Důvod nesplnění (volitelný)
    allowNull: true,
  },
  emailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
});

// AfterCreate Hook pro odeslání e-mailu při vytvoření úkolu
Task.addHook('afterCreate', async (task, options) => {
  try {
    // Získání technika a klienta
    const technician = await Technician.findByPk(task.technicianId);
    const client = await Client.findByPk(task.clientId);

    if (!technician || !technician.email) {
      console.warn(`Technik s ID ${task.technicianId} nemá přiřazený e-mail.`);
      return;
    }

    // Definování mailOptions
    const mailOptions = {
      from: process.env.GMAIL_USER, // Vaše Gmail e-mailová adresa
      to: `${technician.email},${process.env.MAIN_TECHNICIAN_EMAIL}`, // Přidání hlavního technika
      subject: `Nový úkol: "${task.description}"`,
      text: `Dobrý den,\n\nByl vám přiřazen nový úkol:\n\nPopis úkolu: ${task.description}\nTermín: ${dayjs(task.dueDate).format('YYYY-MM-DD HH:mm')}\nKlient: ${client ? client.name : 'N/A'}\nTechnik: ${technician.name}\n\nS pozdravem,\nVaše Firma`,
    };

    // Odeslání e-mailu
    const info = await transporter.sendMail(mailOptions);

    console.log(`E-mail o úkolu ID ${task.id} byl odeslán: ${info.response}`);

    // Aktualizace flagu emailSent na true
    await task.update({ emailSent: true });
  } catch (error) {
    console.error(`Chyba při odesílání e-mailu pro úkol ID ${task.id}:`, error);
  }
});

export default Task;
