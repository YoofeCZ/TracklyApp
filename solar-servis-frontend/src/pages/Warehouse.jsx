// src/pages/Warehouse.jsx

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import { deleteWarehouseItem, getWarehouseItems, addWarehouseItem, updateWarehouseItem } from '../services/api'; // Importujte potřebné funkce

const Warehouse = () => {
  const [materials, setMaterials] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();

  // Načtení materiálů ze skladu
  const fetchMaterials = async () => {
    try {
      const data = await getWarehouseItems(); // Použití služby
      console.log('Fetched materials:', data); // Přidáme logování
      setMaterials(data);
    } catch (error) {
      message.error('Chyba při načítání skladu');
    }
  };

  useEffect(() => {
    fetchMaterials(); // Načtení materiálů při inicializaci komponenty
  }, []);

  // Funkce pro přidání materiálu
  const handleAddMaterial = async (values) => {
    try {
      const data = await addWarehouseItem(values); // Použití služby
      setMaterials([...materials, data]);
      message.success('Materiál byl úspěšně přidán!');
      setIsAddModalVisible(false);
      formAdd.resetFields();
    } catch (error) {
      message.error('Chyba při přidávání materiálu');
    }
  };

  // Funkce pro mazání materiálu
  const handleDeleteMaterial = async (id) => {
    if (!id) {
      message.error('Neplatný ID materiálu.');
      return;
    }

    try {
      await deleteWarehouseItem(id); // Použití služby
      setMaterials(materials.filter((material) => material.id !== id)); // Použití správného pole
      message.success('Materiál byl úspěšně smazán!');
    } catch (error) {
      console.error('Chyba při mazání materiálu:', error);
      message.error('Chyba při mazání materiálu');
    }
  };

  // Funkce pro otevření edit modal
  const showEditModal = (material) => {
    setEditingMaterial(material);
    setIsEditModalVisible(true);
    formEdit.setFieldsValue({
      name: material.name,
      price: material.price,
      quantity: material.quantity,
    });
  };

  // Funkce pro zpracování úprav materiálu
  const handleEditMaterial = async (values) => {
    try {
      const updatedMaterial = await updateWarehouseItem(editingMaterial.id, values);
      setMaterials(materials.map((material) => (material.id === updatedMaterial.id ? updatedMaterial : material)));
      message.success('Materiál byl úspěšně aktualizován!');
      setIsEditModalVisible(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error('Chyba při aktualizaci materiálu:', error);
      message.error('Chyba při aktualizaci materiálu');
    }
  };

  const columns = [
    {
      title: 'Název materiálu',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Cena za jednotku (Kč)',
      dataIndex: 'price',
      key: 'price',
      render: (text) => `Kč ${text}`,
    },
    {
      title: 'Množství',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Akce',
      key: 'action',
      render: (_, record) => (
        <>
          <Button danger onClick={() => handleDeleteMaterial(record.id)} style={{ marginRight: 8 }}>
            Smazat
          </Button>
          <Button type="primary" onClick={() => showEditModal(record)}>
            Upravit
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <h2>Správa skladu</h2>
      <Button type="primary" onClick={() => setIsAddModalVisible(true)} style={{ marginBottom: 20 }}>
        Přidat materiál
      </Button>
      <Table dataSource={materials} columns={columns} rowKey="id" />

      {/* Modal pro Přidání Materiálu */}
      <Modal
        title="Přidat materiál"
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onOk={() => formAdd.submit()}
      >
        <Form form={formAdd} layout="vertical" onFinish={handleAddMaterial}>
          <Form.Item
            name="name"
            label="Název materiálu"
            rules={[{ required: true, message: 'Zadejte název materiálu' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Cena za jednotku (Kč)"
            rules={[{ required: true, message: 'Zadejte cenu' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Množství"
            rules={[{ required: true, message: 'Zadejte množství' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal pro Úpravu Materiálu */}
      <Modal
        title="Upravit materiál"
        visible={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingMaterial(null);
        }}
        onOk={() => formEdit.submit()}
      >
        <Form
          form={formEdit}
          layout="vertical"
          onFinish={handleEditMaterial}
          initialValues={editingMaterial}
        >
          <Form.Item
            name="name"
            label="Název materiálu"
            rules={[{ required: true, message: 'Zadejte název materiálu' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Cena za jednotku (Kč)"
            rules={[{ required: true, message: 'Zadejte cenu' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Množství"
            rules={[{ required: true, message: 'Zadejte množství' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Warehouse;
