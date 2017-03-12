var firebase = require("firebase-admin")
var database = firebase.database()


function changeUserStatus(userId, status) {
    database.ref("designers/" + userId).update({ status: status})
}


function getUser(userId) {
    database.ref("designers/" + userId).once("value").then(function (snapshot) {
        return snapshot.val()
    });
}


module.exports.changeUserStatus =  changeUserStatus
module.exports.getUser =  getUser

