import axios from 'axios';
const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://secure-exam-roxt.onrender.com/api' 
});
api.interceptors.request.use((config)=>{ 
  const t=localStorage.getItem('token'); 
  if(t) config.headers.Authorization=`Bearer ${t}`; 
  return config; 
});
export default api;
