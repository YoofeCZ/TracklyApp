// src/components/Navbar.js

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Layout, Menu, Badge, Tooltip, Drawer, Button, Grid } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  BoxPlotOutlined,
  SettingOutlined,
  PoweroffOutlined,
  DashboardOutlined,
  PlusOutlined,
  BellOutlined,
  BulbOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
  DatabaseOutlined,
  MenuOutlined, // Ikona pro menu v mobilním režimu
  LockOutlined, // Přidána ikona pro změnu hesla
} from '@ant-design/icons';
import '../css/Global.css';

const { Sider, Header } = Layout;
const { useBreakpoint } = Grid;

const Navbar = ({ onLogout, pendingTasksCount, onCollapseChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint(); // Hook pro detekci velikosti obrazovky

  const token = localStorage.getItem("token");
  let userRole = null;

  if (token) {
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      userRole = decodedToken.role;
    } catch (error) {
      console.error("Chyba při dekódování tokenu:", error);
    }
  }

  useEffect(() => {
    if (pendingTasksCount > 0) {
      setIsBlinking(true);
    } else {
      setIsBlinking(false);
    }
  }, [pendingTasksCount]);

  // Zavření Drawer při navigaci na novou stránku na mobilních zařízeních
  useEffect(() => {
    if (!screens.md) { // Pokud je zařízení v mobilním režimu
      setDrawerVisible(false);
    }
  }, [location.pathname, screens.md]);

  const handleNotificationClick = () => {
    setIsBlinking(false);
    navigate("/tasks");
    if (!screens.md) {
      setDrawerVisible(false); // Zavřít drawer na mobilních zařízeních po kliknutí
    }
  };

  const items = [];

  items.push({
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: <Link to={userRole === "client" ? "/client-dashboard" : "/dashboard"}>Dashboard</Link>,
  });

  if (userRole === "client") {
    items.push({
      key: 'create-ticket',
      icon: <PlusOutlined />,
      label: <Link to="/create-ticket">Vytvořit Tiket</Link>,
    },
    {
      key: 'know-how-help',
      icon: <BulbOutlined />,
      label: <Link to="/know-how-help">Nápověda (Know How)</Link>,
    }
    );
  }
  if (userRole === "admin") {
    items.push({
      key: 'technicians',
      icon: <UserOutlined />,
      label: <Link to="/technicians">Technici</Link>,
    });
  }


  if (userRole === "admin" || userRole === "technician") {
    items.push(
      {
        key: 'clients',
        icon: <TeamOutlined />,
        label: <Link to="/clients">Klienti</Link>,
      },
      {
        key: 'reports',
        icon: <FileTextOutlined />,
        label: <Link to="/reports">Reporty</Link>,
      },
      {
        key: 'tasks',
        icon: (
          <Badge count={pendingTasksCount} dot={false} style={{ backgroundColor: isBlinking ? 'red' : '#1890ff' }}>
            <UnorderedListOutlined style={{ fontSize: '16px' }} />
          </Badge>
        ),
        label: (
          <span onClick={() => { setIsBlinking(false); }}>
            <Link to="/tasks">Plánovač</Link>
          </span>
        ),
      },
      {
        key: 'calendar',
        icon: <CalendarOutlined />,
        label: <Link to="/calendar">Kalendář</Link>,
      },
      {
        key: 'warehouse',
        icon: <BoxPlotOutlined />,
        label: <Link to="/warehouse">Sklad</Link>,
      },
      {
        key: 'systems',
        icon: <AppstoreOutlined />,
        label: <Link to="/systems">Systémy</Link>,
      },
      {
        key: 'components',
        icon: <DatabaseOutlined />,
        label: <Link to="/components">Komponenty</Link>,
      },
      {
        key: 'technician-dashboard',
        icon: <UnorderedListOutlined />,
        label: <Link to="/technician-dashboard">Seznam Tiketů</Link>,
      }
    );

      if (userRole === "admin") {
        items.push({
          key: 'add-know-how',
          icon: <BulbOutlined />,
          label: <Link to="/add-know-how">Přidat Know How</Link>,
        });
      }
    }
    if (userRole === "admin" || userRole === "technician") {
      items.push(
      {
      key: 'know-how-list',
      icon: <BulbOutlined />,
      label: <Link to="/know-how-list">Seznam Know How</Link>,
    }
    );
  }

  if (userRole === "admin") {
    items.push(
      {
        key: 'create-user',
        icon: <UserAddOutlined />,
        label: <Link to="/create-user">Vytvořit uživatele</Link>,
      },
      {
        key: 'user-management',
        icon: <UserSwitchOutlined />,
        label: <Link to="/user-management">Správa uživatelů</Link>,
      }
    );
  }

  const footerItems = [
    userRole === "client" ? {
      key: 'change-password',
      icon: <LockOutlined />,
      label: <Link to="/change-password">Změnit Heslo</Link>,
    } : userRole !== "client" ? {
      key: 'settings-1',
      icon: <SettingOutlined />,
      label: <Link to="/settings">Nastavení</Link>,
    } : null,
    {
      key: 'logout-1',
      icon: <PoweroffOutlined />,
      label: <span onClick={onLogout}>Odhlásit se</span>,
    },
    {
      key: 'notification',
      icon: (
        <Tooltip title={`Máte ${pendingTasksCount} naplánovaných úkolů/servisů`}>
          <Badge count={pendingTasksCount} className={isBlinking ? 'blinking' : ''}>
            {/* Pokud isBlinking = true, přidá třídu bell-animate k ikoně */}
            <BellOutlined onClick={handleNotificationClick} className={isBlinking ? 'bell-animate' : ''} />
          </Badge>
        </Tooltip>
      ),
      label: !collapsed ? <span onClick={handleNotificationClick}>Notifikace</span> : '',
    }
  ].filter(Boolean);

  const handleCollapse = (collapsedVal) => {
    setCollapsed(collapsedVal);
    if (onCollapseChange) {
      onCollapseChange(collapsedVal);
    }
  };

  // Funkce pro zobrazení a zavření Drawer (toggle)
  const toggleDrawer = () => {
    setDrawerVisible(!drawerVisible);
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
  };

  // Menu komponenta, kterou použijeme v Sider i Drawer
  const menu = (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={items}
      onClick={() => { if (!screens.md) { onCloseDrawer(); } }}
      style={{ flex: '1 1 auto', overflowY: 'auto' }}
    />
  );

  // Footer Menu items
  const footerMenu = (
    <Menu
      theme="dark"
      mode="inline"
      selectable={false}
      items={footerItems}
      style={{ borderTop: '1px solid #444' }}
    />
  );

  return (
    <>
      {/* Sider pro velké obrazovky */}
      {screens.md ? (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={handleCollapse}
          theme="dark"
          style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 9999 }}
        >
          <div className="sidebar-logo" style={{ padding: '10px', textAlign: 'center' }}>
            <Link to={userRole === "client" ? "/client-dashboard" : "/dashboard"}>
              <img src="/images/logo.png" alt="Solar Servis" style={{ width: collapsed ? 40 : 80, transition: 'width 0.3s' }} />
            </Link>
          </div>

          {menu}

          {footerMenu}
        </Sider>
      ) : (
        // Header a Drawer pro menší obrazovky
        <Header
          className="mobile-header"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10000,
            padding: '0 16px',
            backgroundColor: '#001529',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Link to={userRole === "client" ? "/client-dashboard" : "/dashboard"}>
            <img src="/images/logo.png" alt="Solar Servis" style={{ height: 40 }} />
          </Link>
          <Button type="text" icon={<MenuOutlined style={{ color: '#fff', fontSize: '20px' }} />} onClick={toggleDrawer} />
          <Drawer
            title="Navigace"
            placement="left"
            onClose={onCloseDrawer}
            visible={drawerVisible}
            bodyStyle={{ padding: 0 }}
          >
            {menu}
            {footerMenu}
          </Drawer>
        </Header>
      )}
    </>
  );
};

Navbar.propTypes = {
  onLogout: PropTypes.func.isRequired,
  pendingTasksCount: PropTypes.number.isRequired,
  onCollapseChange: PropTypes.func,
};

export default Navbar;
