import express from 'express';
import { AzureChatOpenAI } from '@langchain/openai';

const model = new AzureChatOpenAI({
    temperature: 0.7,
    streaming: true,
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let messageHistory = [];
let isProcessingRequest = false;

async function fetchWikiInfo(query) {
    try {
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();
        
        console.log('Wikipedia Search Results:', searchData.query.search);
        
        if (!searchData.query.search.length) {
            return null;
        }

        const pageId = searchData.query.search[0].pageid;
        
        const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&pageids=${pageId}&inprop=url&format=json&origin=*&exintro=1&explaintext=1`;
        const contentResponse = await fetch(contentUrl);
        const contentData = await contentResponse.json();
        
        const page = contentData.query.pages[pageId];
        console.log('Wikipedia Page Data:', {
            title: page.title,
            extract: page.extract,
            url: page.fullurl
        });

        return {
            title: page.title,
            extract: page.extract,
            url: page.fullurl
        };
    } catch (error) {
        console.error('Error fetching Wikipedia data:', error);
        return null;
    }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/chat', async (req, res) => {
    try {
        if (isProcessingRequest) {
            return res.status(429).json({ 
                error: 'Please wait for the previous request to complete before sending a new one.',
                history: messageHistory 
            });
        }

        isProcessingRequest = true;

        const prompt = req.body.prompt;
        if (!prompt) {
            isProcessingRequest = false;
            return res.status(400).json({ error: 'Prompt is required', history: messageHistory });
        }

        console.log('The user asked for:', prompt);

        messageHistory.push({ role: 'user', content: prompt });

        const wikiInfo = await fetchWikiInfo(prompt);
        
        const formattedHistory = messageHistory.map(msg => 
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n\n');

        let fullPrompt = formattedHistory;
        if (wikiInfo) {
            fullPrompt += `\n\nHere is some information from Wikipedia about ${wikiInfo.title}:\n${wikiInfo.extract}\n\nBased on this information and our conversation history, please provide a helpful response. Always include the Wikipedia source URL in your response.`;
        }
        fullPrompt += '\n\nAssistant:';

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let fullResponse = '';
        
        const stream = await model.stream(fullPrompt);
        for await (const chunk of stream) {
            const content = chunk.content;
            if (content) {
                fullResponse += content;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
                await delay(Math.floor(Math.random() * 30) + 20);
            }
        }

        if (wikiInfo) {
            fullResponse += `\n\nSource: [${wikiInfo.title} on Wikipedia](${wikiInfo.url})`;
        }

        messageHistory.push({ role: 'assistant', content: fullResponse });

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Error in POST /api/chat:', error);
        res.status(500).json({ error: 'Failed to process prompt', history: messageHistory });
    } finally {
        isProcessingRequest = false;
    }
});

export default app;