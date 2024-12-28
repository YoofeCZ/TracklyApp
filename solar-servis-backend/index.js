// backend/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sequelize from './database.js';
import technicianRoutes from './routes/technicians.js';
import clientRoutes from './routes/clients.js';
import reportRoutes from './routes/reports.js';
import taskRoutes from './routes/tasks.js';
import warehouseRouter from './routes/warehouse.js';
import path from 'path';
import userRoutes from './routes/users.js'; // Import routeru pro uživatele
import User from './models/User.js'; // Import modelu uživatele
import Settings from './models/Settings.js'; // Import modelu Settings
import settingsRouter from './routes/settings.js'; // Import routeru nastavení
import systemsRoutes from './routes/systems.js';
import componentsRouter from './routes/components.js';
import filesRouter from './routes/files.js';
import subtaskRoutes from './routes/subtasks.js';
import http from 'http';
import { Server } from 'socket.io';
import transporter from './mailer.js'; // Import Nodemailer transporteru
import cron from 'node-cron';
import { Op } from 'sequelize';
import { Task, Technician, Client, Subtask } from './models/associations.js'; // Import modelů
import dayjs from 'dayjs'; // Import dayjs pro formátování datumu
import superagent from 'superagent';
import ticketsRouter from './routes/tickets.js'; // Import ticket router
import knowHowRouter from './routes/knowHow.js'; // Import KnowHow router
import topicRoutes from './routes/topics.js';

import './models/associations.js'; // Importujte asociace po definici modelů

// Inicializace aplikace Express
const app = express();
const PORT = process.env.PORT || 5000;

// Vytvoření HTTP serveru
const server = http.createServer(app);

// Inicializace Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Pro produkční prostředí doporučuji specifikovat konkrétní doménu
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors({
  origin: '*', // Pro produkční prostředí změňte na specifickou doménu
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Nastavte požadovaný limit (např. 10MB) // Middleware pro práci s JSON daty

// Použití technických, klientských a report routes
app.use('/api/Users', userRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tasks', taskRoutes); // Použití /tasks route
app.use('/api/warehouse', warehouseRouter); // Připojení skladu
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/settings', settingsRouter); // Připojení routeru k API
app.use('/api/systems', systemsRoutes); // Připojení routes
app.use('/api/components', componentsRouter);
app.use('/api', filesRouter); // Správce Souborů
app.use('/api', subtaskRoutes); // Přidání routeru pro podúkoly
app.use('/api/tickets', ticketsRouter); // Připojení tickets routeru
app.use('/api/know-how', knowHowRouter); // Připojení KnowHow routeru
app.use('/api/topics', topicRoutes);
// Proxy route pro výpočet vzdálenosti pomocí Google API
app.get('/api/distance', async (req, res) => {
  // Logování celého objektu query
  console.log('Query parametry:', req.query);
  const { origins, destinations } = req.query;

  // Logování přijatých parametrů
  console.log('Celý požadavek:', req.query);
  console.log('Parametr origins:', req.query.origins);
  console.log('Parametr destinations:', req.query.destinations);
  console.log('Přijaté parametry:', { origins, destinations });

  // Validace parametrů
  if (!origins || !destinations) {
    console.error('Chyba: origins nebo destinations nejsou nastavené.', {
      origins,
      destinations,
    });
    return res.status(400).json({
      error: 'Origins nebo destinations nejsou správně nastavené.',
      detail: { origins, destinations },
    });
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  // Logování načtení klíče
  console.log('GOOGLE_MAPS_API_KEY:', GOOGLE_MAPS_API_KEY);

  // Ověření, že API klíč je dostupný
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('API klíč není nastaven.');
    return res.status(500).json({
      error: 'API klíč není nastaven. Ujistěte se, že je GOOGLE_MAPS_API_KEY definován ve vašem .env souboru.',
    });
  }

  try {
    // Logování parametrů volání Google API
    console.log(`Volání Google API s origins: ${origins}, destinations: ${destinations}`);

    const response = await superagent
      .get('https://maps.googleapis.com/maps/api/distancematrix/json')
      .query({
        origins,
        destinations,
        key: GOOGLE_MAPS_API_KEY,
      });

    // Logování celé odpovědi Google API
    console.log('Kompletní odpověď Google API:', response.body);

    // Kontrola, zda je odpověď od Google API platná
    if (response.body && response.body.status === 'OK' && response.body.rows.length > 0) {
      const data = response.body;
      console.log('Platná odpověď Google API:', data);
      res.json(data); // Odeslání odpovědi zpět klientovi
    } else {
      console.error('Neplatná odpověď z Google API:', response.body);
      res.status(500).json({
        error: 'Nastala chyba při získávání dat z Google API',
        detail: response.body,
      });
    }
  } catch (error) {
    // Logování chyby při volání Google API
    console.error('Chyba při volání Google API:', error.response ? error.response.text : error);
    res.status(500).json({
      error: 'Nastala chyba při volání Google API',
      detail: error.response ? error.response.text : error,
    });
  }
});

// Sledování úkolů a odesílání notifikací pomocí cron
cron.schedule('0 * * * *', async () => { // Spuštění každou hodinu na začátku hodiny
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // Za hodinu

    // Najít úkoly, které mají termín za hodinu, nejsou dokončené a e-mail ještě nebyl odeslán
    const upcomingTasks = await Task.findAll({
      where: {
        dueDate: {
          [Op.between]: [now, oneHourLater]
        },
        status: {
          [Op.notIn]: ['completed', 'missed']
        },
        emailSent: false, // Přidání tohoto filtru
      },
      include: [
        { model: Technician, as: 'Technician' },
        { model: Subtask, as: 'subtasks' },
        { model: Client, as: 'client' },
      ]
    });

    for (const task of upcomingTasks) {
      // Získání technika a jeho e-mailu
      const technician = task.Technician;
      if (!technician || !technician.email) {
        console.warn(`Technik s ID ${task.technicianId} nemá přiřazený e-mail.`);
        continue;
      }

      // Definování mailOptions před voláním sendMail
      const mailOptions = {
        from: process.env.GMAIL_USER, // Vaše Gmail e-mailová adresa
        to: `${technician.email},mracek@lamasolar.cz`, // Technik a hlavní technik
        subject: `Připomenutí: Úkol "${task.description}" za hodinu`,
        text: `Dobrý den,\n\nPřipomínáme vám, že úkol "${task.description}" má termín splnění dnes v ${dayjs(task.dueDate).format('HH:mm')}.\n\nPopis úkolu: ${task.description}\nKlient: ${task.client ? task.client.name : 'N/A'}\nTechnik: ${technician.name}\n\nS pozdravem,\nVaše Firma`,
      };

      // Odeslání e-mailu
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`E-mail o úkolu ID ${task.id} byl odeslán: ${info.response}`);

        // Emitování notifikace přes Socket.IO
        io.emit('notification', {
          type: 'upcomingTask',
          task: {
            id: task.id,
            description: task.description,
            dueDate: task.dueDate,
            clientId: task.clientId,
            technicianId: task.technicianId,
            type: task.type, // Zahrnuje typ úkolu (task nebo service)
          }
        });

        // Aktualizace flagu emailSent
        await task.update({ emailSent: true });
      } catch (error) {
        console.error(`Chyba při odesílání e-mailu pro úkol ID ${task.id}:`, error);
      }
    }

    // Po dokončení sledování, aktualizovat počet naplánovaných úkolů
    const pendingCount = await Task.count({
      where: {
        status: {
          [Op.notIn]: ['completed', 'missed']
        }
      }
    });

    // Emitování počátečních dat pro nové připojené klienty
    io.emit('initialData', { pendingTasks: pendingCount });

  } catch (error) {
    console.error('Chyba při sledování úkolů:', error);
  }
});

// Funkce pro vytvoření admin uživatele a výchozích nastavení
const createAdminUser = async () => {
  try {
    // Zkontroluj, jestli uživatel existuje
    const existingUser = await User.findOne({ where: { username: 'mracek.d' } });
    if (existingUser) {
      console.log('Admin uživatel již existuje, přeskočeno.');
      return;
    }

    // Vytvoř nového uživatele
    const adminUser = await User.createUser('mracek.d', 'Udrzbar654456!', 'admin');
    console.log('Admin uživatel úspěšně vytvořen:', adminUser.username);
  } catch (error) {
    console.error('Chyba při vytváření admin uživatele:', error);
  }
};

const createDefaultSettings = async () => {
  try {
    const existingSettings = await Settings.findOne();
    if (!existingSettings) {
      await Settings.create({
        hourlyRate: 1500, // Cena za hodinu
        kilometerRate: 8, // Cena za kilometr
        travelTimeRate: 100, // Cena za hodinu cestování
      });
      console.log('Výchozí nastavení byla vytvořena.');
    } else {
      console.log('Výchozí nastavení již existují.');
    }
  } catch (error) {
    console.error('Chyba při vytváření výchozích nastavení:', error);
  }
};

// Socket.IO spojení
io.on('connection', async (socket) => {
  console.log('Nový klient připojen:', socket.id);

  try {
    // Získání aktuálního počtu naplánovaných úkolů
    const pendingTasks = await Task.count({
      where: {
        status: {
          [Op.notIn]: ['completed', 'missed']
        }
      }
    });

    // Odeslání počátečních dat
    socket.emit('initialData', { pendingTasks });
  } catch (error) {
    console.error('Chyba při získávání počtu naplánovaných úkolů:', error);
    socket.emit('initialData', { pendingTasks: 0 });
  }

  socket.on('disconnect', () => {
    console.log('Klient odpojen:', socket.id);
  });
});

// Synchronizace databáze a spuštění serveru
sequelize.sync({ alter: true }) // Použijeme alter pro přidání nových tabulek bez mazání existujících dat
  .then(async () => {
    console.log('Databáze připojena a tabulky synchronizovány');

    // Vytvoření výchozích nastavení
    await createDefaultSettings();
    // Vytvoření admin uživatele
    await createAdminUser();

    // Spuštění serveru
    server.listen(PORT, () => {
      console.log(`Server běží na portu: ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Chyba při připojování k databázi:', error);
  });
