// middleware/authenticateToken.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config(); // Načtení proměnných prostředí

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('Token nebyl nalezen v hlavičce Authorization.');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT Verification Error:', err);
      return res.sendStatus(403);
    }
    console.log('Authenticated User:', user);
    req.user = user;
    next();
  });
};

export default authenticateToken;
