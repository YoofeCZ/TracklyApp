// mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Vytvoření Nodemailer transporteru s Gmail SMTP nastavením
const transporter = nodemailer.createTransport({
  service: 'gmail', // Můžete také použít host a port níže
  auth: {
    user: process.env.GMAIL_USER, // Vaše Gmail e-mailová adresa
    pass: process.env.GMAIL_APP_PASSWORD, // Vygenerovaný App Password
  },
});

// Kontrola připojení k SMTP serveru
transporter.verify((error, success) => {
  if (error) {
    console.error('Chyba při připojování k SMTP serveru:', error);
  } else {
    console.log('SMTP server je připraven k odesílání e-mailů.');
  }
});

export default transporter;
