var userService = require("./user.service");
var firebase = require("firebase-admin")
var database = firebase.database()


function changeTaskStatus(taskId, status) {
    var database = firebase.database()
    database.ref("tasks/" + taskId).update({ status: status})
}

function closeTask(taskId) {
    var database = firebase.database()
    database.ref("tasks/" + taskId).update({ status: "archive"})

    database.ref("tasks/" + taskId).once("value", function (snapshot) {
        var designerId = snapshot.val().toId
        var clientId = snapshot.val().fromId
    
        //remove from active tasks
        database.ref("designers/" + designerId + "/activeTasks/" + taskId).remove()
        database.ref("clients/" + clientId + "/activeTasks/" + taskId).remove()

        //add to archive
        var value = {};
        value[taskId] = 1;
        database.ref("user-tasks/" + designerId).update(value);
        database.ref("user-tasks/" + clientId).update(value);

        // checkUserWorkload(designerId)
    })


}

function checkUserWorkload(userId) {
    database.ref("designers/" + userId + "/activeTasks").once("value")
        .then(function(snapshot) {
            var count = snapshot.numChildren();
            console.log("this designer have: " + count + " tasks")
            if(count < 2) {
                userService.changeUserStatus(userId, "free")
            }

        });
}


function acceptTask(res, taskId, userId) {

    database.ref("designers/" + userId + "/inbox/" + taskId).remove()

    //check task's status
    database.ref("tasks/" + taskId).once("value", function (snapshot) {

        if (snapshot.val().status !== "reject") {
            //get User Info
            database.ref("designers/" + userId).once("value", function (snap) {
                var photoUrl = snap.val().photoUrl

                database.ref("tasks/" + taskId).update({
                    awareness: { status: "none" },
                    concept: { status: "none" },
                    design: { status: "none" },
                    imageUrl: photoUrl,
                    status: "awareness",
                    toId: userId
                })
            })

            //add task to designer's actives
            let value = {}
            value[taskId] = 1
            database.ref("designers/" + userId + "/activeTasks/" ).update(value)

            res.send({ taskId: taskId, status: "ACCEPTED"})

            //set user status
            database.ref("designers/" + userId + "/activeTasks").once("value")
                .then(function(snapshot) {
                    var count = snapshot.numChildren();
                    console.log("this designer have: " + count + " tasks")
                    // if (count <= 2) {
                    //     userService.changeUserStatus(userId, "free")
                    // } else {
                    //     userService.changeUserStatus(userId, "busy")
                    // }
                });
        } else {
            console.log("The task was canceled")
            res.send({ taskId: taskId, status: "CANCELED"})
        }
    })


}


function rejectTask(res, taskId) {
    var taskRef = database.ref("tasks/" + taskId)
    taskRef.once("value", function (snapshot) {
        var userId = snapshot.val().fromId
        var designerId = snapshot.val().toId
        database.ref("user-tasks/" + userId).update(value)
        database.ref("clients/" + userId + "/activeTasks/" + taskId).remove()
        taskRef.update({ status: "reject" })

        var value = {}
        value[taskId] = 1

        if (designerId !== "designStudio") {
            database.ref("designers/" + designerId + "/activeTasks/" + taskId).remove()
            database.ref("user-tasks/" + designerId).update(value)
            checkUserWorkload(designerId)
        }
    })

    res.status(200).send({ taskId: taskId, status: "CANCELED"});
}


module.exports.changeTaskStatus =  changeTaskStatus
module.exports.closeTask = closeTask
module.exports.acceptTask = acceptTask
module.exports.rejectTask = rejectTask

