// MyTickets.js
import React, { useState, useEffect } from 'react';
import { Table, Typography, message, Tag, Button, Row, Col } from 'antd';
import { getMyTickets } from '../services/api';
import { useNavigate } from 'react-router-dom'; // Správný import useNavigate
import '../css/Global.css';

const { Title } = Typography;

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Inicializace useNavigate správně

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const data = await getMyTickets();
        setTickets(data);
      } catch (error) {
        message.error('Chyba při načítání tiketů.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      responsive: ['lg'], // Zobrazit pouze na velkých obrazovkách a výše
    },
    {
      title: 'Téma',
      dataIndex: 'topic',
      key: 'topic',
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
    {
      title: 'Systém',
      dataIndex: 'system',
      key: 'system',
      responsive: ['sm', 'md', 'lg'], // Skrýt na extra malých obrazovkách
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'geekblue';
        if (status === 'closed') {
          color = 'green';
        } else if (status === 'in_progress') {
          color = 'orange';
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
    {
      title: 'Popis',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['md', 'lg'], // Skrýt na malých a extra malých obrazovkách
    },
    {
      title: 'Vytvořeno',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
      responsive: ['sm', 'md', 'lg'], // Skrýt na extra malých obrazovkách
    },
    {
      title: 'Akce', // Nový sloupec
      key: 'action',
      render: (text, record) => (
        <Button type="link" onClick={() => navigate(`/tickets/${record.id}`)}>
          Chat
        </Button>
      ),
      responsive: ['xs', 'sm', 'md', 'lg'],
    },
  ];

  return (
    <div className="my-tickets-container">
      <Row justify="center">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <Title level={2} className="my-tickets-title">Moje Tikety</Title>
          <Table
            dataSource={tickets}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: '100%' }} // Povolit horizontální scroll, pokud je potřeba
            bordered
            className="my-tickets-table"
          />
        </Col>
      </Row>
    </div>
  );
};

export default MyTickets;
