/**
 * Created by LeshaReva on 3/10/17.
 */
var express = require('express');
var router = express.Router();
var firebase = require("firebase-admin");
var request = require('request');
var database = firebase.database()
var config = require("./config");

/* GET home page. */
router.get('/', function(req, res, next) {

    var orderId = Math.round(new Date().getTime()/1000)
    database.ref("orders/" + orderId).update({ amount: +req.query.amount, clientId: req.query.userId }).then(function() {
        res.render('pay', {title: 'Оплата покупки', descript: "Пополнение счета в системе Лин-дизайн", amount: req.query.amount, orderId: orderId, terminalKey: config.terminalKey})
    })

});


router.post('/submit', function (req, res, next) {
    //parameters: OrderId
    //response: 200
        checkOrder(req.body.OrderId, function (order) {
            updateUserAmount(order.clientId, order.amount, function () {
                res.status(200).send('OK');
            })
        })
});



router.post('/createOrder', function (req, res, next) {
//parameters: userId, amount
//response orderId
        console.log(req.body)
        var orderId = Math.round(new Date().getTime()/1000)
        database.ref("orders/" + orderId).update({ amount: +req.body.amount, clientId: req.body.userId }).then(function() {
            res.status(200).jsonp({success: true, OrderId: orderId})
        })


});



function checkOrder(orderId, callback) {
    var ref = database.ref("orders/" + orderId)
    ref.once("value", function (snapshot) {
        if(snapshot.val()) {
            ref.update({status: 'paid'}).then(function () {
                return callback(snapshot.val())
            })
        }
    })
}

function updateUserAmount(userId, amount, callback) {
    var ref = database.ref("clients/" + userId)
    ref.once("value", function (snapshot) {
        if(snapshot.val().sum) {
            var newSum = Math.round(+snapshot.val().sum + +amount)
            ref.update({ sum: newSum}).then(function() {
                return callback()
            })
        }

    })
}

module.exports = router;