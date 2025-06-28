import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Invalid email format']
    },
    password: {
        type: String,
        required: true,
        trim: true,
        select: false, // Do not return password in queries
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    }
},{
    timestamps: true,
})

const User = mongoose.model('User', userSchema);
export default User;
