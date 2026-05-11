const express = require('express');
const router = express.Router();
const { getDashboardArtiste } = require('../controllers/dashboardController');

router.get('/:artiste_id', getDashboardArtiste);

module.exports = router;