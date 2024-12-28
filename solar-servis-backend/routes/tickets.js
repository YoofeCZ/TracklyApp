// routes/tickets.js
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeRole from '../middleware/authorizeRole.js';
import Ticket from '../models/Ticket.js';
import KnowHow from '../models/KnowHow.js';
import Client from '../models/Client.js';
import Technician from '../models/Technician.js';
import TicketMessage from '../models/TicketMessage.js';
import Topic from '../models/Topic.js'; // Import Topic modelu

const router = express.Router();

// Endpoint pro získání témat
// Endpoint pro získání témat
router.get('/topics', authenticateToken, authorizeRole(['client', 'admin', 'technician']), async (req, res) => {
  try {
      const clientId = req.user.clientId;

      if (!clientId) {
          console.warn('Client ID není dostupné.');
          return res.status(400).json({ message: 'Client ID není dostupné.' });
      }

      const client = await Client.findByPk(clientId);
      if (!client) {
          console.warn('Klient nebyl nalezen.');
          return res.status(404).json({ message: 'Klient nebyl nalezen.' });
      }

      const systemId = client.systemId;

      if (!systemId) {
          console.warn('System ID klienta není definováno.');
          return res.status(400).json({ message: 'System ID klienta není definováno.' });
      }

      const topics = await Topic.findAll({
          include: [{
              model: KnowHow,
              as: 'knowHows',
              where: { systemId },
              attributes: [],
              required: false, // LEFT OUTER JOIN pro zahrnutí všech témat
          }],
          attributes: ['id', 'name', 'severity'], // Zahrnout 'severity'
          group: ['Topic.id'],
          order: [['name', 'ASC']],
      });

      res.json(topics);
  } catch (error) {
      console.error('Chyba při získávání témat:', error);
      res.status(500).json({ message: 'Chyba při získávání témat', error: error.message });
  }
});

// 2. Vytvoření nového tiketu
router.post('/', authenticateToken, authorizeRole(['client']), async (req, res) => {
  const { topic, system, description, status, knowHowId } = req.body;

  try {
    // Validace vstupních dat
    if (!topic || !system) {
      return res.status(400).json({ message: 'Topic a systém jsou povinné.' });
    }

    // Najít téma a získat jeho závažnost
    const topicRecord = await Topic.findOne({ where: { name: topic } });
    if (!topicRecord) {
      return res.status(400).json({ message: 'Vybrané téma neexistuje.' });
    }

    const severity = topicRecord.severity;

    // Najít KnowHow pokud knowHowId je poskytnut
    let knowHow = null;
    if (knowHowId) {
      knowHow = await KnowHow.findByPk(knowHowId);
      if (!knowHow) {
        return res.status(400).json({ message: 'Neplatný Know How ID.' });
      }
    }

    // Vytvořit tiket
    const ticket = await Ticket.create({
      topic,
      system,
      description: description || '',
      severity, // přiřazená závažnost
      status: status || 'open',
      knowHowId: knowHowId || null,
      clientId: req.user.clientId,
    });

    // Pokud není Know-How, přidat automatickou zprávu
    if (!knowHowId) {
      await TicketMessage.create({
        sender: 'system', // Přidáno 'system'
        message: 'Pro toto téma není dostupné žádné Know-How. Prosím, poskytněte podrobnější popis problému.',
        TicketId: ticket.id,
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Chyba při vytváření tiketu:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
// 3. Získání všech tiketů pro aktuálního klienta
router.get('/my', authenticateToken, authorizeRole(['client']), async (req, res) => {
  const clientId = req.user.clientId;

  try {
    const tickets = await Ticket.findAll({
      where: { clientId },
      include: [
        { model: KnowHow, as: 'knowHow' },
        { model: TicketMessage, as: 'messages' }, // Přidáno pro zobrazení zpráv
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(tickets);
  } catch (error) {
    console.error('Chyba při získávání tiketů:', error);
    res.status(500).json({ message: 'Chyba při získávání tiketů', error: error.message });
  }
});

// 4. Získání všech tiketů (pro techniky a adminy)
router.get('/', authenticateToken, authorizeRole(['admin', 'technician']), async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: KnowHow, as: 'knowHow' },
        { model: TicketMessage, as: 'messages' },
      ],
      order: [['severity', 'ASC'], ['createdAt', 'ASC']], // Řazení podle závažnosti a data
    });
    res.json(tickets);
  } catch (error) {
    console.error('Chyba při získávání všech tiketů:', error);
    res.status(500).json({ message: 'Chyba při získávání tiketů', error: error.message });
  }
});


// 5. Získání detailu tiketu podle ID
router.get('/:id', authenticateToken, authorizeRole(['client', 'admin', 'technician']), async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await Ticket.findByPk(id, {
      include: [
        { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
        { model: KnowHow, as: 'knowHow' },
        { model: TicketMessage, as: 'messages' }, // Přidáno pro zobrazení zpráv
      ],
      order: [[{ model: TicketMessage, as: 'messages' }, 'createdAt', 'ASC']], // Správné řazení zpráv
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket nebyl nalezen.' });
    }

    // Kontrola, zda klient, který žádá o tiket, je vlastníkem tiketu nebo je admin/technician
    if (req.user.role === 'client' && ticket.clientId !== req.user.clientId) {
      return res.status(403).json({ message: 'Přístup odepřen.' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Chyba při získávání tiketu:', error);
    res.status(500).json({ message: 'Chyba při získávání tiketu', error: error.message });
  }
});

// 6. Aktualizace tiketu (např. změna statusu, přidání odpovědi)
router.put('/:id', authenticateToken, authorizeRole(['admin', 'technician', 'client']), async (req, res) => {
  const { id } = req.params;
  const { status, response } = req.body;

  try {
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket nebyl nalezen.' });
    }

    // Kontrola přístupových práv
    if (req.user.role === 'client' && ticket.clientId !== req.user.clientId) {
      return res.status(403).json({ message: 'Přístup odepřen.' });
    }

    // Aktualizace polí
    if (status) ticket.status = status;
    if (response) ticket.response = response; // Předpokládáme, že máte pole 'response' v modelu

    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Chyba při aktualizaci tiketu:', error);
    res.status(500).json({ message: 'Chyba při aktualizaci tiketu', error: error.message });
  }
});

// 7. Přidání zprávy do tiketu (chat)
router.post('/:id/messages', authenticateToken, authorizeRole(['client', 'admin', 'technician']), async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Zpráva nemůže být prázdná.' });
  }

  try {
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket nebyl nalezen.' });
    }

    // Kontrola přístupových práv
    if (req.user.role === 'client' && ticket.clientId !== req.user.clientId) {
      return res.status(403).json({ message: 'Přístup odepřen.' });
    }

    // Vytvoření zprávy
    const newMessage = await TicketMessage.create({
      sender: req.user.role === 'client' ? 'client' : 'technician',
      message,
      TicketId: id,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Chyba při přidávání zprávy:', error);
    res.status(500).json({ message: 'Chyba při přidávání zprávy.', error: error.message });
  }
});

// 8. Získání všech zpráv z tiketu (chat)
router.get('/:id/messages', authenticateToken, authorizeRole(['client', 'admin', 'technician']), async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: TicketMessage,
          as: 'messages',
          attributes: ['id', 'sender', 'message', 'createdAt'],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket nebyl nalezen.' });
    }

    // Kontrola přístupových práv
    if (req.user.role === 'client' && ticket.clientId !== req.user.clientId) {
      return res.status(403).json({ message: 'Přístup odepřen.' });
    }

    res.json(ticket.messages);
  } catch (error) {
    console.error('Chyba při získávání zpráv:', error);
    res.status(500).json({ message: 'Chyba při získávání zpráv.', error: error.message });
  }
});

// 9. Aktualizace stavu tiketu (specifický endpoint)
router.put('/:id/status', authenticateToken, authorizeRole(['admin', 'technician']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status je povinný.' });
  }

  try {
    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket nebyl nalezen.' });
    }

    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Chyba při aktualizaci stavu tiketu:', error);
    res.status(500).json({ message: 'Chyba při aktualizaci stavu tiketu.', error: error.message });
  }
});

// Export routeru
export default router;
