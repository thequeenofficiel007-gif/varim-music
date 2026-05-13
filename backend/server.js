const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// 🔒 Sécuriser les headers HTTP
app.use(helmet());

// 🔒 Autoriser le frontend
app.use(cors({
  origin: ['http://localhost:3000', 'https://varim-music6.vercel.app', 'https://varim-test.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// 🔒 Limiter les tentatives de connexion (max 5 par minute)
const limiteConnexion = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    message: '❌ Trop de tentatives. Réessayez dans 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔒 Limiter les inscriptions (max 3 par heure)
const limiteInscription = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    message: '❌ Trop d\'inscriptions depuis cette adresse. Réessayez dans 1 heure.'
  }
});

// 🔒 Limiter les uploads (max 10 par heure)
const limiteUpload = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    message: '❌ Trop d\'uploads. Réessayez dans 1 heure.'
  }
});

const favoriRoutes = require('./routes/favoris');
const enregistrementRoutes = require('./routes/enregistrements');
app.use('/api/favoris', favoriRoutes);
app.use('/api/enregistrements', enregistrementRoutes);

// Routes
const authRoutes = require('./routes/auth');
const musiqueRoutes = require('./routes/musiques');
const achatRoutes = require('./routes/achats');
const dashboardRoutes = require('./routes/dashboard');
const profilRoutes = require('./routes/profil');
const adminRoutes = require('./routes/admin');
const retraitRoutes = require('./routes/retraits');
app.use('/api/retraits', retraitRoutes);

// 🔒 Appliquer les limites sur les routes sensibles
app.use('/api/auth/connexion', limiteConnexion);
app.use('/api/auth/inscription', limiteInscription);
app.use('/api/musiques/upload', limiteUpload);

app.use('/api/auth', authRoutes);
app.use('/api/musiques', musiqueRoutes);
app.use('/api/achats', achatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profil', profilRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur Varim Music API !' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Serveur Varim Music demarre sur le port ' + PORT);
});