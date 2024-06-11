const express = require('express');
const app = express();
const port = 3000;
const request = require('request');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');
app.use(bodyParser.urlencoded({ extended: true }));
require('dotenv').config();
 app.use(express.static('public'));

 app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

var serviceAccount = require("./key.json");

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();

const firebaseConfig = {
    apiKey: "AIzaSyCNVjpXi38JnhWxcJRgzUINOwtt590XYwE",
    authDomain: "project-9cc21.firebaseapp.com",
    projectId: "project-9cc21",
    storageBucket: "project-9cc21.appspot.com",
    messagingSenderId: "338665293905",
    appId: "1:338665293905:web:a760491d42139b9195d070",
    measurementId: "G-DBKW5RY5K8"
  };

app.set("view engine", "ejs");

app.get("/signin", (req, res) => {
    res.render('signin', {titl:"Login"});
});

app.get('/search', (req, res) => {
    res.render('stockData', { title: 'Stock' });
});

app.get("/signup", (req, res) => {
    res.render('signup', {titl:"Signup"});
});


app.post('/signupsubmit', (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const conform_password = req.body.conform_password;

    //Adding data to the collection
    if (password === conform_password) {
        db.collection('users')
            .add({
                username: username,
                email: email,
                password: password,
            })
            .then(() => {
                res.render("signin");
            })
            .catch((error) => {
                console.error("Error adding user to Firestore: ", error);
                res.send("Signup Failed: Error saving user to database.");
            });
    } else {
        res.send("Signup Failed: Passwords do not match.");
    }
});


app.post('/signinsubmit', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Validate email and password
    if (!email || !password) {
        return res.send("Login Failed: Email and password are required.");
    }

    db.collection("users")
        .where("email", "==", email)
        .where("password", "==", password)
        .get()
        .then((docs) => {
            if (docs.size > 0) {
                var usersData = [];
                db.collection('users')
                    .get()
                    .then((allDocs) => {
                        allDocs.forEach((doc) => {
                            usersData.push(doc.data());
                        });
                    })
                    .then(() => {
                        console.log(usersData);
                        res.render('index', { userData: usersData, titl: "Dashboard" });
                    });
            } else {
                res.send("Login Failed: Incorrect email or password.");
            }
        })
        .catch((error) => {
            console.error("Error logging in: ", error);
            res.send("Login Failed: Error checking credentials.");
        });
});

app.get("/stockwidget", (req, res) =>{
    res.render("stockwidget", {titl:"GlobalMarket"});
});

app.get('/search', (req, res) => {
    res.render('stockData', { msg: "", n: "", p: "", c: "", h: "", l: "" });
});

app.get("/", (req, res) =>{
    res.render("index", {titl:"Dashboard"});
});

app.get('/data', async (req, res) => {
    const { symbol } = req.query;
    if (!symbol) {
        return res.render('index', { msg: 'Please enter a stock symbol.', n: "", p: "", c: "", h: "", l: "" });
    }

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol.toUpperCase()}&apikey=${apiKey}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data['Global Quote'];
        if (data && Object.keys(data).length > 0) {
            const name = `Company Symbol: ${data['01. symbol']}`;
            const price = `Current Price: ${data['05. price']}`;
            const change = `Change: ${data['10. change percent']}`;
            const high = `High: ${data['03. high']}`;
            const low = `Low: ${data['04. low']}`;
            res.render('stockData', { msg: "", n: name, p: price, c: change, h: high, l: low });
        } else {
            res.render('stockData', { msg: 'No data found for the given symbol.', n: "", p: "", c: "", h: "", l: "" });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.render('stockData', { msg: 'Error fetching data. Please try again later.', n: "", p: "", c: "", h: "", l: "" });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});