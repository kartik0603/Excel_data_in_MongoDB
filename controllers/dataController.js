const multer = require("multer");
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const XLSX = require("xlsx");
const Data = require("../models/data.Schema");
require('dotenv').config();

// Configure AWS SDK v3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Multer S3 storage for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }   
}).single('file');

// Helper function to upload file to S3 using AWS SDK v3
const uploadToS3 = async (file) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`, // Generate a unique file name
        Body: file.buffer, // Use the file buffer directly
        
    };
    try {
        await s3Client.send(new PutObjectCommand(params));
        return params.Key; // Return the file key (filename in S3)
    } catch (err) {
        console.error("Error uploading to S3:", err);
        throw new Error('Failed to upload file to S3');
    }
};

// Import Excel file data into MongoDB
const importFile = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(500).send('Error uploading file');
        }
        try {
            // Upload file to S3 and get the file key
            const fileKey = await uploadToS3(req.file);

            // Download the file from S3 to read the content
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileKey
            };
            const data = await s3Client.send(new GetObjectCommand(params));
            const fileStream = data.Body;

            // Convert the stream to a buffer for parsing with XLSX
            const buffer = await streamToBuffer(fileStream);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            // Insert the data into MongoDB
            await Data.insertMany(sheetData);
            console.log("Data inserted successfully");
            res.redirect('/');
        } catch (err) {
            console.error("Error processing file:", err);
            res.status(500).send('Error processing file');
        }
    });
};



// Convert readable stream to buffer
const streamToBuffer = (stream) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
};

// Export data from MongoDB as JSON
const exportData = async (req, res) => {
    try {
        const data = await Data.find();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error exporting data:", error);
        return res.status(400).json({ error: error.message });
    }
};

// Delete all data from MongoDB
const deleteData = async (req, res) => {
    try {
        await Data.deleteMany({});
        res.redirect('/');
    } catch (err) {
        console.error("Error deleting data:", err);
        res.status(500).send('Error deleting data from MongoDB');
    }
};

module.exports = { importFile, exportData, deleteData };
