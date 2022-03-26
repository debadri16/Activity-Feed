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

// to check if the same user has already liked the post
const didNotLike = (postid, userid) => {
    return new Promise((resolve, reject) => {
        getLikes = `select * from postlikes where postid=${postid} and userid=${userid}`;
        db.connect().all(getLikes, (err, rows) => {
            if (err) {
                reject(err);
            }
            // will return empty array if first time user is liking a post
            if (rows.length === 0) {
                resolve("Did not like");
            }
            reject("Liked");
        });
    });
}

// add like to a post
const addLike = (postid, userid) => {
    insertLike = `insert into postlikes (postid, userid) values (${postid}, ${userid})`;
    db.connect().run(insertLike, err => {
        if (err) {
            return console.error(err);
        }
    });
}

const fetchPostLikers = (userid) => {
    return new Promise((resolve, reject) => {

        // joining posts by the particular user with all the likes on them,
        // then selecting distict userid and username from that by joining with users table
        // while discarding any likes by the user itself
        allPostLikers = `select distinct(pl.userid), u.username from
                        (
                            select p.postid, l.userid from
                            (
                                select postid from posts where userid=${userid}
                            )
                            p inner join postlikes l on p.postid=l.postid
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

// route to like a post, body -> {postid: ..., userid: ...}
router.post('/', (req, res) => {
    //Check if user id is valid
    if (req.body.userid === undefined || req.body.postid === undefined) {
        res.status(400);
        res.json({ message: "Bad Request" });
    }
    else {
        checkValidUserId(req.body.userid).then(resolve => {
            checkValidPost(req.body.postid).then(resolve => {
                didNotLike(req.body.postid, req.body.userid).then(resolve => {
                    // like the post only if it is not already liked by the same user
                    addLike(req.body.postid, req.body.userid);
                    return res.json({ message: `postid: ${req.body.postid} liked by userid: ${req.body.userid}` });
                },
                    err => {
                        return res.json({ message: `Post has already been liked by user` });
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

// route to fetch the latest list of users liking the post of an user
router.get('/:userid', (req, res) => {
    if (req.params.userid === undefined) {
        res.status(400);
        res.json({ message: "Bad Request" });
    }
    else {
        checkValidUserId(req.params.userid).then(resolve => {
            fetchPostLikers(req.params.userid).then(data=>{
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