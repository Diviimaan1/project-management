import mongoose from "mongoose";

const connectdb = async () => {
    try {
        mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected")
    } catch (error) {
        console.error("MongoDB connection error",error);
        process.exit(1);
    }
}

export default connectdb