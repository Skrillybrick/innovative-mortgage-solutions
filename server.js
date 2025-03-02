const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Serve only the static files from the dist directory
const distPath = path.join(__dirname, '/dist/YOUR_APP_NAME');
app.use(express.static(distPath));

// Send all requests to index.html
app.get('/*', function(req, res) {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the app by listening on the default Heroku port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});