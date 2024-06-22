import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectDB } from './configs/db';
import { commonRouter as router } from './routes/common.route';
import setupSwagger from './swagger';

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: '*',
    credentials: true
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/api', router);

// Swagger
setupSwagger(app);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
};

startServer();
