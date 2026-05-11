const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProfilArtiste,
  modifierProfil,
  sAbonner,
  seDesabonner,
  getAbonnements
} = require('../controllers/profilController');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/:artiste_id', getProfilArtiste);
router.put('/modifier', upload.single('photo'), modifierProfil);
router.post('/abonner', sAbonner);
router.post('/desabonner', seDesabonner);
router.get('/:artiste_id/abonnements', getAbonnements);

module.exports = router;