const express = require('express');
const router = express.Router();
const { getEnregistrements, ajouterEnregistrement, retirerEnregistrement, verifierEnregistrement } = require('../controllers/enregistrementController');

router.get('/verifier', verifierEnregistrement);
router.get('/:utilisateur_id', getEnregistrements);
router.post('/', ajouterEnregistrement);
router.delete('/', retirerEnregistrement);

module.exports = router;