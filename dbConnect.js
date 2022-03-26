const sqlite3 = require("sqlite3").verbose();

module.exports = {
    // connecting to the DB
    connect: ()=>{
        return new sqlite3.Database('./social.db', err => {
            if (err) {
                return console.error(err.message);
            }
            // console.log("Successful connection to the database 'social.db'");
        });
    }
}