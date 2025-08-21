import axios from "axios";


const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`, // token from .env
  },
});



export const getNotes = (page = 1, limit = 20) =>
  API.get(`/notes?page=${page}&limit=${limit}`);



export const createNote = (data) => API.post("/notes", data);

export const replayNote = (id) => API.post(`/notes/${id}/replay`);
