# Node.js Server

A simple Node.js HTTP server project ready for deployment.

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on http://localhost:3000 by default.

## Deployment

This project is ready to be deployed to various platforms:

### Render.com
1. Sign up at [Render](https://render.com/)
2. Create a new Web Service
3. Connect your repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Choose the free plan
6. Deploy

### Vercel
1. Sign up at [Vercel](https://vercel.com/)
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel login` and follow the instructions
4. Run `vercel` in the project directory

### Railway
1. Sign up at [Railway](https://railway.app/)
2. Create a new project
3. Connect your repository
4. Railway will automatically detect Node.js and deploy

## Environment Variables

The server uses the following environment variables:
- `PORT`: The port on which the server will run (defaults to 3000)

## Project Structure

- `index.js`: Main server file
- `package.json`: Project configuration