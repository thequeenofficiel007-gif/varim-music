const express = require('express');
const router = express.Router();
const { creerAchat, verifierPaiement, webhookMTN, webhookAirtel, getMesAchats } = require('../controllers/achatController');

router.post('/', creerAchat);
router.get('/verifier/:referenceId', verifierPaiement);
router.post('/webhook/mtn', webhookMTN);
router.post('/webhook/airtel', webhookAirtel);
router.get('/mes-achats/:acheteur_id', getMesAchats);

module.exports = router;