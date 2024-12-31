const express = require('express');
const router = express.Router();
const { protect, isOwner } = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');

// Protected routes
router.use(protect);

// Purchase process
router.post('/checkout', transactionController.createCheckoutSession);
router.post('/webhook', transactionController.handleStripeWebhook);
router.get('/success', transactionController.handleSuccessfulPayment);
router.get('/cancel', transactionController.handleCancelledPayment);

// Transaction management
router.get('/my-purchases', transactionController.getMyPurchases);
router.get('/my-sales', transactionController.getMySales);
router.get('/:id', isOwner('Transaction'), transactionController.getTransaction);

// Downloads
router.get('/:id/download', isOwner('Transaction'), transactionController.downloadBeat);
router.get('/:id/license', isOwner('Transaction'), transactionController.downloadLicense);

// Refunds and disputes
router.post('/:id/refund', isOwner('Transaction'), transactionController.requestRefund);
router.post('/:id/dispute', isOwner('Transaction'), transactionController.createDispute);

// Analytics and reporting
router.get('/stats/sales', transactionController.getSalesStats);
router.get('/stats/revenue', transactionController.getRevenueStats);
router.get('/reports/monthly', transactionController.getMonthlyReport);
router.get('/reports/yearly', transactionController.getYearlyReport);

module.exports = router;
