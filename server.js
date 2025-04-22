import express from 'express';
import cors from 'cors';
import { AzureChatOpenAI } from '@langchain/openai';

const model = new AzureChatOpenAI({
    temperature: 1,
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// List of keywords related to nature and plants
const natureKeywords = [
    'nature', 'plant', 'tree', 'forest', 'flower', 'leaf', 'grass', 'garden',
    'ecosystem', 'wildlife', 'botany', 'flora', 'fauna', 'environment', 'soil',
    'photosynthesis', 'rainforest', 'desert', 'mountain', 'river', 'ocean',
    'animal', 'bird', 'insect', 'climate', 'biodiversity', 'conservation'
];

// In-memory message history
let messageHistory = [];

// Function to check if the prompt is related to nature or plants
function isNatureRelated(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    return natureKeywords.some(keyword => lowerPrompt.includes(keyword));
}

app.get('/', async (req, res) => {
    try {
        const result = await tellJoke();
        res.json({ message: result, history: messageHistory });
    } catch (error) {
        console.error('Error in GET /:', error);
        res.status(500).json({ error: 'Failed to fetch joke' });
    }
});

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required', history: messageHistory });
        }

        // Check if the prompt is nature/plant-related
        if (!isNatureRelated(prompt)) {
            const errorMessage = 'Sorry, I can only answer questions related to nature and plants. Please ask about topics like plants, trees, wildlife, or the environment.';
            messageHistory.push({ prompt, response: errorMessage });
            return res.status(400).json({ message: errorMessage, history: messageHistory });
        }

        console.log('The user asked for:', prompt);

        // Create context with message history
        const historyContext = messageHistory
            .map(({ prompt, response }) => `User: ${prompt}\nBot: ${response}`)
            .join('\n\n');
        const fullPrompt = `${historyContext}\n\nUser: Answer the following question about nature or plants: ${prompt}`;

        const result = await model.invoke(fullPrompt);
        const responseMessage = result.content;

        // Add to message history
        messageHistory.push({ prompt, response: responseMessage });

        res.json({ message: responseMessage, history: messageHistory });
    } catch (error) {
        console.error('Error in POST /:', error);
        res.status(500).json({ error: 'Failed to process prompt', history: messageHistory });
    }
});

async function tellJoke() {
    const joke = await model.invoke('Tell me a joke about plants or nature!');
    return joke.content;
}

app.listen(3000, () => console.log('App listening on port 3000!'));