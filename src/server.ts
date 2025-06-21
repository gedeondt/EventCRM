import express from 'express';
import createContactRoutes from './slices/contact/create-contact/http.js';
import editContactRoutes from './slices/contact/edit-contact/http.js';
import projectContactRoutes from './slices/contact/project-contact/http.js';

const app = express();
app.use(express.json());

// Register each contact slice router
app.use('/api', createContactRoutes);
app.use('/api', editContactRoutes);
app.use('/api', projectContactRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CRM service running on http://localhost:${PORT}`);
});
