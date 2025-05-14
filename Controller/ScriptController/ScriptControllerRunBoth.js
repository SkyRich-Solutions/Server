// ScriptRunBoth.js
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ScriptControllerRunBoth = async (req, res) => {
    try {
        const scriptPath = path.join(__dirname, '..', '..', '..', 'Backend', 'main.py');
        let output = '';

        const mainProcess = spawn('python', [scriptPath]);

        mainProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        mainProcess.stderr.on('data', (error) => {
            console.error(`main.py stderr: ${error}`);
        });

        mainProcess.on('close', (code) => {
            console.log(`main.py exited with code ${code}`);

            const hitlProcess = spawn('python', [scriptPath, 'human_in_the_loop']);

            hitlProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            hitlProcess.stderr.on('data', (error) => {
                console.error(`human_in_the_loop stderr: ${error}`);
            });

            hitlProcess.on('close', (hitlCode) => {
                console.log(`human_in_the_loop exited with code ${hitlCode}`);
                res.json({ output: output.trim() });
            });
        });
    } catch (error) {
        console.error('Error running both scripts:', error);
        res.status(500).json({ error: 'Failed to run both Python scripts' });
    }
};
