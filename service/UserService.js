"use strict";
const db = require("../db/db-config");
const User = db.user;
const Op = db.Sequelize.Op;


exports.createUser = function (newUser) {
    const user = new User(newUser);
    return user.save();
}

exports.updateUser = function (updatedUser) {
    const user = new User(updatedUser);
    return User.update(user, {
        where: {
            email: updatedUser.email
        }
    });
}