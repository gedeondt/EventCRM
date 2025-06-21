import express from 'express';
import createContactRoutes from './slices/contact/create-contact/http.js';
import editContactRoutes from './slices/contact/edit-contact/http.js';
import projectContactRoutes from './slices/contact/project-contact/http.js';
import createClientRoutes from './slices/client/create-client/http.js';
import editClientRoutes from './slices/client/edit-client/http.js';
import linkContactRoutes from './slices/client/link-contact/http.js';
import unlinkContactRoutes from './slices/client/unlink-contact/http.js';
import projectClientRoutes from './slices/client/project-client/http.js';

const app = express();
app.use(express.json());

// Register each contact slice router
app.use('/api', createContactRoutes);
app.use('/api', editContactRoutes);
app.use('/api', projectContactRoutes);
app.use('/api', createClientRoutes);
app.use('/api', editClientRoutes);
app.use('/api', linkContactRoutes);
app.use('/api', unlinkContactRoutes);
app.use('/api', projectClientRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CRM service running on http://localhost:${PORT}`);
});
