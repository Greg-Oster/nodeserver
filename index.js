console.log('Happy developing ✨')

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const os = require('os');
const osUtils = require('os-utils');
const moment = require('moment');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// Store connected clients and request history
const connectedClients = new Map();
const requestHistory = [];

// Store request rate data
const requestRateData = {
    timestamps: [],
    counts: [],
    lastCalculated: Date.now(),
    // Initialize with some empty data points to avoid empty chart
    initialize: function() {
        const now = Math.floor(Date.now() / 1000);
        for (let i = 0; i < 10; i++) {
            this.timestamps.unshift(now - i);
            this.counts.unshift(0);
        }
    }
};

// Initialize request rate data with empty points
requestRateData.initialize();

// Middleware to track request history
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const now = Date.now();

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

    // Calculate requests per second
    const currentSecond = Math.floor(now / 1000);
    const lastTimestampIndex = requestRateData.timestamps.indexOf(currentSecond);

    if (lastTimestampIndex === -1) {
        // This is a new second, add it to the array
        requestRateData.timestamps.push(currentSecond);
        requestRateData.counts.push(1);

        // Keep only the last 60 seconds of data
        if (requestRateData.timestamps.length > 60) {
            requestRateData.timestamps.shift();
            requestRateData.counts.shift();
        }
    } else {
        // Increment the count for the current second
        requestRateData.counts[lastTimestampIndex]++;
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
            <script src="/socket.io/socket.io.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; }
                .container { display: flex; flex-wrap: wrap; }
                .section { margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; flex: 1; min-width: 300px; }
                .full-width { flex-basis: 100%; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f2f2f2; }
                tr:hover { background-color: #f5f5f5; }
                .updated { animation: highlight 2s; }
                @keyframes highlight {
                    0% { background-color: #ffff99; }
                    100% { background-color: transparent; }
                }
                .chart-container { 
                    position: relative; 
                    height: 250px; 
                    width: 100%; 
                }
                .rps-value {
                    font-size: 24px;
                    font-weight: bold;
                    text-align: center;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <h1>Привет, мир!</h1>
            <p><small>Данные обновляются в реальном времени</small></p>

            <div class="container">
                <div class="section full-width">
                    <h2>Запросы в секунду</h2>
                    <div class="rps-value" id="current-rps">0 запросов/сек</div>
                    <div class="chart-container">
                        <canvas id="requestsChart"></canvas>
                    </div>
                </div>

                <div class="section">
                    <h2>Информация о сервере</h2>
                    <table id="system-info">
                        <tr><td>Процессоры:</td><td id="cpu-count">${cpuCount}</td></tr>
                        <tr><td>Загрузка CPU:</td><td id="cpu-usage">${(cpuUsage * 100).toFixed(2)}%</td></tr>
                        <tr><td>Всего памяти:</td><td id="total-memory">${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB</td></tr>
                        <tr><td>Свободно памяти:</td><td id="free-memory">${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB</td></tr>
                        <tr><td>Использовано памяти (процесс):</td><td id="memory-usage">${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB</td></tr>
                        <tr><td>Время работы:</td><td id="uptime">${Math.floor(uptime / 3600)} часов ${Math.floor((uptime % 3600) / 60)} минут</td></tr>
                    </table>
                </div>

                <div class="section">
                    <h2>Подключенные клиенты (<span id="clients-count">${connectedClients.size}</span>)</h2>
                    <table>
                        <tr>
                            <th>IP адрес</th>
                            <th>Последний запрос</th>
                            <th>URL</th>
                        </tr>
                        <tbody id="clients-table">
                        ${Array.from(connectedClients.values()).map(client => `
                            <tr>
                                <td>${client.ip}</td>
                                <td>${client.lastSeen}</td>
                                <td>${client.url}</td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2>История запросов (последние <span id="history-count">${requestHistory.length}</span>)</h2>
                    <table>
                        <tr>
                            <th>Время</th>
                            <th>IP адрес</th>
                            <th>URL</th>
                        </tr>
                        <tbody id="history-table">
                        ${requestHistory.slice().reverse().slice(0, 10).map(req => `
                            <tr>
                                <td>${req.timestamp}</td>
                                <td>${req.ip}</td>
                                <td>${req.url}</td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                // Connect to the Socket.io server
                const socket = io();
                let requestsChart;

                // Initialize the chart when the page loads
                document.addEventListener('DOMContentLoaded', function() {
                    const ctx = document.getElementById('requestsChart').getContext('2d');

                    // Create gradient fill
                    const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                    gradient.addColorStop(0, 'rgba(54, 162, 235, 0.6)');
                    gradient.addColorStop(1, 'rgba(54, 162, 235, 0.1)');

                    // Create the chart
                    requestsChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: [],
                            datasets: [{
                                label: 'Запросы в секунду',
                                data: [],
                                backgroundColor: gradient,
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 2,
                                tension: 0.3,
                                pointRadius: 3,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Запросы/сек'
                                    }
                                },
                                x: {
                                    title: {
                                        display: true,
                                        text: 'Время'
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.parsed.y + ' запросов/сек';
                                        }
                                    }
                                }
                            },
                            animation: {
                                duration: 500
                            }
                        }
                    });
                });

                // Function to update an element and add the 'updated' class for animation
                function updateElement(id, value) {
                    const element = document.getElementById(id);
                    if (element && element.textContent !== value) {
                        element.textContent = value;
                        element.classList.remove('updated');
                        // Trigger reflow to restart animation
                        void element.offsetWidth;
                        element.classList.add('updated');
                    }
                }

                // Function to update the requests chart
                function updateRequestsChart(data) {
                    if (!requestsChart) return;

                    // Update the current RPS value
                    updateElement('current-rps', data.currentRPS + ' запросов/сек');

                    // Update chart data
                    requestsChart.data.labels = data.labels;
                    requestsChart.data.datasets[0].data = data.values;
                    requestsChart.update();
                }

                // Function to update system information
                function updateSystemInfo(data) {
                    // Update requests per second chart
                    if (data.requestRateData) {
                        updateRequestsChart(data.requestRateData);
                    }

                    updateElement('cpu-count', data.cpuCount);
                    updateElement('cpu-usage', data.cpuUsage + '%');
                    updateElement('total-memory', data.totalMemory + ' GB');
                    updateElement('free-memory', data.freeMemory + ' GB');
                    updateElement('memory-usage', data.memoryUsage + ' MB');
                    updateElement('uptime', data.uptime.hours + ' часов ' + data.uptime.minutes + ' минут');

                    // Update clients count
                    updateElement('clients-count', data.connectedClients.length);

                    // Update clients table
                    const clientsTable = document.getElementById('clients-table');
                    if (clientsTable) {
                        let clientsHtml = '';
                        data.connectedClients.forEach(client => {
                            clientsHtml += '<tr><td>' + client.ip + '</td><td>' + client.lastSeen + '</td><td>' + client.url + '</td></tr>';
                        });
                        clientsTable.innerHTML = clientsHtml;
                    }

                    // Update history count
                    updateElement('history-count', data.requestHistory.length);

                    // Update history table
                    const historyTable = document.getElementById('history-table');
                    if (historyTable) {
                        let historyHtml = '';
                        data.requestHistory.forEach(req => {
                            historyHtml += '<tr><td>' + req.timestamp + '</td><td>' + req.ip + '</td><td>' + req.url + '</td></tr>';
                        });
                        historyTable.innerHTML = historyHtml;
                    }
                }

                // Listen for system info updates
                socket.on('systemInfo', updateSystemInfo);
            </script>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    });
});

// About page route
app.get('/about', (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send('<h1>О сервере</h1><p>Это простой сервер для мониторинга системной информации.</p>');
});

// Function to collect system information
function getSystemInfo(callback) {
    const cpuCount = os.cpus().length;
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const uptime = os.uptime();

    // Format request rate data for the chart
    const formattedRequestRateData = {
        labels: requestRateData.timestamps.map(timestamp => {
            return moment.unix(timestamp).format('HH:mm:ss');
        }),
        values: requestRateData.counts,
        // Calculate current requests per second (average of last 5 seconds or available data)
        currentRPS: calculateCurrentRPS()
    };

    osUtils.cpuUsage((cpuUsage) => {
        const systemInfo = {
            cpuCount,
            cpuUsage: (cpuUsage * 100).toFixed(2),
            totalMemory: (totalMemory / 1024 / 1024 / 1024).toFixed(2),
            freeMemory: (freeMemory / 1024 / 1024 / 1024).toFixed(2),
            memoryUsage: (memoryUsage.rss / 1024 / 1024).toFixed(2),
            uptime: {
                hours: Math.floor(uptime / 3600),
                minutes: Math.floor((uptime % 3600) / 60)
            },
            connectedClients: Array.from(connectedClients.values()),
            requestHistory: requestHistory.slice().reverse().slice(0, 10),
            requestRateData: formattedRequestRateData
        };

        callback(systemInfo);
    });
}

// Function to calculate current requests per second (average of last 5 seconds or available data)
function calculateCurrentRPS() {
    const counts = requestRateData.counts;
    if (counts.length === 0) return 0;

    // Take the last 5 seconds or all available data if less than 5 seconds
    const lastNSeconds = Math.min(5, counts.length);
    const sum = counts.slice(-lastNSeconds).reduce((acc, val) => acc + val, 0);
    return (sum / lastNSeconds).toFixed(2);
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A client connected');

    // Store the client's IP address in the socket object
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    socket.clientIp = clientIp;

    // Add to connected clients
    connectedClients.set(socket.id, {
        ip: clientIp,
        userAgent: userAgent,
        lastSeen: timestamp,
        url: socket.handshake.url || '/'
    });

    // Send initial data
    getSystemInfo((data) => {
        socket.emit('systemInfo', data);
    });

    socket.on('disconnect', () => {
        console.log('A client disconnected');

        // Remove the client from the connectedClients Map when they disconnect
        connectedClients.delete(socket.id);
    });
});

// Set up interval to broadcast system info every 2 seconds
setInterval(() => {
    getSystemInfo((data) => {
        io.emit('systemInfo', data);
    });
}, 2000);

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT} в режиме ${process.env.NODE_ENV || 'development'}`);
});
