console.log('Happy developing ✨')

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Привет, мир!</h1>');
});

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
