var express = require('express');
var router = express.Router();
var firebaseConfig = require("./firebaseConfig");
var firebase = require("firebase-admin")
var newTask = require("./modules/newTask")
var moneyCtrl = require("./modules/moneyCtrl")
var newClient = require("./modules/new-client")
var taskService = require("./task.service")
var pushServer = require("./modules/push-server")
var fs = require('fs');
var path = require('path');
var busboy = require('connect-busboy');
var asyncBusboy = require('async-busboy');
var querystring = require('querystring');
var schedule = require('node-schedule');
var saveToGDrive = require("./modules/saveToGDrive");


var database = firebase.database();

var nconf = require('nconf');
var url = require('url');
var request = require('request');
var authorization = require('auth-header');

var jsdom = require("jsdom");


nconf.env();
nconf.file({ file: 'config.json' });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Lesha Reva', condition: true, anyArray: [1,2,3] });
});



router.get('/awareness', function (req,res, next) {

    database.ref('tasks/' + req.query.taskId + '/awareness').once('value', function (snapshot) {
        var text = snapshot.val().text
        // console.log(text)
        // var text = converHTML(snapshot.val().text)
        res.render('awareness', { text: String(text)});

    })


});



/* GET home page. */
router.get('/file-request/', function(req, res, next) {
    var id = req.query.id;

    database.ref('clients/' + id).once('value', function (snapshot) {
        var name = snapshot.val().name
        var ownerPhone = snapshot.val().name
        res.render('new-file', { title: 'Запрос файлов', id: id, name: name, owner: ownerPhone });
    })

});



router.post('/newclient', function(req, res, next) {
    newClient.newClientWelcome(req.body, res)
});



router.get('/pay', function (req, res, next)  {
  res.render('pay', {title: 'Оплата покупки', descript: "Пополнение счета в системе Лин-дизайн", amount: req.query.amount, orderId: req.query.orderId, name: req.query.name, phone: req.query.phone, email: req.query.email})
});


router.post('/requestBill', function (req, res, next) {
    moneyCtrl.requestBill(res, req.body.clientId, req.body.amount, req.body.inn, req.body.company)
})

router.post('/workdone', function (req, res, next) {
    moneyCtrl.sendBills(res, req.body.taskId)
})

router.post('/pay/submit', function (req, res, next) {
    //we get new order from client
    moneyCtrl.sendOrderToDb(req);
    res.status(200).send('OK');
});

// router.post('/tasks', function (req, res, next) {
//
//     if(req.body.subject === "acceptTask") {
//         taskService.acceptTask(res, req.body.taskId, req.body.userId)
//     } else if (req.body.subject === "reject") {
//         taskService.rejectTask(res, req.body.taskId)
//     }
// });


router.post('/newtask', function (req, res, next) {
    console.log(req.body)
    newTask.sendTaskToDesigners(req, res)
});



router.post('/sendMessage', function (req, res, next) {

    var values = {
        fromId: req.body.fromId,
        taskId: req.body.taskId,
        toId: req.body.toId,
        timestamp: req.body.timestamp
    }

    if (req.body.text !== null)
        values["text"] = req.body.text
    else if (req.body.imageUrl !== null) {
        values["imageUrl"] = req.body.imageUrl
        values["imageHeight"] = req.body.imageHeight
        values["imageWidth"] = req.body.imageWidth
    }
    console.log(values)

    var messageKey = firebase.database().ref("messages").push(values).key
    let messVal = {};
    messVal[messageKey] = 1;
    firebase.database().ref('task-messages/' + req.body.taskId).update(messVal);

    firebase.database().ref(req.body.role + '/' + req.body.toId + "/unread/" + req.body.taskId).update(messVal)

    pushServer.sendPush(req.body.toId, "Новое сообщение", req.body.text, req.body.taskId)

    res.status(200).send({ status: "success"})
});

router.post('/getprice', function (req, res, next) {
        //send this task to admin
        database.ref("admins").once("child_added", function (snapshot) {
            console.log(snapshot.key)
            var adminId = snapshot.key
            var value = {
                message: "highPrice",
                taskId: req.body.taskId
            }
            database.ref("designers/" + adminId + '/inbox/' + req.body.taskId).update(value)
            pushServer.sendPush(adminId, "Задача за пределами лина", "Задача за пределами лина", req.body.taskId)
        })
});

router.post('/highprice', function (req, res, next) {
    moneyCtrl.countPrice(res, req.body.time, req.body.taskId)
    pushServer.sendPush(req.body.toId, "Согласуйте цену", "Согласуйте оценку", req.body.taskId)
})




router.post('/closeTask', function (req, res, next) {
    taskService.closeTask(req.body.taskId)
})



router.post('/push', function (req, res, next) {
    console.log("new push: ", req.body)
    if(req.body.taskId) {
        pushServer.sendPush(req.body.userId, "Уведомление", req.body.message, req.body.taskId)
    } else {
        pushServer.sendPush(req.body.userId, "Уведомление", req.body.message)
    }
    res.status(200).send({ status: "success"})
    res.end()
})


router.post('/awareness', function (req, res, next) {
    var taskId = req.body.taskId
    var ref = firebase.database().ref('tasks/' + taskId + "/awareness")
    ref.update({
        text: req.body.text,
        status: "unread"
    })

    firebase.database().ref('tasks/' + taskId).update({status: "awarenessApprove"})
    pushServer.sendPush(req.body.toId, "Понимание задачи", "Согласуйте понимание задачи", taskId)
    res.status(200).send({ status: "success"})
    res.end()
})



router.post('/saveSources', function(req, res) {

    asyncBusboy(req).then(function(formData) {
        console.log(formData)
        const files = formData.files

        for(i = 0; file = files[i]; i++) {
            //let's get file
            var taskId = formData.fields.taskId
            var fileId = formData.fields.fileId
            const filename = file.filename
            var saveTo = path.join('', path.basename(filename));
            file.pipe(fs.createWriteStream(saveTo));

            firebase.database().ref("tasks/" + taskId).once("value", function (snapshot) {
                var clientId = snapshot.val().fromId
                saveToGDrive.saveImageToDrive(filename, clientId, fileId);
            })

        }

        res.status(200).send('Success');
    });
});

router.post('/saveFiles', function(req, res) {

    asyncBusboy(req).then(function(formData) {
        const files = formData.files
        for(i=0; file = files[i]; i++) {

            const filename = file.filename
            const userId = formData.fields["userId"]

            console.log(userId)
            var saveTo = path.join('', path.basename(filename));
            file.pipe(fs.createWriteStream(saveTo));

            var values = {
                name: filename,
                timestamp: Math.floor(Date.now() / 1000)
            }

            var fileId = database.ref("files").push(values).key

            var fileVal = {}
            fileVal[fileId] = 1
            firebase.database().ref("userFiles/" + userId).update(fileVal)

            saveToGDrive.saveImageToDrive(filename, userId, fileId)

        }

        res.status(200).send("Success")
        res.end()
    })
})

router.post('/sign-up', function(req, res) {

    var userId = req.body.id
    //save user's data in db
    firebase.database().ref("designers/" + userId).update(req.body)

    //subscribe him on lectures
    var value = {}
    value[userId] = 1
    firebase.database().ref("environment/subscribers/").update(value)
    firebase.database().ref("environment/userLectures/" + userId).update({0: 0})

    res.status(200).send({ status: "Success"})
    res.end()
});

router.post('/homework', function(req, res) {
    console.log(req.body.week, req.body.userId)

    //week, userId
    database.ref("environment/lectures").orderByChild("week").equalTo(req.body.week).once("child_added", function (snapshot) {
        var lectureKey = snapshot.key
        let value = {}
        value[lectureKey] = 1
        database.ref("environment/userLectures/" + req.body.userId).update(value)
    })

})



router.post('/activateUser', function (req, res) {
    var userId = req.body.userId

    database.ref("designers/" + userId).update( { status: "study" } )

    database.ref("environment/userLectures/" + userId).once("value", function (snapshot) {
        var nextWeek = snapshot.numChildren()

        for(var i = nextWeek; i < 10; i++) {
            var value = {}
            value[i] = 1
            database.ref("environment/userLectures/" + userId).update(value)
        }


    })
})



router.post('/digits', function (req, res) {
    var apiUrl = req.body['apiUrl']
    var credentials = req.body['credentials']
    var verified = true;
    var messages = [];

    // Get authorization header.
    var auth = authorization.parse(credentials);

    // OAuth authentication not provided.
    if (auth.scheme != 'OAuth') {
        verified = false;
        messages.push('Invalid auth type.');
    }

    var subKey = nconf.get('DIGITS_CONSUMER_KEY')
    console.log(auth.params.oauth_consumer_key, subKey)
    // Verify the OAuth consumer key.
    // if (auth.params.oauth_consumer_key != nconf.get('DIGITS_CONSUMER_KEY')) {
    if (auth.params.oauth_consumer_key != '6Cn2E0dGAsOMd7417DrM2AG1r') {
        verified = false;
        messages.push('The Digits API key does not match.');
    }

    // Verify the hostname.
    var hostname = url.parse(req.body.apiUrl).hostname;
    if (hostname != 'api.digits.com' && hostname != 'api.twitter.com') {
        verified = false;
        messages.push('Invalid API hostname.');
    }

    // Do not perform the request if the API key or hostname are not verified.
    if (!verified) {
        return res.send({
            phoneNumber: "",
            userID: "",
            error: messages.join(' ')
        });
    }

    // Prepare the request to the Digits API.
    var options = {
        url: apiUrl,
        headers: {
            'Authorization': credentials
        }
    };

    // Perform the request to the Digits API.
    request.get(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Send the verified phone number and Digits user ID.
            var digits = JSON.parse(body)
            return res.send({
                phoneNumber: digits.phone_number,
                userID: digits.id_str,
                error: ''
            });
        } else {
            // Send the error.
            return res.send({
                phoneNumber: '',
                userID: '',
                error: error.message
            });
        }
    });
});

router.post('/get-user', function (req, res) {
    var userId = req.body.userId
    console.log(userId)
    database.ref("clients/" + userId).once('value', function (snapshot) {
        if(snapshot.val()) {
            res.status(200).send({ user: snapshot.val() })
            res.end()
        } else {
            res.status(400).send({ error: "no such users" })
        }

    })

})





module.exports = router;
