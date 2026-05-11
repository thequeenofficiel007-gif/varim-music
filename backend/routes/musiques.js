const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const {
  uploadMusique, getMusiques, getPistesAlbum,
  getNouveautes, getTopVentes, getTopSingles, getTopAlbums, getTopArtistes,
  getGenres, getMusiquesByGenre, getMusiquesSuivis, rechercherMusiques
} = require('../controllers/musiqueController');

router.get('/recherche', rechercherMusiques);
router.get('/nouveautes', getNouveautes);
router.get('/top-ventes', getTopVentes);
router.get('/top-singles', getTopSingles);
router.get('/top-albums', getTopAlbums);
router.get('/top-artistes', getTopArtistes);
router.get('/genres', getGenres);
router.get('/genres/:genre', getMusiquesByGenre);
router.get('/suivis/:utilisateur_id', getMusiquesSuivis);
router.get('/:id/pistes', getPistesAlbum);
router.get('/', getMusiques);
router.post('/upload', upload.fields([
  { name: 'pochette', maxCount: 1 },
  { name: 'fichier', maxCount: 1 },
  ...Array.from({ length: 15 }, (_, i) => ({ name: `piste_fichier_${i}`, maxCount: 1 }))
]), uploadMusique);

module.exports = router;