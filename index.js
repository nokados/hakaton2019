const CONFIG = {
    db: {
        host: 'localhost',
        port: 3306,
        user: 'detalist',
        password: 'detalistpass',
        database: 'detalist'
    }
};

const mysql = require('mysql');
const express = require('express');
const app = express();

app.use('/', express.static('front/build'));

app.get('/test', function (req, res) {
    res.send('Hello World!');
});


app.listen(8000, function () {
    console.log('Detalist started');
});
