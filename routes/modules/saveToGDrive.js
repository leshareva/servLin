var GoogleTokenProvider = require('refresh-token').GoogleTokenProvider;
var firebase = require("firebase-admin")
var taskService = require("../task.service")
var userService = require("../user.service")


const CLIENT_ID = '441408687598-6u7kml2g469dgvbshhvqlg0sna1i7orq.apps.googleusercontent.com';
const CLIENT_SECRET = 'GooltWZtbarnKtDza75QkYyJ';
const REFRESH_TOKEN = '1/m_xMwlUd7wN2kxph0IzStegYMZ_OG_Dnr_CoQEU5vHk40ftc3JxCN-qo3gOnIw-E';
const ENDPOINT_OF_GDRIVE = 'https://www.googleapis.com/drive/v2';
const PARENT_FOLDER_ID = '0B5ifIe9z1t1nMzZzUzhlVXRZUWs';

const database = firebase.database()

var async = require('async'),
    request = require('request'),
    fs = require('fs');



function saveImageToDrive(PSD_FILE, clientId, fileId) {

    database.ref("clients/" + clientId).once("value", function (snap) {
        var folderId = snap.val().conceptUrl
        sendToDrive(PSD_FILE, folderId, fileId)
        // taskService.changeTaskStatus(taskId, "sourcesApprove")
    })

}

function sendToDrive(PSD_FILE, PARENT_FOLDER_ID, fileId) {

    async.waterfall([
        //-----------------------------
        // Obtain a new access token
        //-----------------------------
        function(callback) {
            var tokenProvider = new GoogleTokenProvider({
                'refresh_token': REFRESH_TOKEN,
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET
            });
            tokenProvider.getToken(callback);
        },

        function(accessToken, callback) {

            var fstatus = fs.statSync(PSD_FILE);
            fs.open(PSD_FILE, 'r', function(status, fileDescripter) {
                if (status) {
                    callback(status.message);
                    return;
                }

                var buffer = new Buffer(fstatus.size);
                fs.read(fileDescripter, buffer, 0, fstatus.size, 0, function(err, num) {

                    request.post({
                        'url': 'https://www.googleapis.com/upload/drive/v2/files',
                        'qs': {
                            //request module adds "boundary" and "Content-Length" automatically.
                            'uploadType': 'multipart'

                        },
                        'headers' : {
                            'Authorization': 'Bearer ' + accessToken
                        },
                        'multipart':  [
                            {
                                'Content-Type': 'application/json; charset=UTF-8',
                                'body': JSON.stringify({
                                    'title': PSD_FILE,
                                    'parents': [
                                        {
                                            'id': PARENT_FOLDER_ID
                                        }
                                    ]
                                })
                            },
                            {
                                'Content-Type': 'image/png',
                                'body': buffer
                            }
                        ]
                    }, callback);

                });
            });
        },

        //----------------------------
        // Parse the response
        //----------------------------
        function(response, body, callback) {
            var body = JSON.parse(body);

            callback(null, body);
        }

    ], function(err, results) {
        if (!err) {
            console.log(results);

            database.ref('files/' + fileId).update({ source: "https://drive.google.com/file/d/" + results.id })

            fs.unlink(PSD_FILE, function(err){
                if (err) throw err;
                console.log(PSD_FILE + " deleted");
            });
        } else {
            console.error('---error');
            console.error(err);
        }
    });
}





module.exports.saveImageToDrive = saveImageToDrive
