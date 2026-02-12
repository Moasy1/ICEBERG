# Iceberg Agency - Digital Marketing Website

A modern, responsive digital marketing agency website with a custom CMS backend, built for Vercel deployment.

## 🚀 Features

### Frontend
- **Modern Design**: Glassmorphism UI with Tailwind CSS
- **Bilingual Support**: English and Arabic with RTL support
- **Smooth Animations**: GSAP-powered animations and transitions
- **Responsive Design**: Mobile-first approach
- **SEO Optimized**: Meta tags and semantic HTML
- **Interactive Elements**: Hover effects, micro-interactions

### Backend & CMS
- **Express.js API**: RESTful API with MongoDB
- **Custom Admin Dashboard**: Content management interface
- **Multi-language Content**: Support for English and Arabic content
- **Contact Form**: Email notifications with Nodemailer
- **Project Management**: Dynamic portfolio management
- **Service Management**: Update services dynamically
- **Security**: Rate limiting, CORS, helmet protection

## 📁 Project Structure

```
iceberg-agency/
├── Home.html              # Main frontend file
├── admin/                 # Admin dashboard
│   ├── index.html        # Admin UI
│   └── admin.js          # Admin functionality
├── api/                   # Backend API
│   ├── index.js          # Main server file
│   ├── models/           # MongoDB models
│   │   ├── Content.js
│   │   ├── Project.js
│   │   └── Service.js
│   └── routes/           # API routes
│       ├── content.js
│       ├── contact.js
│       ├── projects.js
│       └── services.js
├── package.json          # Dependencies and scripts
├── vercel.json          # Vercel configuration
├── .env.example         # Environment variables template
└── README.md            # This file
```

## 🛠️ Tech Stack

### Frontend
- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript ES6+**: Modern JavaScript features
- **GSAP**: Animation library
- **Lucide Icons**: Icon library

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **Nodemailer**: Email sending
- **Helmet**: Security middleware

### Deployment
- **Vercel**: Hosting platform
- **MongoDB Atlas**: Production database

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (local or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd iceberg-agency
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/iceberg_cms
   JWT_SECRET=your_super_secret_jwt_key_here
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   CONTACT_EMAIL=info@iceberg.agency
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   This will start both the frontend (port 3000) and backend (port 3001).

### Available Scripts

- `npm run dev` - Start development servers
- `npm run dev:frontend` - Start frontend only
- `npm run dev:backend` - Start backend only
- `npm run build` - Build for production
- `npm start` - Start production server

## 📊 Admin Dashboard

Access the admin dashboard at `http://localhost:3000/admin/`

### Features:
- **Content Management**: Edit website content in multiple languages
- **Project Management**: Add, edit, delete portfolio projects
- **Service Management**: Update service offerings
- **Contact Messages**: View contact form submissions
- **Dashboard Overview**: Site statistics and recent activity

### Default Setup:
1. Click "Initialize Data" in the admin dashboard to set up sample content
2. Navigate through different sections to manage your content
3. All changes are reflected immediately on the frontend

## 🌐 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables on Vercel
Set these in your Vercel dashboard under Environment Variables:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - Email configuration
- `CONTACT_EMAIL` - Contact form recipient
- `NODE_ENV` - Set to `production`

## 📧 Contact Form Configuration

The contact form uses Nodemailer to send emails. For Gmail:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App Passwords
3. Use the App Password in your `EMAIL_PASS` environment variable

## 🎨 Customization

### Colors
Edit the CSS variables in `Home.html`:
```css
:root {
    --primary: #00d4ff;
    --secondary: #0a192f;
    --glass: rgba(255, 255, 255, 0.05);
    --glass-border: rgba(255, 255, 255, 0.1);
}
```

### Content
Use the admin dashboard to update all website content without touching code.

### Styling
The design uses Tailwind CSS classes. Modify directly in the HTML files or extend with custom CSS.

## 🔧 API Endpoints

### Content
- `GET /api/content` - Get all content
- `GET /api/content/:key` - Get specific content
- `POST /api/content` - Create content
- `PUT /api/content/:key` - Update content
- `DELETE /api/content/:key` - Delete content

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:slug` - Get specific project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:slug` - Get specific service
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Contact
- `POST /api/contact/submit` - Submit contact form

## 🌍 Multi-language Support

The website supports English and Arabic:
- Frontend automatically switches between LTR and RTL
- All content can be managed in both languages via the CMS
- Language switcher in the navigation

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for your domain
- **Helmet**: Security headers
- **Input Validation**: Form data validation
- **Sanitization**: Prevents XSS attacks

## 📈 Performance

- **Optimized Images**: Lazy loading and proper sizing
- **Minified Code**: Production builds are minified
- **CDN Ready**: Static assets optimized for CDN
- **SEO Friendly**: Semantic HTML and meta tags

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact:
- Email: info@iceberg.agency
- Create an issue in the repository

---

**Built with ❤️ by Iceberg Agency**
