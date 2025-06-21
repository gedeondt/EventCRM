import express from 'express';
import contactRoutes from './slices/contact/http';

const app = express();
app.use(express.json());

// Aquí montamos los routers slice a slice
app.use('/api', contactRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CRM service running on http://localhost:${PORT}`);
});