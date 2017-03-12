var firebase = require("firebase-admin")
var database = firebase.database()
var pushServer = require("./push-server")
var taskServices = require("../task.service");
var http = require("http");

module.exports = {

    countPrice: function(res, time, taskId){
        var hourCost = getHourPrice(time)

        var taskRef =  database.ref("tasks/" + taskId)

        taskRef.once("value", function (snapshot) {
            var clientId = snapshot.val().fromId
            var designerId = snapshot.val().toId

            database.ref("clients/" + clientId).once("value", function (snap) {
                var clientRate = snap.val().rate

                database.ref("designers/" + designerId).once("value", function (snap) {
                    var designerRate = snap.val().rate

                    var price = +time * +hourCost * +clientRate * +designerRate
                    var withPercent = price + (price * 0.09)
                    var mathPrice = Math.round(withPercent * 10) / 10
                    console.log("price of task: ", mathPrice)
                    taskRef.update({ price: Math.round(mathPrice), status: "priceApprove", time: +time})
                    pushServer.sendPush(clientId, "Согласуйте цену", "Согласуйте оценку", taskId)
                })
            })
        })

        res.send({ ok: "ok"})
    }



}

function getHourPrice(time) {

    var hourCost;
    // 0.5, 1, 2.5, 3.5
    if (time <= 1) {
        hourCost = 1000
    } if (time > 1 && time <= 3) {
        hourCost = 1200
    } else if (time > 3) {
        hourCost = 2000
    }

    return hourCost
}

function sendBills (res, taskId) {
    var taskRef = database.ref("tasks/" + taskId)
    taskRef.once("value", function (snapshot) {
        var status = snapshot.val().status
        var price = snapshot.val().price
        var clientId = snapshot.val().fromId
        var designerId = snapshot.val().toId
        var newStatus;
        var bill = "";
        var time = snapshot.val().time
        var stage = "";
        var percent = "";

        //set percents
        if (time <= 1) {
            percent = 0.2
        } else if (time > 1 && time <= 6) {
            percent = 0.3
        } else if (time > 6 && time <= 12) {
            percent = 0.4
        }


        if(status === "priceApprove") {
            bill = Math.round(+price * 0.1)

            //change task's status
            taskRef.update({status: "concept"})
            stage = "понимание задачи"
        } else if (status === "conceptApprove") {
            bill = Math.round(+price  * 0.5)
            taskRef.update({status: "design"})
            stage = "черновик"
        } else if (status === "designApprove") {
            bill = Math.round(+price * 0.4)
            taskRef.update({status: "sources"})
            stage = "чистовик"
        }


        //refresh client sum
        var clientRef = database.ref("clients/" + clientId)
        clientRef.once("value", function (snapshot) {
            var oldSum = snapshot.val().sum
            var newSum = Number(oldSum) - Math.round(bill)
            var timestamp = + new Date()

            clientRef.update({ sum: Math.round(newSum) })
            clientRef.child("inbox").child(taskId).update({
                bill: Math.round(bill),
                stage: stage
            })
            database.ref("bills/" + clientId).push({ amount: Math.round(bill), taskId: taskId, status: status, timestamp: timestamp })
            var pushMessage = "С вашего счета списано " + String(Math.round(bill)) + ' рублей'
            pushServer.sendPush(clientId, "С вашего счета списана сумма", pushMessage, taskId)
        })

        //рассчитываем дизайнера если это чистовики.
        if (status === "designApprove") {
            //pay for designer
            var designerRef = database.ref("designers/" + designerId)
            designerRef.once("value", function (snapshot) {
                var oldSum = snapshot.val().sum
                var designerBill = Math.round(price) - (Math.round(price) * percent)
                var newSum = Number(oldSum) + Math.round(designerBill)
                designerRef.update({ sum: Math.round(newSum) })
            })

            //pay for topMan
            clientRef.once("value", function (snapshot) {
                var topManId = snapshot.val().topMan
                console.log("topManId " + topManId)
                var topRef = database.ref("clients/" + topManId)
                topRef.once("value", function (snapshot) {
                    var oldSum = snapshot.val().sum
                    var countSum = Number(price) * 0.1
                    var newSum = Math.round(oldSum) + Math.round(countSum)
                    topRef.update({sum: newSum})
                    var pushMessage = "Вы заработали " + String(Math.round(countSum)) + ' рублей'
                    pushServer.sendPush(topManId, "Счет пополнен", pushMessage)
                })
            })

        }




        checkFirstOrder(clientId)

        res.send({ bill: Math.round(bill) })
    })
}


function checkFirstOrder(clientId) {

    database.ref("firstOrder").once("value", function (snapshot) {
        if (snapshot.hasChild(clientId)) {
            console.log("this is first order")
            database.ref("firstOrder/" + clientId).remove()
        } else {
            console.log("this is not first order")
        }

    })

}


function sendOrderToDb(req) {

    var database = firebase.database()
    var orderId = req.body.OrderId

    checkIfOrderExists(orderId);

    function orderExistsCallback(orderId, exists) {
        if (exists) {
            console.log('order ' + orderId + ' is exist!');

            database.ref("orders/" + orderId).once("value", function (snapshot) {
                var clientId = snapshot.val().clientId
                var count = clientId.substring(0, 3)
                var taskId = snapshot.val().taskId

                if(taskId && count === 'tmp') {
                    var taskRef = database.ref('tasks/' + taskId)
                    taskRef.update({ status: "concept"})

                    taskRef.once('value', function (snapshot) {
                        var designerId = snapshot.val().toId
                        pushServer.sendPush(designerId, "Клиент оплатил", "Клиент согласовал оценку, начинаем работу", taskId)
                    })

                }

                var amount = snapshot.val().amount

                var clientRef = database.ref("clients/" + clientId)
                clientRef.once("value", function(snap) {
                    var oldSum = Number(snap.val().sum)
                    var newSum = oldSum + Number(amount)

                    clientRef.update({"sum": newSum})
                })


                let delref = database.ref("orders/" + orderId);
                delref.remove();

            })
        } else {
            console.log('order ' + orderId + ' does not exist!');
        }
    }




    function checkIfOrderExists(orderId) {
        database.ref("orders/" + orderId).once("value", function (snapshot) {
            var exists = (snapshot.val() !== null);
            orderExistsCallback(orderId, exists);
        });
    }




}


function requestBill(res, clientId, amount, inn, company) {
   var userRef = database.ref("clients/" + clientId)
    userRef.update({ inn: inn, fullCompany: company})

    userRef.once("value", function (snapshot) {
        var email = snapshot.val().email
        var mailer = require("./mailer")
        var mailBody = "Нужно выставить счет на " + amount + " для этой компании: " + company + " " + inn
        mailer.sendMail("684092@gmail.com", mailBody, "Лин-дизайн. Выставить счет")

        res.send({status: "success"})
        res.end()

    })



}


module.exports.requestBill = requestBill
module.exports.sendBills = sendBills
module.exports.sendOrderToDb = sendOrderToDb



