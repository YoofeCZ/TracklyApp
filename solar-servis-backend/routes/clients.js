import express from 'express';
import path from 'path';
import fs from 'fs';
import Client from '../models/Client.js';
import { fileURLToPath } from 'url';
import System from '../models/System.js';
import User from '../models/User.js'; // Import User modelu
import bcrypt from 'bcryptjs';
import transporter from '../mailer.js'; // Import transporteru pro odesílání e-mailů
import { v4 as uuidv4 } from 'uuid'; // Pro generování náhodných hesel
// Middleware pro ověření tokenu a autorizaci
import authenticateToken from '../middleware/authenticateToken.js'; // Předpokládám, že máte tento middleware
import authorizeRole from '../middleware/authorizeRole.js'; // A tento také
import KnowHow from '../models/KnowHow.js';





// Vytvoření ekvivalentu `__dirname` v ES Modulech
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializace routeru
const router = express.Router();




// Vytvořit složku 'uploads', pokud neexistuje
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


router.get('/me', authenticateToken, authorizeRole(['client', 'admin', 'technician']), async (req, res) => {
  try {
    const clientId = req.user.clientId;
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID není dostupné.' });
    }

    const client = await Client.findByPk(clientId, {
      attributes: ['id', 'name', 'email', 'systemId', 'company'],
    });

    if (!client) {
      return res.status(404).json({ message: 'Klient nebyl nalezen.' });
    }

    res.json(client);
  } catch (error) {
    console.error('Chyba při získávání informací o klientovi:', error);
    res.status(500).json({ message: 'Chyba při získávání informací o klientovi', error: error.message });
  }
});

router.get('/system/:system', authenticateToken, authorizeRole(['client', 'technician', 'admin']), async (req, res) => {
  const { system } = req.params;

  try {
    const knowHows = await KnowHow.findAll({ where: { system } });
    if (!knowHows.length) {
      return res.status(404).json({ message: 'Know How pro tento systém nebylo nalezeno.' });
    }
    res.json(knowHows);
  } catch (error) {
    console.error('Chyba při získávání Know How podle systému:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/email/:email', async (req, res) => {
  const email = decodeURIComponent(req.params.email); // Dekódování emailu
  try {
      const client = await Client.findOne({
          where: { email },
          include: { model: System, as: 'system' }, // Zahrnutí systému klienta
      });
      if (!client) {
          return res.status(404).json({ message: 'Klient nenalezen' });
      }
      res.json(client);
  } catch (error) {
      console.error('Chyba při získávání klienta:', error);
      res.status(500).json({ message: 'Chyba při získávání klienta.' });
  }
});




// Endpoint pro registraci klienta
router.post('/:id/register', authenticateToken, authorizeRole(['admin', 'technician']), async (req, res) => {
  const clientId = req.params.id;

  try {
    const client = await Client.findByPk(clientId, { include: [{ model: User, as: 'user' }] });

    if (!client) {
      return res.status(404).json({ message: 'Klient nenalezen.' });
    }

    if (client.userId) {
      return res.status(400).json({ message: 'Klient již má registrovaný účet.' });
    }

    // Generování náhodného hesla (např. 12 znaků)
    const generatedPassword = uuidv4().slice(0, 12); // Můžete použít libovolný generátor

    // Vytvoření uživatelského účtu
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    const newUser = await User.create({
      username: client.email, // Používáme e-mail jako uživatelské jméno
      password: hashedPassword,
      role: 'client',
    });

    // Aktualizace klienta s userId
    client.userId = newUser.id;
    await client.save();

    // Odeslání e-mailu klientovi
    const mailOptions = {
      from: process.env.GMAIL_USER, // Vaše e-mailová adresa
      to: client.email,
      subject: 'Registrace účtu - Vaše Firma',
      text: `Dobrý den ${client.name},\n\nByl Vám vytvořen účet pro přístup k systému.\n\nPřihlašovací údaje:\nEmail: ${client.email}\nHeslo: ${generatedPassword}\n\nDoporučujeme po prvním přihlášení heslo změnit.\n\nS pozdravem,\nVaše Firma`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Klient byl úspěšně registrován a e-mail byl odeslán.' });
  } catch (error) {
    console.error('Chyba při registraci klienta:', error);
    res.status(500).json({ message: 'Chyba při registraci klienta.', error: error.message });
  }
});




// Funkce pro získání klienta podle ID
export const getClientById = async (clientId) => {
  try {
    const client = await Client.findByPk(clientId); // Použijte findByPk místo findById
    if (!client) {
      throw new Error('Klient nebyl nalezen');
    }
    return client;
  } catch (error) {
    console.error('Chyba při získávání klienta podle ID:', error);
    throw error;
  }
};



router.get('/clients/:clientId/files', async (req, res) => {
  try {
      const clientId = req.params.clientId;
      const clientPath = path.join(__dirname, 'uploads', clientId); // Složka pro daného klienta
      if (!fs.existsSync(clientPath)) {
          return res.status(404).json({ message: 'Složka klienta neexistuje' });
      }

      const files = fs.readdirSync(clientPath).map(file => ({
          name: file,
          isDirectory: fs.statSync(path.join(clientPath, file)).isDirectory(),
          path: `/${clientId}/${file}`,
      }));

      res.status(200).json({ files });
  } catch (error) {
      console.error('Chyba při načítání souborů:', error);
      res.status(500).json({ message: 'Chyba při načítání souborů', error: error.message });
  }
});


// Přidání nového klienta
router.post('/', async (req, res) => {
  try {
    const { opCodes, systemId, ...clientData } = req.body;

    // Ověření existence systému
    const system = await System.findByPk(systemId);
    if (!system) {
      return res.status(400).json({ message: 'Systém nenalezen' });
    }

    // Vytvoření nového klienta s přiřazeným systémem
    const newClient = await Client.create({ ...clientData, opCodes, systemId });
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Chyba při vytváření klienta:', error);
    res.status(500).json({ message: 'Chyba při vytváření klienta', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [
        { model: System, as: 'system' }, // Zahrnutí systému
      ],
    });

    if (!client) {
      return res.status(404).json({ message: 'Klient nenalezen' });
    }

    res.status(200).json(client);
  } catch (error) {
    console.error('Chyba při získávání klienta:', error);
    res.status(500).json({ message: 'Chyba při získávání klienta' });
  }
});


// Získání všech klientů
router.get('/', async (req, res) => {
  try {
    const clients = await Client.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'address','company', 'opCodes', 'revisionExpirationDate', 'contractNextServiceDate'],
      include: [
        {
          model: System,
          as: 'system',
          attributes: ['id', 'name'],
        },
      ],
    });
    res.json(clients);
  } catch (error) {
    console.error('Chyba při načítání klientů:', error);
    res.status(500).json({ error: 'Chyba při načítání klientů.' });
  }
});


router.delete('/:id', async (req, res) => {
  const clientId = req.params.id;
  try {
    const client = await Client.findByPk(clientId); // Použití Sequelize pro nalezení klienta
    if (!client) {
      return res.status(404).json({ message: 'Klient nenalezen' });
    }
    await client.destroy(); // Smazání klienta
    res.status(200).json({ message: 'Klient byl úspěšně smazán.' });
  } catch (error) {
    res.status(500).json({ message: 'Chyba při mazání klienta', error: error.message });
  }
});

// Aktualizace klienta
router.put('/:id', async (req, res) => {
  try {
    const { opCodes, systemId, ...clientData } = req.body;

    const client = await Client.findByPk(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Klient nenalezen' });
    }

    // Ověření existence systému, pokud je poskytnut
    if (systemId) {
      const system = await System.findByPk(systemId);
      if (!system) {
        return res.status(400).json({ message: 'Systém nenalezen' });
      }
    }

    await client.update({ ...clientData, opCodes, systemId });
    res.status(200).json(client);
  } catch (error) {
    console.error('Chyba při aktualizaci klienta:', error);
    res.status(500).json({ message: 'Chyba při aktualizaci klienta', error: error.message });
  }
});


router.post('/:id/assign-op', async (req, res) => {
  try {
    const clientId = req.params.id; // Získání ID klienta z parametru
    const { opCode } = req.body; // Získání OP kódu z těla požadavku

    const client = await Client.findByPk(clientId); // Vyhledání klienta podle ID
    if (!client) {
      return res.status(404).json({ message: 'Klient nenalezen' });
    }

    // Kontrola, zda OP kódy již existují, a přidání nového OP kódu
    const updatedOpCodes = client.opCodes ? [...client.opCodes, opCode] : [opCode];
    await client.update({ opCodes: updatedOpCodes });

    res.status(200).json({ message: 'OP kód byl přiřazen klientovi', opCodes: updatedOpCodes });
  } catch (error) {
    console.error('Chyba při přiřazování OP kódu klientovi:', error);
    res.status(500).json({ message: 'Chyba při přiřazování OP kódu klientovi', error: error.message });
  }
});


// Veřejný endpoint pro registraci klienta na základě e-mailu
router.post('/register-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'E-mail je povinný.' });
  }

  try {
    // Najít klienta podle e-mailu
    const client = await Client.findOne({ where: { email } });

    if (!client) {
      return res.status(404).json({ message: 'Klient s tímto e-mailem neexistuje.' });
    }

    if (client.userId) {
      return res.status(400).json({ message: 'Klient již má registrovaný účet.' });
    }

    // Generování náhodného hesla
    const generatedPassword = uuidv4().slice(0, 12);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Vytvoření uživatele
    const newUser = await User.create({
      username: email,
      password: hashedPassword,
      role: 'client',
    });

    // Aktualizace klienta s userId
    client.userId = newUser.id;
    await client.save();

    // Odeslání e-mailu s přihlašovacími údaji
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Registrace do systému',
      text: `Dobrý den ${client.name},\n\nByl vám vytvořen účet pro přístup k systému.\n\nPřihlašovací údaje:\nEmail: ${email}\nHeslo: ${generatedPassword}\n\nDoporučujeme si po přihlášení heslo změnit.\n\nS pozdravem,\nVaše firma`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Registrace proběhla úspěšně. E-mail byl odeslán.' });
  } catch (error) {
    console.error('Chyba při registraci klienta:', error);
    res.status(500).json({ message: 'Chyba při registraci klienta.', error: error.message });
  }
});



export default router;