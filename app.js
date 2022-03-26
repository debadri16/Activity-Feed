var express = require('express');
var bodyParser = require('body-parser');

var app = express();

var posts = require('./posts.js');
var comments = require('./comments.js');
var likePosts = require('./likePosts');
var likeComments = require('./likeComments');

app.use(bodyParser.json());
app.use('/posts', posts);
app.use('/comments', comments);
app.use('/likePosts', likePosts);
app.use('/likeComments', likeComments);

app.listen(3000, () => {
    console.log("Server started at port 3000");
});