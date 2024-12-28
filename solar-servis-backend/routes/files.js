// routes/files.js
import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { getClientById } from './clients.js'; // musí vracet objekt klienta s name a files

const router = express.Router();
const __dirname = process.cwd(); 
const BASE_DIR = path.join(__dirname, 'uploads');

router.use(fileUpload({ createParentPath: true }));

// Middleware pro nastavení cesty k adresáři klienta
router.use('/clients/:clientId', async (req, res, next) => {
  try {
    const client = await getClientById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ error: 'Klient nenalezen' });
    }

    req.client = client;
    req.clientDir = path.join(BASE_DIR, client.name);

    if (!fs.existsSync(req.clientDir)) {
      fs.mkdirSync(req.clientDir, { recursive: true });
    }

    next();
  } catch (error) {
    console.error('Chyba při načítání klienta:', error);
    res.status(500).json({ error: 'Chyba při načítání klienta' });
  }
});

// Získání seznamu souborů a složek
router.get('/clients/:clientId/files', (req, res) => {
  const currentPath = path.join(req.clientDir, req.query.path || '');
  fs.readdir(currentPath, { withFileTypes: true }, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Nelze načíst adresář' });
    }

    const files = items.map((item) => {
      const itemPath = path.join(currentPath, item.name);
      const stats = fs.statSync(itemPath);
      return {
        name: item.name,
        type: item.isDirectory() ? 'folder' : 'file',
        path: path.join(req.query.path || '', item.name),
        size: item.isDirectory() ? null : stats.size,
        updatedAt: stats.mtime,
      };
    });
    res.json({ files });
  });
});

// Vytvoření nové složky
router.post('/clients/:clientId/folders', (req, res) => {
  const folderPath = path.join(req.clientDir, req.body.folderPath);
  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      console.error("Chyba při vytváření složky:", err);
      return res.status(500).json({ error: 'Nelze vytvořit složku' });
    }
    res.json({ name: path.basename(folderPath), message: 'Složka byla úspěšně vytvořena' });
  });
});

// Smazání souboru nebo složky
router.delete('/clients/:clientId/files', (req, res) => {
  const itemPath = path.join(req.clientDir, req.body.path);
  fs.stat(itemPath, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Položka nebyla nalezena' });
    }
    if (stats.isDirectory()) {
      fs.rmdir(itemPath, { recursive: true }, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Nelze smazat složku' });
        }
        res.json({ message: 'Složka byla úspěšně smazána' });
      });
    } else {
      fs.unlink(itemPath, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Nelze smazat soubor' });
        }
        res.json({ message: 'Soubor byl úspěšně smazán' });
      });
    }
  });
});

// Stahování souborů
router.get('/clients/:clientId/files/download', (req, res) => {
  const filePath = path.join(req.clientDir, req.query.path || '');

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Soubor nenalezen:', filePath);
      if (!res.headersSent) {
        res.status(404).json({ error: 'Soubor nenalezen' });
      }
      return;
    }

    res.download(filePath, (err) => {
      if (err) {
        console.error('Chyba při stahování souboru:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Chyba při stahování souboru' });
        }
      }
    });
  });
});

// Nahrávání souborů s metadaty
router.post('/clients/:clientId/files/upload', async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'Žádný soubor nebyl nahrán' });
  }

  const fileType = req.body.fileType || 'normal';
  let expirationDate = null;
  let nextServiceDate = null;
  
  const client = req.client; 

  if (fileType === 'revision') {
    expirationDate = req.body.expirationDate;
    if (!expirationDate) {
      return res.status(400).json({ error: 'U revizní zprávy je nutné zadat expirationDate' });
    }
    // Uložíme do zvláštního sloupce klienta
    client.revisionExpirationDate = expirationDate;
  }

  if (fileType === 'contract') {
    nextServiceDate = req.body.nextServiceDate;
    if (!nextServiceDate) {
      return res.status(400).json({ error: 'U servisní smlouvy je nutné zadat nextServiceDate' });
    }
    // Uložíme do zvláštního sloupce klienta
    client.contractNextServiceDate = nextServiceDate;
  }

  try {
    const uploadPath = path.join(req.clientDir, req.body.path || '', req.files.file.name);
    if (!fs.existsSync(path.dirname(uploadPath))) {
      fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
    }

    await req.files.file.mv(uploadPath);

    // Uložení souboru do pole files, pokud chcete zachovat i tuto funkcionalitu
    const newFileMeta = {
      name: req.files.file.name,
      path: path.join(req.body.path || '', req.files.file.name),
      fileType,
      expirationDate: expirationDate || null,
      nextServiceDate: nextServiceDate || null
    };

    client.files.push(newFileMeta);
    await client.save(); // uloží změny do DB, včetně revisionExpirationDate a contractNextServiceDate

    res.json({ message: 'Soubor byl úspěšně nahrán', file: newFileMeta });
  } catch (err) {
    console.error('Chyba při nahrávání souboru:', err);
    res.status(500).json({ error: 'Chyba při nahrávání souboru' });
  }
});

export default router;
