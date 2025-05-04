import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ScriptControllerHumanInTheLoop = async (req, res) => {
    try {
        const scriptName = 'main'; // Python script name
        const scriptFolderPath = path.join(__dirname, '..', '..', '..', 'Backend');
        const scriptPath = path.join(scriptFolderPath, `${scriptName}.py`);

        const pythonProcess = spawn('python', [scriptPath, 'human_in_the_loop']);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (error) => {
            console.error(`Python script stderr: ${error}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python script (human_in_the_loop) exited with code ${code}`);
            res.json({ output: output.trim() });
        });
    } catch (error) {
        console.error('Error running Python script:', error);
        res.status(500).json({ error: 'Failed to run Python script' });
    }
};
