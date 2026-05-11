const express = require('express');
const axios = require('axios');

const router = express.Router();

// ===== HELPER: SAFE ERROR MESSAGE =====
function getErrorMessage(err) {
    if (err.response && err.response.data) {
        return err.response.data;
    }
    return err.message || 'Unknown error';
}

/**
 * POST /api/ai/check-symptoms
 */
router.post('/check-symptoms', async(req, res) => {
    try {
        const { symptoms } = req.body;

        if (!symptoms || symptoms.trim().length === 0) {
            return res.status(400).json({
                message: 'Please provide symptoms'
            });
        }

        const systemPrompt = `You are a medical assistant AI for HealthConnect.
Suggest which type of specialist the user should consult.

Rules:
- Keep response short (max 150 words)
- Do NOT diagnose
- Give only ONE specialty
- End with: SPECIALTY: <type>
`;

        const response = await axios.post(
            'https://api.anthropic.com/v1/messages', {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 300,
                system: systemPrompt,
                messages: [{
                    role: 'user',
                    content: `Patient symptoms: ${symptoms}`
                }]
            }, {
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY
                }
            }
        );

        // ✅ SAFE ACCESS
        const aiMessage =
            response.data &&
            response.data.content &&
            response.data.content[0] &&
            response.data.content[0].text ?
            response.data.content[0].text :
            'Unable to process response';

        // ✅ EXTRACT SPECIALTY
        let recommendedSpecialty = 'General Physician';

        const match = aiMessage.match(/SPECIALTY:\s*(.+)$/i);
        if (match) {
            recommendedSpecialty = match[1].trim();
        }

        const cleanResponse = aiMessage
            .replace(/SPECIALTY:.+$/i, '')
            .trim();

        res.json({
            aiResponse: cleanResponse,
            recommendedSpecialty
        });

    } catch (err) {
        console.error('AI Symptom Error:', getErrorMessage(err));
        res.status(500).json({
            message: 'Error checking symptoms'
        });
    }
});

/**
 * POST /api/ai/chat
 */
router.post('/chat', async(req, res) => {
    try {
        const { message, history } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                message: 'Please provide a message'
            });
        }

        const systemPrompt = `You are a friendly AI health assistant.
- Do NOT diagnose
- Give simple explanations
- Recommend doctor when needed
- Keep under 200 words`;

        // ✅ SAFE HISTORY
        const safeHistory = Array.isArray(history) ? history : [];

        const messages = [
            ...safeHistory.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content || ''
            })),
            {
                role: 'user',
                content: message
            }
        ];

        const response = await axios.post(
            'https://api.anthropic.com/v1/messages', {
                model: 'claude-sonnet-4-20250514',
                max_tokens: 400,
                system: systemPrompt,
                messages
            }, {
                headers: {
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                    'x-api-key': process.env.ANTHROPIC_API_KEY
                }
            }
        );

        // ✅ SAFE ACCESS
        const aiResponse =
            response.data &&
            response.data.content &&
            response.data.content[0] &&
            response.data.content[0].text ?
            response.data.content[0].text :
            'No response from AI';

        res.json({ aiResponse });

    } catch (err) {
        console.error('AI Chat Error:', getErrorMessage(err));
        res.status(500).json({
            message: 'Error processing chat message'
        });
    }
});

module.exports = router;