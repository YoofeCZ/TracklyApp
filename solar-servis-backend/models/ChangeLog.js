// Cesta: models/ChangeLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../database.js'; // Přidání .js přípony pro správný import v ESM

const ChangeLog = sequelize.define('ChangeLog', {
    reportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Reports', // Název tabulky pro Report
            key: 'id',
        },
    },
    changeType: {
        type: DataTypes.STRING, // Např. "create", "update", "delete"
        allowNull: false,
    },
    changedBy: {
        type: DataTypes.STRING, // Jméno uživatele, který provedl změnu
        allowNull: false,
    },
    changeDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    details: {
        type: DataTypes.TEXT, // Popis změny
        allowNull: true,
    },
});

export default ChangeLog; // Změněno na export default pro správný import v ESM
