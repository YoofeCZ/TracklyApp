import React, { useState, useEffect } from "react";
import { Form, InputNumber, Button, message, Card } from "antd";
import API_URL from "../config"; // Cesta k souboru config.js

const SettingsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Funkce pro načtení aktuálních nastavení
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/settings`);
      if (!response.ok) {
        throw new Error("Nepodařilo se načíst nastavení.");
      }
      const data = await response.json();
      form.setFieldsValue(data); // Načtená data nastavíme do formuláře
    } catch (error) {
      console.error("Chyba při načítání nastavení:", error);
      message.error("Nepodařilo se načíst nastavení.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(); // Načtení nastavení při prvním renderu
  }, []);

  // Funkce pro uložení změn nastavení
  const handleSaveSettings = async (values) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings`, {
        method: "PUT", // PUT pro aktualizaci
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Nepodařilo se uložit nastavení.");
      }

      message.success("Nastavení bylo úspěšně uloženo.");
    } catch (error) {
      console.error("Chyba při ukládání nastavení:", error);
      message.error("Nepodařilo se uložit nastavení.");
    } finally {
      setLoading(false);
    }
  };

  // Funkce pro resetování changelogu
  const handleResetChangelog = () => {
    localStorage.removeItem("dismissedChangelog");
    message.success("Changelog byl resetován a znovu se zobrazí.");
  };

  return (
    <div className="container mt-5">
    {/* Titulek stránky */}
    <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
      Nastavení aplikace
    </h1>

    <Card title="Nastavení aplikace" bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveSettings}
          initialValues={{
            hourlyRate: 1500,
            kilometerRate: 8,
            travelTimeRate: 100,
          }}
        >
          <Form.Item
            name="hourlyRate"
            label="Cena za hodinu práce (Kč)"
            rules={[{ required: true, message: "Zadejte cenu za hodinu práce." }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="kilometerRate"
            label="Cena za kilometr (Kč)"
            rules={[{ required: true, message: "Zadejte cenu za kilometr." }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="travelTimeRate"
            label="Cena za hodinu cesty (Kč)"
            rules={[{ required: true, message: "Zadejte cenu za hodinu cesty." }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Uložit nastavení
            </Button>
          </Form.Item>
        </Form>
        {/* Tlačítko pro resetování changelogu */}
        <Button
          type="default"
          onClick={handleResetChangelog}
          style={{ marginTop: "20px" }}
        >
          Resetovat changelog
        </Button>
      </Card>
    </div>
  );
};

export default SettingsPage;
