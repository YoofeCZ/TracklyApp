// routes/tasks.js
import express from 'express';
import Task from '../models/Task.js';
import Subtask from '../models/Subtask.js';

const router = express.Router();

// Přidání nového úkolu (POST /api/tasks)
router.post('/', async (req, res) => {
  try {
    const { type, clientId, ...rest } = req.body;

    // Pokud je typ "task", klient není vyžadován
    if (type === 'task' && clientId) {
      return res.status(400).json({ message: 'Podúkol nesmí mít přiřazeného klienta.' });
    }

    const newTask = await Task.create({ type, clientId: type === 'task' ? null : clientId, ...rest });
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při vytváření úkolu.', error: error.message });
  }
});

  

// Získání úkolů (GET /api/tasks nebo GET /api/tasks?technicianId=...)
router.get('/', async (req, res) => {
  try {
    const { technicianId } = req.query;
    let tasks;
    const now = new Date();

    if (technicianId) {
      tasks = await Task.findAll({
        where: { technicianId },
        include: { model: Subtask, as: 'subtasks' }, // Přidání podúkolů
      });
    } else {
      tasks = await Task.findAll({
        include: { model: Subtask, as: 'subtasks' }, // Přidání podúkolů
      });
    }

    // Aktualizace stavu podle času
    await Promise.all(
      tasks.map(async (task) => {
        if (task.type === 'service' && new Date(task.dueDate) < now && task.status !== 'completed') {
          await task.update({ status: 'missed' });
        }
      })
    );

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při získávání úkolů', error: error.message });
  }
});

// Získání jednoho úkolu podle ID (GET /api/tasks/:id)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (task) {
      res.status(200).json(task);
    } else {
      res.status(404).json({ message: 'Úkol nenalezen' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Chyba při získávání úkolu', error: error.message });
  }
});

// Aktualizace úkolu podle ID (PUT /api/tasks/:id)
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Úkol nenalezen' });
    }

    // Povinnost zadat důvod při označení jako nesplněné
    if (req.body.status === 'missed' && !req.body.reason) {
      console.warn('Úkol označen jako nesplněný bez uvedení důvodu.');
    }
    

    await task.update(req.body);
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Chyba při aktualizaci úkolu', error: error.message });
  }
});

router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: { model: Subtask, as: 'subtasks' },
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při načítání úkolů.', error: error.message });
  }
});


// Smazání úkolu podle ID (DELETE /api/tasks/:id)
router.delete('/:id', async (req, res) => {
  console.log('Mazání úkolu s ID:', req.params.id);
  try {
    const task = await Task.findByPk(req.params.id);
    if (task) {
      await task.destroy();
      console.log('Úkol smazán:', task);
      res.status(200).json({ message: 'Úkol byl úspěšně smazán' });
    } else {
      res.status(404).json({ message: 'Úkol nenalezen' });
    }
  } catch (error) {
    console.error('Chyba při mazání úkolu:', error);
    res.status(500).json({ message: 'Chyba při mazání úkolu', error: error.message });
  }
});


export default router;