// src/pages/CreateUser.js

import React, { useState, useEffect } from 'react';
import { createUser, getTechnicians } from '../services/api'; // Import getTechnicians
import { Select, Input, Button, Typography, Alert } from 'antd';

const { Option } = Select;
const { Title } = Typography;

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Původní výchozí role
  const [technicians, setTechnicians] = useState([]); // Stav pro techniky
  const [technicianId, setTechnicianId] = useState(null); // Vybraný technicianId
  const [messageInfo, setMessageInfo] = useState('');

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const data = await getTechnicians();
        setTechnicians(data);
      } catch (error) {
        console.error('Chyba při načítání techniků:', error);
        setMessageInfo('Nepodařilo se načíst seznam techniků.');
      }
    };

    fetchTechnicians();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token'); // Získání tokenu
    if (!token) {
      setMessageInfo('Chybí přihlašovací token.');
      return;
    }

    const userData = {
      username,
      password,
      role,
      technicianId: technicianId || null, // Přiřazení technicianId, pokud je vybrán
    };

    try {
      await createUser(userData, token); // Zavolání API pro vytvoření uživatele
      setMessageInfo('Uživatel byl úspěšně vytvořen.');
      setUsername('');
      setPassword('');
      setRole('user');
      setTechnicianId(null);
    } catch (error) {
      console.error('Chyba při vytváření uživatele:', error);
      setMessageInfo('Chyba při vytváření uživatele. Zkuste to znovu.');
    }
  };

  return (
    <div className="container mt-5">
      <Title level={2}>Vytvořit nového uživatele</Title>
      {messageInfo && <Alert message={messageInfo} type="info" showIcon closable style={{ marginBottom: '16px' }} />}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Uživatelské jméno</label>
          <Input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Heslo</label>
          <Input.Password
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="role" className="form-label">Role</label>
          <Select
            id="role"
            value={role}
            onChange={(value) => setRole(value)}
            style={{ width: '100%' }}
          >
            <Option value="user">Uživatel</Option>
            <Option value="admin">Admin</Option>
          </Select>
        </div>
        <div className="mb-3">
          <label htmlFor="technician" className="form-label">Technik (volitelné)</label>
          <Select
            id="technician"
            value={technicianId}
            onChange={(value) => setTechnicianId(value)}
            placeholder="Vyberte technika (volitelně)"
            style={{ width: '100%' }}
          >
            <Option value={null}>Nepřiřazovat technika</Option>
            {technicians.map((tech) => (
              <Option key={tech.id} value={tech.id}>
                {tech.name} ({tech.employeeId})
              </Option>
            ))}
          </Select>
        </div>
        <Button type="primary" htmlType="submit">Vytvořit uživatele</Button>
      </form>
    </div>
  );
};

export default CreateUser;
