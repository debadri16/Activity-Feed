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

// to check if the comment is in the DB
const checkValidComment = commentid => {
    return new Promise((resolve, reject) => {
        getAllComments = `select commentid from comments where commentid=${commentid}`;
        db.connect().all(getAllComments, (err, rows) => {
            if (err) {
                reject(err);
            }
            // will return empty array if user does not exist
            if (rows.length !== 0) {
                resolve(commentid);
            }
            reject(commentid);
        });
    });
}

// to check if the same user has already liked the comment
const didNotLikeComment = (commentid, userid) => {
    return new Promise((resolve, reject) => {
        getCommentLikes = `select * from commentlikes where commentid=${commentid} and userid=${userid}`;
        db.connect().all(getCommentLikes, (err, rows) => {
            if (err) {
                reject(err);
            }
            // will return empty array if first time user is liking a comment
            if (rows.length === 0) {
                resolve("Did not like");
            }
            reject("Liked");
        });
    });
}

// add like to a comment
const addCommentLike = (commentid, userid) => {
    insertCommentLike = `insert into commentlikes (commentid, userid) values (${commentid}, ${userid})`;
    db.connect().run(insertCommentLike, err => {
        if (err) {
            return console.error(err);
        }
    });
}

const fetchCommentLikers = (userid) => {
    return new Promise((resolve, reject) => {

        // joining comments by the particular user with all the likes on them,
        // then selecting distict userid and username from that by joining with users table
        // while discarding any likes by the user itself
        allCommenttLikers = `select distinct(pl.userid), u.username from
                        (
                            select p.commentid, l.userid from
                            (
                                select commentid from comments where userid=${userid}
                            )
                            p inner join commentlikes l on p.commentid=l.commentid
                        ) 
                        pl inner join users u on pl.userid=u.userid
                        where u.userid<>${userid}; `
                            
        db.connect().all(allCommenttLikers, (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    });
}

// route to like a comment, body -> {commentid: ..., userid: ...}
router.post('/', (req, res) => {
    //Check if user id is valid
    if (req.body.userid === undefined || req.body.commentid === undefined) {
        res.status(400);
        res.json({ message: "Bad Request" });
    }
    else {
        checkValidUserId(req.body.userid).then(resolve => {
            checkValidComment(req.body.commentid).then(resolve => {
                didNotLikeComment(req.body.commentid, req.body.userid).then(resolve => {
                    // like the comment only if it is not already liked by the same user
                    addCommentLike(req.body.commentid, req.body.userid);
                    return res.json({ message: `commentid: ${req.body.commentid} liked by userid: ${req.body.userid}` });
                },
                err => {
                    return res.json({ message: `Comment has already been liked by user` });
                });
            },
            err => {
                return res.json({ message: "Comment does not exist" });
            });


        },
        err => {
            return res.json({ message: "User does not exist" });
        });
    }
});

// route to fetch the latest list of users liking the comments of an user on any post
router.get('/:userid', (req, res) => {
    if (req.params.userid === undefined) {
        res.status(400);
        res.json({ message: "Bad Request" });
    }
    else {
        checkValidUserId(req.params.userid).then(resolve => {
            fetchCommentLikers(req.params.userid).then(data=>{
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