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

module.exports =  {
    // send mail with defined transport object

    sendMailToClient: function(receivers, subject, body) {
        var mailOptions = {
            from: ''+config.mailUser+'', // sender address
            to: receivers, // list of receivers
            subject: subject, // plaintext body
            html: body // html body
        };

        mailTransport.on('log', console.log);

        mailTransport.sendMail( mailOptions, function (err,info) {
            if (err) {
                console.log('Unable to send email: ' + err);
            } else {
                console.log("Mail enviado" + info.response);
                mailTransport.close();
            }
        })

    }

};