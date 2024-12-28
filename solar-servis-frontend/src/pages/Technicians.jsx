//Technicians.js
import React, { useEffect, useState } from 'react';
import {
  getTechnicians, createTechnician,deleteTask, updateTechnician, deleteTechnician, getReports, getTasksByTechnician, createTask, getClients, updateTask,
} from '../services/api';
import {
  Button, Input, Row, Col, Card, Modal, Form, Typography, Select, message, DatePicker,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, FileTextOutlined, PlusOutlined, ProfileOutlined,
} from '@ant-design/icons';
import dayjs from "dayjs";
import { useLocation } from 'react-router-dom';
import '../css/Global.css';


const { Option } = Select;

function Technicians() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || ''; // Načtení výchozího vyhledávacího termínu
  const [technicians, setTechnicians] = useState([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState([]);
  const [newTechnician, setNewTechnician] = useState({ name: '', email: '', phone: '', address: '', employeeId: '' });
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    description: '',
    dueDate: null,
    clientId: '',
    technicianId: '',
  });
  const [clients, setClients] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);


  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const data = await getTechnicians();
        setTechnicians(data);
        setFilteredTechnicians(data); // Inicializujeme filtrované techniky
        setSearchTerm(initialSearch); // Nastavení výchozího vyhledávání
      } catch (error) {
        console.error('Chyba při načítání techniků:', error);
      }
    };
  
    fetchTechnicians();
  }, [initialSearch]); // Pouze jednou při mountnutí komponenty
  
  
  useEffect(() => {
    setFilteredTechnicians(
      technicians.filter((technician) =>
        technician.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, technicians]);
  

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClients(data); // Uložení klientů do stavu
      } catch (error) {
        console.error('Chyba při načítání klientů:', error);
        message.error('Nepodařilo se načíst klienty.');
      }
    };
  
    fetchClients();
  }, []); // Volá se pouze jednou při načtení komponenty
  

  const handleAddTechnician = async () => {
    try {
      const createdTechnician = await createTechnician(newTechnician);
      setTechnicians([...technicians, createdTechnician]);
      setNewTechnician({ name: '', email: '', phone: '', address: '', employeeId: '' });
      message.success('Technik úspěšně přidán!');
    } catch (error) {
      console.error('Chyba při přidávání technika:', error);
    }
  };

  const handleEditTechnician = (technician) => {
    setEditingTechnician(technician);
    setIsModalOpen(true);
  };

  const handleSaveTechnician = async () => {
    try {
      const updatedTechnician = await updateTechnician(editingTechnician.id, editingTechnician);
      setTechnicians(technicians.map((tech) =>
        tech.id === updatedTechnician.id ? updatedTechnician : tech
      ));
      setIsModalOpen(false);
      setEditingTechnician(null);
      message.success('Technik úspěšně upraven!');
    } catch (error) {
      console.error('Chyba při aktualizaci technika:', error);
    }
  };

  const handleDeleteTechnician = async (id) => {
    if (window.confirm("Opravdu chcete smazat tohoto technika?")) {
      try {
        await deleteTechnician(id);
        setTechnicians(technicians.filter((technician) => technician.id !== id));
        message.success('Technik úspěšně smazán!');
      } catch (error) {
        console.error('Chyba při mazání technika:', error);
      }
    }
  };

  const handleViewReports = async (technicianId) => {
    try {
      const reportsData = await getReports(technicianId);
      setReports(reportsData);
      setIsReportModalOpen(true);
    } catch (error) {
      console.error('Chyba při získávání reportů:', error);
    }
  };

  const handleViewTasks = async (technicianId) => {
    try {
      const tasksData = await getTasksByTechnician(technicianId);
      setTasks(tasksData);
      setIsTaskModalOpen(true);
    } catch (error) {
      console.error('Chyba při získávání úkolů:', error);
    }
  };

  const handleAddTask = (technicianId) => {
    setNewTask({ description: '', dueDate: null, clientId: '', technicianId });
    setIsEditMode(false);
    setIsAddTaskModalOpen(true);
  };

  const handleClientSelection = (clientId) => {
    setNewTask((prevTask) => ({
      ...prevTask,
      clientId: clientId,
    }));
  };

  const handleSaveTask = async () => {
    try {
      if (newTask.clientId) {
        if (isEditMode) {
          await updateTask(newTask.id, newTask);
          setTasks(tasks.map((task) => (task.id === newTask.id ? newTask : task)));
        } else {
          const response = await createTask(newTask);
          setTasks([...tasks, response]);
        }

        setIsAddTaskModalOpen(false);
        setNewTask({
          description: "",
          dueDate: null,
          clientId: "",
          technicianId: "",
        });
        message.success('Úkol úspěšně uložen!');
      } else {
        message.error("Nebyl vybrán žádný klient.");
      }
    } catch (error) {
      console.error("Chyba při ukládání úkolu:", error);
    }
  };

  const handleEditTask = (task) => {
    setNewTask(task);
    setIsEditMode(true);
    setIsAddTaskModalOpen(true);
  };

  
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Opravdu chcete smazat tento úkol?')) {
      try {
        await deleteTask(taskId); // Zavolá endpoint pro mazání úkolu
        setTasks(tasks.filter((task) => task.id !== taskId)); // Aktualizace stavu úkolů
        message.success('Úkol úspěšně smazán!');
      } catch (error) {
        console.error('Chyba při mazání úkolu:', error);
        message.error('Nepodařilo se smazat úkol.');
      }
    }
  };
  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={2}>Technici</Typography.Title>
      <Input.Search
        placeholder="Hledat technika"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        enterButton
        style={{ marginBottom: '20px' }}
      />

      <Form layout="vertical">
        <Form.Item label="Přidat nového technika">
          <Input
            placeholder="Jméno"
            value={newTechnician.name}
            onChange={(e) => setNewTechnician({ ...newTechnician, name: e.target.value })}
          />
          <Input
            placeholder="Email"
            value={newTechnician.email}
            onChange={(e) => setNewTechnician({ ...newTechnician, email: e.target.value })}
            style={{ marginTop: '10px' }}
          />
          <Input
            placeholder="Telefon"
            value={newTechnician.phone}
            onChange={(e) => setNewTechnician({ ...newTechnician, phone: e.target.value })}
            style={{ marginTop: '10px' }}
          />
          <Input
            placeholder="Adresa"
            value={newTechnician.address}
            onChange={(e) => setNewTechnician({ ...newTechnician, address: e.target.value })}
            style={{ marginTop: '10px' }}
          />
          <Input
            placeholder="Zaměstnanecké ID"
            value={newTechnician.employeeId}
            onChange={(e) => setNewTechnician({ ...newTechnician, employeeId: e.target.value })}
            style={{ marginTop: '10px' }}
          />
          <Button type="primary" onClick={handleAddTechnician} style={{ marginTop: '10px' }} icon={<PlusOutlined />}>
            Přidat Technika
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="Upravit Technika"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveTechnician}
      >
        <Form layout="vertical">
          <Form.Item label="Jméno">
            <Input
              value={editingTechnician?.name || ''}
              onChange={(e) => setEditingTechnician({ ...editingTechnician, name: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Email">
            <Input
              value={editingTechnician?.email || ''}
              onChange={(e) => setEditingTechnician({ ...editingTechnician, email: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Telefon">
            <Input
              value={editingTechnician?.phone || ''}
              onChange={(e) => setEditingTechnician({ ...editingTechnician, phone: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Adresa">
            <Input
              value={editingTechnician?.address || ''}
              onChange={(e) => setEditingTechnician({ ...editingTechnician, address: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Zaměstnanecké ID">
            <Input
              value={editingTechnician?.employeeId || ''}
              onChange={(e) => setEditingTechnician({ ...editingTechnician, employeeId: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal for Viewing Tasks */}
      <Modal
        title="Úkoly Technika"
        visible={isTaskModalOpen}
        onCancel={() => setIsTaskModalOpen(false)}
        footer={<Button onClick={() => setIsTaskModalOpen(false)}>Zavřít</Button>}
        width={800}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => {
            const client = clients.find((c) => c.id === task.clientId);
            return (
              <Card key={task.id} style={{ marginBottom: '20px' }}>
                <Card.Meta
                  title={`Popis Úkolu: ${task.description}`}
                  description={`Datum splnění: ${new Date(task.dueDate).toLocaleString()}`}
                />
                {client && (
                  <div style={{ marginTop: '10px' }}>
                    <Typography.Text strong>Informace o Klientovi:</Typography.Text>
                    <div>Jméno: {client.name}</div>
                    <div>Email: {client.email}</div>
                    <div>Telefon: {client.phone}</div>
                    <div>Adresa: {client.address}</div>
                  </div>
                )}
                <div style={{ marginTop: '10px' }}>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => handleEditTask(task)}
                  >
                    Upravit
                  </Button>
                  <Button
                    type="danger"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteTask(task.id)}
                    style={{ marginLeft: '10px' }}
                  >
                    Smazat
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Typography>Žádné úkoly k zobrazení.</Typography>
        )}
      </Modal>

      {/* Modal for Viewing Reports */}
      <Modal
        title="Reporty Technika"
        visible={isReportModalOpen}
        onCancel={() => setIsReportModalOpen(false)}
        footer={<Button onClick={() => setIsReportModalOpen(false)}>Zavřít</Button>}
      >
        {reports.length > 0 ? (
          <ul>
            {reports.map((report) => (
              <li key={report.id}>
                {report.date} - {report.description}
              </li>
            ))}
          </ul>
        ) : (
          <Typography>Žádné reporty k zobrazení.</Typography>
        )}
      </Modal>

      {/* Modal for Adding or Editing a Task */}
      <Modal
        title={isEditMode ? 'Upravit Úkol' : 'Přidat Úkol Techniku'}
        visible={isAddTaskModalOpen}
        onCancel={() => setIsAddTaskModalOpen(false)}
        onOk={handleSaveTask}
      >
        <Form layout="vertical">
          <Form.Item label="Popis úkolu">
            <Input
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          <Form.Item label="Datum splnění">
          <DatePicker
  showTime
  value={newTask.dueDate ? dayjs(newTask.dueDate) : null}
  onChange={(date) => setNewTask({ ...newTask, dueDate: date?.toISOString() })}
  style={{ width: '100%' }}
/>
</Form.Item>


          </Form.Item>
          <Form.Item label="Klient">
            <Select
              value={newTask.clientId || ''}
              onChange={(value) => handleClientSelection(value)}
            >
              {clients.map((client) => (
                <Option key={client.id} value={client.id}>
                  {client.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Row gutter={[16, 16]}>
        {filteredTechnicians.map((technician) => (
          <Col key={technician.id} xs={24} sm={12} md={8}>
<Card
  title={`${technician.name} (${technician.employeeId})`}
  actions={[
    <div className="card-actions">
      <Button
        type="link"
        icon={<ProfileOutlined />}
        onClick={() => handleViewReports(technician.id)}
      >
        Zobrazit Reporty
      </Button>
      <Button
        type="link"
        icon={<FileTextOutlined />}
        onClick={() => handleViewTasks(technician.id)}
      >
        Zobrazit Úkoly
      </Button>
      <Button
        type="link"
        icon={<PlusOutlined />}
        onClick={() => handleAddTask(technician.id)}
      >
        Přidat Úkol
      </Button>
      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={() => handleEditTechnician(technician)}
      >
        Upravit
      </Button>
      <Button
        type="danger"
        icon={<DeleteOutlined />}
        onClick={() => handleDeleteTechnician(technician.id)}
      >
        Smazat
      </Button>
    </div>,
  ]}
  className="card" // Přidá třídu k celé kartě
>
  <p>Email: {technician.email}</p>
  <p>Telefon: {technician.phone}</p>
  <p>Adresa: {technician.address}</p>
</Card>



          </Col>
        ))}
      </Row>
    </div>
  );
}

export default Technicians;