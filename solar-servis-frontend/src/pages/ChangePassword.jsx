import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { changePassword } from '../services/api';

const { Title } = Typography;

const ChangePassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Získání stavu z navigace
  const { mustChangePassword } = location.state || {};

  const onFinish = async (values) => {
    const { oldPassword, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      message.error("Nové heslo a potvrzení hesla se neshodují.");
      return;
    }

    setLoading(true);
    try {
      if (mustChangePassword) {
        // Pokud musí uživatel změnit heslo, nepřijímejte staré heslo
        await changePassword(null, newPassword);
      } else {
        // Jinak vyžadujte staré heslo
        await changePassword(oldPassword, newPassword);
      }
      message.success("Heslo bylo úspěšně změněno.");
      navigate('/dashboard'); // Přesměrování po úspěšné změně hesla
    } catch (error) {
      console.error("Chyba při změně hesla:", error);
      message.error(error.response?.data?.message || "Došlo k chybě při změně hesla.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container" style={{ maxWidth: '400px', margin: 'auto', padding: '50px 20px' }}>
      <Title level={2} style={{ textAlign: 'center' }}>Změna hesla</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        {!mustChangePassword && (
          <Form.Item
            label="Staré heslo"
            name="oldPassword"
            rules={[
              { required: true, message: 'Zadejte staré heslo!' },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="Staré heslo" />
          </Form.Item>
        )}

        <Form.Item
          label="Nové heslo"
          name="newPassword"
          rules={[
            { required: true, message: 'Zadejte nové heslo!' },
            { min: 6, message: 'Heslo musí mít alespoň 6 znaků.' },
          ]}
          hasFeedback
        >
          <Input.Password placeholder="Nové heslo" />
        </Form.Item>

        <Form.Item
          label="Potvrdit nové heslo"
          name="confirmPassword"
          dependencies={['newPassword']}
          hasFeedback
          rules={[
            { required: true, message: 'Potvrďte nové heslo!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Hesla se neshodují!'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Potvrďte nové heslo" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Změnit heslo
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ChangePassword;
