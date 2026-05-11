const express = require('express');
const router = express.Router();
const { demanderRetrait, getMesRetraits } = require('../controllers/retraitController');

router.post('/', demanderRetrait);
router.get('/:artiste_id', getMesRetraits);

module.exports = router;