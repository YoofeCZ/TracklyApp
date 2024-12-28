// routes/knowHow.js
import express from 'express';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeRole from '../middleware/authorizeRole.js';
import { KnowHow, System, Topic, Client } from '../models/associations.js';
import { Op } from 'sequelize';

const router = express.Router();

// Endpoint pro přidání Know How (pouze pro techniky a adminy)
router.post('/', authenticateToken, authorizeRole(['technician', 'admin']), async (req, res) => {
  const { topic, system, content, availableForClients } = req.body;

  try {
    console.log("Přijímání dat pro Know How:", { topic, system, content, availableForClients });

    // Validace, zda 'topic' a 'system' jsou řetězce
    if (typeof topic !== 'string') {
      console.log("Topic není řetězec:", topic);
      return res.status(400).json({ message: 'Topic musí být řetězec.' });
    }

    if (typeof system !== 'string') {
      console.log("System není řetězec:", system);
      return res.status(400).json({ message: 'System musí být řetězec.' });
    }

    // Validace, zda 'system' je jeden z povolených systémů
    const allowedSystems = ['Solar Edge', 'Solax', 'GoodWe', 'Victron'];
    if (!allowedSystems.includes(system)) {
      console.log("Neplatný systém:", system);
      return res.status(400).json({ message: `System musí být jedním z: ${allowedSystems.join(', ')}.` });
    }

    // Najít systém podle názvu
    const systemRecord = await System.findOne({ where: { name: system } });
    if (!systemRecord) {
      console.log("Systém nebyl nalezen:", system);
      return res.status(400).json({ message: 'Systém nebyl nalezen.' });
    }

    // Najít nebo vytvořit téma podle názvu
    let topicRecord = await Topic.findOne({ where: { name: topic } });
    if (!topicRecord) {
      topicRecord = await Topic.create({ name: topic });
    }

    const topicId = topicRecord.id;

    // Zkontrolovat, zda již "Know How" pro dané téma a systém existuje
    const existingKnowHow = await KnowHow.findOne({ where: { topicId, systemId: systemRecord.id } });
    if (existingKnowHow) {
      console.log("Know How pro toto téma a systém již existuje.");
      return res.status(400).json({ message: 'Know How pro toto téma a systém již existuje.' });
    }

    // Vytvořit nový "Know How" s dostupností pro klienty
    const knowHow = await KnowHow.create({
      topicId,
      systemId: systemRecord.id,
      content,
      availableForClients: availableForClients || false // Nastavení defaultní hodnoty
    });

    console.log("Nové Know How vytvořeno:", knowHow);
    res.status(201).json(knowHow);
  } catch (error) {
    console.error("Chyba při vytváření Know How:", error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});


// Vyhledávání Know How
router.get('/search', authenticateToken, authorizeRole(['client', 'technician', 'admin']), async (req, res) => {
  const { q } = req.query; // Hledaný výraz
  const role = req.user.role;

  try {
    const whereClause = {
      [Op.or]: [
        { '$topic.name$': { [Op.iLike]: `%${q}%` } },
        { content: { [Op.iLike]: `%${q}%` } },
      ]
    };

    if (role === 'client') {
      // Najít klienta na základě userId
      const client = await Client.findOne({ where: { userId: req.user.id } });
      if (client) {
        whereClause.availableForClients = true;
        whereClause.systemId = client.systemId;
      } else {
        // Pokud klient není nalezen, vrátit prázdný výsledek
        return res.json([]);
      }
    }

    const knowHows = await KnowHow.findAll({
      where: whereClause,
      include: [
        { model: System, as: 'system', attributes: ['name'] },
        { model: Topic, as: 'topic', attributes: ['name'] },
      ]
    });

    res.json(knowHows);
  } catch (error) {
    console.error('Chyba při vyhledávání Know How:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Získat "Know How" podle tématu (pro klienty, adminy a techniky)
router.get('/:topic', authenticateToken, authorizeRole(['client', 'technician', 'admin']), async (req, res) => {
  const { topic } = req.params;

  try {
      // Najít Topic podle názvu
      const topicRecord = await Topic.findOne({ where: { name: topic } });
      if (!topicRecord) {
          return res.status(404).json({ message: 'Téma nebylo nalezeno.' });
      }

      // Najít KnowHow položky pro dané topicId a systém klienta
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

      // Najít KnowHow položky s odpovídajícím topicId a systemId, které jsou dostupné pro klienty
      const knowHows = await KnowHow.findAll({
          where: {
              topicId: topicRecord.id,
              systemId: systemId,
              availableForClients: true
          },
          include: [{ model: System, as: 'system', attributes: ['name'] }]
      });

      // Pokud nejsou žádná Know-How, vrátit prázdné pole s 200
      res.json(knowHows);
  } catch (error) {
      console.error('Chyba při získávání Know How:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Aktualizovat "Know How" (pouze pro techniky a adminy)
router.put('/:id', authenticateToken, authorizeRole(['technician', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { content, availableForClients } = req.body;

  try {
    const knowHow = await KnowHow.findByPk(id);
    if (!knowHow) {
      return res.status(404).json({ message: 'Know How nebylo nalezeno.' });
    }

    // Aktualizovat obsah a dostupnost
    knowHow.content = content || knowHow.content;
    if (availableForClients !== undefined) {
      knowHow.availableForClients = availableForClients;
    }
    await knowHow.save();

    res.json(knowHow);
  } catch (error) {
    console.error('Chyba při aktualizaci Know How:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Odstranit "Know How" (pouze pro adminy)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const knowHow = await KnowHow.findByPk(id);
    if (!knowHow) {
      return res.status(404).json({ message: 'Know How nebylo nalezeno.' });
    }

    await knowHow.destroy();
    res.json({ message: 'Know How bylo úspěšně odstraněno.' });
  } catch (error) {
    console.error('Chyba při odstraňování Know How:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Získat Seznam Všech Témat
router.get('/topics', authenticateToken, authorizeRole(['client', 'technician', 'admin']), async (req, res) => {
  try {
    const topics = await KnowHow.findAll({
      attributes: ['topic'],
      group: ['topic'],
      raw: true
    });
    const uniqueTopics = topics.map(item => item.topic);
    res.json(uniqueTopics);
  } catch (error) {
    console.error('Chyba při získávání témat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;

// Odstranit "Know How" (pouze pro adminy)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
      const knowHow = await KnowHow.findByPk(id);
      if (!knowHow) {
          return res.status(404).json({ message: 'Know How nebylo nalezeno.' });
      }

      await knowHow.destroy();
      res.json({ message: 'Know How bylo úspěšně odstraněno.' });
  } catch (error) {
      console.error('Chyba při odstraňování Know How:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Aktualizovat "Know How" (pouze pro techniky a adminy)
router.put('/:id', authenticateToken, authorizeRole(['technician', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { content, availableForClients } = req.body;

  try {
      const knowHow = await KnowHow.findByPk(id);
      if (!knowHow) {
          return res.status(404).json({ message: 'Know How nebylo nalezeno.' });
      }

      // Aktualizovat obsah a dostupnost
      knowHow.content = content || knowHow.content;
      if (availableForClients !== undefined) {
          knowHow.availableForClients = availableForClients;
      }
      await knowHow.save();

      res.json(knowHow);
  } catch (error) {
      console.error('Chyba při aktualizaci Know How:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Získat detail "Know How" podle ID
router.get('/detail/:id', authenticateToken, authorizeRole(['client', 'technician', 'admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const knowHow = await KnowHow.findByPk(id, {
      include: [
        { model: System, as: 'system', attributes: ['name'] },
        { model: Topic, as: 'topic', attributes: ['name'] },
      ]
    });

    if (!knowHow) {
      return res.status(404).json({ message: 'Know How pro toto téma nebylo nalezeno.' });
    }

    res.json(knowHow);
  } catch (error) {
    console.error('Chyba při získávání detailu Know How:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
