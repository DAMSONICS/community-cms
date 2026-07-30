/**
 * Optional Lightweight Node.js Native HTTP API Server (Zero Dependencies)
 * Run: node server.js
 */

const http = require('http');

const PORT = process.env.PORT || 3001;
let postsStore = [
  {
    id: '1',
    title: 'Welcome Announcement',
    content: 'Native backend initialized.',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const parseJSON = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    // GET /api/posts - Public feed or admin feed
    if (req.method === 'GET' && url.pathname === '/api/posts') {
      const statusFilter = url.searchParams.get('status');
      let results = postsStore;
      if (statusFilter) {
        results = postsStore.filter((p) => p.status === statusFilter);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(results));
    }

    // POST /api/posts - Create Post
    if (req.method === 'POST' && url.pathname === '/api/posts') {
      const body = await parseJSON(req);
      const newPost = {
        id: Date.now().toString(),
        title: body.title || 'Untitled',
        content: body.content || '',
        status: body.status || 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      postsStore.unshift(newPost);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(newPost));
    }

    // PUT /api/posts/:id - Update Post
    if (req.method === 'PUT' && url.pathname.startsWith('/api/posts/')) {
      const id = url.pathname.split('/')[3];
      const body = await parseJSON(req);
      let updatedPost = null;

      postsStore = postsStore.map((p) => {
        if (p.id === id) {
          updatedPost = { ...p, ...body, updatedAt: new Date().toISOString() };
          return updatedPost;
        }
        return p;
      });

      if (!updatedPost) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Post not found' }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(updatedPost));
    }

    // DELETE /api/posts/:id - Delete Post
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/posts/')) {
      const id = url.pathname.split('/')[3];
      postsStore = postsStore.filter((p) => p.id !== id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true }));
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`CMS API running on port ${PORT}`);
});