// src/pages/KnowHowClientHelpPage.jsx

import React, { useState, useEffect } from 'react';
import { Table, Input, Button, message, Card, Modal, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getKnowHowsBySearch, getClientInfo } from '../services/api'; // Přidáno getClientInfo
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Text } = Typography;

const KnowHowClientHelpPage = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedKnowHow, setSelectedKnowHow] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [clientSystem, setClientSystem] = useState(null); // Přidáno stav pro systém klienta

  const columns = [
    {
      title: 'Téma',
      dataIndex: 'topic',
      key: 'topic',
      render: (text, record) => (record.topic ? record.topic.name : 'N/A'),
    },
    {
      title: 'Systém',
      dataIndex: 'system',
      key: 'system',
      render: (text, record) => (record.system ? record.system.name : 'N/A'),
    },
    {
      title: 'Akce',
      key: 'action',
      render: (text, record) => (
        <Button type="link" onClick={() => showDetail(record)}>
          Zobrazit
        </Button>
      ),
    },
  ];

  // Funkce pro načtení informací o klientovi
  const fetchClientSystem = async () => {
    try {
      const clientInfo = await getClientInfo();
      console.log('Client Info:', clientInfo);
      setClientSystem(clientInfo.system);
    } catch (error) {
      console.error('Error fetching client info:', error);
      message.error('Chyba při načítání informací o klientovi.');
    }
  };

  const fetchData = async (q = '') => {
    setLoading(true);
    try {
      const result = await getKnowHowsBySearch(q);
      console.log('API Response:', result); // Přidán log pro kontrolu
      setData(result);
    } catch (error) {
      message.error('Chyba při načítání nápovědy.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientSystem(); // Načtení systému klienta
    fetchData('');
  }, []);

  const onSearch = () => {
    fetchData(searchTerm);
  };

  const showDetail = (knowHow) => {
    console.log('Selected KnowHow:', knowHow); // Přidán log pro kontrolu
    setSelectedKnowHow(knowHow);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedKnowHow(null);
  };

  return (
    <Card title={`Nápověda (Pro klienty${clientSystem ? ` - Systém: ${clientSystem.name}` : ''})`} className="table-card">
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <Input
          placeholder="Hledat..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          allowClear
        />
        <Button icon={<SearchOutlined />} type="primary" onClick={onSearch}>
          Hledat
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
      />

      {/* Modal pro zobrazení detailu Know How */}
      <Modal
        title={selectedKnowHow ? selectedKnowHow.topic.name : 'Detail Know How'}
        visible={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Zavřít
          </Button>,
        ]}
        width={800}
      >
        {selectedKnowHow && (
          <div>
            <h3>Systém: {selectedKnowHow.system.name}</h3>
            <ReactQuill
              value={selectedKnowHow.content}
              readOnly={true}
              theme="bubble"
            />
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default KnowHowClientHelpPage;
