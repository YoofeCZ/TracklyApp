// src/models/Technician.js

import { DataTypes } from 'sequelize';
import sequelize from '../database.js'; // Import sequelize instance

const Technician = sequelize.define('Technician', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    employeeId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Další pole podle potřeby
}, {
    tableName: 'Technicians',
    timestamps: true,
});

// Definování asociací
Technician.associate = (models) => {
    Technician.hasMany(models.User, { foreignKey: 'technicianId', as: 'users' });
};

export default Technician;
