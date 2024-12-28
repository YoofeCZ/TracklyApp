import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Typography, Select, Input, DatePicker } from 'antd';
import { getAllTickets } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TechnicianDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [filterSeverity, setFilterSeverity] = useState(null);
  const [filterPriorityLevel, setFilterPriorityLevel] = useState(null);
  const [filterTopic, setFilterTopic] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getAllTickets();
        setTickets(data);
      } catch (error) {
        console.error('Chyba při získávání tiketů:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const calculatePriorityScore = (ticket) => {
    const severityWeight = 10;
    const dateWeight = 1;

    const daysOld = Math.floor((new Date() - new Date(ticket.createdAt)) / (1000 * 60 * 60 * 24));
    return ticket.severity * severityWeight + daysOld * dateWeight;
  };

  const ticketsWithPriority = tickets.map((ticket) => {
    const score = calculatePriorityScore(ticket);
    let priorityLevel = 'Nízká';
    if (score >= 50) priorityLevel = 'Střední';
    if (score >= 100) priorityLevel = 'Vysoká';

    return { ...ticket, priorityScore: score, priorityLevel };
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: 'Téma',
      dataIndex: 'topic',
      key: 'topic',
      filters: [
        { text: 'Hardware', value: 'Hardware' },
        { text: 'Software', value: 'Software' },
        { text: 'Network', value: 'Network' },
      ],
      onFilter: (value, record) => record.topic === value,
    },
    {
      title: 'Závažnost',
      dataIndex: 'severity',
      key: 'severity',
      sorter: (a, b) => a.severity - b.severity,
      sortDirections: ['descend', 'ascend'],
      filters: Array.from({ length: 10 }, (_, i) => ({
        text: `${i + 1}`,
        value: i + 1,
      })),
      onFilter: (value, record) => record.severity === value,
      render: (severity) => {
        let color = 'green';
        if (severity >= 8) {
          color = 'red';
        } else if (severity >= 5) {
          color = 'orange';
        }
        return <Tag color={color}>{severity}</Tag>;
      },
    },
    {
      title: 'Priorita',
      dataIndex: 'priorityLevel',
      key: 'priorityLevel',
      filters: [
        { text: 'Nízká', value: 'Nízká' },
        { text: 'Střední', value: 'Střední' },
        { text: 'Vysoká', value: 'Vysoká' },
      ],
      onFilter: (value, record) => record.priorityLevel === value,
      render: (priorityLevel) => {
        let color = 'blue';
        if (priorityLevel === 'Střední') {
          color = 'orange';
        } else if (priorityLevel === 'Vysoká') {
          color = 'red';
        }
        return <Tag color={color}>{priorityLevel}</Tag>;
      },
    },
    {
      title: 'Klient',
      dataIndex: ['client', 'name'],
      key: 'clientName',
    },
    {
      title: 'Stav',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'OTEVŘENO', value: 'open' },
        { text: 'PROBÍHÁ', value: 'in_progress' },
        { text: 'VYŘEŠENO', value: 'resolved' },
        { text: 'ZAMÍTNUTO', value: 'closed' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let color = 'geekblue';
        if (status === 'resolved') {
          color = 'green';
        } else if (status === 'in_progress') {
          color = 'orange';
        } else if (status === 'closed') {
          color = 'red';
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Datum vytvoření',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      sortDirections: ['descend', 'ascend'],
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Akce',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => navigate(`/tickets/${record.id}`)}>Detail</Button>
        </Space>
      ),
    },
  ];

  const filteredTickets = ticketsWithPriority.filter((ticket) => {
    const severityMatch = filterSeverity ? ticket.severity === filterSeverity : true;
    const priorityMatch = filterPriorityLevel ? ticket.priorityLevel === filterPriorityLevel : true;
    const topicMatch = filterTopic ? ticket.topic === filterTopic : true;
    const dateMatch = filterDateRange
      ? new Date(ticket.createdAt) >= filterDateRange[0] && new Date(ticket.createdAt) <= filterDateRange[1]
      : true;
    const fullTextMatch = searchText
      ? [
          ticket.id,
          ticket.client?.name,
          ticket.client?.address,
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchText.toLowerCase())
      : true;

    return severityMatch && priorityMatch && topicMatch && dateMatch && fullTextMatch;
  });

  const sortedTickets = filteredTickets.sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Seznam Všech Tiketů</Title>
      <div style={{ marginBottom: '16px' }}>
        <Input
          placeholder="Vyhledat podle ID, jména nebo adresy klienta"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, marginRight: 16 }}
        />
        <span style={{ marginRight: 8 }}>Filtrovat podle Závažnosti:</span>
        <Select
          allowClear
          placeholder="Vyberte závažnost"
          style={{ width: 120, marginRight: 16 }}
          onChange={(value) => setFilterSeverity(value)}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <Option key={num} value={num}>{num}</Option>
          ))}
        </Select>
        <span style={{ marginRight: 8 }}>Filtrovat podle Priority:</span>
        <Select
          allowClear
          placeholder="Vyberte prioritu"
          style={{ width: 120, marginRight: 16 }}
          onChange={(value) => setFilterPriorityLevel(value)}
        >
          <Option value="Nízká">Nízká</Option>
          <Option value="Střední">Střední</Option>
          <Option value="Vysoká">Vysoká</Option>
        </Select>
        <span style={{ marginRight: 8 }}>Filtrovat podle Tématu:</span>
        <Select
          allowClear
          placeholder="Vyberte téma"
          style={{ width: 120, marginRight: 16 }}
          onChange={(value) => setFilterTopic(value)}
        >
          <Option value="Hardware">Hardware</Option>
          <Option value="Software">Software</Option>
          <Option value="Network">Network</Option>
        </Select>
        <RangePicker
          onChange={(dates) => setFilterDateRange(dates)}
          style={{ marginRight: 16 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={sortedTickets}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default TechnicianDashboard;
