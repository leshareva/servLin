/**
 * Created by LeshaReva on 3/11/17.
 */
var express = require('express');
var router = express.Router();
var firebase = require("firebase-admin");
var database = firebase.database()
var request = require('request');
var forEach = require('async-foreach').forEach;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200).end();
});


router.post('/create', function (req, res, next) {
    console.log(req.body)
//params: userId, text
//response: {success: true, message: "Задача создана", taskId: taskId}
    if(req.body.userId && req.body.text) {
        var taskId = database.ref("tasks/").push().key
        var value = {
            awareness: { status: 'none'},
            concept: { status: 'none'},
            design: { status: 'none'},
            sources: { status: 'none'},
            taskId: taskId,
            fromId: req.body.userId,
            status: 'none',
            text: req.body.text,
            timestamp: Math.round(new Date().getTime()/10),
            toId: 'designStudio'
        }

        updateTask(taskId, value, function (result) {
            if(result.success === true) {
                addToUserTasks(req.body.userId, "client", taskId, function (result) {
                    if (result.success) {
                        sendNotifications(taskId)
                    }

                })
                res.status(200).jsonp({success: true, message: "Задача создана", taskId: taskId})
            } else {
                res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
            }

        })
    } else {
        res.status(404).jsonp({success: false, message: "Нужно больше информации"})
    }
});


router.post('/remove', function (req, res, next) {
    //params: taskId
    //response: {success: true, message: "Задача удалена", taskId: taskId}
    if (req.body.taskId) {
        removeTask(req.body.taskId, function(result) {
            if(result.success)
                res.status(200).jsonp({success: true, message: "Задача удалена"})
            else
                res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
        })
    } else {
        res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
    }
});

router.post('/get', function (req, res, next) {
    //params: taskId
    if(req.body.taskId){
        getTask(req.body.taskId, function (task) {
            if(task !== null) {
                res.status(200).jsonp({success: true, task: task})
            } else {
                res.status(403).jsonp({success: false, message: "Нет такой задачи"})
            }
        })
    } else {
        res.status(404).jsonp({success: false, message: "wrong parameters"})
    }
});



router.post('/update', function (req, res, next) {
//params: taskId, status (awareness|awarenessApprove|price|priceApprove|concept|conceptApprove|), userId, price
//response: {success: true, message: "Задача создана", taskId: taskId}

    if (req.body.taskId && req.body.status) {
        updateTask(req.body.taskId, { status: req.body.status }, function (result) {
            if (result.success === true) {
                if(req.body.status === 'awareness') {
                    addToUserTasks(req.body.userId, "designer",req.body.taskId, function (result) {
                        if(result.success) {
                            database.ref("tasks/" + req.body.taskId).update({toId: req.body.userId})
                            database.ref("designers/" + req.body.userId + "/inbox/" + req.body.taskId).remove()
                            res.status(200).jsonp({success: true, message: "Задача обновлена"})
                        } else {
                            res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
                        }
                    })
                } else if(req.body.status === 'admin') {
                    getAdmin(function (result) {
                        if(result.success) {
                            var arr = []
                            arr.push(result.adminId)
                            sendToDesigner(arr, req.body.taskId)
                            res.status(200).jsonp({success: true, message: "Задача отправлена админу"})
                        } else {
                            res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
                        }

                    })
                } else if(req.body.status === 'priceApprove') {
                    updateTask(req.body.taskId, { price: req.body.price }, function (result) {
                        if(result.success) {
                            res.status(200).jsonp({success: true, message: "Задача отправлена админу"})
                        } else {
                            res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
                        }
                    })
                } else if(req.body.status === 'archive') {
                    archiveTask(req.body.taskId, function (result) {
                        if(result.success)
                            res.status(200).jsonp({success: true, message: "Задача сдана в архив"})
                        else
                            res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
                    })


                } else if(req.body.status === 'reject') {
                    rejectTask(req.body.taskId, function (result) {
                        if(result.success)
                            res.status(200).jsonp({success: true, message: "Задача сдана в архив"})
                        else
                            res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
                    })
                } else {
                    res.status(200).jsonp({success: true, message: "Задача обновлена"})
                }

            } else {
                res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
            }

        })

    } else {
        res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
    }

});



router.post('/get-price', function (req, res, next) {
    //params: { taskId, time }
    if(req.body.taskId && req.body.time) {
        getTask(req.body.taskId, function (task) {
            if(task !== null) {
                getPrice(req.body.time, task.fromId, task.toId, function (price) {
                    res.status(200).jsonp({success: true, price: price})
                })
            }
        })
    } else {
        res.status(404).jsonp({success: false, message: "Нужно больше информации"})
    }

});


function updateTask(taskId, obj, callback) {
    database.ref("tasks/" + taskId).update(obj).then(function (snapshot) {
        return callback({success: true})
    })
}

function removeTask(taskId, callback) {

    getTask(taskId, function (task) {
        database.ref("clients/" + task.fromId + "/activeTasks/" + taskId).remove()
        database.ref("designers/" + task.toId + "/activeTasks/" + taskId).remove()

        database.ref("user-tasks/" + task.fromId + "/" + taskId).remove()
        database.ref("user-tasks/" + task.toId + "/" + taskId).remove().then(function () {
            setTimeout(function () {
                updateTask(taskId, { status: 'reject'}, function (result) {
                    if(result.success)
                        return callback({ success: true })
                    else
                        return callback({ success: false })
                })
            }, 2000)

        }).catch(function (err) {
            console.log(err)
            return callback({ success: false })
        })
    })

}

function addToUserTasks(userId, userType, taskId, callback) {
    var value = {}
    value[taskId] = true

    database.ref(userType + "s/" + userId + "/activeTasks").update(value)
    database.ref("user-tasks/" + userId).update(value).then(function () {
        return callback({success: true})
    }).catch(function () {
        return callback({success: false})
    })
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


function getAdmin(callback) {
    database.ref("admins").once('child_added', function (snapshot) {
        console.log(snapshot.key)
        return callback({ adminId: snapshot.key, success: true })
    })
}


function getPrice(time, clientId, designerId, callback) {
    var hour;
    if (time <= 1)
        hour = 1000
    else if (time > 1 && time <= 3)
        hour = 1200
    else if (time > 3)
        hour = 1300

    console.log("the price of hour is " + hour)
    database.ref("clients/" + clientId).once("value").then(function(snapshot) {
        var clientRate = snapshot.val().rate
        database.ref("designers/" + designerId).once("value").then(function (snapshot) {
            var designerRate = snapshot.val().rate

            var price = +time * +hour * +clientRate * +designerRate
            var withPercent = price + (price * 0.09)
            var mathPrice = Math.round((withPercent * 10) / 10)

            return callback(mathPrice)
        })
    })

}



function archiveTask(taskId, callback) {
    updateTask(taskId, { status: "archive"}, function (result) {
        getTask(taskId, function (task) {
            if(task !== null) {
                database.ref("clients/" + task.fromId + "/activeTasks/" + taskId).remove()
                database.ref("designers/" + task.toId + "/activeTasks/" + taskId).remove()
                var value = {}
                value[taskId] = false
                database.ref("user-tasks/" + task.fromId).update(value)
                database.ref("user-tasks/" + task.toId).update(value)
                return callback({success: true})
            }
        })
    })
}


function rejectTask(taskId, callback) {
    updateTask(taskId, { status: "reject"}, function (result) {
        getTask(taskId, function (task) {
            if(task !== null) {
                console.log(task)
                database.ref("clients/" + task.fromId + "/activeTasks/" + taskId).remove()
                database.ref("designers/" + task.toId + "/activeTasks/" + taskId).remove()
                var value = {}
                value[taskId] = false
                database.ref("user-tasks/" + task.fromId).update(value)
                database.ref("user-tasks/" + task.toId).update(value)
                return callback({success: true})
            }
        })
    })
}

function getTask(taskId, callback) {
    database.ref("tasks/" + taskId).once("value", function (snapshot) {
        if(snapshot.val())
            return callback(snapshot.val())
        else
            return callback(null)
    })
}


module.exports = router;