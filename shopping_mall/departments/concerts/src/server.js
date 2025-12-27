const http = require('http');
const Router = require('./router');
const { bodyParser, queryParser, logger } = require('./middleware');
const Controller = require('./controller');

class App {
  constructor() {
    this.router = new Router();
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  get(path, handler) {
    this.router.get(path, handler);
  }

  post(path, handler) {
    this.router.post(path, handler);
  }

  put(path, handler) {
    this.router.put(path, handler);
  }

  patch(path, handler) {
    this.router.patch(path, handler);
  }

  delete(path, handler) {
    this.router.delete(path, handler);
  }

  use(middleware) {
    this.router.use(middleware);
  }

  async handleRequest(req, res) {
    req.url = req.url.split('?')[0];
    
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };

    res.send = (data) => {
      res.end(data);
    };

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    if (req.url.startsWith('/public/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', req.url);
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.status(404).send('Not Found');
        } else {
          const ext = path.extname(filePath);
          const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json'
          };
          res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
          res.end(content);
        }
      });
      return;
    }

    await queryParser(req);
    await bodyParser(req);

    let middlewareIndex = 0;
    const next = () => {
      if (middlewareIndex < this.router.middlewares.length) {
        const middleware = this.router.middlewares[middlewareIndex++];
        middleware(req, res, next);
      } else {
        this.processRoute(req, res);
      }
    };
    next();
  }

  processRoute(req, res) {
    const route = this.router.findRoute(req.method, req.url);
    if (route) {
      const routeSegments = route.path.split('/');
      const urlSegments = req.url.split('/');
      routeSegments.forEach((segment, i) => {
        if (segment.startsWith(':')) {
          const paramName = segment.slice(1);
          req.params[paramName] = urlSegments[i];
        }
      });
      
      try {
        route.handler(req, res);
      } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      res.status(404).json({ error: 'Route not found' });
    }
  }

  listen(port, callback) {
    this.server.listen(port, callback);
  }
}

const concertsController = new Controller('concerts.json');
const artistsController = new Controller('artists.json');
const app = new App();

app.use(logger);

app.get('/concerts', (req, res) => concertsController.getAll(req, res));
app.get('/concerts/:id', (req, res) => concertsController.getById(req, res));
app.post('/concerts', (req, res) => concertsController.create(req, res));
app.put('/concerts/:id', (req, res) => concertsController.update(req, res));
app.patch('/concerts/:id', (req, res) => concertsController.update(req, res));
app.delete('/concerts/:id', (req, res) => concertsController.delete(req, res));

app.get('/artists', (req, res) => artistsController.getAll(req, res));
app.get('/artists/:id', (req, res) => artistsController.getById(req, res));
app.post('/artists', (req, res) => artistsController.create(req, res));
app.put('/artists/:id', (req, res) => artistsController.update(req, res));
app.patch('/artists/:id', (req, res) => artistsController.update(req, res));
app.delete('/artists/:id', (req, res) => artistsController.delete(req, res));

app.get('/', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const html = fs.readFileSync(path.join(__dirname, '../public/index.html'));
  res.setHeader('Content-Type', 'text/html');
  res.end(html);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  GET    /concerts');
  console.log('  GET    /concerts/:id');
  console.log('  POST   /concerts');
  console.log('  PUT    /concerts/:id');
  console.log('  PATCH  /concerts/:id');
  console.log('  DELETE /concerts/:id');
  console.log('  GET    /artists');
  console.log('  GET    /artists/:id');
  console.log('  POST   /artists');
  console.log('  PUT    /artists/:id');
  console.log('  PATCH  /artists/:id');
  console.log('  DELETE /artists/:id');
});

module.exports = App;