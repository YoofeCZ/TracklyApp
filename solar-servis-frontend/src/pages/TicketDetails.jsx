// src/pages/TicketDetails.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTicketById, getTicketMessages, addTicketMessage, updateTicketStatus } from '../services/api';
import { Typography, Descriptions, Tag, List, Input, Button, Select, message as AntMessage, Row, Col, Space } from 'antd';
import { jwtDecode } from 'jwt-decode';
import "../css/Global.css";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TicketDetails = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [userRole, setUserRole] = useState('');

  const token = localStorage.getItem('token');
  if (token) {
    const decoded = jwtDecode(token);
    localStorage.setItem('userRole', decoded.role);
  }

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const data = await getTicketById(id);
        setTicket(data);
        setStatus(data.status);
      } catch (error) {
        console.error('Chyba při načítání tiketu:', error);
        AntMessage.error('Chyba při načítání tiketu.');
      } finally {
        setLoading(false);
      }
    };

    const fetchMessages = async () => {
      try {
        const data = await getTicketMessages(id);
        setMessages(data);
      } catch (error) {
        console.error('Chyba při načítání zpráv:', error);
        AntMessage.error('Chyba při načítání zpráv.');
      }
    };

    const role = localStorage.getItem('userRole');
    console.log('User Role:', role);
    setUserRole(role);

    fetchTicket();
    fetchMessages();
  }, [id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      AntMessage.error('Prosím napište zprávu.');
      return;
    }

    try {
      const messageData = await addTicketMessage(id, newMessage);
      setMessages([...messages, messageData]);
      setNewMessage('');
    } catch (error) {
      console.error('Chyba při přidávání zprávy:', error);
      AntMessage.error('Chyba při odesílání zprávy.');
    }
  };

  const handleStatusChange = async (value) => {
    setStatusUpdating(true);
    try {
      const updatedTicket = await updateTicketStatus(id, value);
      setStatus(updatedTicket.status);
      AntMessage.success('Stav tiketu byl aktualizován.');
    } catch (error) {
      console.error('Chyba při aktualizaci stavu tiketu:', error);
      AntMessage.error('Chyba při aktualizaci stavu.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return <div className="ticket-details-container">Načítání tiketu...</div>;
  }

  if (!ticket) {
    return <div className="ticket-details-container">Tiket nebyl nalezen.</div>;
  }

  return (
    <div className="ticket-details-container">
      <Row gutter={[16,16]}>
        <Col span={24}>
          <Title level={2}>Tiket #{ticket.id}</Title>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Téma">{ticket.topic}</Descriptions.Item>
            <Descriptions.Item label="Stav">
              <Tag color={
                ticket.status === 'resolved' ? 'green' :
                ticket.status === 'in_progress' ? 'orange' :
                ticket.status === 'closed' ? 'red' :
                'geekblue'
              }>
                {ticket.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Klient">{ticket.client.name}</Descriptions.Item>
            <Descriptions.Item label="Systém">{ticket.client.system}</Descriptions.Item>
            <Descriptions.Item label="Popis">{ticket.description}</Descriptions.Item>
          </Descriptions>
        </Col>

        <Col span={24} style={{ marginTop: '16px', color: 'gray' }}>
          <strong>Aktuální role:</strong> {userRole || 'Nenastaveno'}
        </Col>

        {['admin', 'user'].includes(userRole) && (
          <Col span={24}>
            <Typography.Text strong>Změnit Stav:</Typography.Text>
            <Select
              value={status}
              onChange={handleStatusChange}
              style={{ width: 200, marginLeft: '8px' }}
              loading={statusUpdating}
            >
              <Option value="open">OTEVŘENO</Option>
              <Option value="in_progress">PROBÍHÁ</Option>
              <Option value="resolved">VYŘEŠENO</Option>
              <Option value="closed">ZAMÍTNUTO</Option>
            </Select>
          </Col>
        )}

        <Col span={24}>
          <Title level={4}>Chat</Title>
          <List
            bordered
            className="ticket-details-messages"
            dataSource={messages}
            renderItem={item => (
              <List.Item>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <List.Item.Meta
                    title={
                      <span style={{ fontWeight: 'bold', color: item.sender === 'client' ? '#1890ff' : '#52c41a' }}>
                        {item.sender === 'client' ? 'Klient' : 'Technik'}
                      </span>
                    }
                    description={new Date(item.createdAt).toLocaleString()}
                  />
                  <div style={{ 
                    textAlign: item.sender === 'client' ? 'left' : 'right',
                    backgroundColor: item.sender === 'client' ? '#f0f0f0' : '#e6f7ff',
                    padding: '8px',
                    borderRadius: '4px',
                    maxWidth: '80%',
                    marginLeft: item.sender === 'client' ? '0' : 'auto',
                  }}>
                    {item.message}
                  </div>
                </Space>
              </List.Item>
            )}
          />
        </Col>

        <Col span={24}>
          <div className="ticket-details-input-area">
            <TextArea
              rows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Napište zprávu..."
              disabled={!['client', 'admin', 'user'].includes(userRole)}
            />
            <Button 
              type="primary" 
              onClick={handleSendMessage}
              disabled={!['client', 'admin', 'user'].includes(userRole)}
            >
              Odeslat
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default TicketDetails;
