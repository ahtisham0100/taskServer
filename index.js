import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import extract from 'pdf-text-extract';
import PDFParser from 'pdf2json';
const __filename = fileURLToPath(import.meta.url);
import { API_KEY } from "./config.js"; // Importing api key
const MONDAY_API_URL = "https://api.monday.com/v2";

console.log("Monday API Key:", API_KEY); // Test if it loads correctly

const port = 3000;
const app = express();
const parser = new PDFParser();
app.use(cors());
app.use(express.json());

// Setup multer to store uploaded PDFs
const upload = multer({ dest: 'uploads/' });

// PDF Processing Route
app.post('/upload', upload.single('pdf'), async (req, res) => { 
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log("File uploaded:", req.file.filename);

        // Extract text from the uploaded PDF
        extract(req.file.path, { splitPages: false }, (err, text) => {
            if (err) {
                console.error('Error extracting text:', err);
                return res.status(500).json({ error: 'Failed to extract text from PDF' });
            }
            var pdfdata = Array.isArray(text) ? text.join(' ') : text; 
            pdfdata = pdfdata.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
            console.log(pdfdata);
            
            // console.log('Extracted text:', text);
            res.json({ text }); // Send extracted text as JSON

            // Delete the file after processing
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file:', unlinkErr);
            });
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
 
 
// uploading the content of the pdf file to the monday.com board 

app.get("/postToModay", async (req, res) => {
    try {
        const monday = require("monday-sdk-js");

        fetch ("https://api.monday.com/v2", {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization' : 'YOUR_API_KEY_HERE'
             },
             body: JSON.stringify({
               query : query
             })
            })
             .then(res => res.json())
             .then(res => console.log(JSON.stringify(res, null, 2)));


    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Something went wrong' });
    }

res.send("Hello World");
}
)

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
 




 



async function getBoardId() {
    const query = JSON.stringify({ query: `{ boards { id name } }` });

    try {
        const response = await fetch(MONDAY_API_URL, {
            method: "POST", // Must be POST for GraphQL queries
            headers: {
                "Content-Type": "application/json",
                "Authorization": API_KEY
            },
            body: query, // Send query in the request body
        });

        const data = await response.json(); // Convert response to JSON

        console.log("📌 Available Boards:", data.data.boards);
    } catch (error) {
        console.error("❌ Error Fetching Board ID:", error.message);
    }
}

// Run function
getBoardId();