console.log('Happy developing ✨')

const express = require('express');
const os = require('os');
const osUtils = require('os-utils');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;

// Store connected clients
const connectedClients = new Map();
const requestHistory = [];

// Middleware to track connected clients
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    // Add to connected clients
    connectedClients.set(ip, {
        ip,
        userAgent,
        lastSeen: timestamp,
        url: req.url
    });

    // Add to request history
    requestHistory.push({
        ip,
        userAgent,
        timestamp,
        url: req.url
    });

    // Keep only the last 100 requests
    if (requestHistory.length > 100) {
        requestHistory.shift();
    }

    next();
});

// Main route
app.get('/', (req, res) => {
    // Get system information
    const cpuCount = os.cpus().length;
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const uptime = os.uptime();

    // Get CPU usage
    osUtils.cpuUsage((cpuUsage) => {
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Мониторинг сервера</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                .container { display: flex; flex-wrap: wrap; }
                .section { margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; flex: 1; min-width: 300px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                tr:hover { background-color: #f5f5f5; }
            </style>
        </head>
        <body>
            <h1>Привет, мир!</h1>

            <div class="container">
                <div class="section">
                    <h2>Информация о сервере</h2>
                    <table>
                        <tr><td>Процессоры:</td><td>${cpuCount}</td></tr>
                        <tr><td>Загрузка CPU:</td><td>${(cpuUsage * 100).toFixed(2)}%</td></tr>
                        <tr><td>Всего памяти:</td><td>${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB</td></tr>
                        <tr><td>Свободно памяти:</td><td>${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB</td></tr>
                        <tr><td>Использовано памяти (процесс):</td><td>${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB</td></tr>
                        <tr><td>Время работы:</td><td>${Math.floor(uptime / 3600)} часов ${Math.floor((uptime % 3600) / 60)} минут</td></tr>
                    </table>
                </div>

                <div class="section">
                    <h2>Подключенные клиенты (${connectedClients.size})</h2>
                    <table>
                        <tr>
                            <th>IP адрес</th>
                            <th>Последний запрос</th>
                            <th>URL</th>
                        </tr>
                        ${Array.from(connectedClients.values()).map(client => `
                            <tr>
                                <td>${client.ip}</td>
                                <td>${client.lastSeen}</td>
                                <td>${client.url}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                <div class="section">
                    <h2>История запросов (последние ${requestHistory.length})</h2>
                    <table>
                        <tr>
                            <th>Время</th>
                            <th>IP адрес</th>
                            <th>URL</th>
                        </tr>
                        ${requestHistory.slice().reverse().slice(0, 10).map(req => `
                            <tr>
                                <td>${req.timestamp}</td>
                                <td>${req.ip}</td>
                                <td>${req.url}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
