import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // API handling Google Books Api primarily
  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string || "libri";
      const page = parseInt(req.query.page as string) || 1;
      const maxResults = 16;
      const startIndex = (page - 1) * maxResults;
      
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${maxResults}&startIndex=${startIndex}&langRestrict=it`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Books API returned ${response.status}`);
      }

      const data: any = await response.json();
      const results: any[] = [];
      const seenIsbns = new Set<string>();
      
      if (data.items) {
        for (const item of data.items) {
          const volInfo = item.volumeInfo;
          let isbn = item.id;
          if (volInfo.industryIdentifiers) {
             const trueIsbn = volInfo.industryIdentifiers.find((id: any) => id.type === 'ISBN_13') || volInfo.industryIdentifiers.find((id: any) => id.type === 'ISBN_10');
             if (trueIsbn) isbn = trueIsbn.identifier;
          }

          if (seenIsbns.has(isbn)) continue;
          seenIsbns.add(isbn);

          // Get higher zoom image if possible
          let coverUrl = volInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null;
          if (coverUrl) {
            coverUrl = coverUrl.replace('&zoom=1', '&zoom=0');
          }

          results.push({
            id: item.id || isbn,
            isbn,
            title: volInfo.title || "Titolo Sconosciuto",
            author: volInfo.authors ? volInfo.authors.join(', ') : "Autore Sconosciuto",
            coverUrl,
            category: volInfo.categories ? volInfo.categories[0] : "Altro",
            description: volInfo.description || "Nessuna descrizione disponibile.",
            pageCount: volInfo.pageCount,
            publishedDate: volInfo.publishedDate,
            publisher: volInfo.publisher
          });
        }
      }
      
      res.json({ items: results, totalItems: data.totalItems || 0 });
      
    } catch(err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Since Express v4 is used (express@^4.22.1)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
