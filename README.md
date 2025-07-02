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

### Deploy with Nginx and PM2 (Recommended)

This project includes configuration files for deploying with Nginx as a reverse proxy and PM2 as a process manager.

#### Prerequisites
- A server with Ubuntu/Debian
- Node.js (v14 or higher)
- npm
- Nginx
- PM2 (will be installed by the deployment script if not present)

#### Deployment Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd mynodeserver
   ```

2. **Configure Nginx**:
   ```bash
   # Copy the Nginx configuration file
   sudo cp nginx.conf /etc/nginx/sites-available/mynodeserver

   # Create a symbolic link to enable the site
   sudo ln -s /etc/nginx/sites-available/mynodeserver /etc/nginx/sites-enabled/

   # Edit the configuration to set your domain name
   sudo nano /etc/nginx/sites-available/mynodeserver

   # Test the Nginx configuration
   sudo nginx -t

   # Restart Nginx
   sudo systemctl restart nginx
   ```

3. **Deploy the application**:
   ```bash
   # Make the deployment script executable
   chmod +x deploy.sh

   # Run the deployment script
   ./deploy.sh
   ```

4. **Configure firewall** (if needed):
   ```bash
   sudo ufw allow 80/tcp  # For HTTP
   sudo ufw allow 443/tcp  # For HTTPS (if configured)
   ```

5. **Set up HTTPS** (optional but recommended):
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx

   # Obtain and configure SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

### Cloud Platforms

The project can also be deployed to various cloud platforms:

#### Render.com
1. Sign up at [Render](https://render.com/)
2. Create a new Web Service
3. Connect your repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Choose the free plan
6. Deploy

#### Vercel
1. Sign up at [Vercel](https://vercel.com/)
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel login` and follow the instructions
4. Run `vercel` in the project directory

#### Railway
1. Sign up at [Railway](https://railway.app/)
2. Create a new project
3. Connect your repository
4. Railway will automatically detect Node.js and deploy

## Environment Variables

The server uses the following environment variables:
- `PORT`: The port on which the server will run (defaults to 3000)
- `NODE_ENV`: The environment mode ('development' or 'production')

## Project Structure

- `index.js`: Main server file
- `package.json`: Project configuration
- `nginx.conf`: Nginx configuration for reverse proxy
- `deploy.sh`: Deployment script for automating the setup process
- `.env`: Environment variables configuration
