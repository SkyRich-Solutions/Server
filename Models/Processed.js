import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
    {
        Material: {
            type: String,
            required: true
        },
        Description: {
            type: String,
            required: true
        },
        Plant: {
            type: String,
            required: true
        },
        Plant_Specific_Material_Status: {
            type: String,
            required: true
        },
        Batch_ManagementPlant: {
            type: String,
            default: ''
        },
        Serial_No_Profile: {
            type: String,
            default: ''
        },
        Replacement_Part: {
            type: String,
            default: ''
        },
        Used_in_a_S_bom: {
            type: String,
            default: ''
        },
        Violation: {
            type: Number,
            default: 0
        }
    },
    {
        collection: 'Processed v1'
    }
);

const Processed = mongoose.model('Processed', materialSchema);

export default Processed;
