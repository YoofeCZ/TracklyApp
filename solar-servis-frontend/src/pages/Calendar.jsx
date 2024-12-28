// src/pages/CalendarPage.js
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react'; // React komponenta
import dayGridPlugin from '@fullcalendar/daygrid'; // Zobrazení měsíce
import timeGridPlugin from '@fullcalendar/timegrid'; // Zobrazení týdne/dne
import interactionPlugin from '@fullcalendar/interaction'; // Pro interakce (kliknutí)
import { Modal, Form, Input, Select, DatePicker, Button, message, Typography, Popconfirm } from 'antd';
import { getTasks, createTask, updateTask, deleteTask, getClients, getTechnicians } from '../services/api';
import dayjs from 'dayjs';
import '../css/Global.css'; // Vytvoříme vlastní CSS pro kontextové menu a další styly

const { Option } = Select;
const { TextArea } = Input;

const CalendarPage = () => {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    description: '',
    dueDate: '',
    clientId: '',
    technicianId: '',
    type: 'task',
    subtasks: [],
  });
  const [form] = Form.useForm();
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, clientsData, techniciansData] = await Promise.all([
          getTasks(),
          getClients(),
          getTechnicians(),
        ]);
        setTasks(tasksData);
        setClients(clientsData);
        setTechnicians(techniciansData);
      } catch (error) {
        message.error('Chyba při načítání dat.');
      }
    };

    fetchData();
  }, []);

  const handleDateClick = (arg) => {
    setSelectedTask(null); // Reset selected task
    setNewTask({
      description: '',
      dueDate: dayjs(arg.date).format('YYYY-MM-DD HH:mm'),
      clientId: '',
      technicianId: '',
      type: 'task',
      subtasks: [],
    });
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const taskId = clickInfo.event.id;
    const task = tasks.find((t) => t.id === parseInt(taskId));
    if (task) {
      setSelectedTask(task);
      setNewTask(task);
      form.setFieldsValue({
        description: task.description,
        dueDate: dayjs(task.dueDate),
        clientId: task.clientId,
        technicianId: task.technicianId,
        type: task.type,
        subtasks: task.subtasks || [],
      });
      setIsModalOpen(true);
    }
  };

  const handleSaveTask = async () => {
    try {
      const values = await form.validateFields();
      const taskData = {
        ...newTask,
        description: values.description,
        dueDate: values.dueDate.format('YYYY-MM-DD HH:mm'),
        clientId: values.clientId,
        technicianId: values.technicianId,
        type: values.type,
        subtasks: values.subtasks || [],
      };

      if (taskData.id) {
        // Aktualizace existujícího úkolu
        await updateTask(taskData.id, taskData);
        message.success('Úkol byl úspěšně aktualizován.');
      } else {
        // Vytvoření nového úkolu
        await createTask(taskData);
        message.success('Úkol byl úspěšně vytvořen.');
      }

      // Reload tasks
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
      setIsModalOpen(false);
    } catch (error) {
      message.error('Chyba při ukládání úkolu.');
      console.error('Chyba při ukládání:', error);
    }
  };

  // Funkce pro získání barvy na základě stavu
  const getStatusColor = (status) => {
    switch (status) {
      case 'missed':
        return 'red';
      case 'in_progress':
        return 'blue';
      case 'completed':
        return 'green';
      default:
        return 'gray';
    }
  };

  // Definice handleSubtaskToggle
  const handleSubtaskToggle = async (index) => {
    if (!selectedTask) return;

    const updatedSubtasks = [...selectedTask.subtasks];
    updatedSubtasks[index].completed = true;

    // Zkontroluj, zda jsou všechny podúkoly splněné
    const allCompleted = updatedSubtasks.every((subtask) => subtask.completed);

    try {
      // Aktualizace úkolu na backendu
      await updateTask(selectedTask.id, {
        ...selectedTask,
        subtasks: updatedSubtasks,
        status: allCompleted ? 'completed' : selectedTask.status,
      });

      message.success('Podúkol byl označen jako splněný.');

      // Aktualizuj úkoly v seznamu
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);

      // Aktualizuj detail aktuálně vybraného úkolu
      setSelectedTask({
        ...selectedTask,
        subtasks: updatedSubtasks,
        status: allCompleted ? 'completed' : selectedTask.status,
      });
    } catch (error) {
      message.error('Chyba při aktualizaci podúkolu.');
      console.error('Chyba při aktualizaci podúkolu:', error);
    }
  };

  // Přidání vlastní funkce pro pravý klik na události
  const handleEventContextMenu = (event) => {
    event.preventDefault();
    const taskId = event.currentTarget.getAttribute('data-task-id');
    const task = tasks.find((t) => t.id === parseInt(taskId));
    if (task) {
      setSelectedTask(task);
      setIsDetailModalOpen(true);
    }
  };

  // Funkce pro smazání úkolu
  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      await deleteTask(selectedTask.id);
      message.success('Úkol byl úspěšně smazán.');
      
      // Aktualizace seznamu úkolů
      const updatedTasks = await getTasks();
      setTasks(updatedTasks);
      
      // Zavření detailního modalu
      setIsDetailModalOpen(false);
    } catch (error) {
      message.error('Chyba při mazání úkolu.');
      console.error('Chyba při mazání úkolu:', error);
    }
  };

  // Převedení úkolů na události pro kalendář
  const events = tasks.map((task) => ({
    id: task.id,
    title: task.description,
    start: task.dueDate,
    allDay: false,
    backgroundColor: getStatusColor(task.status),
    borderColor: getStatusColor(task.status),
    extendedProps: {
      ...task,
    },
  }));

  return (
    <div onContextMenu={(e) => e.preventDefault()}> {/* Zakázání výchozího kontextového menu na celém komponentu */}
      <Typography.Title level={2}>Kalendář Úkolů a Servisů</Typography.Title>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDidMount={(info) => {
          // Přidání pravého kliknutí na událost
          info.el.setAttribute('data-task-id', info.event.id);
          info.el.addEventListener('contextmenu', handleEventContextMenu);
        }}
        selectable={true}
        editable={false}
        height="auto"
      />

      {/* Modal pro přidání/úpravu úkolu */}
      <Modal
        title={newTask.id ? 'Upravit Úkol/Servis' : 'Přidat Úkol/Servis'}
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveTask}
        okText="Uložit"
        width={800}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'task' }}>
          <Form.Item label="Typ" name="type" rules={[{ required: true, message: 'Vyberte typ úkolu.' }]}>
            <Select onChange={(value) => setNewTask({ ...newTask, type: value })}>
              <Option value="task">Úkol</Option>
              <Option value="service">Servis</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Popis"
            name="description"
            rules={[{ required: true, message: 'Zadejte popis úkolu.' }]}
          >
            <TextArea rows={3} maxLength={255} />
          </Form.Item>

          {form.getFieldValue('type') === 'task' && (
            <Form.List name="subtasks">
              {(fields, { add, remove }) => (
                <div>
                  <Typography.Title level={5}>Podúkoly</Typography.Title>
                  {fields.map((field) => (
                    <div key={field.key} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'description']}
                        fieldKey={[field.fieldKey, 'description']}
                        rules={[{ required: true, message: 'Zadejte popis podúkolu.' }]}
                        style={{ flex: 1, marginRight: 8 }}
                      >
                        <Input placeholder="Popis podúkolu" />
                      </Form.Item>
                      <Button type="danger" onClick={() => remove(field.name)}>
                        Odstranit
                      </Button>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block>
                      Přidat podúkol
                    </Button>
                  </Form.Item>
                </div>
              )}
            </Form.List>
          )}

          <Form.Item
            label="Termín"
            name="dueDate"
            rules={[{ required: true, message: 'Zadejte termín úkolu.' }]}
          >
            <DatePicker
              showTime={{ minuteStep: 15 }}
              format="YYYY-MM-DD HH:mm"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          {form.getFieldValue('type') !== 'task' && (
            <Form.Item label="Klient" name="clientId">
              <Select placeholder="Vyberte klienta (volitelně)">
                {clients.map((client) => (
                  <Option key={client.id} value={client.id}>
                    {client.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label="Technik"
            name="technicianId"
            rules={[{ required: true, message: 'Vyberte technika.' }]}
          >
            <Select placeholder="Vyberte technika">
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
        visible={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Popconfirm
            title="Opravdu chcete smazat tento úkol?"
            onConfirm={handleDeleteTask}
            okText="Ano"
            cancelText="Ne"
            key="delete-confirm"
          >
            <Button key="delete" type="danger">
              Smazat Úkol
            </Button>
          </Popconfirm>,
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Zavřít
          </Button>,
        ]}
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
            <Typography>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(selectedTask.status),
                    marginRight: '8px',
                  }}
                ></span>
                {selectedTask.status === 'upcoming'
                  ? 'Nadcházející'
                  : selectedTask.status === 'in_progress'
                  ? 'Probíhá'
                  : selectedTask.status === 'completed'
                  ? 'Splněný'
                  : selectedTask.status === 'missed'
                  ? 'Nesplněný'
                  : 'Neznámý'}
              </span>
            </Typography>

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

export default CalendarPage;
