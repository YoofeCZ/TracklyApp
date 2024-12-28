// routes/systems.js
import express from 'express';
import System from '../models/System.js';

const router = express.Router();

// Vytvoření nového systému
router.post('/', async (req, res) => {
  try {
    const system = await System.create(req.body);
    res.status(201).json(system);
  } catch (error) {
    res.status(400).json({ message: 'Chyba při vytváření systému', error: error.message });
  }
});

// Získání všech systémů
router.get('/', async (req, res) => {
  try {
    const systems = await System.findAll();
    res.status(200).json(systems);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při získávání systémů', error: error.message });
  }
});

// Získání jednoho systému
router.get('/:id', async (req, res) => {
  try {
    const system = await System.findByPk(req.params.id);
    if (!system) {
      return res.status(404).json({ message: 'Systém nenalezen' });
    }
    res.status(200).json(system);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při získávání systému', error: error.message });
  }
});

// Aktualizace systému
router.put('/:id', async (req, res) => {
  try {
    const system = await System.findByPk(req.params.id);
    if (!system) {
      return res.status(404).json({ message: 'Systém nenalezen' });
    }
    await system.update(req.body);
    res.status(200).json(system);
  } catch (error) {
    res.status(400).json({ message: 'Chyba při aktualizaci systému', error: error.message });
  }
});

// Smazání systému
router.delete('/:id', async (req, res) => {
  try {
    const system = await System.findByPk(req.params.id);
    if (!system) {
      return res.status(404).json({ message: 'Systém nenalezen' });
    }
    await system.destroy();
    res.status(200).json({ message: 'Systém byl smazán' });
  } catch (error) {
    res.status(500).json({ message: 'Chyba při mazání systému', error: error.message });
  }
});

export default router;
