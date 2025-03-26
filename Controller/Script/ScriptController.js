import { spawn } from 'child_process';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ScriptController = async (req, res) => {
    try {
        // Logic for selecting which script to run
        const scriptName = 'main'; // Predefined or determined based on your logic
        const scriptFolderPath = path.join(
            __dirname,
            '..',
            '..',
            '..',
            'Backend'
        ); // Going two levels up to get outside the server folder
        const scriptPath = path.join(scriptFolderPath, `${scriptName}.py`);

        const pythonProcess = spawn('python3', [scriptPath]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (error) => {
            console.error(`Error: ${error}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);
            // console.log('Output:\n', output.trim());
            res.json('Data Cleaning Complete ✅'); // Send script output back to frontend
        });
    } catch (error) {
        console.error('Error running Python script:', error);
        res.status(500).json({ error: 'Failed to run Python script' });
    }
};
