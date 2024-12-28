// src/pages/KnowHowListPage.jsx

import React, { useState, useEffect } from 'react';
import { Table, Input, Button, message, Card, Modal, Form, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getKnowHowsBySearch, deleteKnowHow, updateKnowHow, getKnowHowDetail } from '../services/api'; // Importujte všechny potřebné API funkce
import { jwtDecode } from 'jwt-decode';

const KnowHowListPage = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null); // Stav pro roli

  // Stav pro edit modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentKnowHow, setCurrentKnowHow] = useState(null);
  const [editForm] = Form.useForm();

  // Stav pro detail modal
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [detailKnowHow, setDetailKnowHow] = useState(null);

  // Funkce pro získání role z tokenu
  const getUserRole = () => {
    const token = localStorage.getItem('token'); // Předpokládáme, že token je uložen v localStorage
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return decoded.role; // Předpokládáme, že role je v payloadu tokenu
      } catch (error) {
        console.error('Chyba při dekódování tokenu:', error);
        return null;
      }
    }
    return null;
  };

  // Nastavení role při inicializaci komponenty
  useEffect(() => {
    const userRole = getUserRole();
    setRole(userRole);
  }, []);

  // Načtení Know How ze skladu
  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const result = await getKnowHowsBySearch(q);
      setData(result);
    } catch (error) {
      console.error('Chyba při načítání Know How:', error);
      message.error('Chyba při načítání Know How.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData('');
  }, []);

  const onSearch = () => {
    fetchData(searchTerm);
  };

  // Implementace mazání
  const handleDelete = (record) => {
    Modal.confirm({
      title: 'Opravdu chcete odstranit tuto Know How?',
      content: `Téma: ${record.topic.name}`, // Opraven přístup k názvu tématu
      okText: 'Ano',
      okType: 'danger',
      cancelText: 'Ne',
      onOk: async () => {
        setLoading(true);
        try {
          await deleteKnowHow(record.id);
          message.success('Know How bylo úspěšně odstraněno.');
          // Aktualizace seznamu Know How
          fetchData(searchTerm);
        } catch (error) {
          message.error('Chyba při odstraňování Know How.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Implementace úpravy
  const handleEdit = (record) => {
    setCurrentKnowHow(record);
    editForm.setFieldsValue({
      content: record.content,
      availableForClients: record.availableForClients,
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    setLoading(true);
    try {
      await updateKnowHow(currentKnowHow.id, values);
      message.success('Know How bylo úspěšně upraveno.');
      setIsEditModalVisible(false);
      setCurrentKnowHow(null);
      fetchData(searchTerm);
    } catch (error) {
      message.error('Chyba při úpravě Know How.');
    } finally {
      setLoading(false);
    }
  };

  // Implementace zobrazení detailu
  const handleViewDetail = async (record) => {
    setLoading(true);
    try {
      const detail = await getKnowHowDetail(record.id);
      setDetailKnowHow(detail);
      setIsDetailModalVisible(true);
    } catch (error) {
      message.error('Chyba při načítání detailu Know How.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Téma',
      dataIndex: ['topic', 'name'], // Upraven dataIndex pro přístup k názvu tématu
      key: 'topic',
      sorter: (a, b) => a.topic.name.localeCompare(b.topic.name),
      render: (text, record) => record.topic ? record.topic.name : 'N/A', // Přidána render funkce pro bezpečné zobrazení
    },
    {
      title: 'Systém',
      dataIndex: ['system', 'name'],
      key: 'system',
      sorter: (a, b) => a.system.name.localeCompare(b.system.name),
      render: (text, record) => record.system ? record.system.name : 'N/A', // Přidána render funkce pro bezpečné zobrazení
    },
    {
      title: 'Dostupné pro klienty',
      dataIndex: 'availableForClients',
      key: 'availableForClients',
      sorter: (a, b) => a.availableForClients - b.availableForClients,
      render: val => val ? 'Ano' : 'Ne'
    },
    // Pokud je admin nebo technik, přidáme sloupec s akcemi
    ...(role === 'admin' || role === 'technician' ? [{
      title: 'Akce',
      key: 'actions',
      render: (text, record) => (
        <div>
          <Button type="link" onClick={() => handleViewDetail(record)}>Zobrazit Detail</Button>
          <Button type="link" onClick={() => handleEdit(record)}>Upravit</Button>
          <Button type="link" danger onClick={() => handleDelete(record)}>Smazat</Button>
        </div>
      )
    }] : [])
  ];

  return (
    <Card title="Seznam Know How (Pro techniky a adminy)" className="table-card">
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Input
          placeholder="Hledat podle tématu, obsahu..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
        />
        <Button icon={<SearchOutlined />} type="primary" onClick={onSearch}>Hledat</Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />

      {/* Edit Modal */}
      <Modal
        title={`Upravit Know How: ${currentKnowHow?.topic?.name || 'N/A'}`} // Opraven přístup k názvu tématu
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            label="Obsah Know How"
            name="content"
            rules={[{ required: true, message: 'Prosím zadejte obsah Know How' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Dostupné pro klienty"
            name="availableForClients"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Uložit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Detail Know How: ${detailKnowHow?.topic?.name || 'N/A'}`} // Opraven přístup k názvu tématu
        visible={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Zavřít
          </Button>,
        ]}
        width={800}
      >
        {detailKnowHow ? (
          <div>
            <p><strong>Téma:</strong> {detailKnowHow.topic ? detailKnowHow.topic.name : 'N/A'}</p>
            <p><strong>Systém:</strong> {detailKnowHow.system ? detailKnowHow.system.name : 'N/A'}</p>
            <p><strong>Dostupné pro klienty:</strong> {detailKnowHow.availableForClients ? 'Ano' : 'Ne'}</p>
            <p><strong>Obsah:</strong></p>
            <div dangerouslySetInnerHTML={{ __html: detailKnowHow.content }} />
          </div>
        ) : (
          <p>Načítání...</p>
        )}
      </Modal>
    </Card>
  );
};

export default KnowHowListPage;
