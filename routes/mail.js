/**
 * Created by LeshaReva on 3/11/17.
 */
var express = require('express');
var router = express.Router();

var request = require('request');


const nodemailer = require('nodemailer')
const config = require('./config')
const xoauth2 = require('xoauth2')

var generator = require('xoauth2').createXOAuth2Generator({
    user: config.mailUser,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken: config.refreshToken,
    accessToken: config.accessToken
});

generator.on('token', function (token) {
    console.log('New token for %s: %s', token.user, token.accessToken);
});


var mailTransport = nodemailer.createTransport( {
    service: 'Gmail',
    auth: {
        user: 'leandesign.box@gmail.com',
        pass: 'Leandesign22',
        xoauth2:generator
    },
    debug: true
});


router.post('/', function (req, res, next) {
    //Parameters: email, subject, body
    console.log(req.body)
    if(req.body["email"]) {
        var mailOptions = {
            from: ''+config.mailUser+'', // sender address
            to: req.body['email'], // list of receivers
            subject: req.body['subject'], // plaintext body
            html: req.body['body'] // html body
        };

        mailTransport.on('log', console.log);

        mailTransport.sendMail( mailOptions, function (err,info) {
            if (err) {
                console.log('Unable to send email: ' + err);
            } else {
                console.log("Mail enviado" + info.response);
                mailTransport.close();
                res.status(200).jsonp({success: true});
            }
        })
    }

});





module.exports = router;