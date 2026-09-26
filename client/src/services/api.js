import axios from 'axios';

export const CUSTOMER_KEY = 'msp_token';
export const ADMIN_KEY = 'msp_admin_token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 25000 });

api.interceptors.request.use((cfg) => {
  const isAdmin = cfg.url?.startsWith('/admin') || cfg.url?.startsWith('/auth/admin');
  const token = localStorage.getItem(isAdmin ? ADMIN_KEY : CUSTOMER_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    let message = 'Something went wrong. Please try again.';
    if (err.code === 'ECONNABORTED') message = 'The request timed out. Please try again.';
    else if (!err.response) message = 'Cannot reach the server. Check your internet connection.';
    else if (err.response.data?.message) message = err.response.data.message;
    if (err.response?.status === 401 && !/auth\/(admin\/)?login|auth\/register/.test(err.config?.url || '')) {
      const admin = err.config?.url?.startsWith('/admin');
      window.dispatchEvent(new CustomEvent('msp:unauthorized', { detail: { admin } }));
    }
    const e = new Error(message);
    e.status = err.response?.status;
    e.details = err.response?.data?.details;
    return Promise.reject(e);
  }
);

export const get = (url, params) => api.get(url, { params }).then((r) => r.data);
export const post = (url, body, cfg) => api.post(url, body, cfg).then((r) => r.data);
export const put = (url, body) => api.put(url, body).then((r) => r.data);
export const del = (url, body) => api.delete(url, { data: body }).then((r) => r.data);

export async function download(url, filename) {
  const res = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}
export default api;
