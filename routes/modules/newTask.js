var firebase = require("firebase-admin")
var database = firebase.database()
var forEach = require('async-foreach').forEach;
var pushServer = require("./push-server")
var newClient = require("./new-client")
var mailer = require('./mailer');


var adminEmail = "leshareva.box@gmail.com"


module.exports = {

    sendTaskToDesigners: function(req, res){
        var clientId = req.body.fromId
        var taskId = database.ref("tasks/").push(req.body).key
        database.ref("tasks/" + taskId).update({taskId: taskId}).then(function () {

            addTaskToClient(clientId, taskId);
            sendTaskToAdmin(taskId);
            sendNotifications(taskId);

            if (clientId === 'webSite') {
                sendMailToAdmins(req.body.phone)
                createTempClient(req.body.phone)
                //     checkPhone(phone, function (result) {})
            } else {
                sendMailAboutTask(clientId)
            }
            res.status(200).send({ taskId: taskId})

        })

    }

}


function createTempClient(phone) {
    var tmpId = database.ref("clients").push().key
    var client = {
        phone: phone,
        rate: 0.6,
        id: "tmp" + tmpId,
        firstName: "Клиент из формы",
        photoUrl: "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg",
        sum: 0
    }

    database.ref("clients/tmp" + tmpId).update(client).then(function () {
            database.ref('tasks/' + taskId).update({ fromId: "tmp" + tmpId}).then(function () {
                newClient.createFolder("temp", "tmp" + tmpId)
            })
        }
    )
}


function addTaskToClient(clientId, taskId) {
    var taskValue = {}
    taskValue[taskId] = 1
    database.ref("clients/" + clientId + "/activeTasks").update(taskValue)
}


function sendNotifications(taskId) {
    i = 0;
    var allDesigners = []

    //get array of all free designers
    var freeRef = database.ref("designers").orderByChild('status').equalTo("free")
    freeRef.on("child_added", function (snapshot) {
        allDesigners.push(snapshot.key)
        sendToDesigner(allDesigners, taskId)
        freeRef.off()
    })
}


function sendToDesigner(designers, taskId) {
    //get first element from array

    forEach(designers, function (userId) {
        var value = {};
        value[taskId] = 1;
        // pushServer.sendPush(userId, "Новая задача", "Новая задача в Лине", taskId)
        var inbox = database.ref("designers/" + userId + "/inbox")
        inbox.update(value)
    })
}


function sendTaskToAdmin(taskId) {
    database.ref("admins").once("child_added", function (snapshot) {
        var adminId = snapshot.key
        var value = {}
        value[taskId] = 1
        database.ref("designers/" + adminId + "/inbox").update(value)
        // adminRef.off()
    })
}

function sendMailToAdmins(phone) {
    var title = "ЛИД в Лин дизайне";
    var date = new Date()
    var body = "Новая задача с формы на сайте. Телефон клиента: " + phone +
        '<br />Время: ' + date;
    mailer.sendMailToClient(adminEmail, title, body)
}


function sendMailAboutTask(clientId) {
    database.ref("clients/" + clientId).once('value', function (snap) {
        var title = "Новая задача в Лин дизайне";
        var date = new Date()
        var body = 'Новая задача. Клиент есть в системе: ' +
            '<br />Телефон: ' + snap.val().phone +
            '<br />Компания: ' + snap.val().company +
            '<br />Имя: ' + snap.val().firstName +
            '<br />Время: ' + date

        mailer.sendMailToClient(adminEmail, title, body)
    })
}



function checkPhone(phone, callback) {
    database.ref("clients").orderByChild('phone').equalTo(phone).limitToFirst(1).on('value', function (snapshot) {
        var trigger = snapshot.numChildren() > 0;
        console.log(snapshot.numChildren())
        return callback(trigger);
    });
}


function checkPhoneNumber(phone, taskId) {
    database.ref("clients").orderByChild('phone').equalTo(phone).limitToFirst(1).once('value', function (snapshot) {



        if (snapshot.numChildren() > 0) {

            var clientId = snap.key
            database.ref('tasks/' + taskId).update({ fromId: clientId})

            addTaskToClient(clientId, taskId,  function () {
                sendTaskToAdmin(taskId, function () {
                    sendMailAboutTask(clientId)
                })
                sendNotifications(taskId, function () {
                    return true;
                })
            })



        } else {
            console.log("this is new phone number")


        }

    })
}


function getFavoritesDesigners() {
    //now try to get favorites designers
    setTimeout(function () {
        database.ref("clients/" + clientId + '/favorites').once("value")
            .then(function(snapshot) {
                var count = snapshot.numChildren();
                console.log("Before ", allDesigners)
                if (count > 0) {
                    console.log("we have fav")
                    var favKeys = Object.keys(snapshot.val())
                    forEach(favKeys, function (favId) {
                        var index = allDesigners.indexOf(favId)

                        if((index != -1)) {
                            allDesigners.splice(index,1)
                            allDesigners.unshift(favId)
                        };

                    }, sendToDesigner(allDesigners));

                } else {
                    console.log("we dont have fav")
                    sendToDesigner(allDesigners)
                }
            });
    }, 0)
}