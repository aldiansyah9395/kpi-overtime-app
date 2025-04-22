const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3000;

// GitHub Config
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "aldiansyah9395";
const REPO_NAME = "kpi-overtime-app";
const BRANCH = "main";
const DATA_FOLDER = "data"; // Lokasi file CSV di repo

// Upload handler
app.post("/upload", upload.single("csv"), async (req, res) => {
  const file = req.file;

  if (!file) return res.status(400).send("No file uploaded.");

  const fileContent = fs.readFileSync(file.path, "utf8");
  const fileName = file.originalname;

  try {
    // Get existing file SHA (if exists)
    const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FOLDER}/${fileName}`;
    let sha = null;

    try {
      const getRes = await axios.get(fileUrl, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      });
      sha = getRes.data.sha;
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    const base64Content = Buffer.from(fileContent).toString("base64");

    const payload = {
      message: `Upload ${fileName} via web dashboard`,
      content: base64Content,
      branch: BRANCH,
      ...(sha && { sha }),
    };

    await axios.put(fileUrl, payload, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    fs.unlinkSync(file.path); // delete uploaded temp file
    res.send("File uploaded & committed successfully.");
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Failed to upload file.");
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
