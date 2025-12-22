class Router {
  constructor() {
    this.routes = {
      GET: [],
      POST: [],
      PUT: [],
      PATCH: [],
      DELETE: []
    };
    this.middlewares = [];
  }

  get(path, handler) {
    this.routes.GET.push({ path, handler });
  }

  post(path, handler) {
    this.routes.POST.push({ path, handler });
  }

  put(path, handler) {
    this.routes.PUT.push({ path, handler });
  }

  patch(path, handler) {
    this.routes.PATCH.push({ path, handler });
  }

  delete(path, handler) {
    this.routes.DELETE.push({ path, handler });
  }

  use(middleware) {
    this.middlewares.push(middleware);
  }

  findRoute(method, url) {
    return this.routes[method].find(route => {
      const routeSegments = route.path.split('/');
      const urlSegments = url.split('/');
      
      if (routeSegments.length !== urlSegments.length) return false;
      
      for (let i = 0; i < routeSegments.length; i++) {
        if (routeSegments[i].startsWith(':')) continue;
        if (routeSegments[i] !== urlSegments[i]) return false;
      }
      return true;
    });
  }
}

module.exports = Router;