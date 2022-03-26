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

// to check if the post is in the DB
const checkValidPost = postid => {
    return new Promise((resolve, reject) => {
        getAllPosts = `select * from posts where postid=${postid}`;
        db.connect().all(getAllPosts, (err, rows) => {
            if (err) {
                reject(err);
            }
            // will return empty array if post does not exist
            if (rows.length !== 0) {
                resolve(postid);
            }
            reject(postid);
        });
    });
}

// add a comment to a post
const addComment = (postid, userid, comment) => {
    return new Promise((resolve, reject) => {
        insertPost = `insert into comments (postid, userid, comment) values ('${postid}',${userid},'${comment}')`
        db.connect().run(insertPost, err => {
            if (err) {
                reject(err);
            }
            resolve(userid);
        });
    });
}

const fetchCommenters = (userid) => {
    return new Promise((resolve, reject) => {

        // joining posts by the particular user with all the comments on them,
        // then selecting distict userid and username from that by joining with users table
        // while discarding any likes by the user itself
        allPostLikers = `select distinct(pl.userid), u.username from
                        (
                            select p.postid, l.userid from
                            (
                                select postid from posts where userid=${userid}
                            )
                            p inner join comments l on p.postid=l.postid
                        ) 
                        pl inner join users u on pl.userid=u.userid
                        where u.userid<>${userid}; `
        db.connect().all(allPostLikers, (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

// route to create a comment, body -> {postid: ..., userid: ..., comment: ...}
router.post('/', (req, res) => {
    //Check if user id is valid
    if (req.body.postid === undefined || req.body.userid === undefined || req.body.comment === undefined) {
        res.status(400);
        res.json({ message: "Bad Request" });
    }
    else {
        checkValidUserId(req.body.userid).then(resolve => {
            checkValidPost(req.body.postid).then(resolve => {
                addComment(req.body.postid, req.body.userid, req.body.comment).then(resolve => {
                    return res.json({ message: `Comment added at postid: ${req.body.postid} by userid: ${req.body.userid}` });
                },
                err => {
                    return res.json({ message: "Some error occured" });
                });
            },
            err => {
                return res.json({ message: "Post does not exist" });
            });


        },
        err => {
            return res.json({ message: "User does not exist" });
        });
    }
});

// route to fetch the latest list of users commenting on the post of an user
router.get('/:userid', (req, res) => {
    if (req.params.userid === undefined) {
        res.status(400);
        res.json({ message: "Bad Request" });
    }
    else {
        checkValidUserId(req.params.userid).then(resolve => {
            fetchCommenters(req.params.userid).then(data=>{
                return res.json({ users: data });
            })
        },
        err => {
            return res.json({ message: "User does not exist" });
        });
    }
});


//export this router to use in the app.js
module.exports = router;