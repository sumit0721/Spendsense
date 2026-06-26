# SpendSense Deployment & Architecture Guide

This document serves as a future reference for the deployment architecture of SpendSense. It outlines how the application is built, deployed, and how modern DevOps practices were used to bypass traditional, complicated server configurations.

## 🏗️ Architecture Overview

The application uses a **split deployment strategy** to maximize performance, security, and developer experience while keeping costs at absolute zero (using Free Tiers).

1.  **Frontend (React/Vite):** Deployed on **Vercel**
2.  **Backend (Node.js/Express):** Deployed on **AWS EC2 (t2.micro)**
3.  **Database:** Managed securely on **MongoDB Atlas**
4.  **Containerization:** **Docker & Docker Compose**

---

## 🚀 Why Modern DevOps Beat the "Old Way"

When researching deployment, you will often hear about installing Nginx, PM2, Certbot (SSL), and configuring SSH keys. We used a modern approach to bypass *all* of those manual steps:

### 1. PM2 (Process Manager) replaced by Docker
*   **The Old Way:** PM2 is installed on the server to restart the Node.js app if it crashes.
*   **Our Way:** We used **Docker**. By adding `restart: always` to our `docker-compose.yml`, the Docker engine acts as our process manager. If the app crashes, Docker instantly restarts it.

### 2. Nginx replaced by Vercel & Docker
*   **The Old Way:** You must manually install Nginx on the server to route internet traffic and serve HTML files.
*   **Our Way:** Vercel acts as our global Nginx server for the frontend. For the backend, Docker binds directly to port 5000, exposing our API instantly.

### 3. SSL/Certbot replaced by Vercel Rewrite Proxy
*   **The Old Way:** To get the secure `https://` padlock without Mixed Content errors, you must buy a domain, map it to AWS, install Certbot, generate certificates, and set up cron jobs to renew them.
*   **Our Way:** Vercel automatically secures the frontend with HTTPS. To solve the issue where secure Vercel couldn't talk to the insecure AWS IP address (`Mixed Content Block`), we used a **Vercel Rewrite Proxy** (`vercel.json`).
    *   React asks Vercel for `/api`.
    *   Vercel's internal servers securely fetch the data from the AWS IP address.
    *   Vercel passes it securely back to the browser.
    *   *Result: 100% secure app, no domain needed, no SSL to manage!*

### 4. SSH Connections replaced by GitHub Actions
*   **The Old Way:** Manually connecting to the server via terminal with `.pem` keys to pull code and restart the server on every update.
*   **Our Way:** We implemented **Continuous Deployment (CD)**.

---

## 🤖 Continuous Integration / Continuous Deployment (CI/CD)

We automated the entire deployment process so that pushing to the `main` branch updates the live website instantly.

### Frontend CD (Vercel)
Vercel handles this natively. Once connected to the GitHub repository, any push to `main` triggers Vercel to rebuild and deploy the React app in seconds.

### Backend CD (GitHub Actions)
We created `.github/workflows/deploy.yml`. Here is what the "robot" does on every push to `main`:
1.  **CI (Continuous Integration):** It sets up Node 20, installs dependencies, and runs Lint checks to ensure the code isn't broken.
2.  **CD (Continuous Deployment):** It uses the `EC2_HOST` and `EC2_SSH_KEY` secrets stored in GitHub to securely log into the AWS server.
3.  **Update:** It runs `git pull origin main`.
4.  **Rebuild:** It runs `sudo docker compose up --build -d backend` to launch the new code seamlessly.

---

## 🛠️ Quick Commands Cheat Sheet

If you ever need to manually interact with the AWS server, use the **AWS EC2 Instance Connect** (Browser Terminal) to avoid Windows SSH configuration.

**View Backend Logs:**
```bash
sudo docker logs spendsense-backend
```

**Restart Backend:**
```bash
sudo docker compose restart backend
```

**Rebuild Backend Manually:**
```bash
cd Spendsense
git pull origin main
sudo docker compose up --build -d backend
```
