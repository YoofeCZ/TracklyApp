import React, { useState } from "react";
import { message, Radio, Modal, Form, Input, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  LoginFormPage,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import "../css/Global.css";
import { forgotPassword, registerClientByEmail  } from '../services/api';



const Login = ({ onLogin }) => {
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);
  const navigate = useNavigate();

  const { Title } = Typography;

  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  // Funkce pro otevření/zavření registračního modalu
  const showRegisterModal = () => setIsRegisterModalVisible(true);
  const handleRegisterCancel = () => {
    setRegisterEmail('');
    setIsRegisterModalVisible(false);
  };

  // Funkce pro registraci
  const handleRegisterSubmit = async () => {
    if (!registerEmail) {
      message.error('Zadejte prosím e-mail.');
      return;
    }

    setIsRegisterLoading(true);
    try {
      await registerClientByEmail(registerEmail);
      message.success('Pokud je e-mail v databázi, byl odeslán registrační e-mail.');
      handleRegisterCancel();
    } catch (error) {
      console.error('Chyba při registraci klienta:', error);
      message.error('Nepodařilo se dokončit registraci, zadali jste stejný e-mail který máte uvedený ve smlouvě?');
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const showForgotPasswordModal = () => {
    setIsForgotPasswordModalVisible(true);
  };

  const handleForgotPasswordCancel = () => {
    setIsForgotPasswordModalVisible(false);
    setForgotPasswordEmail('');
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotPasswordEmail) {
      message.error("Zadejte prosím e-mail.");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await forgotPassword(forgotPasswordEmail);
      message.success("Pokud účet s tímto e-mailem existuje, byl odeslán e-mail s novým heslem.");
      handleForgotPasswordCancel();
    } catch (err) {
      console.error("Chyba při odesílání resetovacího e-mailu:", err);
      message.error("Došlo k chybě při odesílání resetovacího e-mailu.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleFinish = async (values) => {
    const emailOrUsername = values.username;
    const password = values.password;

    if (role === "client" && !emailOrUsername.includes("@")) {
      setError("Na záložce Klient je vyžadován e-mail.");
      message.error("Na záložce Klient je vyžadován e-mail.");
      return;
    }

    if (role === "technician" && emailOrUsername.includes("@")) {
      setError("Na záložce Technik je vyžadováno uživatelské jméno.");
      message.error("Na záložce Technik je vyžadováno uživatelské jméno.");
      return;
    }

    if (!emailOrUsername || !password) {
      setError("Všechna pole musí být vyplněna.");
      message.error("Vyplňte prosím všechny údaje.");
      return;
    }

    try {
      await onLogin(emailOrUsername.trim(), password.trim());
    } catch (err) {
      console.error("Chyba při přihlášení:", err.message || err);
      if (err.response?.status === 404) {
        setError("Uživatel nenalezen.");
        message.error("Uživatel nenalezen.");
      } else if (err.response?.status === 401) {
        setError("Nesprávné přihlašovací údaje.");
        message.error("Nesprávné přihlašovací údaje.");
      } else {
        setError("Přihlášení selhalo.");
        message.error("Došlo k chybě při přihlášení.");
      }
    }
  };

  return (
    <div className="login-container">
      <LoginFormPage
        backgroundImageUrl="https://mdn.alipayobjects.com/huamei_gcee1x/afts/img/A*y0ZTS6WLwvgAAAAAAAAAAAAADml6AQ/fmt.webp"
        backgroundVideoUrl="https://gw.alipayobjects.com/v/huamei_gcee1x/afts/video/jXRBRK_VAwoAAAAAAAAAAAAAK4eUAQBr"
        logo=""
        title="Přihlášení"
        subTitle="Trackly - Přihlášení"
        activityConfig={{
          style: {
            boxShadow: '0px 0px 8px rgba(0, 0, 0, 0.2)',
            color: '#fff',
            borderRadius: 8,
            backgroundColor: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(4px)',
          },
          title: 'Info o nás najdete na našem webu',
          subTitle: 'stačí kliknout "Více info"',
          action: (
            <a
              href="https://lamasolar.cz/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                textAlign: 'center',
                lineHeight: '40px',
                textDecoration: 'none',
                borderRadius: 20,
                background: '#fff',
                color: '#1677FF',
                width: 120,
                height: 40,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Více info
            </a>
          ),
        }}
        onFinish={handleFinish}
        submitter={{
          searchConfig: {
            submitText: 'Přihlásit',
          },
        }}
      >
        <Radio.Group
          onChange={(e) => {
            setRole(e.target.value);
            setError("");
          }}
          value={role}
          style={{ marginBottom: '20px', width: '100%' }}
        >
          <Radio.Button value="client" style={{ width: '50%', textAlign: 'center' }}>Klient</Radio.Button>
          <Radio.Button value="technician" style={{ width: '50%', textAlign: 'center' }}>Technik</Radio.Button>
        </Radio.Group>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <ProFormText
          name="username"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined className={'prefixIcon'} />,
          }}
          placeholder={role === 'client' ? 'E-mail' : 'Uživatelské jméno'}
          rules={[
            {
              required: true,
              message: role === 'client' ? 'Zadejte prosím e-mail!' : 'Zadejte prosím uživatelské jméno!',
            },
          ]}
        />

        <ProFormText.Password
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined className={'prefixIcon'} />,
          }}
          placeholder={'Heslo'}
          rules={[
            {
              required: true,
              message: 'Zadejte prosím heslo!',
            },
          ]}
        />

        <div style={{ marginBlockEnd: 24 }}>
          <ProFormCheckbox noStyle name="autoLogin">
            Automaticky přihlásit
          </ProFormCheckbox>
          <Button type="link" onClick={showForgotPasswordModal} style={{ float: 'right' }}>
            Zapomenuté heslo
          </Button>
          
        </div>
        <Button type="link" onClick={showRegisterModal} style={{ float: 'right' }}>
          Registrovat
        </Button>
      </LoginFormPage>

{/* Modal pro registraci */}
<Modal
        title="Registrace klienta"
        visible={isRegisterModalVisible}
        onCancel={handleRegisterCancel}
        footer={null}
      >
          {/* Text pod titulkem */}
  <Typography.Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
    Zadejte e-mail, který máte uvedený ve smlouvě. Pokud se registrace nezdaří, 
    napište nám na e-mail <a href="mailto:email@email.cz">email@email.cz</a>.
  </Typography.Text>
        <Form layout="vertical">
          <Form.Item label="E-mail">
            <Input
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              placeholder="Zadejte váš e-mail"
            />
          </Form.Item>
          <Button
            type="primary"
            loading={isRegisterLoading}
            onClick={handleRegisterSubmit}
            style={{ width: '100%' }}
          >
            Odeslat žádost
          </Button>
        </Form>
      </Modal>
      <Modal
        title="Obnovení hesla"
        visible={isForgotPasswordModalVisible}
        onCancel={handleForgotPasswordCancel}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              {
                type: 'email',
                message: 'Zadejte platný e-mail!',
              },
              {
                required: true,
                message: 'E-mail je povinný.',
              },
            ]}
          >
            <Input
              placeholder="Zadejte svůj e-mail"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              onClick={handleForgotPasswordSubmit}
              loading={forgotPasswordLoading}
              style={{ width: '100%' }}
            >
              Odeslat
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
