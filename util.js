// This file contains common utility functions that are accessed from other
// files in the app

const utilObj = {};

// Creates a flash message informing the user of any relevant info and
// redirects to the appropriate route
utilObj.flashMsg = (req, res, isSuccess, message, route) => {
	let outcome;

	if (isSuccess) {
		outcome = "success";
	} else {
		outcome = "error";
	}

	req.flash(outcome, message);
	res.redirect(route);
};

module.exports = utilObj;
