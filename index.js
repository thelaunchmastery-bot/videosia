import express from "express";
import { exec } from "child_process";
import fs from "fs";
import https from "https";
import http from "http";
import path from "path";

const app = express();
app.use(express.json());

// 👉 ruta de healthcheck (IMPORTANTE para Railway)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

const downloadFile = (url, filePath) =>
  new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, (response) => {
        const file = fs.createWriteStream(filePath);
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });

app.post("/merge-audio", async (req, res) => {
  try {
    const { videoUrl, musicUrl } = req.body;

    if (!videoUrl || !musicUrl) {
      return res.status(400).json({ error: "videoUrl y musicUrl son obligatorios" });
    }

    const videoPath = path.resolve("video.mp4");
    const musicPath = path.resolve("music.mp3");
    const outputPath = path.resolve("output.mp4");

    await downloadFile(videoUrl, videoPath);
    await downloadFile(musicUrl, musicPath);

    const cmd = `
      ffmpeg -y -i "${videoPath}" -i "${musicPath}" \
      -filter_complex "[1:a]volume=0.15[a1];[0:a][a1]amix=inputs=2:duration=first" \
      -c:v copy "${outputPath}"
    `;

    exec(cmd, (error) => {
      if (error) {
        return res.status(500).json({ error: "FFmpeg falló" });
      }
      res.sendFile(outputPath);
    });
  } catch (err) {
    res.status(500).json({ error: "Error general" });
  }
});

// 👉 ESCUCHAR EN 0.0.0.0 (CRÍTICO para Railway)
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log("Servidor listo en puerto", PORT)
);


