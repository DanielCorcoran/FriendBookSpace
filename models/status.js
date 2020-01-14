const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema(
	{
		text: String,
		author: {
			id: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "User"
			},
			username: String
		},
		comments: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Comment"
			}
		]
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Status", statusSchema);
