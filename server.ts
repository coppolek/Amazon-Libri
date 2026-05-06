import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import path from "path";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // API handling Amazon Scrape
  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string || "libri";
      const page = parseInt(req.query.page as string) || 1;
      
      const amazonUrl = `https://www.amazon.it/s?k=${encodeURIComponent(q)}&i=stripbooks&page=${page}`;
      
      const response = await fetch(amazonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Amazon API returned ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: any[] = [];
      
      $('.s-result-item[data-asin]').each((i, el) => {
        const asin = $(el).attr('data-asin');
        if (!asin) return;
        
        const title = $(el).find('h2 span').text().trim();
        // try to find author
        const authorLinks = $(el).find('.a-row.a-size-base.a-color-secondary a.a-size-base');
        let author = authorLinks.first().text().trim();
        if (!author) {
           const authorText = $(el).find('.a-row.a-size-base.a-color-secondary').text();
           const match = authorText.match(/di\s+(.+?)(?:$|\|)/);
           if (match) author = match[1].trim();
        }
        
        let coverUrl = $(el).find('img.s-image').attr('src');
        if (coverUrl) {
          // Aumentiamo la risoluzione dell'immagine convertendo _AC_UY218_ in _AC_UY800_
          coverUrl = coverUrl.replace(/\._AC_.*_\.jpg/, '._AC_UY800_.jpg');
        }
        
        if (title) {
          results.push({ 
            id: asin,
            isbn: asin, // using asin as isbn fallback
            title, 
            author: author || "Autore Sconosciuto", 
            coverUrl,
            category: "Risultato Amazon",
            description: "Risultato dalla ricerca di Amazon.it"
          });
        }
      });

      // Usually Amazon gives max 16 per page for books. Total is hard to guess, we'll estimate:
      const totalItems = results.length > 0 ? 400 : 0; 
      
      res.json({ items: results, totalItems });
      
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
