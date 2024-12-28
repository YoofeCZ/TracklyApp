// src/pages/UserManagement.js

import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Input, Select, message } from "antd";
import { getUsers, updateUserPassword, deleteUser, updateUserRole, assignTechnicianToUser, getTechnicians } from "../services/api";

const { Option } = Select;

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [technicians, setTechnicians] = useState([]); // Stav pro techniky
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("");
    const [newTechnicianId, setNewTechnicianId] = useState(null); // Vybraný technicianId
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalType, setModalType] = useState(""); // Typ modalu (heslo, role, technik)

    // Funkce pro načtení uživatelů
    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            console.log("Fetched Users:", data); // Přidán log pro kontrolu
            setUsers(data);
        } catch (error) {
            message.error("Chyba při načítání uživatelů.");
        }
    };

    // Funkce pro načtení techniků
    const fetchTechnicians = async () => {
        try {
            const data = await getTechnicians();
            setTechnicians(data);
        } catch (error) {
            console.error('Chyba při načítání techniků:', error);
            message.error("Chyba při načítání techniků.");
        }
    };

    // Načítání uživatelů a techniků
    useEffect(() => {
        fetchUsers();
        fetchTechnicians();
    }, []);

    // Otevření modalu
    const showModal = (user, type) => {
        setSelectedUser(user);
        setModalType(type);
        if (type === 'technician') {
            setNewTechnicianId(user.technicianId);
        }
        setIsModalVisible(true);
    };

    // Uzavření modalu
    const handleCancel = () => {
        setIsModalVisible(false);
        setNewPassword("");
        setNewRole("");
        setNewTechnicianId(null);
    };

    // Změna hesla uživatele
    const handlePasswordChange = async () => {
        if (!newPassword) {
            message.error("Nové heslo nemůže být prázdné.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await updateUserPassword(selectedUser.id, newPassword, token);
            message.success("Heslo bylo úspěšně změněno.");
            handleCancel();
            fetchUsers(); // Aktualizace seznamu uživatelů
        } catch (error) {
            console.error("Chyba při změně hesla:", error);
            message.error("Chyba při změně hesla.");
        }
    };

    // Změna role uživatele
    const handleChangeRole = async () => {
        if (!newRole) {
            message.error("Role nemůže být prázdná.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const updatedUser = await updateUserRole(selectedUser.id, newRole, token);
            setUsers(users.map((user) => (user.id === selectedUser.id ? updatedUser : user)));
            message.success("Role byla úspěšně změněna.");
            handleCancel();
        } catch (error) {
            console.error("Chyba při změně role:", error);
            message.error("Chyba při změně role.");
        }
    };

    // Přiřazení technika uživateli
    const handleAssignTechnician = async () => {
        if (!newTechnicianId) {
            message.error("Musíte vybrat technika.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const updatedUser = await assignTechnicianToUser(selectedUser.id, newTechnicianId, token);
            console.log("Updated User:", updatedUser); // Přidán log pro kontrolu
            setUsers(users.map((user) => (user.id === selectedUser.id ? updatedUser : user)));
            message.success("Technik byl úspěšně přiřazen.");
            handleCancel();
        } catch (error) {
            console.error("Chyba při přiřazení technika:", error);
            message.error("Chyba při přiřazení technika.");
        }
    };

    // Smazání uživatele
    const handleDeleteUser = async (userId) => {
        try {
            const token = localStorage.getItem("token");
            await deleteUser(userId, token);
            setUsers(users.filter((user) => user.id !== userId));
            message.success("Uživatel byl úspěšně smazán.");
        } catch (error) {
            console.error("Chyba při mazání uživatele:", error);
            message.error("Chyba při mazání uživatele.");
        }
    };

    // Konfigurace sloupců pro tabulku
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            align: "center",
        },
        {
            title: "Uživatelské jméno",
            dataIndex: "username",
            key: "username",
            align: "center",
            render: (text) => <b>{text}</b>,
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            align: "center",
            render: (role) => (
                <span style={{ color: role === "admin" ? "#ff4500" : "#007bff" }}>
                    {role}
                </span>
            ),
        },
        {
            title: "Technik",
            dataIndex: "technician",
            key: "technician",
            align: "center",
            render: (technician) => (
                technician ? `${technician.name} (${technician.employeeId})` : 'Není přiřazen'
            ),
        },
        {
            title: "Akce",
            key: "actions",
            align: "center",
            render: (text, user) => (
                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    <Button type="primary" onClick={() => showModal(user, "password")}>
                        Změnit heslo
                    </Button>
                    <Button type="default" onClick={() => showModal(user, "role")}>
                        Změnit roli
                    </Button>
                    {/* Přiřazení technika pro uživatele bez přiřazeného technika */}
                    {!user.technicianId && (
                        <Button type="default" onClick={() => showModal(user, "technician")}>
                            Přiřadit technika
                        </Button>
                    )}
                    <Button danger onClick={() => handleDeleteUser(user.id)}>
                        Smazat
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="container mt-5">
            <h2>Správa uživatelů</h2>
            <Table dataSource={users} columns={columns} rowKey="id" />

            {/* Modal pro změnu hesla, role a přiřazení technika */}
            <Modal
                title={
                    modalType === "password" ? (
                        <span>Změna hesla</span>
                    ) : modalType === "role" ? (
                        <span>Změna role</span>
                    ) : modalType === "technician" ? (
                        <span>Přiřadit technika</span>
                    ) : null
                }
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                {modalType === "password" ? (
                    <>
                        <Input.Password
                            placeholder="Nové heslo"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={{
                                borderRadius: "5px",
                                fontSize: "1rem",
                                marginBottom: "20px",
                            }}
                        />
                        <Button type="primary" onClick={handlePasswordChange}>
                            Změnit heslo
                        </Button>
                    </>
                ) : modalType === "role" ? (
                    <>
                        <Select
                            placeholder="Vyberte roli"
                            value={newRole}
                            onChange={(value) => setNewRole(value)}
                            style={{
                                width: "100%",
                                borderRadius: "5px",
                                fontSize: "1rem",
                                marginBottom: "20px",
                            }}
                        >
                            <Option value="technician">Technik</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                        <Button type="primary" onClick={handleChangeRole}>
                            Změnit roli
                        </Button>
                    </>
                ) : modalType === "technician" && selectedUser ? (
                    <>
                        <Select
                            placeholder="Vyberte technika"
                            value={newTechnicianId}
                            onChange={(value) => setNewTechnicianId(value)}
                            style={{
                                width: "100%",
                                borderRadius: "5px",
                                fontSize: "1rem",
                                marginBottom: "20px",
                            }}
                        >
                            {technicians.map((tech) => (
                                <Option key={tech.id} value={tech.id}>
                                    {tech.name} ({tech.employeeId})
                                </Option>
                            ))}
                        </Select>
                        <Button type="primary" onClick={handleAssignTechnician}>
                            Přiřadit technika
                        </Button>
                    </>
                ) : null}
            </Modal>
        </div>
    );
};

export default UserManagement;
