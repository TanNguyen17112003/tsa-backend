import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const sampleSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    version: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    type: {
        type: Schema.Types.ObjectId,
        ref: 'Type'
    }
});

export const Sample = mongoose.model('Model', sampleSchema);
