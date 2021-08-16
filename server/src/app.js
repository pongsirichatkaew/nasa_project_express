const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const planetsRouter = require('./routes/planets/planets.router');
const launchesRouter = require('./routes/launches/launches.router');
const app = express();

// Access-Control-Allow-Origin: *
// app.use(cors());
app.use(
  cors({
    origin: 'http://localhost:3000',
  })
);
app.use(morgan('combined'));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
// console.log(path.join(__dirname, '..', 'public'))
app.use(planetsRouter);
app.use('/launches',launchesRouter);

// Serve HTML
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = app;
