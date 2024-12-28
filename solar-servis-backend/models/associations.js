// models/associations.js

import sequelize from '../database.js';
import Report from './Report.js';
import Client from './Client.js';
import Technician from './Technician.js';
import System from './System.js';
import Component from './Component.js';
import Task from './Task.js';
import Subtask from './Subtask.js';
import User from './User.js';
import Ticket from './Ticket.js';
import TicketMessage from './TicketMessage.js';
import KnowHow from './KnowHow.js';
import Topic from './Topic.js';

// Definice asociací

// Asociace mezi Technician a Report
Technician.hasMany(Report, { foreignKey: 'technicianId', as: 'reports' });
Report.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

// Asociace mezi Client a Report
Client.hasMany(Report, { foreignKey: 'clientId', as: 'reports' });
Report.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Asociace mezi System a Component
System.hasMany(Component, { foreignKey: 'systemId', as: 'components' });
Component.belongsTo(System, { foreignKey: 'systemId', as: 'system' });

// Asociace mezi System a Report
System.hasMany(Report, { foreignKey: 'systemId', as: 'reports' });
Report.belongsTo(System, { foreignKey: 'systemId', as: 'system' });

// Asociace mezi Component a Report
Component.hasMany(Report, { foreignKey: 'componentId', as: 'reports' });
Report.belongsTo(Component, { foreignKey: 'componentId', as: 'component' });

// Asociace mezi System a Client
System.hasMany(Client, { foreignKey: 'systemId', as: 'clients' });
Client.belongsTo(System, { foreignKey: 'systemId', as: 'system' });

// Asociace mezi Task a Subtask
Task.hasMany(Subtask, { foreignKey: 'taskId', as: 'subtasks' });
Subtask.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// Asociace mezi Task a Technician
Technician.hasMany(Task, { foreignKey: 'technicianId', as: 'tasks' });
Task.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

// Asociace mezi Task a Client
Client.hasMany(Task, { foreignKey: 'clientId', as: 'tasks' });
Task.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Asociace mezi Client a User
Client.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Client, { foreignKey: 'userId', as: 'client' });

// Asociace mezi Client a Ticket
Client.hasMany(Ticket, { foreignKey: 'clientId', as: 'tickets' });
Ticket.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Asociace mezi Technician a Ticket
Technician.hasMany(Ticket, { foreignKey: 'technicianId', as: 'tickets' });
Ticket.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

// Asociace mezi Ticket a TicketMessage
Ticket.hasMany(TicketMessage, { foreignKey: 'TicketId', as: 'messages' });
TicketMessage.belongsTo(Ticket, { foreignKey: 'TicketId', as: 'ticket' });

// Asociace mezi Technician a KnowHow
Technician.hasMany(KnowHow, { foreignKey: 'technicianId', as: 'knowHows' });
KnowHow.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });

// Asociace mezi User a Technician
User.belongsTo(Technician, { foreignKey: 'technicianId', as: 'technician' });
Technician.hasOne(User, { foreignKey: 'technicianId', as: 'user' });

// Asociace mezi KnowHow a Ticket
KnowHow.hasMany(Ticket, { foreignKey: 'knowHowId', as: 'tickets' });
Ticket.belongsTo(KnowHow, { foreignKey: 'knowHowId', as: 'knowHow' });

// Asociace mezi KnowHow a System
System.hasMany(KnowHow, { foreignKey: 'systemId', as: 'knowHows' });
KnowHow.belongsTo(System, { foreignKey: 'systemId', as: 'system' });

// Asociace mezi KnowHow a Topic
Topic.hasMany(KnowHow, { foreignKey: 'topicId', as: 'knowHows' });
KnowHow.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });

// Export všech modelů pro snadný import v jiných částech aplikace
export {
  sequelize,
  Report,
  Client,
  Technician,
  System,
  Component,
  Task,
  Subtask,
  User,
  Ticket,
  TicketMessage,
  KnowHow,
  Topic,
};
