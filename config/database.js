const sqlite3 = require('sqlite3').verbose();
const dbName = './myAudioDatabase.db';
const db = new sqlite3.Database(dbName, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log(`Connected to the SQLite database: ${dbName}`);
});

module.exports = db;