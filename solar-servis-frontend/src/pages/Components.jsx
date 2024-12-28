// Components.js
import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';

let API_URL;

if (window.location.hostname === 'localhost') {
  API_URL = 'http://localhost:5000/api'; // Lokální prostředí
} else if (window.location.hostname.startsWith('192.168')) {
  API_URL = 'http://192.168.0.101:5000/api'; // Interní IP
} else {
  API_URL = 'http://188.175.32.34/api'; // Veřejná IP
}

const Components = () => {
  const [components, setComponents] = useState([]);
  const [systems, setSystems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentComponent, setCurrentComponent] = useState(null);

  const fetchComponents = async () => {
    try {
      const response = await fetch(`${API_URL}/components`);
      const data = await response.json();
      setComponents(data);
    } catch (error) {
      message.error('Chyba při načítání komponent.');
    }
  };

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
    fetchComponents();
    fetchSystems();
  }, []);

  const handleAddComponent = async (values) => {
    try {
      await fetch(`${API_URL}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Komponenta byla úspěšně přidána.');
      fetchComponents();
      setIsModalVisible(false);
    } catch (error) {
      message.error('Chyba při přidávání komponenty.');
    }
  };

  const handleEditComponent = (component) => {
    setCurrentComponent(component);
    setIsModalVisible(true);
  };

  const handleUpdateComponent = async (values) => {
    try {
      await fetch(`${API_URL}/components/${currentComponent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      message.success('Komponenta byla úspěšně aktualizována.');
      fetchComponents();
      setIsModalVisible(false);
      setCurrentComponent(null);
    } catch (error) {
      message.error('Chyba při aktualizaci komponenty.');
    }
  };

  const handleDeleteComponent = async (id) => {
    try {
      await fetch(`${API_URL}/components/${id}`, {
        method: 'DELETE',
      });
      message.success('Komponenta byla úspěšně smazána.');
      fetchComponents();
    } catch (error) {
      message.error('Chyba při mazání komponenty.');
    }
  };

  const columns = [
    { title: 'Název', dataIndex: 'name', key: 'name' },
    {
      title: 'Systém',
      dataIndex: 'system',
      key: 'system',
      render: (system) => system?.name || 'N/A',
    },
    {
      title: 'Akce',
      key: 'action',
      render: (text, record) => (
        <div>
          <Button type="link" onClick={() => handleEditComponent(record)}>
            Upravit
          </Button>
          <Button type="link" danger onClick={() => handleDeleteComponent(record.id)}>
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
      Seznam Komponentů
    </h1>
      <Button type="primary" onClick={() => setIsModalVisible(true)}>
        Přidat Komponentu
      </Button>
      <Table dataSource={components} columns={columns} rowKey="id" />
      <Modal
        title={currentComponent ? 'Upravit Komponentu' : 'Přidat Komponentu'}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentComponent(null);
        }}
        footer={null}
      >
        <Form
          onFinish={currentComponent ? handleUpdateComponent : handleAddComponent}
          initialValues={
            currentComponent
              ? {
                  name: currentComponent.name,
                  systemId: currentComponent.systemId,
                }
              : {}
          }
        >
          <Form.Item name="name" label="Název" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="systemId" label="Systém" rules={[{ required: true }]}>
            <Select>
              {systems.map((system) => (
                <Select.Option key={system.id} value={system.id}>
                  {system.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Button type="primary" htmlType="submit">
            {currentComponent ? 'Upravit' : 'Přidat'}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default Components;
