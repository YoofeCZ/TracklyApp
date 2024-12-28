//Frontednd/Clients.js
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Typography, message, Popconfirm } from 'antd';
import { getClients, createClient,deleteClient, updateClient, registerClient } from '../services/api';
import { useLocation } from 'react-router-dom';
import { Select } from 'antd';
import { getSystems } from '../services/api';
import FileManager from '../components/FileManager';
import moment from 'moment';

let API_URL;

if (window.location.hostname === 'localhost') {
  API_URL = 'http://localhost:5000/api'; // Lokální prostředí
} else if (window.location.hostname.startsWith('192.168')) {
  API_URL = 'http://192.168.0.101:5000/api'; // Interní IP
} else {
  API_URL = 'http://188.175.32.34/api'; // Veřejná IP
}

const Clients = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || ''; // Načtení výchozího vyhledávacího termínu
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]); // Pro filtrované klienty
  const [files] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]); // Pro filtrované soubory
  const [clientSearchTerm, setClientSearchTerm] = useState(initialSearch); // Vyhledávání klientů
  const [fileSearchTerm] = useState(''); // Vyhledávání souborů
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [systems, setSystems] = useState([]);
  const [isFileManagerVisible, setIsFileManagerVisible] = useState(false);
  const [registeringClients, setRegisteringClients] = useState([]); // Stav pro sledování registrací

  const [newClient, setNewClient] = useState({  
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    opCode: '',
    systemId: '', // Přidání pole opCode
  });

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const systemsData = await getSystems();
        setSystems(systemsData);
      } catch (error) {
        console.error('Chyba při načítání systémů:', error);
      }
    };
  
    fetchSystems();
  }, []);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
        setFilteredClients(data); // Inicializujeme filtrované klienty
        setClientSearchTerm(initialSearch); // Nastavení výchozího vyhledávání
      } catch (error) {
        console.error('Chyba při načítání klientů:', error);
      }
    };
  
    fetchClients();
  }, [initialSearch]); // Pouze jednou při mountnutí komponenty
  
  
  useEffect(() => {
    if (clientSearchTerm.trim() === '') {
      setFilteredClients(clients); // Pokud není zadán vyhledávací termín, zobrazíme všechny klienty
    } else {
      const lowerCaseSearchTerm = clientSearchTerm.toLowerCase();
      const filtered = clients.filter((client) =>
        (client.name || '').toLowerCase().includes(lowerCaseSearchTerm) ||
        (client.email || '').toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [clientSearchTerm, clients]);
  
  useEffect(() => {
    if (fileSearchTerm.trim() === '') {
      setFilteredFiles(files);
    } else {
      const lowerCaseSearchTerm = fileSearchTerm.toLowerCase();
      const filtered = files.filter((file) =>
        file.name.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredFiles(filtered);
    }
  }, [fileSearchTerm, files]);
  
  
  // Handler pro registraci klienta
  const handleRegisterClient = async (clientId, clientName, clientEmail) => {
    try {
      setRegisteringClients((prev) => [...prev, clientId]); // Přidání klienta do seznamu načítajících se
      const response = await registerClient(clientId);
      message.success('Klient byl úspěšně registrován a e-mail byl odeslán.');
      
      // Aktualizace klientů
      const updatedClients = await getClients();
      setClients(updatedClients);
    } catch (error) {
      message.error(`Chyba při registraci klienta: ${error.response?.data?.message || error.message}`);
    } finally {
      setRegisteringClients((prev) => prev.filter(id => id !== clientId)); // Odstranění klienta z načítajících se
    }
  };

  const handleAddClient = async () => {
    try {
      const clientData = {
        ...newClient,
        systemId: newClient.systemId,
      };
      const response = await createClient(clientData);
      console.log(response);
      message.success('Klient úspěšně přidán!');
      setIsModalOpen(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
        opCodes: [],
        systemId: '',
      }); // Reset
      const updatedClients = await getClients();
      setClients(updatedClients);
    } catch (error) {
      message.error('Chyba při přidávání klienta.');
      console.error('Chyba při přidávání klienta:', error);
    }
  };
  
  
  
  const handleDeleteClient = async (clientId) => {
    try {
      await deleteClient(clientId); // Volání API pro smazání klienta
      message.success('Klient úspěšně smazán!');
      setClients((prevClients) =>
        prevClients.filter((client) => client.id !== clientId)
      );
    } catch (error) {
      message.error('Chyba při mazání klienta.');
      console.error('Chyba při mazání klienta:', error);
    }
  };
  

  
  const handleUpdateClient = async () => {
    try {
      const clientData = {
        ...currentClient,
        systemId: currentClient.systemId || (currentClient.system && currentClient.system.id),
      };
      await updateClient(currentClient.id, clientData);
      message.success('Klient úspěšně aktualizován!');
      setClients((prevClients) =>
        prevClients.map((client) =>
          client.id === currentClient.id ? { ...client, ...clientData } : client
        )
      );
      setIsModalOpen(false);
      setCurrentClient(null); // Reset aktuálního klienta
    } catch (error) {
      message.error('Chyba při aktualizaci klienta.');
      console.error('Chyba při aktualizaci klienta:', error);
    }
  };
  
  

  
  const handleEditClient = (client) => {
    setCurrentClient(client); // Nastaví klienta k úpravě
    setIsModalOpen(true); // Otevře modal pro úpravu
  };

  const handleShowFileManager = (client) => {
    setCurrentClient(client); // Nastaví aktuálního klienta
    setIsFileManagerVisible(true); // Zobrazí modál
  };
  

  const columns = [
    {
      title: 'Jméno',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'E-mail',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Adresa',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Systém',
      key: 'system',
      render: (text, client) => client.system ? client.system.name : '',
    },
    {
      title: 'Firma',
      dataIndex: 'company',
      key: 'company',
      render: (company) => company || '',
    },
    
    {
      title: "OP",
      dataIndex: "opCodes",
      key: "opCodes",
      render: (opCodes) => (opCodes && opCodes.length > 0 ? opCodes[0] : "N/A"), // Zobrazí první OP kód nebo "N/A"
    },
    {
      title: 'Revizní zpráva',
      key: 'revisionInfo',
      render: (text, client) => {
        if (client.revisionExpirationDate) {
          return `Do ${moment(client.revisionExpirationDate).format('DD.MM.YYYY')}`;
        } else {
          return 'Žádná revizní zpráva';
        }
      },
    },
    {
      title: 'Servisní smlouva',
      key: 'contractInfo',
      render: (text, client) => {
        if (client.contractNextServiceDate) {
          return `Další servis: ${moment(client.contractNextServiceDate).format('DD.MM.YYYY')}`;
        } else {
          return 'Žádná servisní smlouva';
        }
      },
    },
        
    {
      title: 'Akce',
      key: 'action',
      render: (text, client) => (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button type="link" onClick={() => handleEditClient(client)}>
            Upravit Klienta
          </Button>
          <Button type="link" onClick={() => handleShowFileManager(client)}>
            Zobrazit Soubory
          </Button>
          <Button type="link" danger onClick={() => handleDeleteClient(client.id)}>
            Smazat Klienta
          </Button>
          {/* Nové tlačítko pro registraci */}
          {!client.userId && (
            <Popconfirm
              title="Opravdu chcete zaregistrovat tohoto klienta?"
              onConfirm={() => handleRegisterClient(client.id, client.name, client.email)}
              okText="Ano"
              cancelText="Ne"
            >
              <Button type="primary" loading={registeringClients.includes(client.id)}>
                Registrovat
              </Button>
            </Popconfirm>
          )}
          {client.userId && (
            <Typography.Text type="success">Registrován</Typography.Text>
          )}
        </div>
      ),
    },
    
  ];
  
  
  
  

  return (
    <div style={{ padding: '20px' }}>
      <Typography.Title level={2}>Klienti</Typography.Title>
      <Input
        placeholder="Vyhledat klienta"
        value={clientSearchTerm}
        onChange={(e) => setClientSearchTerm(e.target.value)}
        style={{ marginBottom: '20px' }}
      />
      <Button type="primary" onClick={() => setIsModalOpen(true)} style={{ marginBottom: '20px' }}>
        Přidat Nového Klienta
      </Button>
      <Table dataSource={filteredClients} columns={columns} rowKey="id" />

      <Modal
  title={currentClient ? "Upravit Klienta" : "Přidat Nového Klienta"}
  open={isModalOpen}
  onOk={currentClient ? handleUpdateClient : handleAddClient}
  onCancel={() => {
    setIsModalOpen(false);
    setCurrentClient(null); // Reset aktuálního klienta
  }}
  okText={currentClient ? "Upravit" : "Přidat"}
  cancelText="Zrušit"
>
  <Form layout="vertical">
    <Form.Item label="Jméno">
      <Input
        value={currentClient?.name || newClient.name}
        onChange={(e) =>
          currentClient
            ? setCurrentClient({ ...currentClient, name: e.target.value })
            : setNewClient({ ...newClient, name: e.target.value })
        }
      />
    </Form.Item>
    <Form.Item label="E-mail">
      <Input
        value={currentClient?.email || newClient.email}
        onChange={(e) =>
          currentClient
            ? setCurrentClient({ ...currentClient, email: e.target.value })
            : setNewClient({ ...newClient, email: e.target.value })
        }
      />
    </Form.Item>
    <Form.Item label="Telefon">
      <Input
        value={currentClient?.phone || newClient.phone}
        onChange={(e) =>
          currentClient
            ? setCurrentClient({ ...currentClient, phone: e.target.value })
            : setNewClient({ ...newClient, phone: e.target.value })
        }
      />
    </Form.Item>
    <Form.Item label="Adresa">
  <Input
    value={currentClient?.address || newClient.address}
    onChange={(e) =>
      currentClient
        ? setCurrentClient({ ...currentClient, address: e.target.value })
        : setNewClient({ ...newClient, address: e.target.value })
    }
  />
</Form.Item>

<Form.Item label="Systém" required>
  <Select
    value={
      currentClient
        ? currentClient.systemId || (currentClient.system && currentClient.system.id)
        : newClient.systemId
    }
    onChange={(value) =>
      currentClient
        ? setCurrentClient({ ...currentClient, systemId: value })
        : setNewClient({ ...newClient, systemId: value })
    }
    placeholder="Vyberte systém"
  >
    {systems.map((system) => (
      <Select.Option key={system.id} value={system.id}>
        {system.name}
      </Select.Option>
    ))}
  </Select>
</Form.Item>


    <Form.Item label="Firma (volitelné)">
      <Input
        value={currentClient?.company || newClient.company}
        onChange={(e) =>
          currentClient
            ? setCurrentClient({ ...currentClient, company: e.target.value })
            : setNewClient({ ...newClient, company: e.target.value })
        }
      />
    </Form.Item>
    <Form.Item
  label="OP (volitelné)"
  validateStatus={
    (currentClient?.opCodes && currentClient.opCodes.some((op) => !/^[a-zA-Z0-9-]+$/.test(op))) ||
    (newClient.opCodes && newClient.opCodes.some((op) => !/^[a-zA-Z0-9-]+$/.test(op)))
      ? 'error'
      : ''
  }
  help={
    (currentClient?.opCodes && currentClient.opCodes.some((op) => !/^[a-zA-Z0-9-]+$/.test(op))) ||
    (newClient.opCodes && newClient.opCodes.some((op) => !/^[a-zA-Z0-9-]+$/.test(op)))
      ? 'OP může obsahovat pouze písmena, čísla a pomlčky.'
      : ''
  }
>
  <Input
    value={currentClient?.opCodes?.join(', ') || newClient.opCodes?.join(', ') || ''} // Bezpečná kontrola
    onChange={(e) => {
      const value = e.target.value
        .split(',')
        .map((op) => op.trim())
        .filter((op) => /^[a-zA-Z0-9-]+$/.test(op)); // Filtrování pouze platných OP
      if (currentClient) {
        setCurrentClient({ ...currentClient, opCodes: value }); // Aktualizace existujícího klienta
      } else {
        setNewClient({ ...newClient, opCodes: value }); // Nastavení nového klienta
      }
    }}
  />
</Form.Item>



  </Form>
</Modal>
<Modal
  title={`Soubory klienta: ${currentClient?.name || ''}`}
  open={isFileManagerVisible}
  onCancel={() => setIsFileManagerVisible(false)} // Zavře modál
  footer={null}
  width="80%" // Nastavení šířky modálu
>
  <FileManager
    clientId={currentClient?.id}
    onClose={() => setIsFileManagerVisible(false)} // Zavření file manageru
  />
</Modal>

    </div>
  );
};

export default Clients;