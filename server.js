// server.js
// Entry point for Node.js hosting environments (like Hostinger)
const app = require('./api/index');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
