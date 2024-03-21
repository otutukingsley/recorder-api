const db = require('../config/database');

// Define the query for creating the sessions table
const createTableQuery = `
CREATE TABLE IF NOT EXISTS record_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_id TEXT NOT NULL UNIQUE,
    duration TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

// Execute the query to create the sessions table
db.run(createTableQuery, (err) => {
  if (err) {
    console.error("Error creating record_sessions table", err.message);
  } else {
    console.log("record_sessions table created or already exists.");
    // After successfully creating the table, create the trigger for updatedAt
    createUpdateTrigger();
  }
});

// Define a function to create the trigger for updating the updatedAt timestamp
function createUpdateTrigger() {
  const createTriggerQuery = `
    CREATE TRIGGER IF NOT EXISTS update_record_sessions_timestamp
    AFTER UPDATE ON record_sessions
    FOR EACH ROW
    BEGIN
        UPDATE record_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;`;

  db.run(createTriggerQuery, (err) => {
    if (err) {
      console.error("Error creating update timestamp trigger", err.message);
    } else {
      console.log("Update timestamp trigger created successfully.");
    }
  });
}
