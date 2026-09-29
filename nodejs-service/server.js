const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 3000;
const PYTHON_URL = 'http://localhost:5001';
const CSV_PATH = path.join(__dirname, 'history.csv');

if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, 'Timestamp,Number1,Number2,Operation,Result\n');
}

function logToCSV(num1, num2, operation, result) {
    const timestamp = new Date().toISOString();
    const line = `${timestamp},${num1},${num2},"${operation}","${result}"\n`;
    fs.appendFileSync(CSV_PATH, line);
}

app.use(express.static(__dirname));

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello from Node.js Gateway!' });
});

app.post('/api/calculate', async (req, res) => {
    console.log('✅ Node.js received:', req.body);
    try {
        const pythonResponse = await axios.post(`${PYTHON_URL}/calculate`, req.body);
        const { num1, num2, operation } = req.body;
        logToCSV(num1, num2, operation, pythonResponse.data.result);

        res.json({
            gateway_message: 'Node.js successfully aggregated the data!',
            python_result: pythonResponse.data
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            error: 'Failed to reach Python service. Is it running on port 5001?'
        });
    }
});

app.get('/api/status', async (req, res) => {
    try {
        const ping = await axios.get(`${PYTHON_URL}/ping`);
        res.json({ gateway: 'Node.js is running', python: ping.data });
    } catch (error) {
        res.status(500).json({ gateway: 'Node.js is running', python: 'Python is NOT reachable' });
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Node.js Gateway: http://localhost:${PORT}`);
    console.log(`🐍 Python URL: ${PYTHON_URL}`);
    console.log(`📄 CSV History: ${CSV_PATH}`);
});
