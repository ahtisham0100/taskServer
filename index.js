import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import extract from 'pdf-text-extract';
import PDFParser from 'pdf2json';
import { API_KEY } from "./config.js"; // Importing api key
const MONDAY_API_URL = "https://api.monday.com/v2";

console.log("Monday API Key:", API_KEY); // for Test if it loads correctly

const BOARD_ID = "1979257003"; //  board ID
const port = 3000;
const app = express();
const parser = new PDFParser();
app.use(cors());
app.use(express.json());

// Setup multer to store uploaded PDFs
const upload = multer({ dest: 'uploads/' });

// PDF Processing Route
app.post('/upload', upload.fields([{ name: 'pdf' }, { name: 'email' }]), async (req, res) => {  
    try {
        const projectName = req.body.projectname;
        const mailFile = req.files['email'] ? req.files['email'][0] : null;
        const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;

        if (!projectName || !mailFile || !pdfFile) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log("Files uploaded:", mailFile.filename, pdfFile.filename);

        // function to  Extract text from both PDFs
        const extractText = (filePath) =>
            new Promise((resolve, reject) => {
                extract(filePath, { splitPages: false }, (err, text) => {
                    if (err) return reject(err);
                    resolve(Array.isArray(text) ? text.join(' ') : text);
                });
            });
 

            //extracting data from the pdf;
        const emailContent = await extractText(mailFile.path);
        const workOrderContent = await extractText(pdfFile.path);

        // Upload data to Monday.com
        const response = await addTaskToMonday(projectName, emailContent, workOrderContent);
        console.log('Monday.com Response:', response);

        // Clean up uploaded files
        fs.unlink(mailFile.path, (err) => err && console.error('Error deleting email file:', err));
        fs.unlink(pdfFile.path, (err) => err && console.error('Error deleting work order file:', err));

        res.json({ message: 'Data uploaded successfully to Monday.com', response });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// Function to send data to Monday.com board
async function addTaskToMonday(projectName, workOrderData, emailContent) {
    try {
        const columnValues = {
            text_mknm5hg3: workOrderData, // WorkOrder column
            text_mknmejk1: emailContent // EmailContent column
        };

        const query = {
            query: `mutation {
                create_item (
                    board_id: ${BOARD_ID}, 
                    item_name: "${projectName}", 
                    column_values: ${JSON.stringify(JSON.stringify(columnValues))}
                ) {
                    id
                }
            }`
        };

        const response = await fetch(MONDAY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': API_KEY
            },
            body: JSON.stringify(query)
        });

        const data = await response.json();
        console.log("Monday.com Update Response:", data);
        return data;
    } catch (error) {
        console.error("Error updating Monday.com board:", error);
    }
}
























app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
 
 

 




// columns ids 

async function getBoardColumns() {
    const query = {
        query: `{
            boards (ids: ${BOARD_ID}) {
                columns {
                    id
                    title
                    type
                }
            }
        }`
    };

    const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': API_KEY
        },
        body: JSON.stringify(query)
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2)); // Pretty print the response
}

getBoardColumns();