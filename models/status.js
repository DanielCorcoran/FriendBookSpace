const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
    author: String,
    status: String,
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Status", statusSchema);