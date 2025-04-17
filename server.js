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

app.get('/', async (req, res) => {
    try {
        const result = await tellJoke();
        res.json({ message: result });
    } catch (error) {
        console.error('Error in GET /:', error);
        res.status(500).json({ error: 'Failed to fetch joke' });
    }
});

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        console.log('The user asked for:', prompt);
        const result = await model.invoke(`Tell me a joke about ${prompt}`);
        res.json({ message: result.content });
    } catch (error) {
        console.error('Error in POST /:', error);
        res.status(500).json({ error: 'Failed to process prompt' });
    }
});

async function tellJoke() {
    const joke = await model.invoke('Tell me a JavaScript joke!');
    return joke.content;
}

app.listen(3000, () => console.log('App listening on port 3000!'));