import * as dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectDB } from './config/db';
import AppError from './helpers/appError';
import router from './routes';
import setupSwagger from './swagger';

const app = express();
const port = process.env.PORT || 3000;

app.use(
    cors({
        origin: '*',
        credentials: true
    })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.use('/api', router);

// Swagger
setupSwagger(app);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
    next(new AppError(`The URL ${req.originalUrl} does not exist`, 404));
});

// Start server
const startServer = async () => {
    await connectDB();
    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    });
};

startServer()

export default app;
