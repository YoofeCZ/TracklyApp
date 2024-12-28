// src/components/FileManager.js
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Upload,
  Breadcrumb,
  Input,
  message,
  Select,
  DatePicker,
} from 'antd';
import {
  UploadOutlined,
  FolderAddOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';

const { Option } = Select;

const getAPIUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  } else if (window.location.hostname.startsWith('192.168')) {
    return 'http://192.168.0.101:5000/api';
  } else {
    return 'http://188.175.32.34/api';
  }
};

const FileManager = ({ clientId }) => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const [fileType, setFileType] = useState('normal');
  const [expirationDate, setExpirationDate] = useState(null);
  const [nextServiceDate, setNextServiceDate] = useState(null);

  const API_URL = getAPIUrl();

  const refetchClientData = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients/${clientId}`);
      setClient(response.data);
    } catch (error) {
      console.error('Chyba při načítání klienta:', error);
    }
  };

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await axios.get(`${API_URL}/clients/${clientId}`);
        setClient(response.data);
      } catch (error) {
        console.error('Chyba při načítání klienta:', error);
      }
    };
    fetchClientData();
  }, [clientId, API_URL]);

  useEffect(() => {
    fetchFiles(currentPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const fetchFiles = async (path) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/clients/${clientId}/files`, {
        params: { path },
      });
      const formattedFiles = response.data.files.map((file) => ({
        ...file,
        type: file.type === 'folder' ? 'folder' : 'file',
      }));
      setFiles(formattedFiles);
    } catch (error) {
      console.error('Chyba při načítání souborů:', error);
      message.error('Chyba při načítání souborů');
    } finally {
      setLoading(false);
    }
  };

  const handleFilePreview = (file) => {
    if (!file || !file.name) {
      setPreviewFile(null);
      setPreviewContent(<p>Soubor není k dispozici.</p>);
      setIsPreviewModalVisible(true);
      return;
    }

    const fileUrl = `${API_URL}/clients/${clientId}/files/download?path=${encodeURIComponent(file.path)}`;
    const fileExtension = file.name.split('.').pop().toLowerCase();

    setPreviewFile({ ...file, url: fileUrl });

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(fileExtension)) {
      setPreviewContent(<img src={fileUrl} alt={file.name} style={{ width: '100%' }} />);
    } else if (fileExtension === 'pdf') {
      setPreviewContent(
        <iframe
          src={fileUrl}
          style={{ width: '100%', height: '500px' }}
          frameBorder="0"
          title={file.name}
        />
      );
    } else {
      setPreviewContent(
        <p>
          Nelze zobrazit náhled. <a href={fileUrl} target="_blank" rel="noopener noreferrer">Stáhnout</a>
        </p>
      );
    }

    setIsPreviewModalVisible(true);
  };

  const handleFileOpen = (file) => {
    if (file.type === 'folder') {
      setCurrentPath(file.path);
    } else {
      window.open(
        `${API_URL}/clients/${clientId}/files/download?path=${encodeURIComponent(file.path)}`,
        '_blank'
      );
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      message.error('Název složky nemůže být prázdný.');
      return;
    }

    try {
      const folderPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
      const response = await axios.post(`${API_URL}/clients/${clientId}/folders`, { folderPath });
      message.success(`Složka '${response.data.name}' byla úspěšně vytvořena`);
      setIsFolderModalVisible(false);
      setNewFolderName('');
      fetchFiles(currentPath);
    } catch (error) {
      console.error('Chyba při vytváření složky:', error);
      message.error('Chyba při vytváření složky');
    }
  };

  const handleDelete = (file) => {
    Modal.confirm({
      title: `Opravdu chcete smazat ${file.name}?`,
      okText: 'Ano',
      okType: 'danger',
      cancelText: 'Ne',
      onOk: async () => {
        try {
          await axios.delete(`${API_URL}/clients/${clientId}/files`, {
            data: { path: file.path },
          });
          message.success(`Položka ${file.name} byla odstraněna.`);
          fetchFiles(currentPath);
        } catch (error) {
          console.error('Chyba při mazání souboru nebo složky:', error);
          message.error('Chyba při mazání souboru nebo složky');
        }
      },
    });
  };

  const customUploadRequest = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);
    formData.append('fileType', fileType);
    if (fileType === 'revision' && expirationDate) {
      formData.append('expirationDate', expirationDate.format('YYYY-MM-DD'));
    }
    if (fileType === 'contract' && nextServiceDate) {
      formData.append('nextServiceDate', nextServiceDate.format('YYYY-MM-DD'));
    }

    try {
      await axios.post(`${API_URL}/clients/${clientId}/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success(`Soubor ${file.name} byl úspěšně nahrán`);

      // Znovu načteme klienta, aby se aktualizovala expirační data/smlouva
      await refetchClientData();
      await fetchFiles(currentPath);
    } catch (error) {
      console.error('Chyba při nahrávání souboru:', error);
      message.error('Chyba při nahrávání souboru');
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(fileSearchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Název',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) =>
        record.type === 'folder' ? (
          <span>
            <FolderOutlined style={{ marginRight: 8 }} />
            <a onClick={() => handleFileOpen(record)}>{text}</a>
          </span>
        ) : (
          <span>
            <FileOutlined style={{ marginRight: 8 }} />
            {text}
          </span>
        ),
    },
    {
      title: 'Typ',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (text === 'folder' ? 'Složka' : 'Soubor'),
    },
    {
      title: 'Velikost',
      dataIndex: 'size',
      key: 'size',
      render: (size) => (size ? `${(size / 1024).toFixed(2)} KB` : '-'),
    },
    {
      title: 'Poslední změna',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Akce',
      key: 'actions',
      render: (_, record) => (
        <span>
          {record.type === 'file' && (
            <>
              <Button
                type="link"
                icon={<DownloadOutlined />}
                onClick={() => handleFileOpen(record)}
              >
                Stáhnout
              </Button>

              <Button type="link" onClick={() => handleFilePreview(record)}>
                Zobrazit
              </Button>
            </>
          )}

          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            danger
          >
            Smazat
          </Button>
        </span>
      ),
    },
  ];

  // Zobrazení informací přímo z revisionExpirationDate a contractNextServiceDate
  let contractInfo = 'Nemá servisní smlouvu';
  let revisionInfo = 'Revizní zpráva není k dispozici';
  if (client) {
    if (client.contractNextServiceDate) {
      contractInfo = `Má servisní smlouvu, další servis: ${moment(client.contractNextServiceDate).format('DD.MM.YYYY')}`;
    }

    if (client.revisionExpirationDate) {
      revisionInfo = `Revizní zpráva platná do: ${moment(client.revisionExpirationDate).format('DD.MM.YYYY')}`;
    }
  }

  return (
    <div>
      <h2>Klient: {client?.name || 'Načítání...'}</h2>
      <p>{contractInfo}</p>
      <p>{revisionInfo}</p>

      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Button type="link" onClick={() => setCurrentPath('')} style={{ padding: 0 }}>
            Domů
          </Button>
        </Breadcrumb.Item>
        {currentPath.split('/').map((folder, index, array) => {
          if (folder) {
            const path = array.slice(0, index + 1).join('/');
            return (
              <Breadcrumb.Item key={path}>
                <Button type="link" onClick={() => setCurrentPath(path)} style={{ padding: 0 }}>
                  {folder}
                </Button>
              </Breadcrumb.Item>
            );
          }
          return null;
        })}
      </Breadcrumb>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<FolderAddOutlined />}
          onClick={() => setIsFolderModalVisible(true)}
          style={{ marginRight: 8, borderRadius: '8px' }}
        >
          Nová složka
        </Button>

        <Upload customRequest={customUploadRequest} showUploadList={false}>
          <Button icon={<UploadOutlined />} style={{ borderRadius: '8px' }}>
            Nahrát soubor
          </Button>
        </Upload>

        <Input.Search
          placeholder="Vyhledat soubory"
          value={fileSearchTerm}
          onChange={(e) => setFileSearchTerm(e.target.value)}
          style={{ width: 200, marginLeft: 'auto' }}
        />
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: '8px' }}>
        <Select value={fileType} onChange={setFileType} style={{ width: 150 }}>
          <Option value="normal">Normální</Option>
          <Option value="revision">Revizní zpráva</Option>
          <Option value="contract">Servisní smlouva</Option>
        </Select>

        {fileType === 'revision' && (
          <DatePicker
            placeholder="Platnost revizní zprávy"
            value={expirationDate}
            onChange={setExpirationDate}
            format="DD.MM.YYYY"
          />
        )}

        {fileType === 'contract' && (
          <DatePicker
            placeholder="Datum příštího servisu"
            value={nextServiceDate}
            onChange={setNextServiceDate}
            format="DD.MM.YYYY"
          />
        )}
      </div>

      <Table
        dataSource={filteredFiles}
        columns={columns}
        rowKey={(record) => record.path}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
        style={{ backgroundColor: '#fff', borderRadius: '8px' }}
      />

      <Modal
        title="Vytvořit novou složku"
        visible={isFolderModalVisible}
        onOk={handleCreateFolder}
        onCancel={() => setIsFolderModalVisible(false)}
        okText="Vytvořit"
        cancelText="Zrušit"
      >
        <Input
          placeholder="Název složky"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
        />
      </Modal>

      <Modal
        title={`Náhled souboru: ${previewFile?.name || 'Neznámý soubor'}`}
        visible={isPreviewModalVisible}
        footer={null}
        onCancel={() => setIsPreviewModalVisible(false)}
        width={800}
      >
        {previewContent}
      </Modal>
    </div>
  );
};

FileManager.propTypes = {
  clientId: PropTypes.string.isRequired,
};

export default FileManager;
