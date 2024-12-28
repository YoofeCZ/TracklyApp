// routes/topic.js
import express from 'express';
import Topic from '../models/Topic.js';
import KnowHow from '../models/KnowHow.js';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeRole from '../middleware/authorizeRole.js';
import { Sequelize } from 'sequelize';

const router = express.Router();

// Middleware pro všechny následující routy
router.use(authenticateToken);
router.use(authorizeRole(['admin']));

// 1. Získat všechna témata
router.get('/', async (req, res) => {
  try {
    const topics = await Topic.findAll();
    res.json(topics);
  } catch (error) {
    console.error('Chyba při získávání témat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. Získat všechna témata s počtem Know How
router.get('/with-count', async (req, res) => { // Změněná cesta na /with-count
  try {
    const topics = await Topic.findAll({
      attributes: {
        include: [
          [
            Sequelize.fn('COUNT', Sequelize.col('knowHows.id')),
            'knowHowCount'
          ]
        ]
      },
      include: [{
        model: KnowHow,
        as: 'knowHows',
        attributes: []
      }],
      group: ['Topic.id'],
      order: [['name', 'ASC']]
    });
    res.json(topics);
  } catch (error) {
    console.error('Chyba při získávání témat s počtem Know How:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. Přidat nové téma
router.post('/', async (req, res) => {
  const { name, severity } = req.body; // Zahrnout 'severity'

  try {
    // Validace
    if (severity === undefined || severity < 1 || severity > 10) {
      return res.status(400).json({ message: 'Závažnost musí být mezi 1 a 10.' });
    }

    const existingTopic = await Topic.findOne({ where: { name } });
    if (existingTopic) {
      return res.status(400).json({ message: 'Téma již existuje.' });
    }

    const newTopic = await Topic.create({ name, severity });
    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Chyba při přidávání tématu:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 4. Aktualizovat existující téma
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, severity } = req.body; // Zahrnout 'severity'

  try {
    const topic = await Topic.findByPk(id);
    if (!topic) {
      return res.status(404).json({ message: 'Téma nebylo nalezeno.' });
    }

    // Aktualizace názvu
    if (name) {
      const existingTopic = await Topic.findOne({ where: { name } });
      if (existingTopic && existingTopic.id !== parseInt(id, 10)) {
        return res.status(400).json({ message: 'Téma s tímto názvem již existuje.' });
      }
      topic.name = name;
    }

    // Aktualizace závažnosti
    if (severity !== undefined) {
      if (severity < 1 || severity > 10) {
        return res.status(400).json({ message: 'Závažnost musí být mezi 1 a 10.' });
      }
      topic.severity = severity;
    }

    await topic.save();

    res.json(topic);
  } catch (error) {
    console.error('Chyba při aktualizaci tématu:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 5. Odstranit téma
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const topic = await Topic.findByPk(id);
    if (!topic) {
      return res.status(404).json({ message: 'Téma nebylo nalezeno.' });
    }

    await topic.destroy();
    res.json({ message: 'Téma bylo úspěšně odstraněno.' });
  } catch (error) {
    console.error('Chyba při odstraňování tématu:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
