const express = require('express');
const router = express.Router();
const { handleWhatsAppReply } = require('../controllers/whatsappController');

router.post('/whatsapp-reply', handleWhatsAppReply);

module.exports = router;
