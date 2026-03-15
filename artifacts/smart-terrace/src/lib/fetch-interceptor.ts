/**
 * Since we are using generated API hooks that rely on a customFetch implementation
 * we might not be able to modify, we intercept the global fetch to automatically 
 * inject our authentication token into every request going to the API.
 */

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, config] = args;

  // Only intercept requests going to our API
  const url = typeof resource === 'string' ? resource : (resource instanceof Request ? resource.url : '');
  
  if (url.toString().startsWith('/api')) {
    const token = localStorage.getItem('stf_token');
    
    if (token) {
      if (resource instanceof Request) {
        resource.headers.set('Authorization', `Bearer ${token}`);
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
  if (response.status === 401 && !url.toString().includes('/auth/login')) {
    localStorage.removeItem('stf_token');
    const base = import.meta.env.BASE_URL || '/';
    window.location.href = base + 'login';
  }

  return response;
};

export {};
