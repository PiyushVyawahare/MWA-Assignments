const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String, 
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    profile_pic: {
        type: String,
        required: true,
    }
},
{ timestamps: true }
);

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;