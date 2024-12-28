// src/pages/Tasks.js
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  Form,
  Select,
  Typography,
  DatePicker,
  message,
} from 'antd';
import { getTasks, createTask, updateTask, deleteTask, getClients, getTechnicians } from '../services/api';
import dayjs from 'dayjs'; // Import Day.js
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const { TextArea } = Input;
const { Option } = Select;

const Tasks = ({ updatePendingTasksCount }) => {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ description: '', dueDate: '', clientId: '', technicianId: '', subtasks: [] });
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const MAX_DESCRIPTION_LENGTH = 255; // Maximální počet znaků pro popis

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, clientsData, techniciansData] = await Promise.all([
          getTasks(),
          getClients(),
          getTechnicians(),
        ]);

        // Aktualizace stavu na základě splněných podmínek
        const now = dayjs();
        const updatedTasks = await Promise.all(
          tasksData.map(async (task) => {
            if (task.dueDate && dayjs(task.dueDate).isBefore(now) && task.status !== 'completed') {
              // Aktualizace stavu na 'missed' pokud je termín prošlý a úkol není dokončen
              await updateTask(task.id, { ...task, status: 'missed' });
              return { ...task, status: 'missed' }; // Aktualizovaný stav
            }
            return task;
          })
        );

        // Nastavení aktualizovaných úkolů a dalších dat
        setTasks(updatedTasks);
        setFilteredTasks(updatedTasks);
        setClients(clientsData);
        setTechnicians(techniciansData);

        // Aktualizace počtu naplánovaných úkolů
        const pendingCount = updatedTasks.filter(task => task.status === 'upcoming' || task.status === 'in_progress').length;
        updatePendingTasksCount(pendingCount);
      } catch (error) {
        message.error('Chyba při načítání dat.');
        console.error('Chyba při načítání dat:', error);
      }
    };

    fetchData();
  }, [updatePendingTasksCount]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    const lowerCaseValue = value.toLowerCase();

    setFilteredTasks(
      tasks.filter((task) => {
        const technicianName = technicians.find((tech) => tech.id === task.technicianId)?.name?.toLowerCase() || '';
        const clientName = clients.find((client) => client.id === task.clientId)?.name?.toLowerCase() || '';
        const description = task.description?.toLowerCase() || '';

        return (
          description.includes(lowerCaseValue) ||
          technicianName.includes(lowerCaseValue) ||
          clientName.includes(lowerCaseValue)
        );
      })
    );
  };

  const handleAddTask = () => {
    setNewTask({ description: '', dueDate: '', clientId: '', technicianId: '', subtasks: [] });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setNewTask(task);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSaveTask = async () => {
    try {
      // Pokud je editace zapnutá
      if (isEditMode) {
        await updateTask(newTask.id, newTask); // Zahrnuje subtasks
        message.success('Úkol byl úspěšně aktualizován.');
      } else {
        await createTask(newTask); // Zahrnuje subtasks
        message.success('Úkol byl úspěšně přidán.');
      }

      // Po uložení znovu načti seznam úkolů a aktualizuj počet
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
      setFilteredTasks(updatedTasks);

      // Aktualizuj počet naplánovaných úkolů
      const pendingCount = updatedTasks.filter(task => task.status === 'upcoming' || task.status === 'in_progress').length;
      updatePendingTasksCount(pendingCount);

      // Reset modal a nový úkol
      setIsModalOpen(false);
      setNewTask({ description: '', dueDate: '', clientId: '', technicianId: '', subtasks: [] });
    } catch (error) {
      message.error('Chyba při ukládání úkolu.');
      console.error('Chyba při ukládání:', error);
    }
  };

  const handleSubtaskToggle = async (index) => {
    const updatedSubtasks = [...selectedTask.subtasks];
    updatedSubtasks[index].completed = true;

    // Zkontroluj, zda jsou všechny podúkoly splněné
    const allCompleted = updatedSubtasks.every((subtask) => subtask.completed);

    try {
      // Odeslání aktualizovaných podúkolů na backend
      await updateTask(selectedTask.id, {
        ...selectedTask,
        subtasks: updatedSubtasks,
        status: allCompleted ? 'completed' : selectedTask.status, // Aktualizace stavu úkolu
      });

      message.success('Podúkol byl označen jako splněný.');

      // Aktualizuj úkoly v seznamu
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
      setFilteredTasks(updatedTasks);

      // Aktualizuj počet naplánovaných úkolů
      const pendingCount = updatedTasks.filter(task => task.status === 'upcoming' || task.status === 'in_progress').length;
      updatePendingTasksCount(pendingCount);

      // Aktualizuj detail aktuálně vybraného úkolu
      setSelectedTask({ 
        ...selectedTask, 
        subtasks: updatedSubtasks, 
        status: allCompleted ? 'completed' : selectedTask.status 
      });
    } catch (error) {
      message.error('Chyba při aktualizaci podúkolu.');
      console.error('Chyba při aktualizaci podúkolu:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);
      setFilteredTasks(updatedTasks);
      message.success('Úkol byl úspěšně smazán.');

      // Aktualizuj počet naplánovaných úkolů
      const pendingCount = updatedTasks.filter(task => task.status === 'upcoming' || task.status === 'in_progress').length;
      updatePendingTasksCount(pendingCount);
    } catch (error) {
      message.error('Chyba při mazání úkolu.');
      console.error('Chyba při mazání úkolu:', error);
    }
  };

  const handleUpdateTaskStatus = async (task, status) => {
    if (status === 'missed' && !task.reason) {
      const reason = prompt('Zadejte důvod nesplnění:');
      if (!reason) return;
      task.reason = reason;
    }

    try {
      await updateTask(task.id, { ...task, status });
      message.success('Stav úkolu byl aktualizován.');
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
      setFilteredTasks(updatedTasks);

      // Aktualizuj počet naplánovaných úkolů
      const pendingCount = updatedTasks.filter(task => task.status === 'upcoming' || task.status === 'in_progress').length;
      updatePendingTasksCount(pendingCount);
    } catch (error) {
      message.error('Chyba při aktualizaci stavu úkolu.');
      console.error('Chyba při aktualizaci stavu úkolu:', error);
    }
  };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTask({ description: '', dueDate: '', clientId: '', technicianId: '', subtasks: [] });
    setIsEditMode(false);
  };

  const columns = [
    {
      title: 'Popis',
      dataIndex: 'description',
      key: 'description',
      render: (description) =>
        description.length > 30 ? `${description.substring(0, 30)}...` : description,
    },
    {
      title: 'Podúkoly',
      dataIndex: 'subtasks',
      key: 'subtasks',
      render: (subtasks) =>
        subtasks && subtasks.length > 0
          ? `${subtasks.filter((s) => s.completed).length}/${subtasks.length} splněno`
          : 'Žádné podúkoly',
    },
    {
      title: 'Termín',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'Stav',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          upcoming: 'Nadcházející',
          in_progress: 'Probíhá',
          completed: 'Splněný',
          missed: 'Nesplněný',
        };
        return statusMap[status] || 'Neznámý';
      },
    },
    {
      title: 'Klient',
      dataIndex: 'clientId',
      key: 'clientId',
      render: (id) => {
        const client = clients.find((client) => client.id === id);
        return client ? (
          <Button
            type="link"
            onClick={() => {
              // Přesměruj na stránku klienta a předvyplň vyhledávání
              navigate(`/clients?search=${encodeURIComponent(client.name)}`);
            }}
          >
            {client.name}
          </Button>
        ) : (
          'N/A'
        );
      },
    },
    {
      title: 'Technik',
      dataIndex: 'technicianId',
      key: 'technicianId',
      render: (id) => {
        const technician = technicians.find((tech) => tech.id === id);
        return technician ? (
          <Button
            type="link"
            onClick={() => {
              // Přesměruj na stránku technika a předvyplň vyhledávání
              navigate(`/technicians?search=${encodeURIComponent(technician.name)}`);
            }}
          >
            {technician.name}
          </Button>
        ) : (
          'N/A'
        );
      },
    },
    {
      title: 'Akce',
      key: 'action',
      render: (_, task) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            type="link"
            onClick={() => handleUpdateTaskStatus(task, 'completed')}
            disabled={task.status === 'completed'}
          >
            Označit jako splněné
          </Button>
          <Button
            type="link"
            danger
            onClick={() => handleUpdateTaskStatus(task, 'missed')}
            disabled={task.status === 'missed'}
          >
            Označit jako nesplněné
          </Button>
          <Button type="link" onClick={() => handleEditTask(task)}>
            Upravit
          </Button>
          <Button type="link" danger onClick={() => handleDeleteTask(task.id)}>
            Smazat
          </Button>
          <Button type="link" onClick={() => handleViewDetails(task)}>
            Detaily
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={2}>Plánovač úkolů a servisů</Typography.Title>
      <Input.Search
        placeholder="Vyhledat podle popisu, klienta nebo technika"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <Button type="primary" onClick={handleAddTask} style={{ marginBottom: '20px' }}>
        Přidat Úkol/Servis
      </Button>
      <Table dataSource={filteredTasks} columns={columns} rowKey="id" />

      {/* Modal pro přidání/úpravu úkolu nebo servisu */}
      <Modal
        title={isEditMode ? 'Upravit Úkol/Servis' : 'Přidat Úkol/Servis'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        onOk={handleSaveTask}
      >
        <Form layout="vertical">
          <Form.Item label="Typ">
            <Select
              value={newTask.type}
              onChange={(value) => setNewTask({ ...newTask, type: value })}
              placeholder="Vyberte typ"
            >
              <Option value="task">Úkol</Option>
              <Option value="service">Servis</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Popis"
            validateStatus={newTask.description.length > MAX_DESCRIPTION_LENGTH ? 'error' : ''}
            help={newTask.description.length > MAX_DESCRIPTION_LENGTH ? 'Maximální délka je 255 znaků' : ''}
            required={newTask.type === 'service'} // Povinné jen u servisu
          >
            <TextArea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <Typography.Text type={newTask.description.length > MAX_DESCRIPTION_LENGTH ? 'danger' : 'secondary'}>
              {newTask.description.length}/{MAX_DESCRIPTION_LENGTH} znaků
            </Typography.Text>
          </Form.Item>

          {newTask.type === 'task' && (
            <Form.Item label="Podúkoly">
              {(newTask.subtasks || []).map((subtask, index) => (
                <Input
                  key={index}
                  placeholder={`Podúkol ${index + 1}`}
                  value={subtask.description}
                  onChange={(e) => {
                    const updatedSubtasks = [...newTask.subtasks];
                    updatedSubtasks[index].description = e.target.value;
                    setNewTask({ ...newTask, subtasks: updatedSubtasks });
                  }}
                  style={{ marginBottom: '10px' }}
                />
              ))}
              <Button
                type="dashed"
                onClick={() => {
                  const updatedSubtasks = [...(newTask.subtasks || []), { description: '', completed: false }];
                  setNewTask({ ...newTask, subtasks: updatedSubtasks });
                }}
              >
                Přidat podúkol
              </Button>
            </Form.Item>
          )}

          <Form.Item label="Termín">
            <DatePicker
              showTime={{ minuteStep: 15 }}
              format="YYYY-MM-DD HH:mm"
              value={newTask.dueDate ? dayjs(newTask.dueDate, 'YYYY-MM-DD HH:mm') : null}
              onChange={(date) =>
                setNewTask({ ...newTask, dueDate: date ? date.format('YYYY-MM-DD HH:mm') : '' })
              }
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          {newTask.type !== 'task' && (
            <Form.Item label="Klient">
              <Select
                value={newTask.clientId}
                onChange={(value) => setNewTask({ ...newTask, clientId: value })}
                placeholder="Vyberte klienta (volitelně)"
              >
                {clients.map((client) => (
                  <Option key={client.id} value={client.id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Technik">
            <Select
              value={newTask.technicianId}
              onChange={(value) => setNewTask({ ...newTask, technicianId: value })}
              placeholder="Vyberte technika"
            >
              {technicians.map((tech) => (
                <Option key={tech.id} value={tech.id}>
                  {tech.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal pro zobrazení detailů */}
      <Modal
        title="Detaily Úkolu/Servisu"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
      >
        {selectedTask && (
          <>
            <Typography.Title level={5}>Typ</Typography.Title>
            <Typography>{selectedTask.type === 'task' ? 'Úkol' : 'Servis'}</Typography>

            <Typography.Title level={5}>Popis</Typography.Title>
            <Typography>{selectedTask.description || 'N/A'}</Typography>

            <Typography.Title level={5}>Datum splnění</Typography.Title>
            <Typography>
              {selectedTask.dueDate ? dayjs(selectedTask.dueDate).format('YYYY-MM-DD HH:mm') : 'N/A'}
            </Typography>

            <Typography.Title level={5}>Klient</Typography.Title>
            <Typography>
              {clients.find((client) => client.id === selectedTask.clientId)?.name || 'N/A'}
            </Typography>

            <Typography.Title level={5}>Technik</Typography.Title>
            <Typography>
              {technicians.find((tech) => tech.id === selectedTask.technicianId)?.name || 'N/A'}
            </Typography>

            <Typography.Title level={5}>Stav</Typography.Title>
            <Typography>{selectedTask.status || 'Neznámý'}</Typography>

            {selectedTask.type === 'task' && (
              <>
                <Typography.Title level={5}>Podúkoly</Typography.Title>
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                  <div>
                    {selectedTask.subtasks.map((subtask, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <Input value={subtask.description} readOnly style={{ marginRight: '10px', flex: 1 }} />
                        <Button
                          type="primary"
                          onClick={() => handleSubtaskToggle(index)}
                          disabled={subtask.completed}
                        >
                          {subtask.completed ? 'Splněno' : 'Označit jako splněné'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Typography>Žádné podúkoly.</Typography>
                )}
              </>
            )}

            {selectedTask.reason && (
              <>
                <Typography.Title level={5}>Důvod nesplnění</Typography.Title>
                <Typography>{selectedTask.reason}</Typography>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

Tasks.propTypes = {
  updatePendingTasksCount: PropTypes.func.isRequired,
};

export default Tasks;
