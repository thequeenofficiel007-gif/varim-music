const express = require('express');
const router = express.Router();
const { getStatsAdmin, traiterRetrait, bloquerUtilisateur } = require('../controllers/adminController');

router.get('/stats', getStatsAdmin);
router.put('/retrait', traiterRetrait);
router.put('/bloquer', bloquerUtilisateur);

module.exports = router;