var express = require('express');
var app = express();
var path = require('path');

//Main map
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.use("/javascript", express.static('./javascript/'));
app.use("/data", express.static('./data/'));

app.listen(8080);
