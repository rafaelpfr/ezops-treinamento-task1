var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

var Message = mongoose.model('Message',{
  name : String,
  message : String,
  time: String,
  isLiked: Boolean
})

var dbUrl = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@mongo:27017/test?authSource=admin`

app.get('/messages', (req, res) => {
  Message.find({},(err, messages)=> {
    res.send(messages);
  })
})


app.get('/messages/:user', (req, res) => {
  var user = req.params.user
  Message.find({name: user},(err, messages)=> {
    res.send(messages);
  })
})


app.post('/messages/update/:user', async (req, res) => {

  Message.findOne({ _id: req.params.user }, function(err, message) {
    message.isLiked = !message.isLiked;
    message.save(function(err, updatedBook) {
      console.log('atualizou');
    });
  });

  res.sendStatus(200);
})


app.post('/messages/delete/:user', async (req, res) => {
  Message.deleteOne({ _id: req.params.user }, function(err, user) {
    console.log('deletou');
  })
  res.sendStatus(200);
})



app.post('/messages', async (req, res) => {
  const date = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  req.body.time = ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2);
  req.body.isLiked = false

  try{
    var message = new Message(req.body);

    var savedMessage = await message.save()
    req.body._id = savedMessage._id 

    var censored = await Message.findOne({message:'badword'});
    if(censored) await Message.remove({_id: censored.id})
    else io.emit('message', req.body);

    res.sendStatus(200);
  }
  catch (error){
    res.sendStatus(500);
    return console.log('error',error);
  }
  finally{
    console.log('Message Posted')
  }
})



io.on('connection', () =>{
  console.log('a user is connected')
})

mongoose.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true}, (err) => {
  console.log('mongodb connected',err);
})

var server = http.listen(3000, () => {
  console.log('server is running on port', server.address().port);
});
