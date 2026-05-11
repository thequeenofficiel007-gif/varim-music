const express = require('express');
const router = express.Router();
const { inscription, connexion, verifierPin, sauvegarderNumero } = require('../controllers/authController');

router.post('/inscription', inscription);
router.post('/connexion', connexion);
router.post('/verifier-pin', verifierPin);
router.post('/sauvegarder-numero', sauvegarderNumero);

module.exports = router;