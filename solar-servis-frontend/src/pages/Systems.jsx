// Systems.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';

let API_URL;

if (window.location.hostname === 'localhost') {
  API_URL = 'http://localhost:5000/api'; // Lokální prostředí
} else if (window.location.hostname.startsWith('192.168')) {
  API_URL = 'http://192.168.0.101:5000/api'; // Interní IP
} else {
  API_URL = 'http://188.175.32.34/api'; // Veřejná IP
}

const Systems = () => {
  const [systems, setSystems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentSystem, setCurrentSystem] = useState(null);

  const fetchSystems = async () => {
    try {
      const response = await fetch(`${API_URL}/systems`);
      const data = await response.json();
      setSystems(data);
    } catch (error) {
      message.error('Chyba při načítání systémů.');
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const handleAddSystem = async (values) => {
    try {
      await fetch(`${API_URL}/systems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Systém byl úspěšně přidán.');
      fetchSystems();
      setIsModalVisible(false);
    } catch (error) {
      message.error('Chyba při přidávání systému.');
    }
  };

  const handleEditSystem = (system) => {
    setCurrentSystem(system);
    setIsModalVisible(true);
  };

  const handleUpdateSystem = async (values) => {
    try {
      await fetch(`${API_URL}/systems/${currentSystem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Systém byl úspěšně aktualizován.');
      fetchSystems();
      setIsModalVisible(false);
      setCurrentSystem(null);
    } catch (error) {
      message.error('Chyba při aktualizaci systému.');
    }
  };

  const handleDeleteSystem = async (id) => {
    try {
      await fetch(`${API_URL}/systems/${id}`, {
        method: 'DELETE',
      });
      message.success('Systém byl úspěšně smazán.');
      fetchSystems();
    } catch (error) {
      message.error('Chyba při mazání systému.');
    }
  };

  const columns = [
    { title: 'Název', dataIndex: 'name', key: 'name' },
    {
      title: 'Akce',
      key: 'action',
      render: (text, record) => (
        <div>
          <Button type="link" onClick={() => handleEditSystem(record)}>
            Upravit
          </Button>
          <Button type="link" danger onClick={() => handleDeleteSystem(record.id)}>
            Smazat
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: "16px" }}>
    {/* Titulek stránky */}
    <h1 style={{ textAlign: "center", marginBottom: "16px" }}>
      Seznam Systémů
    </h1>
      <Button type="primary" onClick={() => setIsModalVisible(true)}>
        Přidat Systém
      </Button>
      <Table dataSource={systems} columns={columns} rowKey="id" />
      <Modal
        title={currentSystem ? 'Upravit Systém' : 'Přidat Systém'}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentSystem(null);
        }}
        footer={null}
      >
        <Form
          onFinish={currentSystem ? handleUpdateSystem : handleAddSystem}
          initialValues={currentSystem ? { name: currentSystem.name } : {}}
        >
          <Form.Item name="name" label="Název" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            {currentSystem ? 'Upravit' : 'Přidat'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Systems;
