const mongoose = require("mongoose"),
      Status = require("./models/status"),
      Comment   = require("./models/comment");
 
const data = [
    {
        author: "Steve",
        status: "Doing things"
    },
    {
        author: "Jake",
        status: "Enjoying the great weather"
    },
    {
        author: "Jess",
        status: "Dig up! - Albert Einstein"
    }
]
 
function seedDB(){
   Status.deleteMany({}, (err) => {
        if (err) {
            console.log(err);
        }
        console.log("removed statuses!");
        Comment.deleteMany({}, (err) => {
            if (err) {
                console.log(err);
            }
            console.log("removed comments!");
            data.forEach((seed) => {
                Status.create(seed, (err, status) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("added a status");
                        Comment.create(
                            {
                                text: "I totally agree, LOL",
                                author: "Stephanie"
                            }, (err, comment) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    status.comments.push(comment);
                                    status.save();
                                    console.log("Created new comment");
                                }
                            });
                    }
                });
            });
        });
    }); 
}
 
module.exports = seedDB;