const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection, Server shutting down...');

  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception, Server shutting down...');

  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DB.replace('<password>', process.env.DB_PASSWORD);

mongoose
  .connect(DB, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('DB connection successful!');
  });

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
