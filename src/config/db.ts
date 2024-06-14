import mongoose, { ConnectOptions } from 'mongoose';
import { config } from 'dotenv';

config();
export const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.MONGO_URI as string,
            {
                useNewUrlParser: true,
                useUnifiedTopology: true
            } as ConnectOptions
        );
        console.log('MongoDB connected');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
