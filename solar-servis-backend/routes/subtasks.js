// routes/subtasks.js
import express from 'express';
import Subtask from '../models/Subtask.js'; // Model pro podúkoly
const router = express.Router();

// Získání všech podúkolů pro konkrétní úkol
router.get('/tasks/:taskId/subtasks', async (req, res) => {
  try {
    const { taskId } = req.params;
    const subtasks = await Subtask.findAll({ where: { taskId } });
    res.status(200).json(subtasks);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při načítání podúkolů', error: error.message });
  }
});

// Vytvoření nového podúkolu
router.post('/tasks/:taskId/subtasks', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description, completed = false } = req.body;

    const newSubtask = await Subtask.create({
      taskId,
      description,
      completed,
    });

    res.status(201).json(newSubtask);
  } catch (error) {
    res.status(500).json({ message: 'Chyba při vytváření podúkolu', error: error.message });
  }
});

// Aktualizace podúkolu
router.put('/subtasks/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const updatedSubtask = await Subtask.update(req.body, { where: { id: subtaskId } });

    if (!updatedSubtask[0]) {
      return res.status(404).json({ message: 'Podúkol nebyl nalezen' });
    }

    res.status(200).json({ message: 'Podúkol byl úspěšně aktualizován' });
  } catch (error) {
    res.status(500).json({ message: 'Chyba při aktualizaci podúkolu', error: error.message });
  }
});

// Smazání podúkolu
router.delete('/subtasks/:subtaskId', async (req, res) => {
  try {
    const { subtaskId } = req.params;

    const deleted = await Subtask.destroy({ where: { id: subtaskId } });

    if (!deleted) {
      return res.status(404).json({ message: 'Podúkol nebyl nalezen' });
    }

    res.status(200).json({ message: 'Podúkol byl úspěšně smazán' });
  } catch (error) {
    res.status(500).json({ message: 'Chyba při mazání podúkolu', error: error.message });
  }
});

export default router;
