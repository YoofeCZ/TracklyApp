import React, { useEffect, useState } from "react";
import { Row, Col, Card, Table } from "antd";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  getClients,
  getTechnicians,
  getTasks,
  getWarehouseItems,
  getReports,
} from "../services/api";
import {
  UserOutlined,
  FileDoneOutlined,
  AppstoreOutlined,
  ToolOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import "../css/Global.css";

// Registrace potřebných komponent pro Chart.js
ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    clients: 0,
    technicians: 0,
    tasks: 0,
    warehouse: 0,
    maxReportPrice: 0,
    totalReportPrice: 0,
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [monthlyTasksData, setMonthlyTasksData] = useState({
    labels: [],
    datasets: [],
  });

  const [systemStats, setSystemStats] = useState({
    labels: [],
    datasets: [],
  });

  const [systemsTableData, setSystemsTableData] = useState([]);
  const [mostFaultySystem, setMostFaultySystem] = useState("");

  const [componentStats, setComponentStats] = useState({
    labels: [],
    datasets: [],
  });
  
  const [componentsTableData, setComponentsTableData] = useState([]);
  const [mostFaultyComponent, setMostFaultyComponent] = useState("");

  const [recentClients, setRecentClients] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const clients = await getClients();
        const technicians = await getTechnicians();
        const tasks = await getTasks();
        const warehouse = await getWarehouseItems();
        const reports = await getReports();
  
        // Výpočet cen reportů
        const reportPrices = reports.map((report) =>
          (report.totalWorkCost || 0) +
          (report.totalTravelCost || 0) +
          (report.totalMaterialCost || 0)
        );
  
        const maxReportPrice = parseFloat(Math.max(...reportPrices).toFixed(2));
        const totalReportPrice = parseFloat(reportPrices.reduce((sum, price) => sum + price, 0).toFixed(2));
        
        // Data pro graf úkolů podle měsíců
        const monthlyTasks = tasks.reduce((acc, task) => {
          const month = new Date(task.date).toLocaleString("default", {
            month: "short",
          });
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});

        const monthlyLabels = Object.keys(monthlyTasks);
        const monthlyCounts = Object.values(monthlyTasks);

        setMonthlyTasksData({
          labels: monthlyLabels,
          datasets: [
            {
              label: "Počet úkolů",
              data: monthlyCounts,
              backgroundColor: "#ff6384",
            },
          ],
        });
        setRecentTasks(
          tasks.slice(-5).map((task) => {
            const client = clients.find((client) => client.id === task.clientId);
            return {
              ...task,
              clientName: client ? client.name : "Neznámý klient",
            };
          })
        );
        
        // Počet klientů podle systému
        const systemClientsCount = clients.reduce((acc, client) => {
          const systemName = client.system?.name || "Neznámý systém";
          acc[systemName] = (acc[systemName] || 0) + 1;
          return acc;
        }, {});

        // Analýza systémů
        const systems = ["Victron", "Solax", "Solar Edge", "GoodWe"];
        const systemStatsData = systems.map((system) => {
          const systemReports = reports.filter(
            (report) => report.system?.name === system
          );
          
          const serviceCount = systemReports.length;
          const faults = serviceCount; 
          const clientCount = systemClientsCount[system] || 0;

          const faultRate =
            clientCount > 0 ? ((faults / clientCount) * 100).toFixed(2) : 0;

          return {
            system,
            serviceCount,
            faults,
            clientCount,
            faultRate: parseFloat(faultRate),
          };
        });

        setSystemsTableData(systemStatsData);
        setSystemStats({
          labels: systems,
          datasets: [
            {
              label: "Počet servisů",
              data: systemStatsData.map((s) => s.serviceCount),
              backgroundColor: "#36a2eb",
            },
            {
              label: "Poruchovost (%) na klienta",
              data: systemStatsData.map((s) => s.faultRate),
              backgroundColor: "#ffcd56",
            },
          ],
        });

        // Nejvíce poruchový systém
        if (systemStatsData.length > 0) {
          const faultySystem = systemStatsData.reduce((prev, current) =>
            current.faultRate > prev.faultRate ? current : prev
          );
          setMostFaultySystem(faultySystem.system);
        } else {
          setMostFaultySystem("N/A");
        }

        // Analýza komponent
        const totalServices = reports.length;
        const componentStatsData = reports.reduce((acc, report) => {
          const componentName = report.component?.name || "Neznámé";
          if (!acc[componentName]) {
            acc[componentName] = { serviceCount: 0, faults: 0 };
          }
          acc[componentName].serviceCount += 1;
          acc[componentName].faults += 1;
          return acc;
        }, {});

        const components = Object.keys(componentStatsData);
        const componentsData = components.map((component) => {
          const data = componentStatsData[component];
          const faultRate =
            totalServices > 0
              ? ((data.faults / totalServices) * 100).toFixed(2)
              : 0;
          return {
            component,
            serviceCount: data.serviceCount,
            faults: data.faults,
            faultRate: parseFloat(faultRate),
          };
        });

        setComponentsTableData(componentsData);
        setComponentStats({
          labels: components,
          datasets: [
            {
              label: "Počet servisů",
              data: componentsData.map((c) => c.serviceCount),
              backgroundColor: "#36a2eb",
            },
            {
              label: "Poruchovost (%)",
              data: componentsData.map((c) => c.faultRate),
              backgroundColor: "#ffcd56",
            },
          ],
        });

        // Nejvíce poruchová komponenta
        if (componentsData.length > 0) {
          const faultyComponent = componentsData.reduce((prev, current) =>
            current.faultRate > prev.faultRate ? current : prev
          );
          setMostFaultyComponent(faultyComponent.component);
        } else {
          setMostFaultyComponent("N/A");
        }

        // Nastavení statistik
        setStats({
          clients: clients.length,
          technicians: technicians.length,
          tasks: tasks.length,
          warehouse: warehouse.length,
          maxReportPrice,
          totalReportPrice,
        });
        setRecentClients(clients.slice(-5));
        setRecentTasks(tasks.slice(-5));

        // Dummy data pro graf výkonu techniků
        setChartData({
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              label: "Výkon techniků",
              data: [12, 19, 3, 5, 2, 3],
              backgroundColor: "#4bc0c0",
            },
            {
              label: "Úkoly dokončené",
              data: [8, 15, 7, 10, 5, 9],
              backgroundColor: "#9966ff",
            },
          ],
        });
      } catch (error) {
        console.error("Chyba při načítání dat pro dashboard:", error);
      }
    };

    fetchStats();
  }, []);

  const systemColumns = [
    {
      title: "Systém",
      dataIndex: "system",
      key: "system",
    },
    {
      title: "Počet klientů",
      dataIndex: "clientCount",
      key: "clientCount",
    },
    {
      title: "Poruchy",
      dataIndex: "faults",
      key: "faults",
    },
    {
      title: "Poruchovost na klienta (%)",
      dataIndex: "faultRate",
      key: "faultRate",
      render: (value) => `${value}%`,
    },
  ];
  
  const componentColumns = [
    {
      title: "Komponenta",
      dataIndex: "component",
      key: "component",
    },
    {
      title: "Počet poruch",
      dataIndex: "faults",
      key: "faults",
    },
    {
      title: "Poruchovost (%)",
      dataIndex: "faultRate",
      key: "faultRate",
      render: (value) => `${value}%`,
    },
  ];

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      {/* Statistiky */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <div className="icon-box">
              <UserOutlined />
            </div>
            <div className="value">{stats.clients}</div>
            <div className="label">Počet klientů</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <div className="icon-box">
              <ToolOutlined />
            </div>
            <div className="value">{stats.technicians}</div>
            <div className="label">Počet techniků</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <div className="icon-box">
              <FileDoneOutlined />
            </div>
            <div className="value">{stats.tasks}</div>
            <div className="label">Aktivní úkoly</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <div className="icon-box">
              <AppstoreOutlined />
            </div>
            <div className="value">{stats.warehouse}</div>
            <div className="label">Materiály na skladě</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <div className="icon-box">
              <DollarOutlined />
            </div>
            <div className="value">{stats.maxReportPrice} Kč</div>
            <div className="label">Nejvyšší cena reportu</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="stat-card">
            <div className="icon-box">
              <DollarOutlined />
            </div>
            <div className="value">{stats.totalReportPrice} Kč</div>
            <div className="label">Celková cena reportů</div>
          </Card>
        </Col>
      </Row>

      {/* Poslední klienti a úkoly */}
      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col xs={24} md={12}>
          <Card className="list-card" title="Poslední přidaní klienti">
            <ul className="recent-list">
              {recentClients.map((client) => (
                <li key={client.id}>{client.name}</li>
              ))}
            </ul>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="list-card" title="Poslední přidané úkoly">
            <ul className="recent-list">
              {recentTasks.map((task) => (
                <li key={task.id}>
                  {task.description
                    ? task.description.length > 150
                      ? `${task.description.substring(0, 150)}...`
                      : task.description
                    : "Bez popisu"}
                </li>
              ))}
            </ul>
          </Card>
        </Col>
      </Row>

      {/* Tabulka systémů */}
      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Card
            className="table-card"
            title={`Poruchovost systémů (Nejvíce poruchový: ${mostFaultySystem})`}
          >
            <Table
              columns={systemColumns}
              dataSource={systemsTableData}
              rowKey="system"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabulka komponent */}
      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Card
            className="table-card"
            title={`Poruchovost komponent (Nejvíce poruchová: ${mostFaultyComponent})`}
          >
            <Table
              columns={componentColumns}
              dataSource={componentsTableData}
              rowKey="component"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Grafy */}
      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        <Col xs={24} md={12} lg={8}>
          <Card className="chart-card" title="Výkon techniků">
            <Bar data={chartData} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card className="chart-card" title="Počet úkolů na měsíc">
            <Bar data={monthlyTasksData} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={8}>
          <Card className="chart-card" title="Graf poruchovosti komponent">
            <Bar data={componentStats} />
          </Card>
        </Col>
      </Row>

      {/* Graf systémů */}
      <Row gutter={[16, 16]} style={{ marginTop: "20px", marginBottom: "20px" }}>
        <Col span={24}>
          <Card
            className="chart-card"
            title="Systémy - Servisy, poruchy a poruchovost na klienta"
          >
            <Bar data={systemStats} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
