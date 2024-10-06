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
    storage: multer.memoryStorage()  // Store the file in memory temporarily before uploading to S3
}).single('file');

// Helper function to upload file to S3 using AWS SDK v3
const uploadToS3 = async (file) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${Date.now()}-${file.originalname}`, // Generate a unique file name
        Body: file.buffer, // Use the file buffer directly
        // ACL: 'public-read' // Set access control
    };
    try {
        await s3Client.send(new PutObjectCommand(params));
        return params.Key; // Return the file key (filename in S3)
    } catch (err) {
        console.error("Error uploading to S3:", err);
        throw new Error('Failed to upload file to S3');
    }
};

// Function to get the file from S3
const getFileFromS3 = async (fileKey) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileKey,
    };

    try {
        const data = await s3Client.send(new GetObjectCommand(params));
        const fileStream = data.Body;
        // Convert the stream to a buffer
        const buffer = await streamToBuffer(fileStream);
        return buffer;
    } catch (error) {
        console.error("Error fetching file from S3:", error);
        throw new Error('Failed to fetch file from S3');
    }
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

// Function to read the Excel file
const readExcelFile = (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]); // Convert to JSON
    return sheetData;
};

// Import Excel file data into MongoDB
const importFile = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send('Error uploading file');
        }
        try {
            // Upload file to S3 and get the file key
            const fileKey = await uploadToS3(req.file);

            // Download the file from S3 to read the content
            const fileBuffer = await getFileFromS3(fileKey);
            const fileData = readExcelFile(fileBuffer);

            // Insert the data into MongoDB
            await batchInsert(fileData);
            res.redirect('/');
        } catch (err) {
            console.error("Error processing file:", err);
            res.status(500).send('Error processing file');
        }
    });
};

// Batch insert function for MongoDB
const batchInsert = async (dataArray) => {
    const BATCH_SIZE = 100; // Adjust based on your needs
    for (let i = 0; i < dataArray.length; i += BATCH_SIZE) {
        const batch = dataArray.slice(i, i + BATCH_SIZE);
        await Data.insertMany(batch);
        console.log(`Inserted batch ${i / BATCH_SIZE + 1}`);
    }
};

// API endpoint to get the file data
const getFileData = async (req, res) => {
    const { fileKey } = req.params; // Get the file key from request parameters

    try {
        const fileBuffer = await getFileFromS3(fileKey);
        const fileData = readExcelFile(fileBuffer);
        res.status(200).json(fileData); // Return the data as JSON
    } catch (error) {
        res.status(500).send('Error fetching file data');
    }
};

// Export data from MongoDB as JSON
const exportData = async (req, res) => {
    try {
        const data = await Data.find();
        res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: error.message });
    }
};

// Delete all data from MongoDB
const deleteData = (req, res) => {
    Data.deleteMany({})
        .then(() => res.redirect('/'))
        .catch(err => res.status(500).send('Error deleting data from MongoDB'));
};

// Export functions
module.exports = { importFile, exportData, deleteData, getFileData };
