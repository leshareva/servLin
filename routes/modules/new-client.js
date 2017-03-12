var google = require('googleapis');
var firebase = require('firebase-admin');
var mailer = require('./mailer')
var voucher_codes = require('voucher-code-generator');
var numcap = require('numcap');


const CLIENT_ID = '441408687598-6u7kml2g469dgvbshhvqlg0sna1i7orq.apps.googleusercontent.com';
const CLIENT_SECRET = 'GooltWZtbarnKtDza75QkYyJ';
const REFRESH_TOKEN = '1/m_xMwlUd7wN2kxph0IzStegYMZ_OG_Dnr_CoQEU5vHk40ftc3JxCN-qo3gOnIw-E';
const ENDPOINT_OF_GDRIVE = 'https://www.googleapis.com/drive/v2';
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
var database = firebase.database()


module.exports = {
    newClientWelcome: function (req, res) {
        var clientId = req.clientId
        if(req.body["promoCode"]) {
            request.post('/users/promo/check', { form: { code: req.body["promoCode"]} }, function (error, response, body) {
                if(response.statusCode == 200) {
                    createFolder(req.company, clientId, function (result) {
                        if (result !== 'false') {
                            var topMan = String(JSON.parse(body).topman)
                            database.ref('clients/' + clientId).update({ conceptUrl : result, topMan: topMan})
                            res.status(200).jsonp({success: true, message: "Промо-код активирован"})
                        }
                    })

                } else {
                    console.log("Нет такого промо-кода")
                    res.status(403).jsonp({success: false, message: "Нет такого промо-кода"})
                }
            })


        } else {
            createFolder(req.company, clientId, function (result) {
                if (result !== 'false') {
                    database.ref('clients/' + clientId).update({ conceptUrl : result})
                }
            })
        }
    }
}


function sendMailToClient(clientId, promocode) {
    database.ref("clients/" + clientId).once("value", function (snapshot) {
        var email = snapshot.val().email

        var mail = '<div style="font-size: 18px;">' +
            '<h1>Добро пожаловать в Лин!</h1>' +
            '<p>Теперь у вас в телефоне есть инструмент, который решает оперативные дизайн-задачи.</p>' +
            '<div style="font-size: 18px; color: #ffffff; padding: 20px 20px; background-color: #1f8bff;">' +
            'Мы дарим вам 500₽ чтобы вы познакомились с Лином. Cоздайте простую задачку, и попробуйте как все устроено.<br /><br />' +
            'Введите в приложении промо код: ' +
            '<div style="font-size: 28px; letter-spacing: 3px; padding: 10px 20px; border: 1px dashed #ffffff; margin: 10px 0 20px 0; text-align: center;">' + promocode + '</div>' +
            '</div>' +
            '<h3>И еще пару слов о том, почему мы придумали Лин.</h3>' +
            '<p>В дизайне есть простые задачки — внести правки в макет или сделать листовку для бизнеса. Тут не нужно искать вдохновение, придумывать гениальную идею и т.д. Нужно просто сделать и желательно быстро. </p>' +

            '<p>В реальности, когда клиент сталкивается с такой задачей ему сначала приходится искать дизайнера, звонить ему, перекидываться файлами. Дизайнер занят, займется завтра и т.д. Так задача на 10 минут растягивается на несколько дней.</p>' +

            '<p>Мы сделали Лин для тех, кто постоянно что-то меняет в бизнесе, и хочет решать рутинные дизайн-задачи эффективнее. Мы оптимизируем процессы, отбираем дизайнеров, учим их и повышаем эффективность.</p>' +
            '<p>С уважением, Лин</p>'
        '</div>'

        mailer.sendMail(email, mail, "Добро пожаловать в Лин!")
    })
}

// Create User Folder in GDrive
function createFolder(company, clientId, callback) {
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
                    return callback('false')
                } else {
                    console.log('Folder is created. Id: ', file.id);
                    return callback(file.id)
                }
            })
        }
    });
}


module.exports.createFolder = createFolder