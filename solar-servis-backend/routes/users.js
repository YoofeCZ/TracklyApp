// routes/users.js
import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Technician from '../models/Technician.js';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeRole from '../middleware/authorizeRole.js';
import Client from '../models/Client.js'; // Import modelu Client
import dotenv from 'dotenv';
import transporter from '../mailer.js'; // Import transporteru pro odesílání e-mailů
import { v4 as uuidv4 } from 'uuid';

dotenv.config(); // Načtení proměnných prostředí

const router = express.Router();
const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
    throw new Error('JWT_SECRET není nastaven v prostředí.');
}


// Vytvoření nového uživatele (pouze admin)
router.post('/create', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { username, password, role, technicianId } = req.body;
  try {
    // Pokud je technicianId poskytnut, ověřte jeho existenci
    if (technicianId) {
      const technician = await Technician.findByPk(technicianId);
      if (!technician) {
        return res.status(400).json({ message: 'Technik s daným ID neexistuje.' });
      }
    }

    const newUser = await User.createUser(username, password, role, technicianId);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user.', error: error.message });
  }
});

// Změna hesla uživatele (pouze admin)
router.put("/:id/password", authenticateToken, authorizeRole("admin"), async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error updating password.", error: error.message });
  }
});

// Smazání uživatele (pouze admin)
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    await user.destroy();
    res.status(200).json({ message: `User with ID ${id} has been deleted.` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user.', error: error.message });
  }
});

router.post('/validate-email', async (req, res) => {
  const { email } = req.body;

  try {
    const client = await Client.findOne({ where: { email } });
    if (!client) {
      return res.status(404).json({ message: 'E-mail není registrován.' });
    }
    res.status(200).json({ message: 'E-mail ověřen.' });
  } catch (error) {
    console.error('Chyba při ověřování e-mailu:', error);
    res.status(500).json({ message: 'Chyba serveru při ověřování e-mailu.' });
  }
});

// Změna role uživatele (pouze admin)
router.put('/:id/role', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: `Role of user ${user.username} updated to ${role}.` });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role.', error: error.message });
  }
});

// Získání všech uživatelů (pouze admin)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Technician, as: 'technician' }],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Endpoint pro zapomenuté heslo
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ message: 'E-mail je povinný.' });
  }

  try {
      // Najít klienta podle e-mailu
      const client = await Client.findOne({ where: { email } });
      if (!client || !client.userId) {
          // Neposkytovat informace o existenci účtu
          return res.status(200).json({ message: 'Pokud účet s tímto e-mailem existuje, byl odeslán e-mail s novým heslem.' });
      }

      // Najít uživatele spojeného s klientem
      const user = await User.findByPk(client.userId);
      if (!user) {
          return res.status(500).json({ message: 'Uživatel klienta nebyl nalezen.' });
      }

      // Vygenerovat náhodné dočasné heslo
      const tempPassword = uuidv4().slice(0, 12); // Můžete použít robustnější generátor

      // Zašifrovat dočasné heslo
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Aktualizovat heslo uživatele a nastavit povinnost změny hesla
      user.password = hashedPassword;
      user.mustChangePassword = true;
      await user.save();

      // Odeslat e-mail klientovi s novým heslem
      const mailOptions = {
          from: process.env.GMAIL_USER, // Vaše e-mailová adresa
          to: client.email,
          subject: 'Obnovení hesla - Trackly',
          text: `Dobrý den ${client.name},\n\nVaše heslo bylo resetováno. Vaše nové dočasné heslo je: ${tempPassword}\n\nPřihlaste se a změňte si heslo.\n\nS pozdravem,\nTým Trackly`,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({ message: 'Pokud účet s tímto e-mailem existuje, byl odeslán e-mail s novým heslem.' });
  } catch (error) {
      console.error('Chyba při resetování hesla:', error);
      res.status(500).json({ message: 'Chyba při resetování hesla.', error: error.message });
  }
});

// Endpoint pro změnu hesla uživatele (self)
router.put('/change-password', authenticateToken, async (req, res) => {
  const userId = req.user.id; // Z tokenu
  const { oldPassword, newPassword } = req.body;

  if (!newPassword) {
      return res.status(400).json({ message: 'Nové heslo je povinné.' });
  }

  try {
      const user = await User.findByPk(userId);
      if (!user) {
          return res.status(404).json({ message: 'Uživatel nenalezen.' });
      }

      // Pokud musí uživatel změnit heslo, nepřijímejte staré heslo
      if (user.mustChangePassword) {
          user.password = await bcrypt.hash(newPassword, 10);
          user.mustChangePassword = false;
          await user.save();
          return res.status(200).json({ message: 'Heslo bylo úspěšně změněno.' });
      }

      // Jinak ověřte staré heslo
      if (!oldPassword) {
          return res.status(400).json({ message: 'Staré heslo je povinné.' });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
          return res.status(401).json({ message: 'Neplatné staré heslo.' });
      }

      // Nastavit nové heslo
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.status(200).json({ message: 'Heslo bylo úspěšně změněno.' });
  } catch (error) {
      console.error('Chyba při změně hesla:', error);
      res.status(500).json({ message: 'Chyba při změně hesla.', error: error.message });
  }
});


// Přihlášení uživatele
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
      return res.status(400).json({ message: "Username a password jsou povinné." });
  }

  try {
      const user = await User.findOne({
          where: { username },
          include: [
              { model: Technician, as: "technician" },
              { model: Client, as: "client" },
          ],
      });

      if (!user) {
          console.warn(`Uživatel ${username} nenalezen.`);
          return res.status(404).json({ message: "User not found." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          console.warn(`Neplatné heslo pro uživatele ${username}.`);
          return res.status(401).json({ message: "Invalid credentials." });
      }

      const payload = { id: user.id, role: user.role, technicianId: user.technicianId };

      if (user.role === "client" && user.client) {
          payload.clientId = user.client.id;
      }

      if (user.mustChangePassword) {
          payload.mustChangePassword = true;
      }

      const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });
      console.log(`Token vytvořen pro uživatele ${username}: ${token}`);
      res.status(200).json({ token, mustChangePassword: user.mustChangePassword });
  } catch (error) {
      console.error("Chyba při přihlášení:", error.message);
      res.status(500).json({ message: "Error logging in.", error: error.message });
  }
});




// Získání všech uživatelů (pouze admin)
router.get('/all', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users.', error: error.message });
  }
});

// Aktualizace uživatele (pouze admin)
router.put('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { username, role, technicianId } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Pokud je technicianId poskytnut, ověřte jeho existenci
    if (technicianId) {
      const technician = await Technician.findByPk(technicianId);
      if (!technician) {
        return res.status(400).json({ message: 'Technik s daným ID neexistuje.' });
      }
    }

    // Aktualizace uživatele
    user.username = username || user.username;
    user.role = role || user.role;
    user.technicianId = technicianId !== undefined ? technicianId : user.technicianId;

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user.', error: error.message });
  }
});

// Přiřazení technika uživateli (pouze admin)
router.put('/:id/assign-technician', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { technicianId } = req.body;

  if (!technicianId) {
      return res.status(400).json({ message: 'TechnicianId je povinný.' });
  }

  try {
      const user = await User.findByPk(id);
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      const technician = await Technician.findByPk(technicianId);
      if (!technician) {
          return res.status(400).json({ message: 'Technik s daným ID neexistuje.' });
      }

      user.technicianId = technicianId;
      await user.save();

      // Fetch the user with Technician association
      const updatedUser = await User.findByPk(id, {
          include: [{ model: Technician, as: 'technician' }],
      });

      res.status(200).json(updatedUser);
  } catch (error) {
      res.status(500).json({ message: 'Error assigning technician to user.', error: error.message });
  }
});


export default router;
