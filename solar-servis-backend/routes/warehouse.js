// routes/warehouse.js

import express from 'express';
import Warehouse from '../models/Warehouse.js';

const router = express.Router();

// GET - Získání všech materiálů
router.get('/', async (req, res) => {
  try {
    const materials = await Warehouse.findAll();
    res.json(materials);
  } catch (error) {
    console.error('Chyba při získávání materiálů:', error);
    res.status(500).json({ error: 'Chyba při načítání materiálů' });
  }
});

// POST - Přidání nového materiálu
router.post('/', async (req, res) => {
  try {
    const { name, price, quantity } = req.body;
    const newMaterial = await Warehouse.create({ name, price, quantity });
    res.status(201).json(newMaterial);
  } catch (error) {
    console.error('Chyba při přidávání materiálu:', error);
    res.status(500).json({ error: 'Chyba při přidávání materiálu' });
  }
});

// PUT - Aktualizace materiálu
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity } = req.body;

    // Validace, že množství není záporné
    if (quantity < 0) {
      return res.status(400).json({ error: "Množství nemůže být záporné." });
    }

    const material = await Warehouse.findByPk(id);
    if (!material) {
      return res.status(404).json({ error: 'Materiál nenalezen' });
    }

    await material.update({ name, price, quantity });

    res.json(material); // Vrácení aktualizovaného materiálu
  } catch (error) {
    console.error('Chyba při aktualizaci materiálu:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci materiálu' });
  }
});

// DELETE - Smazání materiálu
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const material = await Warehouse.findByPk(id);
    if (!material) {
      return res.status(404).json({ error: 'Materiál nenalezen' });
    }

    await material.destroy();
    res.json({ message: 'Materiál byl úspěšně smazán' });
  } catch (error) {
    console.error('Chyba při mazání materiálu:', error);
    res.status(500).json({ error: 'Chyba při mazání materiálu' });
  }
});

export default router;
