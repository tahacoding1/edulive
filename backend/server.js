const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');

dotenv.config();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET','POST'], credentials: true },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/rooms',       require('./routes/rooms'));
app.use('/api/messages',    require('./routes/messages'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/content',     require('./routes/content'));

app.get('/api/health', (_, res) => res.json({ status: 'OK', timestamp: new Date() }));

require('./socket')(io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌  MongoDB error:', err.message); process.exit(1); });
