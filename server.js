var express = require("express"),
    app = express(),
    binaryServer = require('binaryjs').BinaryServer,
    bodyparser = require("body-parser"),
    wav = require('wav'),
    fs = require('fs'),
    mongoose = require("mongoose"),
    SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
    
app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
mongoose.connect("mongodb://localhost:27017/transcriptionDB",{useNewUrlParser:true});

// ======================== Load Credential ===============================
var ibm_username = "";
var ibm_password = "";
var credential = '/Users/wangruohan/Documents/nlp/ibmCredential.txt';
str = fs.readFileSync(credential, 'utf8')
ibm_username = str.split('\n')[0];
ibm_password = str.split('\n')[1];
console.log(ibm_username);
console.log(ibm_password);
transcriptionFilePath = './ibm_transcription.txt';

// ======================== Database ===============================

var user = {username: "", password: ""};
var patientID = {patientName: "", patientDOB: ""};

var MySchema = new mongoose.Schema({
    name: String,
    password: String,
    transcription: String,
    patient: String,
    birthday: String,
    date: String
});
var Doctor = mongoose.model("Doctor", MySchema);

function addTranscriptionToDB(transcription){
  var time = new Date();
  var person = new Doctor({
    name: user.username,
    password: user.password,
    patient: patientID.patientName,
    birthday: patientID.patientDOB,
    transcription: transcription,
    date: time.toString()
  });
  person.save(function(err, per){
    if(err){
        console.log("something wrong when saving to the database")
    }else{
        console.log("Saved a transcription to the database:")
        console.log(per);
    }
  });
}

// ======================== Views ===============================
app.get("/", function(req, res){
  res.render("landing");
});

app.get("/record", function(req, res){
    res.render("client");
});

app.get("/profile", function(req, res){
  res.render("profile", {username: username});
});

app.post("/record", function(req, res){
  
  patientID.patientName = req.body.patientName;
  patientID.patientDOB = req.body.patientDOB;
  res.render("client");
});

app.post("/profile", function(req, res){
  user.username = req.body.username;
  user.password = req.body.password;
  Doctor.find({name: user.username, password: user.password}, function(err, person){
      if(err){
        console.log(err);
      }else if(person.length == 0){
        res.render("login", {found: false});
          
      }else{
          res.render("profile", {person: person[0]});
      }
  });
});

app.get("/login", function(req, res){
  res.render("login", {found: true});
});

app.post("/login", function(req, res){
  user.username = req.body.username;
  user.password = req.body.password;
  addTranscriptionToDB("I just created an account.");
  res.render("login", {found: true});
})

app.get("/signup", function(req, res){
  res.render("signup");
})

app.listen(3700, function(){
  console.log("server is listening......");
});

// ======================== BinaryJS WebSocket ===============================
var server = binaryServer({port: 9001});

server.on('connection', function(client) {
  console.log('new connection');

  client.on('stream', function(stream, meta) {
    console.log('new stream');

    var speechToText = new SpeechToTextV1({
      username: ibm_username,
      password: ibm_password,
      url: 'https://stream.watsonplatform.net/speech-to-text/api/'
    });

    stream.pipe(speechToText.recognizeUsingWebSocket({ content_type: 'audio/l16; rate=44100' }))
      .pipe(fs.createWriteStream(transcriptionFilePath));

    var interval = setInterval(function(){
      str = fs.readFileSync(transcriptionFilePath, 'utf8');
      client.send({type: 'transcription', data: str});
    }, 5000);

    // stream.on('end', function(){
    //   clearInterval(interval);
    //   str = fs.readFileSync(transcriptionFilePath, 'utf8');
    //   client.send({type: 'transcription', data: str});
    // })
  });
});

