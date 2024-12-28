// services/api.js
import axios from 'axios'; // Import axios
import superagent from "superagent";

// Definujte API_URL podle prostředí
let API_URL;

if (window.location.hostname === 'localhost') {
  API_URL = 'http://localhost:5000/api'; // Lokální prostředí
} else if (window.location.hostname.startsWith('192.168')) {
  API_URL = 'http://192.168.0.101:5000/api'; // Interní IP
} else {
  API_URL = 'http://188.175.32.34/api'; // Veřejná IP
}

// Vytvoření apiClient instance pomocí axios.create
const apiClient = axios.create({
  baseURL: API_URL,
});



// Přidání interceptoru pro automatické přidávání Authorization hlavičky
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Funkce pro zapomenuté heslo
export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post('/users/forgot-password', { email }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při odesílání žádosti o reset hesla:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro změnu hesla
export const changePassword = async (oldPassword, newPassword, mustChangePassword = false) => {
  try {
    // Pokud musí uživatel změnit heslo, posílejte pouze nové heslo
    // Jinak posílejte staré a nové heslo
    const payload = mustChangePassword
      ? { newPassword }
      : { oldPassword, newPassword };

    const response = await apiClient.put('/users/change-password', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error("Chyba při změně hesla:", error.response?.data || error.message);
    throw error;
  }
};
// Funkce pro získání všech techniků
export const getTechnicians = async () => {
  try {
    const response = await apiClient.get('/technicians'); // Použití apiClient
    return response.data;
  } catch (error) {
    console.error("Chyba při získávání techniků:", error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání všech systémů
export const getSystems = async () => {
  try {
    const response = await apiClient.get('/systems');
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání systémů:', error);
    throw error;
  }
};

// Funkce pro vytvoření systému
export const createSystem = async (systemData) => {
  try {
    const response = await apiClient.post('/systems', systemData);
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření systému:', error);
    throw error;
  }
};


// Funkce pro aktualizaci systému
export const updateSystem = async (systemId, systemData) => {
  try {
    const response = await apiClient.put(`/systems/${systemId}`, systemData);
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci systému:', error);
    throw error;
  }
};


// Funkce pro smazání systému
export const deleteSystem = async (systemId) => {
  try {
    await apiClient.delete(`/systems/${systemId}`);
    return { message: 'Systém byl úspěšně smazán' };
  } catch (error) {
    console.error('Chyba při mazání systému:', error);
    throw error;
  }
};

// Funkce pro získání všech komponent
export const getComponents = async () => {
  try {
    const response = await apiClient.get('/components');
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání komponent:', error);
    throw error;
  }
};

export const createComponent = async (componentData) => {
  try {
    const response = await apiClient.post(`${API_URL}/components`, componentData);
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření komponenty:', error);
    throw error;
  }
};

export const updateComponent = async (componentId, componentData) => {
  try {
    const response = await apiClient.put(`${API_URL}/components/${componentId}`, componentData);
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci komponenty:', error);
    throw error;
  }
};

export const getClientInfo = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/clients/me`);
    return response.data;
  } catch (error) {
    console.error('Error fetching client info:', error);
    throw error;
  }
};

export const deleteComponent = async (componentId) => {
  try {
    await apiClient.delete(`${API_URL}/components/${componentId}`);
    return { message: 'Komponenta byla úspěšně smazána' };
  } catch (error) {
    console.error('Chyba při mazání komponenty:', error);
    throw error;
  }
};
// Přidání nové funkce do ../services/api
export const getComponentsBySystemId = async (systemId) => {
  const response = await fetch(`${API_URL}/components/system/${systemId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch components by system ID');
  }
  return await response.json();
};





// Funkce pro nahrání souboru ke klientovi
export const uploadClientFile = async (clientId, formData) => {
  try {
    const response = await apiClient.post(`${API_URL}/clients/${clientId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Správné nastavení hlavičky
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při nahrávání souboru:', error);
    throw error;
  }
};

export const loginUser = async (username, password) => {
  if (!username || !password) {
      console.error("Chybějící username nebo password:", { username, password });
      throw new Error("Username a password jsou povinné.");
  }

  try {
      console.log("Odesílám požadavek na přihlášení:", { username, password });

      const response = await apiClient.post(`${API_URL}/Users/login`, { username, password }, {
          headers: {
              'Content-Type': 'application/json',
          },
      });

      console.log("Odpověď serveru:", response.data);

      return response.data;
  } catch (error) {
      console.error("Chyba při přihlášení:", error.response?.data || error.message);
      throw error;
  }
};






// Vytvoření nového uživatele (pouze pro adminy)
export const createUser = async (userData, token) => {
  try {
    const response = await apiClient.post(`${API_URL}/users/create`, userData, {
      headers: {
        Authorization: `Bearer ${token}`, // Tento token musí být předán správně
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření uživatele:', error.response?.data || error.message);
    throw error;
  }
};


// Získání všech uživatelů (pouze pro adminy)// Získání všech uživatelů (pouze pro adminy)
export const getUsers = async () => {
  const token = localStorage.getItem("token"); // Načti token z localStorage
  if (!token) {
    throw new Error("Přístup odepřen: chybí token.");
  }

  try {
    const response = await apiClient.get(`${API_URL}/users/all`, {
      headers: {
        Authorization: `Bearer ${token}`, // Ověření přes Bearer token
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Chyba při získávání uživatelů:",
      error.response?.data || error.message
    );

    // Pokud je token neplatný, odhlásíme uživatele
    if (error.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.reload(); // Obnovíme stránku, což způsobí přesměrování na login
    }

    throw error;
  }
};


// Funkce pro vytvoření nové složky pro klienta
export const createClientFolder = async (clientId, folderPath) => {
  try {
    const response = await apiClient.post(`${API_URL}/clients/${clientId}/folders`, { folderPath });
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření složky:', error);
    throw error;
  }
};



// Funkce pro přiřazení OP kódu klientovi
export const assignClientOpCode = async (clientId, opCode) => {
  try {
    const response = await apiClient.post(`${API_URL}/clients/${clientId}/assign-op`, { opCode });
    return response.data;
  } catch (error) {
    console.error('Chyba při přiřazení OP kódu klientovi:', error.response?.data || error.message);
    throw error;
  }
};


// Funkce pro vytvoření nového technika
export const createTechnician = async (technicianData) => {
  try {
    const response = await apiClient.post(`${API_URL}/technicians`, technicianData);
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření technika:', error);
    throw error;
  }
};

// Funkce pro získání reportu podle ID
export const getReportById = async (id) => {
  try {
    const response = await apiClient.get(`${API_URL}/reports/${id}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání reportu:', error);
    throw error;
  }
};

// Funkce pro aktualizaci technika
export const updateTechnician = async (id, technicianData) => {
  try {
    const response = await apiClient.put(`${API_URL}/technicians/${id}`, technicianData);
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci technika:', error);
    throw error;
  }
};

// Funkce pro smazání technika
export const deleteTechnician = async (id) => {
  try {
    await apiClient.delete(`${API_URL}/technicians/${id}`);
    return { message: 'Technik smazán' };
  } catch (error) {
    console.error('Chyba při mazání technika:', error);
    throw error;
  }
};

// Funkce pro získání všech klientů
export const getClients = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/clients`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání klientů:', error);
    throw error;
  }
};
export const getClientById = async (clientId) => {
  try {
    const response = await apiClient.get(`${API_URL}/clients/${clientId}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při načítání klienta:', error);
    throw error;
  }
};



// Funkce pro vytvoření nového klienta
export const createClient = async (clientData) => {
  try {
    console.log("Odesílám data do backendu:", clientData); // Přidáme logování
    const response = await apiClient.post('/clients', clientData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = response.data;
    console.log("Odpověď backendu:", data); // Logujeme odpověď backendu
    return data;
  } catch (error) {
    console.error('Chyba při vytváření klienta:', error);
    throw error;
  }
};


//Sekce pro podúkoly
// Funkce pro získání podúkolů pro konkrétní úkol
export const getSubtasks = async (taskId) => {
  try {
    const response = await apiClient.get(`${API_URL}/tasks/${taskId}/subtasks`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání podúkolů:', error);
    throw error;
  }
};

// Funkce pro vytvoření nového podúkolu
export const createSubtask = async (taskId, subtaskData) => {
  try {
    const response = await apiClient.post(`${API_URL}/tasks/${taskId}/subtasks`, subtaskData);
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření podúkolu:', error);
    throw error;
  }
};

// Funkce pro aktualizaci podúkolu
export const updateSubtask = async (subtaskId, subtaskData) => {
  try {
    const response = await apiClient.put(`${API_URL}/subtasks/${subtaskId}`, subtaskData);
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci podúkolu:', error);
    throw error;
  }
};


// Funkce pro smazání podúkolu
export const deleteSubtask = async (subtaskId) => {
  try {
    await apiClient.delete(`${API_URL}/subtasks/${subtaskId}`);
    return { message: 'Podúkol byl smazán' };
  } catch (error) {
    console.error('Chyba při mazání podúkolu:', error);
    throw error;
  }
};



// Funkce pro získání všech reportů
export const getReports = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/reports`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání reportů:', error);
    throw error;
  }
};

export const calculateCosts = (materials = [], hourlyRate, travelCost) => {
  if (!Array.isArray(materials)) {
      throw new Error("Materials must be an array");
  }

  const materialCost = materials.reduce((sum, material) => {
      const cost = material.usedQuantity * material.price;
      return sum + (material.chargeCustomer ? cost : 0);
  }, 0);

  return materialCost + hourlyRate + travelCost;
};


// Funkce pro vytvoření nového reportu
export const createReport = async (reportData) => {
  try {
    const response = await apiClient.post(`${API_URL}/reports`, reportData);
    return response.data;
  } catch (error) {
    console.error("Chyba v odpovědi backendu:", error.response?.data || error.message);

    throw error;
  }
};

// Funkce pro získání úkolů podle technika
export const getTasksByTechnician = async (technicianId) => {
  try {
    const response = await apiClient.get(`${API_URL}/tasks?technicianId=${technicianId}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání úkolů pro technika:', error);
    throw error;
  }
};

// Funkce pro získání všech úkolů
export const getTasks = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/tasks`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání všech úkolů:', error);
    throw error;
  }
};

// Funkce pro vytvoření nového úkolu
// Funkce pro vytvoření nového úkolu včetně podúkolů
export const createTask = async (taskData) => {
  try {
    const { subtasks, ...task } = taskData; // Oddělíme podúkoly od úkolu
    const response = await apiClient.post(`${API_URL}/tasks`, task);

    // Pokud jsou přítomné podúkoly, vytvoříme je
    if (subtasks && subtasks.length > 0) {
      await Promise.all(
        subtasks.map((subtask) => createSubtask(response.data.id, subtask))
      );
    }

    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření úkolu:', error);
    throw error;
  }
};

// Funkce pro aktualizaci úkolu včetně podúkolů
export const updateTask = async (taskId, taskData) => {
  try {
    const { subtasks, ...task } = taskData; // Oddělíme podúkoly od úkolu
    const response = await apiClient.put(`${API_URL}/tasks/${taskId}`, task);

    // Pokud jsou přítomné podúkoly, aktualizujeme je
    if (subtasks && subtasks.length > 0) {
      await Promise.all(
        subtasks.map((subtask) =>
          subtask.id
            ? updateSubtask(subtask.id, subtask) // Aktualizace stávajícího podúkolu
            : createSubtask(taskId, subtask)    // Vytvoření nového podúkolu
        )
      );
    }

    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci úkolu:', error);
    throw error;
  }
};


// Funkce pro smazání úkolu
export const deleteTask = async (taskId) => {
  try {
    await apiClient.delete(`${API_URL}/tasks/${taskId}`);
    return { message: 'Úkol smazán' };
  } catch (error) {
    console.error('Chyba při mazání úkolu:', error);
    throw error;
  }
};

export const updateClient = async (clientId, clientData) => {
  const response = await fetch(`${API_URL}/clients/${clientId}`, { // Absolutní URL
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
  });

  if (!response.ok) {
      throw new Error('Failed to update client');
  }

  return response.json();
};



export const deleteClient = async (id) => {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Chyba při mazání klienta.');
  }

  return await response.json();
};

// Získání všech materiálů
export const getWarehouseItems = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/warehouse`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání materiálů:', error);
    throw error;
  }
};

// Přidání nového materiálu
export const addWarehouseItem = async (item) => {
  try {
    const response = await apiClient.post(`${API_URL}/warehouse`, item);
    return response.data;
  } catch (error) {
    console.error('Chyba při přidávání materiálu:', error);
    throw error;
  }
};


// Načtení materiálů ze skladu
export const fetchMaterialsFromWarehouse = async () => {
  try {
      const response = await superagent.get(`${API_URL}/warehouse`);
      return response.body;
  } catch (error) {
      console.error("Chyba při načítání materiálů ze skladu:", error);
      throw error;
  }
};

// Funkce pro aktualizaci materiálu
export const updateWarehouseItem = async (id, updatedData) => {
  if (!id) {
    throw new Error('Warehouse item ID is required for update.');
  }
  try {
    const response = await apiClient.put(`/warehouse/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci materiálu:', error.response?.data || error.message);
    throw error;
  }
};



// Smazání materiálu
export const deleteWarehouseItem = async (id) => {
  try {
    const response = await apiClient.delete(`${API_URL}/warehouse/${id}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při mazání materiálu:', error);
    throw error;
  }
};

// Know how vyhledávání.
export const getKnowHowsBySearch = async (q) => {
  const token = localStorage.getItem('token');
  const response = await apiClient.get(`${API_URL}/know-how/search?q=${encodeURIComponent(q)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Funkce pro mazání Know How
export const deleteKnowHow = async (id) => {
  try {
    const response = await apiClient.delete(`/know-how/${id}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při mazání Know How:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro úpravu Know How
export const updateKnowHow = async (id, data) => {
  try {
    const response = await apiClient.put(`/know-how/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Chyba při úpravě Know How:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání detailu Know How podle ID
export const getKnowHowDetail = async (id) => {
  try {
    const response = await apiClient.get(`/know-how/detail/${id}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání detailu Know How:', error.response?.data || error.message);
    throw error;
  }
};


// Aktualizace hesla uživatele (pouze admin)
export const updateUserPassword = async (userId, newPassword, token) => {
  if (!userId || !newPassword || !token) {
    throw new Error("Chybí userId, nové heslo nebo token.");
  }

  try {
    const response = await apiClient.put(
      `${API_URL}/users/${userId}/password`, // Správná cesta
      { password: newPassword },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Chyba při aktualizaci hesla uživatele:", error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání aktuálních nastavení
export const getSettings = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/settings`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání nastavení:', error);
    throw error;
  }
};

// Funkce pro aktualizaci nastavení
export const updateSettings = async (settingsData) => {
  try {
    const response = await apiClient.put(`${API_URL}/settings`, settingsData, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci nastavení:', error);
    throw error;
  }
};

// Funkce pro vytvoření nových nastavení
export const createSettings = async (defaultSettings) => {
  try {
    const response = await apiClient.post(`${API_URL}/settings`, defaultSettings, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření nastavení:', error);
    throw error;
  }
};

// Smazání uživatele
export const deleteUser = async (userId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Přístup odepřen: chybí token.");
  }

  try {
    const response = await apiClient.delete(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Chyba při mazání uživatele:", error.response?.data || error.message);
    throw error;
  }
};


// Aktualizace role uživatele
export const updateUserRole = async (userId, newRole) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Přístup odepřen: chybí token.");
  }

  try {
    const response = await apiClient.put(
      `${API_URL}/users/${userId}/role`,
      { role: newRole },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Chyba při aktualizaci role uživatele:", error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro registraci klienta
export const registerClient = async (clientId) => {
  const token = localStorage.getItem("token"); // Načti token z localStorage
  if (!token) {
    throw new Error("Přístup odepřen: chybí token.");
  }

  try {
    const response = await apiClient.post(
      `${API_URL}/clients/${clientId}/register`,
      {}, // Předáváme prázdný objekt, protože backend nevyžaduje žádná data v těle
      {
        headers: {
          Authorization: `Bearer ${token}`, // Přidej autorizaci
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Chyba při registraci klienta:", error.response?.data || error.message);
    throw error;
  }
};

//Registrace na stránce login pomocí emailu..
export const registerClientByEmail = async (email) => {
  const API_URL = 'http://localhost:5000/api'; // Nastavte URL vašeho backendu

  try {
    const response = await fetch(`${API_URL}/clients/register-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Chyba při registraci.');
    }

    return await response.json();
  } catch (error) {
    console.error('Chyba při registraci klienta:', error.message);
    throw error;
  }
};



// Funkce pro vytvoření nového tiketu
export const createTicket = async (ticketData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await apiClient.post(`${API_URL}/tickets`, ticketData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při vytváření tiketu:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání všech tiketů (pro adminy a techniky)
export const getAllTickets = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await apiClient.get(`${API_URL}/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání všech tiketů:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání detailu tiketu
export const getTicketById = async (ticketId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await apiClient.get(`${API_URL}/tickets/${ticketId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání tiketu:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro přidání zprávy do tiketu
export const addTicketMessage = async (ticketId, message) => {
  try {
    const response = await apiClient.post(`/tickets/${ticketId}/messages`, { message });
    return response.data;
  } catch (error) {
    console.error('Chyba při přidávání zprávy do tiketu:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání Know How pro konkrétní téma
export const getKnowHowForTopic = async (topic) => {
  try {
    const token = localStorage.getItem('token');
    const response = await apiClient.get(`${API_URL}/know-how/${encodeURIComponent(topic)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání Know How:', error.response?.data || error.message);
    throw error;
  }
};

export const getClientByEmail = async (email) => {
  try {
    const response = await apiClient.get(`/clients/email/${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    console.error("Chyba při získávání klienta podle emailu:", error);
    throw error;
  }
};




// Funkce pro získání Know How podle systému
export const getKnowHowsBySystem = async (system) => {
  try {
    const response = await apiClient.get(`${API_URL}/knowhow/${system}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání Know How podle systému:', error);
    throw error;
  }
};



// Funkce pro aktualizaci stavu tiketu
export const updateTicketStatus = async (ticketId, status) => {
  try {
    const response = await apiClient.put(`/tickets/${ticketId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci stavu tiketu:', error.response?.data || error.message);
    throw error;
  }
};

// Získat témata podle klienta
export const getTopicsByClientId = async (clientId) => {
  const response = await apiClient.get(`${API_URL}/tickets/topics/${clientId}`);
  return response.data;
};



// Funkce pro vytvoření Know How
export const createKnowHow = async (knowHowData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await apiClient.post(`${API_URL}/know-how`, knowHowData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při přidávání Know How:', error.response?.data || error.message);
    throw error;
  }
};


// Funkce pro přiřazení technika uživateli
export const assignTechnicianToUser = async (userId, technicianId, token) => {
  if (!userId || !technicianId || !token) {
      throw new Error("Chybí userId, technicianId nebo token.");
  }

  try {
      const response = await apiClient.put(
          `${API_URL}/users/${userId}/assign-technician`,
          { technicianId },
          {
              headers: { Authorization: `Bearer ${token}` },
          }
      );
      return response.data;
  } catch (error) {
      console.error("Chyba při přiřazení technika uživateli:", error.response?.data || error.message);
      throw error;
  }
};

// 1. Získat všechna témata
export const getTopics = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/topics`, {
      headers: {
          'Authorization': `Bearer ${token}`,
      },
  });
  return response.data;
};

// 2. Vytvořit nové téma
export const createTopic = async (topicData) => { // Přijímá objekt { name, severity }
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/topics`, topicData, {
      headers: {
          'Authorization': `Bearer ${token}`,
      },
  });
  return response.data;
};

// 3. Aktualizovat téma
export const updateTopic = async (topicId, topicData) => { // Přijímá objekt { name, severity }
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/topics/${topicId}`, topicData, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    return response.data;
};

// Funkce pro mazání tématu
export const deleteTopic = async (id) => {
  try {
    const response = await apiClient.delete(`/topics/${id}`);
    return response.data;
  } catch (error) {
    console.error('Chyba při mazání tématu:', error.response?.data || error.message);
    throw error;
  }
};



// Funkce pro získání všech tiketů pro aktuálního klienta
export const getMyTickets = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await apiClient.get(`${API_URL}/tickets/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání mých tiketů:', error.response?.data || error.message);
    throw error;
  }
};





// Funkce pro aktualizaci tiketu
export const updateTicket = async (ticketId, updateData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await apiClient.put(`${API_URL}/tickets/${ticketId}`, updateData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Chyba při aktualizaci tiketu:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání témat (pokud již neexistuje

export const getTicketTopics = async () => {
  try {
    const response = await apiClient.get('/tickets/topics'); // Použití apiClient
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání témat tiketu:', error.response?.data || error.message);
    throw error;
  }
};

// Funkce pro získání zpráv z tiketu
export const getTicketMessages = async (ticketId) => {
  try {
    const response = await apiClient.get(`/tickets/${ticketId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Chyba při získávání zpráv:', error.response?.data || error.message);
    throw error;
  }
};




