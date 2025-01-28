import mongoose from 'mongoose';

const DatabaseConnection = () => {
    mongoose
        .connect(process.env.MONGO_DB_API)
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.log('Error : ', err);
        });
    
};

export default DatabaseConnection;
