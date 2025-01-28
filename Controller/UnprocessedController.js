import UnProcessed from '../Models/UnProcessed.js';

export const getJSON = async (req, res) => {
    try {
        const data = await UnProcessed.find();
        res.status(200).json(data);
        // console.log('Get JSON : ', data);
    } catch (error) {
        console.log(error);
    }
};

export const postJSON = async (req, res) => {
    // console.log(req.body);
    try {
        // const data = req.body;
        const newData = await UnProcessed.create(req.body);
        // console.log('Post JSON : ', { newData });
        res.status(201).json(newData);
    } catch (error) {
        console.log(error);
    }
};
