/**
 * Since we are using generated API hooks that rely on a customFetch implementation
 * we might not be able to modify, we intercept the global fetch to automatically 
 * inject our authentication token into every request going to the API.
 */

const originalFetch = window.fetch;

const configuredApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?.trim()
  .replace(/\/$/, "");

function getRequestUrl(resource: RequestInfo | URL): string {
  if (typeof resource === "string") return resource;
  if (resource instanceof URL) return resource.toString();
  if (resource instanceof Request) return resource.url;
  return "";
}

function isApiRequest(url: string): boolean {
  if (url.startsWith("/api")) return true;
  if (!configuredApiBase) return false;
  return url.startsWith(`${configuredApiBase}/api`);
}

function resolveRequestTarget(resource: RequestInfo | URL): RequestInfo | URL {
  const url = getRequestUrl(resource);
  if (!configuredApiBase || !url.startsWith("/api")) {
    return resource;
  }

  const absoluteUrl = `${configuredApiBase}${url}`;
  if (resource instanceof Request) {
    return new Request(absoluteUrl, resource);
  }
  return absoluteUrl;
}

window.fetch = async (...args) => {
  let [resource, config] = args;
  resource = resolveRequestTarget(resource);

  // Only intercept requests going to our API
  const url = getRequestUrl(resource);
  
  if (isApiRequest(url)) {
    const token = localStorage.getItem('stf_token');
    
    if (token) {
      if (resource instanceof Request) {
        const headers = new Headers(resource.headers);
        headers.set('Authorization', `Bearer ${token}`);
        resource = new Request(resource, { headers });
      } else {
        config = config || {};
        const headers = new Headers(config.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        config.headers = headers;
      }
    }
  }

  const response = await originalFetch(resource, config);
  
  // Handle global unauthorized state
  if (response.status === 401 && !url.includes('/auth/login')) {
    localStorage.removeItem('stf_token');
    const base = import.meta.env.BASE_URL || '/';
    window.location.href = base + 'login';
  }

  return response;
};

export {};
