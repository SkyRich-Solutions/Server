import Processed from '../Models/Processed.js';

export const getProcessedJSON = async (req, res) => {
    try {
        const data = await Processed.find();
        res.status(200).json(data);
        // console.log('Get JSON : ', data);
    } catch (error) {
        console.log(error);
    }
};
