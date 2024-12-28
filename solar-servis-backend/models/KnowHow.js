// models/KnowHow.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js';

const KnowHow = sequelize.define(
  'KnowHow',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Odebrání pole 'topic' jako stringu
    topicId: { // Přidání cizího klíče 'topicId'
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Topics', // Název tabulky Topics
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    systemId: { // systemId jako cizí klíč
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Systems', // Název tabulky Systems
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    availableForClients: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Ve výchozím stavu není pro klienty
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: 'KnowHows',
  }
);


export default KnowHow;
