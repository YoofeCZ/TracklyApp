// src/pages/ReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  Form,
  Modal,
  Input,
  DatePicker,
  Select,
  Button,
  message,
  Card,
  Table,
  InputNumber,
  Tabs,
  TimePicker,
} from "antd";
import { createReport, getTechnicians, getClients, fetchMaterialsFromWarehouse, updateWarehouseItem, getClientById, getSystems, getComponentsBySystemId } from "../services/api";
import { GoogleMap, LoadScriptNext, Marker, InfoWindow } from "@react-google-maps/api";
import dayjs from "dayjs";
import superagent from "superagent";
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from "@ant-design/icons";
import Docxtemplater from "docxtemplater";
import mammoth from "mammoth";
import PizZip from "pizzip";
import "../css/Global.css";

let API_URL;

if (window.location.hostname === 'localhost') {
  API_URL = 'http://localhost:5000/api'; 
} else if (window.location.hostname.startsWith('192.168')) {
  API_URL = 'http://192.168.0.101:5000/api'; 
} else {
  API_URL = 'http://188.175.32.34/api';
}

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const ReportPage = () => {
  const navigate = useNavigate();
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [reportList, setReportList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [customMaterials, setCustomMaterials] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState({ from: null, to: null });
  const [infoWindow, setInfoWindow] = useState(null);
  const [travelCost, setTravelCost] = useState(0);
  const [totalWorkCost, setTotalWorkCost] = useState(0);
  const [form] = Form.useForm();
  const [mapCenter, setMapCenter] = useState({ lat: 50.0755, lng: 14.4378 });
  const [addressQuery, setAddressQuery] = useState("");
  const [travelResult, setTravelResult] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [chargedCost, setChargedCost] = useState(0);
  const [unchargedCost, setUnchargedCost] = useState(0);
  const [originalReportList, setOriginalReportList] = useState([]);
  const [systems, setSystems] = useState([]);
  const [components, setComponents] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [settings, setSettings] = useState({
    hourlyRate: 1500,
    kilometerRate: 8,
    travelTimeRate: 100,
  });

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const systemsData = await getSystems();
        setSystems(systemsData);
      } catch (error) {
        message.error("Chyba při načítání systémů.");
      }
    };
    fetchSystems();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/settings`);
        const data = await response.json();
        setSettings(data); 
      } catch (error) {
        console.error("Chyba při načítání nastavení:", error);
        message.error("Nepodařilo se načíst nastavení. Používají se výchozí hodnoty.");
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchMaterialsData = async () => {
      try {
        const response = await superagent.get(`${API_URL}/warehouse`);
        setMaterials(response.body);
      } catch (error) {
        message.error("Chyba při načítání materiálů ze skladu.");
      }
    };
    fetchMaterialsData();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [clientData, technicianData] = await Promise.all([getClients(), getTechnicians()]);
        setClients(clientData);
        setTechnicians(technicianData);
      } catch (error) {
        message.error("Chyba při načítání dat.");
      }
    };
    fetchInitialData();
  }, []);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const response = await fetch(`${API_URL}/reports`);
      const data = await response.json();
      setOriginalReportList(data);
      setReportList(data);
    } catch (error) {
      message.error("Chyba při načítání reportů.");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    const opCodeFieldWatcher = form.getFieldValue("opCode");
    if (selectedClient && selectedClient.opCodes?.length > 0) {
      const assignedOpCode = selectedClient.opCodes[0]; 
      if (opCodeFieldWatcher !== assignedOpCode) {
        form.setFieldsValue({ opCode: assignedOpCode });
      }
    }
  }, [form, selectedClient]);

  const handleSystemChange = async (systemId) => {
    setSelectedSystemId(systemId);
    form.setFieldsValue({ componentId: null });
    try {
      const componentsData = await getComponentsBySystemId(systemId);
      setComponents(componentsData);
    } catch (error) {
      message.error("Chyba při načítání komponent.");
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase().trim();
    setSearchTerm(value);

    if (!value) {
      setReportList(originalReportList);
      return;
    }

    const filtered = originalReportList.filter((report) => {
      const clientName = report.client?.name?.toLowerCase() || "";
      const technicianName = report.technician?.name?.toLowerCase() || "";
      const opCode = report.opCode?.toLowerCase() || "";
      const reportDate = dayjs(report.date).format("DD.MM.YYYY").toLowerCase();

      return (
        clientName.includes(value) ||
        technicianName.includes(value) ||
        opCode.includes(value) ||
        reportDate.includes(value)
      );
    });

    setReportList(filtered);
  };

  const handleCombinedValuesChange = (changedValues, allValues) => {
    calculateTotalWorkCost(changedValues, allValues); 
    handleValuesChange(changedValues, allValues);
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setIsDetailModalVisible(true);
  };

  const handleCloseDetails = () => {
    setSelectedReport(null);
    setIsDetailModalVisible(false);
  };

  const handleClientChange = async (clientId) => {
    try {
      const clientDetails = await getClientById(clientId);
      setSelectedClient(clientDetails);

      if (clientDetails.opCodes?.length > 0) {
        form.setFieldsValue({ opCode: clientDetails.opCodes[0] });
      } else {
        form.setFieldsValue({ opCode: "" });
      }

      if (clientDetails.system) {
        form.setFieldsValue({ systemId: clientDetails.system.id });
        handleSystemChange(clientDetails.system.id);
      } else {
        form.setFieldsValue({ systemId: null });
        setComponents([]);
      }
    } catch (error) {
      console.error("Chyba při načítání detailů klienta:", error);
      message.error("Nepodařilo se načíst detaily klienta.");
    }
  };

  const handleValuesChange = (changedValues, allValues) => {
    if (changedValues.opCode && selectedClient && selectedClient.opCodes?.length > 0) {
      const assignedOpCode = selectedClient.opCodes[0];
      if (changedValues.opCode !== assignedOpCode) {
        message.warning("Hodnotu OP kódu nelze měnit. Byla obnovena původní hodnota.");
        form.setFieldsValue({ opCode: assignedOpCode });
      }
    }
  };

  const handleAddressSubmit = async () => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${addressQuery}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      const location = data.results[0]?.geometry.location;
      if (location) {
        setMapCenter(location);
      } else {
        message.error("Adresa nebyla nalezena.");
      }
    } catch (error) {
      console.error("Chyba při vyhledávání adresy:", error);
    }
  };

  const handleSelect = (type) => {
    if (type === "from") {
      setSelectedPositions((prev) => ({ ...prev, from: infoWindow.position }));
    } else if (type === "to") {
      setSelectedPositions((prev) => ({ ...prev, to: infoWindow.position }));
    }
    setInfoWindow(null);
  };

  const handleCalculateRouteAndCosts = async () => {
    try {
      const travelData = await handleCalculateRoute();
      if (travelData) {
        const { distance, duration } = travelData;
        const travelCostValue = (distance * settings.kilometerRate) + (duration / 60) * settings.travelTimeRate;
        setTravelCost(travelCostValue);
        setTravelResult({
          distance,
          duration,
        });
      }
    } catch (error) {
      message.error("Chyba: " + error);
    }
  };

  const handleMapRightClick = (event) => {
    const coordinates = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setInfoWindow({ position: coordinates });
  };

  const handleCalculateRoute = () => {
    return new Promise((resolve, reject) => {
      if (!selectedPositions.from || !selectedPositions.to) {
        message.error("Chybí souřadnice pro výpočet trasy.");
        reject("Chybí souřadnice pro výpočet trasy.");
        return;
      }

      fetch(
        `${API_URL}/distance?origins=${selectedPositions.from.lat},${selectedPositions.from.lng}&destinations=${selectedPositions.to.lat},${selectedPositions.to.lng}`
      )
        .then((response) => response.json())
        .then((data) => {
          const travelData = {
            distance: (data.rows[0].elements[0].distance.value / 1000) * 2,
            duration: (data.rows[0].elements[0].duration.value / 60) * 2,
          };
          resolve(travelData);
        })
        .catch((error) => reject(error));
    });
  };

  const handleEditReport = (report) => {
    setSelectedReport(report); 
    form.setFieldsValue({
      systemId: report.system?.id,
      componentId: report.component?.id,
      reportDate: dayjs(report.date, "YYYY-MM-DD"), 
      opCode: report.opCode,
      clientId: report.client?.id,
      technicianId: report.technician?.id,
      description: report.description,
    });
    setIsModalVisible(true);
  };

  const handleDeleteReport = async (report) => {
    try {
      await superagent.delete(`${API_URL}/reports/${report.id}`);
      message.success("Report byl úspěšně smazán.");
      fetchReports();
    } catch (error) {
      console.error("Chyba při mazání reportu:", error);
      message.error("Nepodařilo se smazat report.");
    }
  };

  const calculateTotalWorkCost = useCallback(() => {
    const { arrivalTime, leaveTime } = form.getFieldsValue(["arrivalTime", "leaveTime"]);
    if (arrivalTime && leaveTime) {
      const arrival = dayjs(arrivalTime, "HH:mm");
      const leave = dayjs(leaveTime, "HH:mm");

      if (arrival.isValid() && leave.isValid() && leave.isAfter(arrival)) {
        const durationInMinutes = leave.diff(arrival, "minute");
        const cost = (durationInMinutes / 60) * settings.hourlyRate; 
        setTotalWorkCost(cost);
        return;
      }
    }
    setTotalWorkCost(0);
  }, [form, settings.hourlyRate]);

  const handleShowDocument = async (report) => {
    try {
      const response = await fetch("/templates/template.docx");
      const arrayBuffer = await response.arrayBuffer();
  
      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
  
      // Zde upravíme zpracování materiálů:
      const warehouseMaterials = report.materialUsed?.warehouse || [];
      const customMaterials = report.materialUsed?.custom || [];
      const allMaterials = [...warehouseMaterials, ...customMaterials];
  
      const data = {
        clientName: report.client?.name || "Neznámý klient",
        clientAddress: report.client?.address || "Adresa není k dispozici",
        clientEmail: report.client?.email || "Email není k dispozici",
        clientPhone: report.client?.phone || "Telefon není k dispozici",
        systemName: report.system?.name || "Není k dispozici",
        componentName: report.component?.name || "Není k dispozici",
        technicianName: report.technician?.name || "Neznámý technik",
        date: dayjs(report.date).format("DD.MM.YYYY"),
        description: report.description || "Popis není k dispozici",
        opCode: report.opCode || "Není přiřazen",
        materials: allMaterials.map(material => ({
          name: material.name || "Neznámý materiál",
          quantity: material.usedQuantity || material.quantity || 0,
          price: material.price || 0,
        })),
        totalWorkCost: report.totalWorkCost || 0,
        totalTravelCost: report.totalTravelCost || 0,
        totalMaterialCost: report.totalMaterialCost || 0,
        totalCost: (report.totalWorkCost || 0) + (report.totalTravelCost || 0) + (report.totalMaterialCost || 0),
        reportId: report.id || "neznámý",
      };
  
      doc.setData(data);
      doc.render();
  
      const renderedDocument = doc.getZip().generate({ type: "arraybuffer" });
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer: renderedDocument });
  
      Modal.info({
        title: "Zobrazení dokumentu",
        content: <div dangerouslySetInnerHTML={{ __html: htmlResult.value }} />,
        width: "80%",
      });
    } catch (error) {
      console.error("Chyba při zobrazování dokumentu:", error);
      message.error("Nepodařilo se zobrazit dokument.");
    }
  };
  

  const handleDownloadDocument = async (report) => {
    try {
      const response = await fetch("/templates/template.docx");
      const arrayBuffer = await response.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      const warehouseMaterials = report.materialUsed?.warehouse || [];
      const customMaterials = report.materialUsed?.custom || [];
      const allMaterials = [...warehouseMaterials, ...customMaterials];

      const data = {
        clientName: report.client?.name || "Neznámý klient",
        clientAddress: report.client?.address || "Adresa není k dispozici",
        clientEmail: report.client?.email || "Email není k dispozici",
        clientPhone: report.client?.phone || "Telefon není k dispozici",
        technicianName: report.technician?.name || "Neznámý technik",
        date: dayjs(report.date).format("DD.MM.YYYY"),
        description: report.description || "Popis není k dispozici",
        opCode: report.opCode || "Není přiřazen",
        materials: allMaterials.map(material => ({
          name: material.name || "Neznámý materiál",
          quantity: material.usedQuantity || material.quantity || 0,
          price: material.price || 0,
        })) || [],
        totalWorkCost: report.totalWorkCost || 0,
        totalTravelCost: report.totalTravelCost || 0,
        totalMaterialCost: report.totalMaterialCost || 0,
        totalCost: (report.totalWorkCost || 0) + (report.totalTravelCost || 0) + (report.totalMaterialCost || 0),
        reportId: report.id || "neznámý",
      };

      doc.setData(data);
      doc.render();

      const renderedDocument = doc.getZip().generate({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(renderedDocument);
      link.download = `report-${report.id || "neznámý"}.docx`;
      link.click();

      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Chyba při stahování dokumentu:", error);
      message.error("Nepodařilo se stáhnout dokument.");
    }
  };

  const reportColumns = [
    {
      title: "Datum reportu",
      dataIndex: "date",
      key: "date",
      render: (text) => dayjs(text).format("DD.MM.YYYY"),
    },
    {
      title: "Klient",
      dataIndex: "client",
      key: "client",
      render: (client) =>
        client ? (
          <Button
            type="link"
            onClick={() => navigate(`/clients?search=${encodeURIComponent(client.name)}`)}
          >
            {client.name}
          </Button>
        ) : (
          "Neznámý klient"
        ),
    },
    {
      title: "Systém",
      dataIndex: ["system", "name"],
      key: "system",
      render: (text, record) => record.system?.name || "N/A",
    },
    {
      title: "Komponenta",
      dataIndex: ["component", "name"],
      key: "component",
      render: (text, record) => record.component?.name || "N/A",
    },
    {
      title: "Technik",
      dataIndex: "technician",
      key: "technician",
      render: (technician) =>
        technician ? (
          <Button
            type="link"
            onClick={() => navigate(`/technicians?search=${encodeURIComponent(technician.name)}`)}
          >
            {technician.name}
          </Button>
        ) : (
          "Neznámý technik"
        ),
    },
    {
      title: "Celková cena",
      dataIndex: "totalWorkCost",
      key: "totalWorkCost",
      render: (text, record) =>
        `${(
          (record.totalWorkCost || 0) +
          (record.totalTravelCost || 0) +
          (record.totalMaterialCost || 0)
        ).toFixed(2)} Kč`,
    },
    {
      title: "Akce",
      key: "action",
      render: (_, record) => (
        <div className="report-page-actions-row">
          <Button type="link" onClick={() => handleViewDetails(record)}>
            Detaily
          </Button>
          <Button type="link" onClick={() => handleEditReport(record)}>
            Upravit
          </Button>
          <Button type="link" style={{ color: "blue" }} onClick={() => handleShowDocument(record)}>
            Zobrazit dokument
          </Button>
          <Button type="link" style={{ color: "green" }} onClick={() => handleDownloadDocument(record)}>
            Stáhnout dokument
          </Button>
          <Button type="link" danger onClick={() => handleDeleteReport(record)}>
            Smazat
          </Button>
        </div>
      ),      
    },
  ];

  const handleSubmit = async (values) => {
    const usedMaterials = materials
    .filter((material) => material.usedQuantity > 0)
    .map((material) => ({
      id: material.id,
      name: material.name,
      usedQuantity: material.usedQuantity,
      remainingQuantity: material.quantity - material.usedQuantity,
      price: material.price // Přidání ceny pro skladové materiály
    }));

    calculateCosts(materials, customMaterials);

    let travelCostValue = 0;
    if (travelResult) {
      const { distance, duration } = travelResult;
      travelCostValue = distance * 8 + (duration / 60) * 100;
    }

    setTravelCost(travelCostValue);

    const reportData = {
      systemId: values.systemId,
      componentId: values.componentId,
      date: values.reportDate?.format("YYYY-MM-DD"),
      description: values.description || "",
      technicianId: values.technicianId,
      clientId: values.clientId,
      opCode: values.opCode,
      materialUsed: {
        warehouse: usedMaterials,
        custom: customMaterials,
      },
      totalWorkCost: parseFloat(totalWorkCost.toFixed(2)),
      totalTravelCost: parseFloat(travelCostValue.toFixed(2)),
      totalMaterialCost: parseFloat((chargedCost + unchargedCost).toFixed(2)),
    };

    try {
      if (selectedClient && values.opCode) {
        const existingOpCodes = selectedClient.opCodes || [];
        if (existingOpCodes.includes(values.opCode)) {
          message.warning("Tento OP kód již byl klientovi přiřazen.");
        } else {
          await superagent
            .post(`${API_URL}/clients/${selectedClient.id}/assign-op`)
            .send({ opCode: values.opCode });
          message.success("OP kód byl úspěšně přiřazen klientovi.");
        }
      }

      await createReport(reportData);
      message.success("Report byl vytvořen!");

      for (const material of usedMaterials) {
        await updateWarehouseItem(material.id, {
          quantity: material.remainingQuantity,
        });
      }
      message.success("Sklad byl úspěšně aktualizován!");

      fetchMaterialsFromWarehouse();
      fetchReports();

      setIsModalVisible(false);
    } catch (error) {
      console.error("Chyba při vytváření reportu nebo aktualizaci skladu:", error);
      message.error("Chyba při vytváření reportu nebo aktualizaci skladu.");
    }
  };

  const handleMaterialChange = (record, field, value) => {
    const updatedMaterials = materials.map((material) =>
      material.id === record.id ? { ...material, [field]: value } : material
    );
    setMaterials(updatedMaterials);
    calculateCosts(updatedMaterials, customMaterials);
  };

  const handleCustomMaterialChange = (record, key, value) => {
    setCustomMaterials((prevCustomMaterials) =>
      prevCustomMaterials.map((material) =>
        material.key === record.key
          ? { ...material, [key]: value }
          : material
      )
    );
  };

  const handleRemoveCustomMaterial = (key) => {
    setCustomMaterials((prevCustomMaterials) =>
      prevCustomMaterials.filter((material) => material.key !== key)
    );
  };

  const handleAddCustomMaterial = () => {
    const newMaterial = {
      key: Date.now(),
      name: "",
      price: 0,
      quantity: 0,
      chargeCustomer: false,
    };

    setCustomMaterials((prevCustomMaterials) => [...prevCustomMaterials, newMaterial]);
  };

  const calculateCosts = (materials, customMaterials) => {
    let totalChargedCost = 0;
    let totalUnchargedCost = 0;

    materials.forEach((material) => {
      const cost = (material.usedQuantity || 0) * material.price;
      if (material.chargeCustomer) {
        totalChargedCost += cost;
      } else {
        totalUnchargedCost += cost;
      }
    });

    customMaterials.forEach((material) => {
      const cost = (material.quantity || 0) * material.price;
      if (material.chargeCustomer) {
        totalChargedCost += cost;
      } else {
        totalUnchargedCost += cost;
      }
    });

    setChargedCost(totalChargedCost);
    setUnchargedCost(totalUnchargedCost);
  };

  const materialColumns = [
    {
      title: "Název materiálu",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Cena za jednotku (Kč)",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Dostupné množství",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Použité množství",
      key: "usedQuantity",
      render: (_, record) => (
        <InputNumber
          min={0}
          max={record.quantity}
          value={record.usedQuantity || 0}
          onChange={(value) => handleMaterialChange(record, "usedQuantity", value)}
        />
      ),
    },
    {
      title: "Zaúčtovat zákazníkovi?",
      key: "chargeCustomer",
      render: (_, record) => (
        <input
          type="checkbox"
          checked={record.chargeCustomer || false}
          onChange={(e) => handleMaterialChange(record, "chargeCustomer", e.target.checked)}
        />
      ),
    },
  ];

  const customMaterialColumns = [
    {
      title: "Název materiálu",
      dataIndex: "name",
      key: "name",
      render: (_, record) => (
        <Input
          value={record.name || ""}
          onChange={(e) => handleCustomMaterialChange(record, "name", e.target.value)}
        />
      ),
    },
    {
      title: "Cena za jednotku (Kč)",
      dataIndex: "price",
      key: "price",
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.price || 0}
          onChange={(value) => handleCustomMaterialChange(record, "price", value)}
        />
      ),
    },
    {
      title: "Použité množství",
      key: "quantity",
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.quantity || 0}
          onChange={(value) => handleCustomMaterialChange(record, "quantity", value)}
        />
      ),
    },
    {
      title: "Zaúčtovat zákazníkovi?",
      key: "chargeCustomer",
      render: (_, record) => (
        <input
          type="checkbox"
          checked={record.chargeCustomer || false}
          onChange={(e) => handleCustomMaterialChange(record, "chargeCustomer", e.target.checked)}
        />
      ),
    },
    {
      title: "Akce",
      key: "action",
      render: (_, record) => (
        <Button danger onClick={() => handleRemoveCustomMaterial(record.key)}>
          Odebrat
        </Button>
      ),
    },
  ];

  return (
    <div className="report-page-container">
      <h1 className="report-page-title">Seznam Reportů</h1>

      <Modal
        title="Detail reportu"
        visible={isDetailModalVisible}
        onCancel={handleCloseDetails}
        footer={null}
        width="70%"
      >
        {selectedReport ? (
          <div className="report-page-details">
            <Card title="Informace o klientovi" className="report-page-card">
              <p><b>Jméno:</b> {selectedReport.client?.name || "Neznámý klient"}</p>
              <p><b>OP kód:</b> {selectedReport.client?.opCodes?.join(', ') || "Není přiřazen"}</p>
              <p><b>Email:</b> {selectedReport.client?.email || "Není k dispozici"}</p>
              <p><b>Telefon:</b> {selectedReport.client?.phone || "Není k dispozici"}</p>
              <p><b>Adresa:</b> {selectedReport.client?.address || "Není k dispozici"}</p>
            </Card>

            <Card title="Informace o technikovi" className="report-page-card">
              <p><b>Jméno:</b> {selectedReport.technician?.name || "Neznámý technik"}</p>
              <p><b>Email:</b> {selectedReport.technician?.email || "Není k dispozici"}</p>
              <p><b>Telefon:</b> {selectedReport.technician?.phone || "Není k dispozici"}</p>
              <p><b>Identifikační číslo:</b> {selectedReport.technician?.employeeId || "Není přiřazeno"}</p>
            </Card>

            <Card title="Detaily reportu" className="report-page-card">
              <p><b>Datum:</b> {dayjs(selectedReport.date).format("DD.MM.YYYY")}</p>
              <p><b>Systém:</b> {selectedReport.system?.name || "Není k dispozici"}</p>
              <p><b>Komponenta:</b> {selectedReport.component?.name || "Není k dispozici"}</p>
              <p><b>Popis práce:</b> {selectedReport.description || "Není k dispozici"}</p>
              <p><b>OP Kód:</b> {selectedReport.opCode || "Není přiřazen"}</p>
            </Card>

            <Card title="Celkové náklady" className="report-page-card">
              <p><b>Cena za práci:</b> {selectedReport.totalWorkCost?.toFixed(2)} Kč</p>
              <p><b>Cestovní náklady:</b> {selectedReport.totalTravelCost?.toFixed(2)} Kč</p>
              <p><b>Náklady na materiál:</b> {selectedReport.totalMaterialCost?.toFixed(2)} Kč</p>
              <p>
                <b>Celková cena:</b>{" "}
                {(
                  (selectedReport.totalWorkCost || 0) +
                  (selectedReport.totalTravelCost || 0) +
                  (selectedReport.totalMaterialCost || 0)
                ).toFixed(2)}{" "}
                Kč
              </p>
            </Card>
          </div>
        ) : (
          <p>Načítání detailů...</p>
        )}
      </Modal>

      <div className="report-page-actions">
        <Button
          type="primary"
          onClick={() => setIsModalVisible(true)}
        >
          Vytvořit report
        </Button>

        <Input.Search
          placeholder="Vyhledat (klient, technik, OP kód, datum)"
          onChange={handleSearch}
          enterButton={<Button icon={<SearchOutlined />} />}
          allowClear
          className="report-page-search"
        />
      </div>

      <div className="report-page-table-wrapper">
        <Table
          dataSource={Array.isArray(reportList) ? reportList : []}
          columns={reportColumns}
          loading={loadingReports}
          rowKey="id"
        />
      </div>

      <Modal
        title="Formulář reportu"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="90%"
        className="report-page-modal"
      >
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Nový report" key="1">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={handleCombinedValuesChange}
            >
              <Form.Item name="reportDate" label="Datum reportu" rules={[{ required: true }]}>
                <DatePicker format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item name="opCode" label="OP Kód">
                <Input />
              </Form.Item>

              <Form.Item name="clientId" label="Klient" rules={[{ required: true }]}>
                <Select onChange={handleClientChange}>
                  {clients.map((client) => (
                    <Select.Option key={client.id} value={client.id}>
                      {client.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {selectedClient && (
                <Card title="Informace o klientovi" className="report-page-card">
                  <p><b>OP kód:</b> {selectedClient.opCodes?.join(', ') || "Klient nemá přidělený OP"}</p>
                  <p><b>Jméno:</b> {selectedClient.name}</p>
                  <p><b>Adresa:</b> {selectedClient.address || "Nezadána"}</p>
                  <p><b>Email:</b> {selectedClient.email || "Nezadán"}</p>
                  <p><b>Telefon:</b> {selectedClient.phone || "Nezadán"}</p>
                </Card>
              )}

              <Form.Item
                name="systemId"
                label="Systém"
                rules={[{ required: true, message: "Vyberte systém" }]}
              >
                <Select onChange={handleSystemChange} placeholder="Vyberte systém">
                  {systems.map((system) => (
                    <Select.Option key={system.id} value={system.id}>
                      {system.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="componentId"
                label="Komponenta"
                rules={[{ required: true, message: "Vyberte komponentu" }]}
              >
                <Select disabled={!selectedSystemId} placeholder="Vyberte komponentu">
                  {components.map((component) => (
                    <Select.Option key={component.id} value={component.id}>
                      {component.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="technicianId" label="Technik" rules={[{ required: true }]}>
                <Select>
                  {technicians.map((tech) => (
                    <Select.Option key={tech.id} value={tech.id}>
                      {tech.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Card title="Výpočet trasy z firmy na zakázku" className="report-page-card">
                <div className="report-page-address">
                  <Input
                    value={addressQuery}
                    onChange={(e) => setAddressQuery(e.target.value)}
                    placeholder="Zadejte adresu (např. Václavské náměstí, Praha)"
                    className="report-page-address-input"
                  />
                  <Button type="primary" onClick={handleAddressSubmit}>
                    Najít adresu
                  </Button>
                </div>

                <LoadScriptNext googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                  <GoogleMap
                    mapContainerClassName="report-page-map-container"
                    center={mapCenter}
                    zoom={12}
                    onRightClick={handleMapRightClick}
                    options={{ gestureHandling: "greedy" }}
                  >
                    {selectedPositions.from && (
                      <Marker
                        position={selectedPositions.from}
                        label="Začátek"
                        icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
                      />
                    )}
                    {selectedPositions.to && (
                      <Marker
                        position={selectedPositions.to}
                        label="Cíl"
                        icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
                      />
                    )}
                    {infoWindow && (
                      <InfoWindow
                        position={infoWindow.position}
                        onCloseClick={() => setInfoWindow(null)}
                      >
                        <div className="report-page-infowindow">
                          <Button onClick={() => handleSelect("from")}>Nastavit jako začátek</Button>
                          <Button onClick={() => handleSelect("to")}>Nastavit jako cíl</Button>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScriptNext>

                <div className="report-page-calc-route">
                  <Button
                    type="primary"
                    onClick={handleCalculateRouteAndCosts}
                    disabled={!selectedPositions.from || !selectedPositions.to}
                  >
                    Vypočítat trasu a cestovní náklady
                  </Button>
                </div>

                {travelResult ? (
                  <Card title="Výsledek trasy" className="report-page-card-inner">
                    <p>Vzdálenost tam a zpět: {travelResult.distance.toFixed(2)} km</p>
                    <p>Čas tam a zpět: {travelResult.duration.toFixed(1)} minut</p>
                  </Card>
                ) : (
                  <p className="report-page-no-result">
                    Výsledek trasy zatím není dostupný.
                  </p>
                )}
              </Card>

              <Form.Item
                name="arrivalTime"
                label="Čas příjezdu na zakázku"
                rules={[{ required: true, message: "Čas příjezdu je povinný." }]}
              >
                <TimePicker showTime onChange={calculateTotalWorkCost} />
              </Form.Item>

              <Form.Item
                name="leaveTime"
                label="Čas odjezdu"
                rules={[{ required: true, message: "Čas odjezdu je povinný." }]}
              >
                <TimePicker showTime onChange={calculateTotalWorkCost} />
              </Form.Item>

              <Form.Item
                name="description"
                label="Popis práce"
                rules={[{ required: true, message: "Zadejte popis práce" }]}
              >
                <Input.TextArea rows={4} placeholder="Popište práci, která byla vykonána" />
              </Form.Item>

              <Card title="Použité materiály" className="report-page-card">
                <Table dataSource={materials} columns={materialColumns} pagination={false} />
              </Card>

              <Card title="Vlastní materiály" className="report-page-card" style={{ marginTop: 20 }}>
                <Table dataSource={customMaterials} columns={customMaterialColumns} pagination={false} />
                <Button type="dashed" onClick={handleAddCustomMaterial} style={{ marginTop: "10px" }}>
                  Přidat vlastní materiál
                </Button>
              </Card>

              <Card title="Celkové náklady" className="report-page-card">
                <p>Cestovní náklady: {travelCost.toFixed(2)} Kč</p>
                <p>Cena za práci: {totalWorkCost.toFixed(2)} Kč</p>
                <p>Zaúčtovaná cena za materiál pro zákazníka: {chargedCost.toFixed(2)} Kč</p>
                <p>Nezaúčtovaná cena za materiál - Servis: {unchargedCost.toFixed(2)} Kč</p>
                <p>Celková cena bez DPH: {((travelCost + totalWorkCost + chargedCost)).toFixed(2)} Kč</p>
                <p>Celková cena s DPH: {((travelCost + totalWorkCost + chargedCost) * 1.21).toFixed(2)} Kč</p>
              </Card>

              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Odeslat
                </Button>
              </Form.Item>
            </Form>
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default ReportPage;
