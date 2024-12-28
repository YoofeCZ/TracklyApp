// src/pages/CreateTicket.js

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message, Typography, Modal, Spin, Radio } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getTicketTopics, getKnowHowForTopic, createTicket, createTopic, getSystems, getClientInfo } from '../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const CreateTicket = () => {
  const [form] = Form.useForm();
  const [topics, setTopics] = useState([]);
  const [knowHows, setKnowHows] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [system, setSystem] = useState(''); // Automatické vyplnění systému klienta
  const [selectedKnowHowId, setSelectedKnowHowId] = useState(null);
  const [showDescription, setShowDescription] = useState(false);
  const [noKnowHowMessage, setNoKnowHowMessage] = useState(''); // Nový stav pro zprávu

  // Stavové proměnné pro různá modální okna
  const [isKnowHowModalOpen, setIsKnowHowModalOpen] = useState(false);
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState('');

  // Stav pro seznam systémů
  const [systems, setSystems] = useState([]);

  // Stav pro načítání dat při inicializaci
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Načtení seznamu systémů
        const systemsData = await getSystems();
        console.log('Systems Data:', systemsData); // Debug
        setSystems(systemsData);

        // Načtení informací o klientovi
        const clientInfo = await getClientInfo();
        console.log('Client Data:', clientInfo); // Debug

        // Najít systém podle systemId
        const clientSystem = systemsData.find(sys => sys.id === clientInfo.systemId);
        if (clientSystem) {
          console.log('Client System:', clientSystem); // Debug
          setSystem(clientSystem.name); // Nastavení systému klienta
          form.setFieldsValue({ system: clientSystem.name });
          console.log('Form System Value Set:', clientSystem.name); // Debug
        } else {
          console.warn('Client system not found in systemsData');
          form.setFieldsValue({ system: undefined });
        }

        // Načtení seznamu témat relevantních pro systém klienta
        const topicsData = await getTicketTopics();
        console.log('Topics Data:', topicsData); // Debug
        setTopics(topicsData);

        setDataLoading(false); // Data jsou načtena
      } catch (error) {
        console.error('Chyba při načítání dat:', error);
        message.error('Chyba při načítání dat.');
        setDataLoading(false);
      }
    };

    fetchData();
  }, [form]);

  // Funkce pro změnu tématu
  const handleTopicChange = async (value) => {
    setSelectedTopic(value);
    setShowDescription(false); // Resetovat popis problému při změně tématu
    setNoKnowHowMessage(''); // Resetovat zprávu
    console.log('Selected Topic:', value); // Debug

    try {
      const knowHowsData = await getKnowHowForTopic(value);
      console.log('KnowHows Data:', knowHowsData); // Debug

      if (Array.isArray(knowHowsData) && knowHowsData.length > 0) {
        setKnowHows(knowHowsData);
        setIsKnowHowModalOpen(true);
      } else {
        // Pokud KnowHows nejsou dostupné, zobrazit zprávu a pole pro popis
        setKnowHows([]);
        setShowDescription(true);
        setNoKnowHowMessage('Pro toto téma není dostupné žádné Know-How. Prosím, popište svůj problém.');
      }
    } catch (error) {
      console.error('Chyba při načítání Know How:', error);
      setKnowHows([]);
      setShowDescription(false);
      // Pokud je chyba 404, znamená to, že Know-How není dostupné
      if (error.response && error.response.status === 404) {
        setNoKnowHowMessage('Pro toto téma není dostupné žádné Know-How. Prosím, popište svůj problém.');
        setShowDescription(true);
      } else {
        message.error('Chyba při načítání Know How.');
      }
    }
  };

  // Funkce pro potvrzení, že Know-How pomohlo
  const handleHelped = async () => {
    setLoading(true);
    try {
      const ticketData = {
        topic: selectedTopic,
        system: system,
        knowHowId: selectedKnowHowId,
        status: 'resolved', // Vytvoření tiketu jako vyřešeného
      };
      console.log('Creating Resolved Ticket:', ticketData); // Debug
      await createTicket(ticketData);
      message.success('Tiket byl úspěšně vytvořen jako vyřešený.');
      form.resetFields();
      setSelectedKnowHowId(null);
      setIsKnowHowModalOpen(false);
      setKnowHows([]);
    } catch (error) {
      console.error('Chyba při vytváření tiketu:', error);
      message.error(`Chyba při vytváření tiketu: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funkce pro potřebu další pomoci
  const handleNeedMoreHelp = () => {
    setIsKnowHowModalOpen(false); // Zavřít modal
    setShowDescription(true); // Zobrazit pole pro popis problému
  };

  // Funkce pro vytvoření nevyřešeného tiketu
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const ticketData = {
        topic: values.topic,
        system: system,
        description: values.description,
        status: 'open', // Vytvoření tiketu jako nevyřešeného
      };
      console.log('Creating Unresolved Ticket:', ticketData); // Debug
      await createTicket(ticketData);
      message.success('Tiket byl úspěšně vytvořen.');
      form.resetFields();
      setShowDescription(false);
      setNoKnowHowMessage('');
    } catch (error) {
      console.error('Chyba při vytváření tiketu:', error);
      message.error(`Chyba při vytváření tiketu: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Funkce pro přidání nového tématu
  const handleAddTopic = async () => {
    if (newTopic.trim()) {
      try {
        console.log('Creating New Topic:', newTopic); // Debug
        await createTopic(newTopic.trim());
        const updatedTopics = await getTicketTopics();
        console.log('Updated Topics:', updatedTopics); // Debug
        setTopics(updatedTopics);
        setNewTopic('');
        setIsCreateTopicModalOpen(false);
        message.success('Nové téma bylo úspěšně vytvořeno.');
      } catch (error) {
        console.error('Chyba při přidávání tématu:', error);
        message.error(error.response?.data?.message || 'Chyba při přidávání tématu.');
      }
    } else {
      message.warning('Téma nemůže být prázdné.');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <Title level={2}>Vytvořit nový tiket</Title>

      {dataLoading ? (
        <Spin tip="Načítání dat..." />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >

          <Form.Item
            label="Téma"
            name="topic"
            rules={[{ required: true, message: 'Prosím vyberte téma' }]}
          >
            <Select
              showSearch
              placeholder="Vyberte téma"
              optionFilterProp="children"
              onChange={handleTopicChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              allowClear
            >
              {topics.map((topic) => (
                <Option key={topic.id} value={topic.name}>
                  {topic.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Automatický výběr systému */}
          <Form.Item
            label="Systém"
            name="system"
            rules={[
              { required: true, message: 'Prosím vyberte systém' },
            ]}
          >
            <Select placeholder="Vyberte systém" disabled>
              {systems.map((sys) => (
                <Option key={sys.id} value={sys.name}>
                  {sys.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Zobrazení zprávy, pokud není dostupné Know-How */}
          {noKnowHowMessage && (
            <Form.Item>
              <Text type="warning">{noKnowHowMessage}</Text>
            </Form.Item>
          )}

          {showDescription && (
            <>
              <Form.Item
                label="Popis problému"
                name="description"
                rules={[{ required: true, message: 'Prosím zadejte popis problému' }]}
              >
                <Input.TextArea rows={4} placeholder="Popište svůj problém" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Odeslat tiket
                </Button>
              </Form.Item>
            </>
          )}
        </Form>
      )}

      {/* Modal pro zobrazení Know-How a akčních tlačítek */}
      <Modal
        title={
          <div>
            <Title level={4} style={{ marginBottom: '8px' }}>Know-How</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Pokud vám nápověda pomohla, vyberte odpovídající Know-How a klikněte na tlačítko "To mi pomohlo".
            </Text>
          </div>
        }
        visible={isKnowHowModalOpen && knowHows.length > 0}
        onCancel={() => setIsKnowHowModalOpen(false)}
        footer={[
          <Button
            key="helped"
            type="primary"
            onClick={handleHelped}
            loading={loading}
            disabled={selectedKnowHowId === null} // Tlačítko aktivní jen při výběru Know-How
          >
            To mi pomohlo
          </Button>,
          <Button
            key="needMoreHelp"
            type="default"
            onClick={handleNeedMoreHelp}
          >
            Potřebuji další pomoc
          </Button>,
        ]}
      >
        <Radio.Group
          onChange={(e) => setSelectedKnowHowId(e.target.value)}
          value={selectedKnowHowId}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {knowHows.map((kh) => (
            <Radio
              key={kh.id}
              value={kh.id}
              style={{ 
                marginBottom: '16px', 
                textAlign: 'left', 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '4px',
                cursor: 'pointer', // Zajistí, že celý rámeček je klikací
              }}
            >
              <Typography.Text strong>{kh.title}</Typography.Text>
              <div
                dangerouslySetInnerHTML={{ __html: kh.content }}
                style={{ marginTop: '8px' }}
              />
            </Radio>
          ))}
        </Radio.Group>
      </Modal>

    </div>
  );
};

export default CreateTicket;
