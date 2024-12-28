// src/models/User.js

import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../database.js'; // Import sequelize instance
import Technician from './Technician.js'; // Import modelu Technician
import Client from './Client.js'; // Import modelu Client

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'client', 'technician'), // Přidány role 'client' a 'technician'
        defaultValue: 'user',
        allowNull: false,
    },
    technicianId: { // Přidání technicianId
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Technicians', // Název tabulky Technicians
            key: 'id',
        },
    },
    mustChangePassword: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'Users',
    timestamps: true,
});

// Hook pro hashování hesla před uložením do databáze
User.beforeCreate(async (user) => {
    if (!user.password.startsWith("$2a$") && !user.password.startsWith("$2b$")) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
    }
});

// Funkce pro vytvoření uživatele
User.createUser = async function (username, password, role = 'user', technicianId = null) {
    return await User.create({
        username,
        password, // heslo bude automaticky zašifrováno
        role,
        technicianId, // přiřazení technicianId
    });
};

// Definování asociací
User.associate = (models) => {
    User.belongsTo(models.Technician, { foreignKey: 'technicianId', as: 'technician' });
    User.hasOne(models.Client, { foreignKey: 'userId', as: 'client' }); // Přidána asociace k Client
};

export default User;
