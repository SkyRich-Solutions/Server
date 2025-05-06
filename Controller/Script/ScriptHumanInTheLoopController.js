import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ScriptControllerHumanInTheLoop = async (req, res) => {
    try {
        const scriptName = 'main'; // the actual script name
        const scriptFolderPath = path.join(__dirname, '..', '..', '..', 'Backend');
        const scriptPath = path.join(scriptFolderPath, `${scriptName}.py`);

        // Check if the script exists
        if (!fs.existsSync(scriptPath)) {
            console.error('Script not found at:', scriptPath);
            return res.status(404).json({ error: 'Python script not found' });
        }

        console.log(`Running: python ${scriptName}.py human_in_the_loop`);

        const pythonProcess = spawn('python', [scriptPath, 'human_in_the_loop']);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            const err = data.toString();
            errorOutput += err;
            console.error(`STDERR: ${err}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Script finished with exit code ${code}`);
            if (code !== 0) {
                return res.status(500).json({
                    error: `Script exited with code ${code}`,
                    stderr: errorOutput.trim()
                });
            }

            res.status(200).json({ output: output.trim() });
        });
    } catch (error) {
        console.error(' Error running Python script:', error);
        res.status(500).json({ error: 'Failed to run Python script', details: error.message });
    }
};
