/**
 * router.js — Simple hash-based SPA router for Contexto App
 */

const routes = {};
let currentRoute = null;

/**
 * Register a route with a handler function.
 * Handler receives (container, params) where params are route parameters.
 */
export function registerRoute(path, handler) {
  routes[path] = handler;
}

/**
 * Navigate to a route programmatically.
 */
export function navigate(path) {
  window.location.hash = path;
}

/**
 * Get current route path.
 */
export function getCurrentRoute() {
  return currentRoute;
}

/**
 * Match a hash path against registered routes.
 * Supports simple params like /video/:id
 */
function matchRoute(hash) {
  const fullRaw = hash.replace('#', '') || '/';
  const [path, queryString] = fullRaw.split('?');
  const queryParams = {};
  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    for (const [key, val] of searchParams.entries()) {
      queryParams[key] = val;
    }
  }

  // Try exact match first
  if (routes[path]) {
    return { handler: routes[path], params: { ...queryParams } };
  }

  // Try parameterized routes
  for (const routePath in routes) {
    const routeParts = routePath.split('/');
    const pathParts = path.split('/');

    if (routeParts.length !== pathParts.length) continue;

    const params = { ...queryParams };
    let match = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].substring(1)] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return { handler: routes[routePath], params };
    }
  }

  return null;
}

/**
 * Handle route changes.
 */
async function handleRoute() {
  const hash = window.location.hash || '#/';
  const matched = matchRoute(hash);
  const container = document.getElementById('page-container');

  if (!container) return;

  if (matched) {
    currentRoute = hash.replace('#', '');

    // Add fade transition
    container.style.animation = 'none';
    container.offsetHeight; // force reflow
    container.style.animation = 'fadeIn var(--transition-base)';

    container.innerHTML = '';
    await matched.handler(container, matched.params);

    // Update active nav link
    updateActiveNav(currentRoute);
  } else {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>Página não encontrada</h3>
        <p>A página que você procura não existe.</p>
        <a href="#/" class="btn btn-primary">Voltar ao início</a>
      </div>
    `;
  }
}

/**
 * Update the active state of navigation links.
 */
function updateActiveNav(path) {
  document.querySelectorAll('.nav-link').forEach(link => {
    const route = link.getAttribute('data-route');
    if (route === path || (route !== '/' && path.startsWith(route))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Initialize the router.
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  // Handle initial load
  handleRoute();
}
