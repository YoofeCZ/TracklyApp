// routes/components.js
import express from 'express';
import { Component, System } from '../models/associations.js'; // Import modelů z associations.js

const router = express.Router();

// Vytvoření nové komponenty
router.post('/', async (req, res) => {
  try {
    const component = await Component.create(req.body);
    res.status(201).json(component);
  } catch (error) {
    res.status(400).json({ message: 'Chyba při vytváření komponenty', error: error.message });
  }
});

// Získání všech komponent s přidáním souvisejícího systému
router.get('/', async (req, res) => {
    try {
      const components = await Component.findAll({
        include: [
          {
            model: System,
            as: 'system',
            attributes: ['id', 'name'], // Můžete specifikovat atributy, které chcete získat
          },
        ],
      });
      res.status(200).json(components);
    } catch (error) {
      res.status(500).json({ message: 'Chyba při získávání komponent', error: error.message });
    }
  });

// Získání komponent podle systému
router.get('/system/:systemId', async (req, res) => {
  try {
    const components = await Component.findAll({ where: { systemId: req.params.systemId } });
    res.status(200).json(components);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při získávání komponent', error: error.message });
  }
});

// Získání jedné komponenty
router.get('/:id', async (req, res) => {
  try {
    const component = await Component.findByPk(req.params.id);
    if (!component) {
      return res.status(404).json({ message: 'Komponenta nenalezena' });
    }
    res.status(200).json(component);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při získávání komponenty', error: error.message });
  }
});

// Aktualizace komponenty
router.put('/:id', async (req, res) => {
  try {
    const component = await Component.findByPk(req.params.id);
    if (!component) {
      return res.status(404).json({ message: 'Komponenta nenalezena' });
    }
    await component.update(req.body);
    res.status(200).json(component);
  } catch (error) {
    res.status(400).json({ message: 'Chyba při aktualizaci komponenty', error: error.message });
  }
});

// Smazání komponenty
router.delete('/:id', async (req, res) => {
  try {
    const component = await Component.findByPk(req.params.id);
    if (!component) {
      return res.status(404).json({ message: 'Komponenta nenalezena' });
    }
    await component.destroy();
    res.status(200).json({ message: 'Komponenta byla smazána' });
  } catch (error) {
    res.status(500).json({ message: 'Chyba při mazání komponenty', error: error.message });
  }
});

export default router;
