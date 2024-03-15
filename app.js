const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7272;

app.use(express.json());

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

sequelize
  .sync()
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });
/*
// PostgreSQL database connection

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Adjust this based on your SSL certificate configuration
    }
  }
});
*/
// Define Image model
const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.BLOB('long'),
    allowNull: false,
  },
});

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));


// API endpoints
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend.html'));
});

/* Contact Code Starts*/

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Node Mailer
// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const html = `
<h1 style="color:green"> Hello Guys </h1>
<p> Vijay from Node mailer</p>
`


// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: "vijayanandvj1998@gmail.com",
      pass: "ezjj lfjk mdlp xczg "
    },
  });

// Route to handle form submission
app.post('/send-email', (req, res) => {
  const { name, email, number, message, sendCopy } = req.body;

  // Array to store recipient emails
  let recipients = ['vijayanandextra@gmail.com'];
  // Add email to recipients if checkbox is checked
  if (sendCopy) {
      recipients.push(email);
  }

  const mailOptions = {
    from: 'vijayanandvj1998@gmail.com',
    to: recipients.join(', '), // Join recipient emails with comma
    subject: 'New Contact Form Submission',
    html: `
        ${html}
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone Number:</strong> ${number}</p>
        <p><strong>Message:</strong> ${message}</p>
    `
};
 
    console.log("Success Message Sent :" + mailOptions.messageId);


    // Send mail
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error occurred:', error);
            res.status(500).send('An error occurred while sending the email.');
        } else {
            console.log('Email sent:', info.response);
            res.status(200).send('Email sent successfully!');
        }
    });
});

/* Contact Code Ends*/
//----------------------------------------------------//
/* Image Upload  Code Starts*/

// Image Upload
app.post('/upload', upload.single('image'), async (req, res) => {
  const { filename } = req.file;
  const imageData = fs.readFileSync(req.file.path);

  try {
    await Image.create({ filename, data: imageData });
    fs.unlinkSync(req.file.path); // Cleanup: Remove the temporary file
    res.send('Image uploaded successfully!');
  } catch (error) {
    console.error('Error inserting image into PostgreSQL database:', error);
    fs.unlinkSync(req.file.path); // Cleanup: Remove the temporary file
    res.status(500).send('Error uploading image');
  }
});

// Get all images
app.get('/images', async (req, res) => {
  try {
    const images = await Image.findAll();
    const formattedImages = images.map(image => ({
      id: image.id,
      filename: image.filename,
      data: image.data.toString('base64'),
    }));
    res.json(formattedImages);
  } catch (error) {
    console.error('Error fetching images from PostgreSQL database:', error);
    res.status(500).send('Error fetching images');
  }
});

// Delete image by ID
app.delete('/images/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await Image.destroy({ where: { id } });
    res.send('Image deleted successfully!');
  } catch (error) {
    console.error('Error deleting image from PostgreSQL database:', error);
    res.status(500).send('Error deleting image');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});

  
//http://localhost:7272