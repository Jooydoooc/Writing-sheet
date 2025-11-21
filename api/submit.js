/**
 * Vercel serverless function to handle IELTS test submissions and send to Telegram
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed' 
        });
    }

    try {
        const {
            studentName,
            studentSurname,
            timerValue,
            submittedAt,
            task1QuestionText,
            task1Answer,
            task2QuestionText,
            task2Answer,
            task2QuestionImageName,
            task2QuestionImageDataUrl
        } = req.body;

        // Validate required fields
        if (!studentName || !studentSurname) {
            return res.status(400).json({
                success: false,
                error: 'Student name and surname are required'
            });
        }

        // Get Telegram credentials from environment variables
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error('Missing Telegram environment variables');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }

        // Format the message for Telegram
        const message = formatTelegramMessage({
            studentName,
            studentSurname,
            timerValue,
            submittedAt,
            task1QuestionText,
            task1Answer,
            task2QuestionText,
            task2Answer,
            task2QuestionImageName
        });

        // Send text message to Telegram
        const telegramResponse = await sendTelegramMessage(botToken, chatId, message);

        if (!telegramResponse.ok) {
            throw new Error(`Telegram API error: ${telegramResponse.description}`);
        }

        // If there's an image, send it as a document
        if (task2QuestionImageDataUrl && task2QuestionImageName) {
            try {
                await sendTelegramDocument(
                    botToken, 
                    chatId, 
                    task2QuestionImageDataUrl, 
                    task2QuestionImageName
                );
            } catch (imageError) {
                console.error('Failed to send image to Telegram:', imageError);
                // Don't fail the entire submission if image sending fails
            }
        }

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'Submission sent to Telegram successfully'
        });

    } catch (error) {
        console.error('Submission processing error:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
}

/**
 * Format the submission data into a readable Telegram message
 */
function formatTelegramMessage(data) {
    const submittedTime = new Date(data.submittedAt).toLocaleString();
    
    return `
🎓 *IELTS Writing Test Submitted*

*Student Information:*
• Name: ${data.studentName} ${data.studentSurname}
• Submitted: ${submittedTime}
• Test Duration: ${data.timerValue}

━━━━━━━━━━━━━━━━━━━━

📝 *TASK 1 QUESTION:*
${data.task1QuestionText || 'N/A'}

📝 *TASK 1 ANSWER:*
${data.task1Answer || 'No answer provided'}

━━━━━━━━━━━━━━━━━━━━

📝 *TASK 2 QUESTION:*
${data.task2QuestionText || (data.task2QuestionImageName ? `Image used: ${data.task2QuestionImageName}` : 'No question provided')}

📝 *TASK 2 ANSWER:*
${data.task2Answer || 'No answer provided'}

━━━━━━━━━━━━━━━━━━━━

*Word Counts:*
• Task 1: ${data.task1Answer ? data.task1Answer.split(/\s+/).length : 0} words
• Task 2: ${data.task2Answer ? data.task2Answer.split(/\s+/).length : 0} words

✅ *Test completed successfully*
    `.trim();
}

/**
 * Send message to Telegram using Bot API
 */
async function sendTelegramMessage(botToken, chatId, message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        })
    });

    return await response.json();
}

/**
 * Send document (image) to Telegram
 */
async function sendTelegramDocument(botToken, chatId, dataUrl, filename) {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', blob, filename);
    formData.append('caption', `Task 2 Question Image: ${filename}`);
    
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
    
    const telegramResponse = await fetch(url, {
        method: 'POST',
        body: formData
    });

    return await telegramResponse.json();
}
