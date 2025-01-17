# Adspower Script

This project uses Puppeteer to connect to an existing browser via WebSocket and perform automated actions. The script is containerized using Docker to ensure consistent behavior across any machine.

## Installation & Setup

### 1. Install the necessary tools:

- **adsPower**
- **nvm / Node.js**
- **git**
- **pm2 / pm2-logrotate**

To install PM2 and pm2-logrotate, run the following commands:

```bash
npm install pm2@latest -g
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true

To start script at the first time (in a new machine), go to the adspower folder and right click -  “open git bash here”
pm2 start main.js -n adspower --time

To start the script if it has already started before and stopped
pm2 start adspower

To stop script at the end of the day
pm2 stop adspower

To watch logs
pm2 logs
or 
pm2 logs --lines 1000