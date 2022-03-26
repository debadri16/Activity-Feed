var express = require('express');
var router = express.Router();
var db = require('./dbConnect.js')

// to check if the user is in the DB
const checkValidUserId = userid => {
    return new Promise((resolve, reject) => {
        getAllUser = `select * from users where userid=${userid}`;
        db.connect().all(getAllUser, (err, rows) => {
            if (err) {
                reject(err);
            }
            // will return empty array if user does not exist
            if (rows.length !== 0) {
                resolve(userid);
            }
            reject(userid);
        });
    });
}

// insert a post in db
const addPost = (userid, title, content) => {
    insertPost = `insert into posts (userid, title, content) values (${userid},'${title}','${content}')`
    db.connect().run(insertPost, err => {
        if (err) {
            return console.error(err);
        }
    });
}

// route to create a post, body -> {userid: ..., title: ..., content: ...}
router.post('/', (req, res) => {
    //Check if user id is valid
    if (req.body.userid === undefined || req.body.title === undefined || req.body.content === undefined) {
        res.status(400);
        res.json({ message: "Bad Request" });
    }
    else {
        checkValidUserId(req.body.userid).then(resolve => {
            addPost(req.body.userid, req.body.title, req.body.content);
            return res.json({ message: `Post created for userid: ${req.body.userid}` });
        },
        err => {
            return res.json({ message: "User does not exist" });
        });
    }
});


//export this router to use in the app.js
module.exports = router;