// In your audioRoutes.js or equivalent file

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

router.post('/upload', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('duration').trim().notEmpty().withMessage('Duration is required'),
], (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Check if file was uploaded
  if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
    return res.status(400).json({ success: false, message: 'No audio file was uploaded.' });
  }

  const file = req.files.file;

  console.log(file);

  if (!file.mimetype.startsWith('audio/')) {
    return res.status(400).json({ success: false, message: 'The file must be an audio file.' });
  }

  const fileID = uuidv4();
  const uploadPath = path.join(__dirname, '../uploads', fileID + path.extname(file.name));

  file.mv(uploadPath, function(err) {
    if (err) return res.status(500).json({ success: false, message: err.message });

    const sql = `INSERT INTO record_sessions (name, title, file_name, file_id, duration, file_path, created_at, updated_at) VALUES (?,?,?,?,?,?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
    db.run(sql, [req.body.name, req.body.title, file.name, fileID, req.body.duration, uploadPath], function(err) {
      if (err) return res.status(500).json({ success: false, message: err.message });

      // Return the created record session
      // Using "this.lastID" to fetch the ID of the inserted session
      const createdSession = { id: this.lastID, name: req.body.name, title: req.body.title, file_name: file.name, file_id: fileID, duration: req.body.duration, file_path: uploadPath };
      res.json({ success: true, message: "Session and file uploaded and information stored in the database!", session: createdSession });
    });
  });
});

router.get('/sessions', (req, res) => {
  const sql = 'SELECT * FROM record_sessions';
  db.all(sql, [], function (err, rows) {
    if (err) {
      console.error('Error fetching sessions', err.message);
      return res.status(500).json({ success: false, message: 'Error fetching sessions' });
    }
    res.json({ success: true, sessions: rows });
  });
});

router.delete('/session/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM record_sessions WHERE id = ?';

  db.run(sql, id, function(err) {
    if (err) {
      console.error('Error deleting session', err.message);
      return res.status(500).json({ success: false, message: 'Error deleting session' });
    }
    if (this.changes > 0) {
      res.json({ success: true, message: 'Session deleted successfully', deletedId: id });

      fs.unlink(path.join(__dirname, '../uploads', fileName), (err) => {
        if (err) {
          console.error('Error deleting the file', err);
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'Session not found' });
    }
  });
});



module.exports = router;
