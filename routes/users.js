/**
 * Created by LeshaReva on 3/10/17.
 */
var express = require('express');
var router = express.Router();
var firebase = require("firebase-admin");
var voucher_codes = require('voucher-code-generator');
var google = require('googleapis');
var request = require('request');
var database = firebase.database()




/* GET home page. */
router.get('/', function(req, res, next) {
    res.status(200).end();
});



router.post('/create', function (req, res, next) {

    if(req.body["code"] !== 'none') {
        console.log(req.body)
        getPromoInfo(req.body["code"], function (result) {
            if(result.success === true) {
                req.body.topMan = result.topMan
                createUser(req.body, function (result) {
                    if (result.success === true) {
                        activatePromo(result.userId, req.body["code"])
                        res.status(200).jsonp({success: true, message: "Пользователь создан"})
                    } else {
                        res.status(404).jsonp({success: false, message: "Пользователь не создан"})
                    }
                })
            } else {
                res.status(403).jsonp({success: false, message: "Нет такого промо-кода"})
            }
        })

    } else {
        createUser(req.body, function (result) {
            if (result.success)
                res.status(200).jsonp({success: true, message: "Пользователь создан"})
            else
                res.status(404).jsonp({success: false, message: "Что-то пошло не так"})
        })
    }


});




router.get('/promo', function (req, res, next) {

});


function getPromoInfo(code, callback) {
        var char = code.substring(0, 1);
        if (char === "P") {
            //lets check who is author
            getTopMan(code, "prime", function (result) {
                if(result !== 'none') {
                   return callback({success: true, topMan: result})
                } else {
                    return callback({success: false, message: "Нет такого кода или он занят"})
                }
            })
        } else if (char === "M") {
            console.log("this is second promo")
            res.status(403).jsonp({success: false, message: "Нет такого кода или он занят"})
            //lets check this promo
        }
}


router.post('/promo/check', function (req, res, next) {

    if(req.body["userId"]) {
        getUser('client', req.body["userId"], function (user) {
            if (user.success !== false) {
                if(user.topMan) {
                    res.status(403).jsonp({success: false, message: "Вы уже использовали такой тип промо-кода"})
                } else {
                    getPromoInfo(req.body["code"], function (result) {
                        if(result.success === true && result.topMan !== req.body["userId"]) {
                            updateUser('client', req.body["userId"], {topMan: result.topMan}, function (result) {
                                if (result.success) {
                                    activatePromo(req.body["userId"], req.body["code"])
                                    res.status(200).jsonp({success: true, message: 'Промо код успешно активирован'})
                                } else {
                                    res.status(404).jsonp({success: false})
                                }

                            })
                        } else {
                            res.status(404).jsonp({success: false, message: 'Промо не действителен'})
                        }

                    })
                }
            } else {
                res.status(404).jsonp({success: false})
            }

        })
    } else {
        getPromoInfo(req.body["code"], function (result) {
            if(result.success === true)
                res.status(200).jsonp({success: true })
            else
                res.status(403).jsonp({success: false, message: "Промокод не действителен"  })
        })
    }


});


router.post('/get', function (req, res, next) {
    //parameters: type = designer/client, userId
    //response: user
    if(req.body.type === 'client' || req.body.type === 'designer') {
        getUser(req.body['type'], req.body['userId'], function (user) {
            res.status(200).jsonp(user)
        })
    } else {
        res.status(404).jsonp({success: false, message: "Не указан тип пользователя"})
    }

});

router.post('/update', function (req, res, next) {
   //params: type, userId, params
    if(req.body.type && req.body.userId && req.body.params) {
        updateUser(req.body.type, req.body.userId, req.body.params, function (result) {
            if(result.success === true)
                res.status(200).jsonp({success: true})
            else
                res.status(404).jsonp({success: false})
        })
    } else {
        res.status(404).jsonp({success: false})
    }

});


function getUser(type, userId, callback) {
    database.ref(type + "s/" + userId).once('value', function (snapshot) {
        if(snapshot.val()) {
            var user = snapshot.val()
            return callback(user)
        } else {
            return callback({success: false, message: "Нет такого пользователя"})
        }
    })
}

function updateUser(type, userId, obj, callback) {
    database.ref(type + "s/" + userId).update(obj).then(function () {
        return callback({success: true})
    })
}


function getTopMan(code, kind, callback) {

    database.ref("promo/" + kind + "/" + code).once("value", function (snapshot) {
        if(snapshot.val() === null || snapshot.val() === 'free') {
            console.log("its not promo")
            return callback("none")
        } else {
            return callback(snapshot.val())
        }


    })
}



function serchFreePromo(callback) {
    var count = 0
    var ref = database.ref("promo/prime/")
    ref.on("child_added", function (snapshot) {
        if (snapshot.val() === 'free') {
            if (count == 0) {
                count++;
                console.log(snapshot.key)
                var value = {}
                value[snapshot.key] = 'busy'
                ref.update(value).then(function() {
                    generatePromo("prime", "P1")
                    return callback(snapshot.key)
                })
            } else {
                ref.off()
            }
        }
    })
}



function activatePromo(userId, code) {


    var ref = database.ref("clients/" + userId)
    ref.once("value", function (snapshot) {
            var amount = 500
            var newSum = +snapshot.val().sum + +amount
            updateUser('client', userId, { sum: Math.round(newSum) }, function (result) {
                console.log(result)
            })
    })
}


function generatePromo(kind, prefix) {
    var code = voucher_codes.generate({
        length: 4,
        count: 1,
        charset: voucher_codes.charset("alphabetic"),
        prefix: prefix
    })
    var value = {}
    value[code[0]] = 'free'
    database.ref('promo/' + kind).update(value)
}






function createUser(user, callback) {

    serchFreePromo(function (code) {
        user.code = code
        connectPromoToUser(code, user.id)
        createUserFolder(user.company, user.id, function (result) {
            user.conceptUrl = result
            user.sum = +user.sum
            user.rate = +user.rate
            database.ref('clients/' + user.id).update(user).then(function () {
                sendEmailToAdmin(user)
                return callback({ success: true, userId: user.id})
            }).catch(function (err) {
                console.log(err)
                return callback({ success: false })
            })

        })

    })


}


function connectPromoToUser(code, userId) {
    var value = {}
    value[code] = userId
    database.ref('promo/prime').update(value)
}

function sendEmailToAdmin(user) {

    var body = "Новый клиент в приложении " +
            "<br />Имя: " + user.firstName + " " + user.lastName +
            "<br />Телефон: " + user.phone +
            "<br />Почта: " + user.email

    var options = {
        url: 'http://leandesign.pro:8100/mail',
        form: { email: "leshareva.box@gmail.com", subject: 'Новый клиент в Лине', body: body }
    }

    request.post(options, function (error, response, body) {
        console.log(body)
    });
}


function createUserFolder(company, clientId, callback) {


    const CLIENT_ID = '441408687598-6u7kml2g469dgvbshhvqlg0sna1i7orq.apps.googleusercontent.com';
    const CLIENT_SECRET = 'GooltWZtbarnKtDza75QkYyJ';
    const REFRESH_TOKEN = '1/m_xMwlUd7wN2kxph0IzStegYMZ_OG_Dnr_CoQEU5vHk40ftc3JxCN-qo3gOnIw-E';
    const PARENT_FOLDER_ID = '0B5ifIe9z1t1nVWp1ZlZwVVZzMzg';
    const REDIRECT_URL = '';


    var OAuth2 = google.auth.OAuth2;
    var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    oauth2Client.setCredentials({
        refresh_token: REFRESH_TOKEN
    });


    google.options({
        auth: oauth2Client
    });

    var drive = google.drive({ version: 'v3', auth: oauth2Client });

    var fileMetadata = {
        'name': company,
        parents: [ PARENT_FOLDER_ID ],
        'mimeType': 'application/vnd.google-apps.folder'
    };

    drive.files.create({
        resource: fileMetadata,
        fields: 'id'
    }, function(err, file) {
        if(err) {
            // Handle error
            console.log(err);
        } else {
            var conceptMetadata = {
                'name': 'Макеты',
                parents: [ file.id ],
                'mimeType': 'application/vnd.google-apps.folder'
            };

            drive.files.create({
                resource: conceptMetadata,
                fields: 'id'
            }, function(err, file2) {
                if(err) {
                    console.log(err);
                    return callback("false")
                } else {
                    console.log('Folder is created. Id: ', file.id);
                    return callback(file.id)
                }
            })
        }
    });
}



module.exports = router;