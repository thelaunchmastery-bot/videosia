import express from "express";
import { exec } from "child_process";
import fs from "fs";
import https from "https";
import http from "http";

const app = express();
app.use(express.json());

// Healthcheck (IMPORTANTE)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

const downloadFile = (url, path) =>
  new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol.get(url, response => {
      const file = fs.createWriteStream(path);
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });

app.post("/merge-audio", async (req, res) => {
  try {
    const { videoUrl, musicUrl } = req.body;

    if (!videoUrl || !musicUrl) {
      return res.status(400).json({ error: "videoUrl y musicUrl son obligatorios" });
    }

    const videoPath = "/tmp/video.mp4";
    const musicPath = "/tmp/music.mp3";
    const outputPath = "/tmp/output.mp4";

    await downloadFile(videoUrl, videoPath);
    await downloadFile(musicUrl, musicPath);

    // 🔥 COMANDO CORRECTO (NO FALLA SI EL VÍDEO NO TIENE AUDIO)
    const cmd = `
      ffmpeg -y -i ${videoPath} -i ${musicPath} \
      -map 0:v:0 -map 1:a:0 \
      -c:v copy -shortest ${outputPath}
    `;

    exec(cmd, (error) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: "FFmpeg falló" });
      }
      res.sendFile(outputPath);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error general" });
  }
});

/* ---------- PUERTO RAILWAY (SIN HISTORIAS) ---------- */
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

