const http = require('http');
const mongoose = require('mongoose');
const app = require('./app');

const { loadPlanetsData } = require('./models/planets.model');

const PORT = process.env.PORT || 8000;
const MONGO_URL = `mongodb+srv://nasa-api:aTtBLFsBlhEJH9tN@nasacluster.mqs5v.mongodb.net/nasa?retryWrites=true&w=majority`;

const server = http.createServer(app);

// once => trigger event will trigger once
mongoose.connection.once('open', () => {
  console.log(`MongoDB connection ready!`);
});

mongoose.connection.once('error', (err) => {
  console.error(`${err}`);
});

async function startServer() {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true, // how mongoose pass connection string
    useFindAndModify: false, // disable update and modify function
    useCreateIndex: true, // create indexx function
    useUnifiedTopology: true, // use updated way to talk to mongo DB
  });
  await loadPlanetsData();
  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
  });
}

startServer();
