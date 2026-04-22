const express = require("express");
const path = require("path");
const fs = require("node:fs/promises");

const app = express();
const PORT = process.env.PORT || 3000;
const POSTS_FILE = path.join(__dirname, "data", "posts.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function readPosts() {
  const fileContent = await fs.readFile(POSTS_FILE, "utf8");
  const posts = JSON.parse(fileContent);

  if (!Array.isArray(posts)) {
    throw new Error("Soubor posts.json musí obsahovat pole článků.");
  }

  return posts;
}

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await readPosts();

    const summarizedPosts = posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      author: post.author,
      date: post.date,
      category: post.category,
      excerpt: post.excerpt
    }));

    res.json(summarizedPosts);
  } catch (error) {
    console.error("Chyba při čtení článků:", error);
    res.status(500).json({ message: "Nepodařilo se načíst články." });
  }
});

app.get("/api/posts/:slug", async (req, res) => {
  try {
    const posts = await readPosts();
    const post = posts.find((p) => p.slug === req.params.slug);

    if (!post) {
      return res.status(404).json({ message: "Článek nebyl nalezen." });
    }

    res.json(post);
  } catch (error) {
    console.error("Chyba při čtení detailu článku:", error);
    res.status(500).json({ message: "Nepodařilo se načíst detail článku." });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Blog běží na http://localhost:${PORT}`);
});