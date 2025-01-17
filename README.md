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


| Action                                       | Command                                          |
|----------------------------------------------|--------------------------------------------------|
| **Start script (new machine)**               | `pm2 start main.js -n adspower --time`           |
| **Start script (already started before)**    | `pm2 start adspower`                             |
| **Stop script**                              | `pm2 stop adspower`                              |
| **View logs**                                | `pm2 logs`                                       |
| **View last 1000 lines of logs**             | `pm2 logs --lines 1000`                          |
