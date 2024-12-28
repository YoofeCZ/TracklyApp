// src/pages/AddKnowHow.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Typography, Alert, Select, Modal, List, Popconfirm, message, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { createKnowHow, getTopics, createTopic, updateTopic, deleteTopic } from '../services/api';
import { useNavigate } from 'react-router-dom';
import ReactQuill, { Quill } from 'react-quill';
import ImageResize from 'quill-image-resize';
import 'react-quill/dist/quill.snow.css';
import imageCompression from 'browser-image-compression';
import "../css/Global.css";

// Registrace modulů
Quill.register('modules/imageResize', ImageResize);

// Rozšířený whitelist fontů
const Font = Quill.import('formats/font');
Font.whitelist = ['arial', 'times-new-roman', 'courier-new', 'verdana', 'georgia'];
Quill.register(Font, true);

const { Title } = Typography;
const { Option } = Select;

const AddKnowHow = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [topics, setTopics] = useState([]);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [isManageTopicsModalVisible, setIsManageTopicsModalVisible] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newTopicSeverity, setNewTopicSeverity] = useState(1); // Nový stav pro závažnost
  const [editorContent, setEditorContent] = useState('');
  const navigate = useNavigate();
  const autoSaveRef = useRef(null);

  // Přidaný stav pro modální potvrzení dostupnosti
  const [pendingData, setPendingData] = useState(null); // Data k odeslání po potvrzení
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);

  // Stav pro správu témat
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editingTopicName, setEditingTopicName] = useState('');
  const [editingTopicSeverity, setEditingTopicSeverity] = useState(1); // Nový stav pro editaci závažnosti

  // Definice funkce pro načtení témat
  const fetchTopics = async () => {
    try {
      const data = await getTopics();
      setTopics(data);
    } catch (error) {
      console.error('Chyba při načítání témat:', error);
      message.error('Chyba při načítání témat.');
    }
  };

  // Načtení témat při inicializaci komponenty
  useEffect(() => {
    fetchTopics();
  }, []);

  // Načtení obsahu z localStorage
  useEffect(() => {
    const savedContent = localStorage.getItem('knowHowContent');
    if (savedContent) {
      setEditorContent(savedContent);
    }
  }, []);

  // Auto-save
  useEffect(() => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    autoSaveRef.current = setTimeout(() => {
      localStorage.setItem('knowHowContent', editorContent);
      console.log('Obsah byl automaticky uložen');
    }, 2000);
    return () => clearTimeout(autoSaveRef.current);
  }, [editorContent]);

  const compressImagesInContent = async (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const images = doc.querySelectorAll('img');

    for (let img of images) {
      if (img.src.startsWith('data:')) {
        try {
          const file = await fetch(img.src).then((res) => res.blob());
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1024,
          });
          const compressedBase64 = await imageCompression.getDataUrlFromFile(compressedFile);
          img.src = compressedBase64;
        } catch (error) {
          console.error('Chyba při kompresi obrázku:', error);
        }
      }
    }

    return doc.body.innerHTML;
  };

  // Původní onFinish nyní pouze uloží data a ukáže modal pro dostupnost
  const onFinish = async (values) => {
    setLoading(true);
    setSuccess(null);
    setErrorMsg(null);

    try {
      const compressedContent = await compressImagesInContent(editorContent);
      const knowHowData = {
        topic: values.topic,
        system: values.system,
        content: compressedContent,
      };

      // Uložíme data do stavu a zobrazíme modal
      setPendingData(knowHowData);
      setAvailabilityModalVisible(true);
    } catch (error) {
      setErrorMsg('Chyba při přípravě dat.');
      setLoading(false);
    }
  };

  // Potvrzení dostupnosti v modal okně
  const handleAvailabilityConfirm = async (availableForClients) => {
    if (!pendingData) return;

    setLoading(true);
    setAvailabilityModalVisible(false);

    try {
      const finalData = { ...pendingData, availableForClients };
      await createKnowHow(finalData);

      setSuccess('Know How bylo úspěšně přidáno.');
      form.resetFields();
      setEditorContent('');
      localStorage.removeItem('knowHowContent');
      setPendingData(null);
      fetchTopics(); // Aktualizovat témata po přidání Know How, pokud je to potřeba
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Chyba při přidávání Know How.');
    } finally {
      setLoading(false);
    }
  };

  // Funkce pro přidání nového tématu
  const handleAddTopic = async () => {
    if (newTopic.trim() && newTopicSeverity >=1 && newTopicSeverity <=10) {
      try {
        await createTopic({ name: newTopic.trim(), severity: newTopicSeverity }); // Poslat 'severity'
        const updatedTopics = await getTopics();
        setTopics(updatedTopics);
        setNewTopic('');
        setNewTopicSeverity(1); // Resetovat závažnost
        setIsCreateTopicModalOpen(false);
        message.success('Nové téma bylo úspěšně vytvořeno.');
      } catch (error) {
        console.error('Chyba při přidávání tématu:', error);
        message.error(error.response?.data?.message || 'Chyba při přidávání tématu.');
      }
    } else {
      message.error('Téma nemůže být prázdné a závažnost musí být mezi 1 a 10.');
    }
  };

  // Funkce pro úpravu tématu
  const handleEditTopic = (topic) => {
    setEditingTopicId(topic.id);
    setEditingTopicName(topic.name);
    setEditingTopicSeverity(topic.severity); // Nastavit aktuální závažnost
  };

  const handleUpdateTopic = async () => {
    if (!editingTopicName.trim()) {
      message.error('Název tématu nemůže být prázdný.');
      return;
    }
    if (editingTopicSeverity <1 || editingTopicSeverity >10) {
      message.error('Závažnost musí být mezi 1 a 10.');
      return;
    }
    try {
      await updateTopic(editingTopicId, { name: editingTopicName.trim(), severity: editingTopicSeverity });
      message.success('Téma bylo úspěšně upraveno.');
      setEditingTopicId(null);
      setEditingTopicName('');
      setEditingTopicSeverity(1);
      const updatedTopics = await getTopics();
      setTopics(updatedTopics);
    } catch (error) {
      console.error('Chyba při aktualizaci tématu:', error);
      message.error(error.response?.data?.message || 'Chyba při aktualizaci tématu.');
    }
  };

  // Funkce pro mazání tématu
  const handleDeleteTopic = async (id) => {
    try {
      await deleteTopic(id);
      message.success('Téma bylo úspěšně odstraněno.');
      const updatedTopics = await getTopics();
      setTopics(updatedTopics);
    } catch (error) {
      console.error('Chyba při odstraňování tématu:', error);
      message.error(error.response?.data?.message || 'Chyba při odstraňování tématu.');
    }
  };

  const modules = {
    toolbar: {
      container: [
        [
          { 'font': ['arial', 'times-new-roman', 'courier-new', 'verdana', 'georgia'] },
          { 'size': ['small', false, 'large', 'huge'] }
        ],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        [{ 'blockquote': true }, { 'code-block': true }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'direction': 'rtl' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
    },
    imageResize: {
      modules: ['Resize'],
    },
  };

  const formats = [
    'font',
    'size',
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'script',
    'blockquote',
    'code-block',
    'list',
    'bullet',
    'direction',
    'align',
    'link',
    'image',
    'video',
  ];

  return (
    <div className="add-knowhow-container">
      <Title level={2}>Přidat Know How</Title>
      {success && <Alert message={success} type="success" showIcon closable className="alert-message" />}
      {errorMsg && <Alert message={errorMsg} type="error" showIcon closable className="alert-message" />}
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <Button type="default" onClick={() => setIsCreateTopicModalOpen(true)} icon={<PlusOutlined />}>
            Vytvořit nové téma
          </Button>
          <Button type="default" onClick={() => setIsManageTopicsModalVisible(true)} icon={<EditOutlined />}>
            Upravit témata
          </Button>
        </div>

        <Form.Item
          label="Téma"
          name="topic"
          rules={[{ required: true, message: 'Prosím zadejte téma' }]}
        >
          <Select showSearch placeholder="Vyberte téma" optionFilterProp="children" allowClear>
            {topics.map((topic) => (
              <Option key={topic.id} value={topic.name}>
                {topic.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Systém"
          name="system"
          rules={[{ required: true, message: 'Prosím vyberte systém' }]}
        >
          <Select placeholder="Vyberte systém">
            <Option value="Solar Edge">Solar Edge</Option>
            <Option value="Solax">Solax</Option>
            <Option value="GoodWe">GoodWe</Option>
            <Option value="Victron">Victron</Option>
          </Select>
        </Form.Item>

        {/* Závažnost je automaticky přiřazena na backendu, takže není potřeba ji zobrazovat klientovi */}
        {/* Skryté pole pro závažnost, aby bylo možné ho předat, pokud je potřeba */}
        <Form.Item
          name="severity"
          hidden
        >
          <InputNumber min={1} max={10} />
        </Form.Item>

        <Form.Item
          label={
            <div className="editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Obsah Know How</span>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="submit-button"
              >
                Přidat Know How
              </Button>
            </div>
          }
          name="content"
          rules={[{ required: true, message: 'Prosím zadejte obsah Know How' }]}
        >
          <ReactQuill
            theme="snow"
            value={editorContent}
            onChange={setEditorContent}
            modules={modules}
            formats={formats}
            placeholder="Detailní nápověda..."
            className="react-quill-editor"
            style={{ backgroundColor: 'white' }} // Bílé pozadí
          />
        </Form.Item>
      </Form>

      {/* Modal pro vytváření nového tématu */}
      <Modal
        title="Vytvořit nové téma"
        visible={isCreateTopicModalOpen}
        onOk={handleAddTopic}
        onCancel={() => setIsCreateTopicModalOpen(false)}
        okText="Vytvořit"
        cancelText="Zrušit"
      >
        <Form layout="vertical">
          <Form.Item
            label="Název tématu"
            required
          >
            <Input
              placeholder="Zadejte nové téma"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onPressEnter={handleAddTopic}
            />
          </Form.Item>
          <Form.Item
            label="Závažnost"
            required
          >
            <InputNumber
              min={1}
              max={10}
              value={newTopicSeverity}
              onChange={(value) => setNewTopicSeverity(value)}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal pro správu témat */}
      <Modal
        title="Správa Témat"
        visible={isManageTopicsModalVisible}
        onCancel={() => setIsManageTopicsModalVisible(false)}
        footer={null}
        width={600}
      >
        <List
          bordered
          dataSource={topics}
          renderItem={item => (
            <List.Item
              actions={[
                editingTopicId === item.id ? (
                  <>
                    <Input
                      value={editingTopicName}
                      onChange={(e) => setEditingTopicName(e.target.value)}
                      style={{ marginRight: '8px' }}
                    />
                    <InputNumber
                      min={1}
                      max={10}
                      value={editingTopicSeverity}
                      onChange={(value) => setEditingTopicSeverity(value)}
                      style={{ width: '60px', marginRight: '8px' }}
                    />
                    <Button type="link" onClick={handleUpdateTopic} icon={<EditOutlined />}>
                      Uložit
                    </Button>
                    <Button type="link" onClick={() => {
                      setEditingTopicId(null);
                      setEditingTopicName('');
                      setEditingTopicSeverity(1);
                    }} icon={<DeleteOutlined />}>
                      Zrušit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="link" onClick={() => handleEditTopic(item)} icon={<EditOutlined />}>
                      Upravit
                    </Button>
                    <Popconfirm
                      title="Opravdu chcete odstranit toto téma?"
                      onConfirm={() => handleDeleteTopic(item.id)}
                      okText="Ano"
                      cancelText="Ne"
                    >
                      <Button type="link" danger icon={<DeleteOutlined />}>
                        Smazat
                      </Button>
                    </Popconfirm>
                  </>
                )
              ]}
            >
              {editingTopicId === item.id ? null : (
                <List.Item.Meta
                  title={item.name}
                  description={`Závažnost: ${item.severity}`}
                />
              )}
              {editingTopicId === item.id && (
                <List.Item.Meta
                  title={`Závažnost: ${item.severity}`}
                />
              )}
            </List.Item>
          )}
        />
      </Modal>

      {/* Modal pro dostupnost pro klienty */}
      <Modal
        title="Dostupnost pro klienty"
        visible={availabilityModalVisible}
        onCancel={() => setAvailabilityModalVisible(false)}
        footer={[
          <Button key="only-tech" onClick={() => handleAvailabilityConfirm(false)}>
            Pouze pro techniky
          </Button>,
          <Button key="tech-clients" type="primary" onClick={() => handleAvailabilityConfirm(true)}>
            Pro techniky i klienty
          </Button>,
        ]}
      >
        <p>Chcete zpřístupnit tento Know How také klientům?</p>
      </Modal>
    </div>
  );
};

export default AddKnowHow;
