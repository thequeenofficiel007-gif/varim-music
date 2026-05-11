const express = require('express');
const router = express.Router();
const { getFavoris, ajouterFavori, retirerFavori, verifierFavori } = require('../controllers/favoriController');

// IMPORTANT : /verifier doit être AVANT /:utilisateur_id
router.get('/verifier', verifierFavori);
router.get('/:utilisateur_id', getFavoris);
router.post('/', ajouterFavori);
router.delete('/', retirerFavori);

module.exports = router;