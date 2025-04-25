🧠 AskSolis Backend

De backend van AskSolis regelt de communicatie met Azure OpenAI en levert slimme antwoorden terug aan de frontend. De server is licht, foutloos en eenvoudig aan te passen.
⚙️ Installatie

    Installeer Express (vereist voor de React-app om met de backend te communiceren):

npm install express

Maak een .env-bestand aan in de hoofdmap met je eigen gegevens:

AZURE_API_KEY=your-azure-openai-key
AZURE_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_DEPLOYMENT_NAME=your-deployment-name
AZURE_API_VERSION=2024-04-01-preview
PORT=3001

Start de server:

    node --env-file=.env --watch server.js

🧠 Wat doet deze server?

    Ontvangt vragen vanuit de frontend

    Stuurt de vragen door naar Azure OpenAI

    Geeft het AI-antwoord netjes terug

    Je kunt makkelijk endpoints of logica aanpassen — alles is opgezet om snel te experimenteren.
