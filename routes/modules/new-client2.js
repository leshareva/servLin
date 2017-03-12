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



module.exports = {

    // Create User Folder in GDrive
    createUserFolder: function(company, clientId, callback) {
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


}

