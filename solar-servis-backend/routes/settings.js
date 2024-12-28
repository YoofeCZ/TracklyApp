import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// Získání aktuálních nastavení
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      // Pokud nastavení neexistují, vytvoříme výchozí hodnoty
      const defaultSettings = await Settings.create({
        hourlyRate: 1500,
        kilometerRate: 8,
        travelTimeRate: 100,
      });
      return res.json(defaultSettings);
    }
    res.json(settings);
  } catch (error) {
    console.error('Chyba při načítání nastavení:', error);
    res.status(500).json({ error: 'Chyba při načítání nastavení.' });
  }
});

// Aktualizace nastavení
router.put('/', async (req, res) => {
  try {
    const { hourlyRate, kilometerRate, travelTimeRate } = req.body;
    let settings = await Settings.findOne();

    if (!settings) {
      // Pokud nastavení neexistují, vytvoříme je
      settings = await Settings.create({ hourlyRate, kilometerRate, travelTimeRate });
    } else {
      // Pokud existují, aktualizujeme pouze změněné hodnoty
      settings.hourlyRate = hourlyRate !== undefined ? hourlyRate : settings.hourlyRate;
      settings.kilometerRate = kilometerRate !== undefined ? kilometerRate : settings.kilometerRate;
      settings.travelTimeRate = travelTimeRate !== undefined ? travelTimeRate : settings.travelTimeRate;
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Chyba při aktualizaci nastavení:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci nastavení.' });
  }
});

// Reset nastavení na výchozí hodnoty (volitelný endpoint)
router.post('/reset', async (req, res) => {
  try {
    const defaultSettings = {
      hourlyRate: 1500,
      kilometerRate: 8,
      travelTimeRate: 100,
    };

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(defaultSettings);
    } else {
      Object.assign(settings, defaultSettings);
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Chyba při resetování nastavení:', error);
    res.status(500).json({ error: 'Chyba při resetování nastavení.' });
  }
});

export default router;
