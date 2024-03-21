// In your audioRoutes.js or equivalent file

const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { body, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");

async function cleanupFailedUpload(sessionId, uploadPath) {
  try {
    if (sessionId) {
      // Delete the session record if it exists
      await new Promise((resolve, reject) => {
        db.run("DELETE FROM record_sessions WHERE id = ?", sessionId, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    if (uploadPath) {
      // Delete the uploaded file if it exists
      await fs.promises.unlink(uploadPath);
    }
  } catch (cleanupError) {
    console.error("Cleanup error:", cleanupError.message);
  }
}

router.post(
  "/upload",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("duration").trim().notEmpty().withMessage("Duration is required"),
  ],
  async (req, res) => {
    let sessionId = null;
    let uploadPath = null;

    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if file was uploaded
      if (
        !req.files ||
        Object.keys(req.files).length === 0 ||
        !req.files.file
      ) {
        return res
          .status(400)
          .json({ success: false, message: "No audio file was uploaded." });
      }

      const file = req.files.file;

      if (!file.mimetype.startsWith("audio/")) {
        return res
          .status(400)
          .json({ success: false, message: "The file must be an audio file." });
      }

      const fileID = uuidv4();
      uploadPath = path.join(
        __dirname,
        "../uploads",
        fileID + path.extname(file.name)
      );

      // Insert initial session record with 'pending' status
      sessionId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO record_sessions (name, title, file_name, file_id, duration, file_path, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
          [
            req.body.name,
            req.body.title,
            file.name,
            fileID,
            req.body.duration,
            uploadPath,
          ],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Move the file
      await new Promise((resolve, reject) => {
        file.mv(uploadPath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Update session status to 'completed' on success
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE record_sessions SET status = 'completed' WHERE id = ?`,
          [sessionId],
          function (err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const createdAt = new Date().toISOString();
      const updatedAt = createdAt; 

      // Return the created session
      res.json({
        success: true,
        message:
          "Session and file uploaded and information stored in the database!",
        session: {
          id: sessionId,
          name: req.body.name,
          title: req.body.title,
          file_name: file.name,
          file_id: fileID,
          duration: req.body.duration,
          file_path: uploadPath,
          status: "completed",
          created_at: createdAt,
          updated_at: updatedAt
        },
      });
    } catch (error) {
      await cleanupFailedUpload(sessionId, uploadPath); 
      console.error("Upload error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

router.get("/sessions", async (req, res) => {
  const sql = "SELECT * FROM record_sessions";
  try {
    const sessions = await new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    res.json({ success: true, sessions });
  } catch (err) {
    console.error("Error fetching sessions", err.message);
    res
      .status(500)
      .json({ success: false, message: "Error fetching sessions" });
  }
});

router.delete("/session/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // retrieve the file path from the database
    const filePath = await new Promise((resolve, reject) => {
      db.get(
        "SELECT file_path FROM record_sessions WHERE id = ?",
        id,
        (err, row) => {
          if (err) reject(err);
          else if (row) resolve(row.file_path);
          else reject(new Error("Session not found"));
        }
      );
    });

    // delete the session from the database
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM record_sessions WHERE id = ?", id, function (err) {
        if (err) reject(err);
        else if (this.changes > 0) resolve();
        else reject(new Error("Session not found"));
      });
    });

    // delete the file
    await fs.promises.unlink(filePath);

    // Respond to the client
    res.json({
      success: true,
      message: "Session and associated file deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Error in session deletion", error.message);

    const message = error.message.includes("not found")
      ? error.message
      : "Error deleting session";
    res.status(500).json({ success: false, message });
  }
});

module.exports = router;
