const express = require('express');
const router = express.Router();
const {
  getBuyerDashboard,
  getSellerDashboard,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/buyer', getBuyerDashboard);
router.get('/seller', getSellerDashboard);

module.exports = router;
