const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ 
    message: 'Growth Garden API is working!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
});