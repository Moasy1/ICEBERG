# Hostinger Node.js Deployment Guide

This guide describes how to deploy the generated `iceberg-hostinger-deploy.zip` file onto Hostinger Node.js Hosting or a Hostinger VPS.

## Step 1: Database Setup (MongoDB Atlas)

Since Hostinger does not host MongoDB locally on shared environments, it is recommended to use a free cloud-hosted MongoDB instance (like **MongoDB Atlas**):
1. Sign up/Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster.
3. Go to **Network Access** and add IP `0.0.0.0/0` (allow access from anywhere, required since Hostinger server IPs can change).
4. Go to **Database Access** and create a database user with a secure password.
5. Click **Connect** -> **Drivers** and copy the Connection String. It should look like:
   `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`

---

## Step 2: Upload and Unzip in Hostinger File Manager

1. Log in to your Hostinger hPanel.
2. Go to **File Manager** for your domain.
3. Navigate to your app directory (usually inside `public_html` or a custom subfolder).
4. Upload `iceberg-hostinger-deploy.zip` from your computer.
5. Right-click the uploaded `.zip` file and select **Extract** (unzip it into the current folder).

---

## Step 3: Setup Node.js Application in Hostinger Panel

1. In hPanel, search for **Node.js** or go to your VPS dashboard.
2. Click **Create Application** (or edit your existing Node.js application configuration).
3. Configure the following fields:
   - **Node.js Version**: Select `Node.js 18` or `Node.js 20` (recommended).
   - **Application Directory**: Set to the path where you extracted the zip file.
   - **Application Startup File**: Set to **`server.js`** (the new entry point we created in the root).
   - **Domain/Subdomain**: Select the domain you want to link it to.

---

## Step 4: Add Environment Variables

In your Hostinger Node.js application management panel, add the following **Environment Variables**:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Connection String (from Step 1) | `mongodb+srv://user:pass@cluster0...` |
| `JWT_SECRET` | Secret key for token generation | `any_long_random_string_here` |
| `EMAIL_HOST` | Nodemailer SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | Nodemailer SMTP server port | `587` |
| `EMAIL_USER` | Gmail address for admin notifications | `youragency@gmail.com` |
| `EMAIL_PASS` | Google App Password (not your Gmail login password) | `abcd efgh ijkl mnop` |
| `CONTACT_EMAIL` | Destination email where submissions are sent | `info@youragency.com` |

---

## Step 5: Install Dependencies & Run

1. In the Hostinger Node.js application dashboard, click the **NPM Install** button. This will download and install the production dependencies (Express, Mongoose, Nodemailer, etc.).
2. Once the installation is complete, click **Start** or **Restart** to boot your server.
3. Visit your domain in the browser (e.g. `http://yourdomain.com`). The site should now load, and the contact form submissions will be saved to MongoDB Atlas and viewable in the admin panel (`http://yourdomain.com/admin/`).
