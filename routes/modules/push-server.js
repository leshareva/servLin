var gcm = require('node-gcm');
var firebase = require("firebase-admin")
var forEach = require('async-foreach').forEach;

module.exports = {

    sendPush: function (userId, title, messageText, taskId) {
        var database = firebase.database()


        database.ref('user-token/' + userId).on("child_added", function (snapshot) {
            if (snapshot.numChildren() === 0) {
                console.log("user " + userId + " have no token")
            }

            var tokensArray = []

            tokensArray.push(snapshot.key)

            forEach(tokensArray, function (token) {
                var FCM = require('fcm-push');
                var serverKey = 'AAAAerW32Uw:APA91bG6AgnFZ-EeLEAvVfwhIMOIfp_uK32Yn9cu-M9oD7pBPYdEB8OgCTeFuynGVBSFvGLTIOvdaDrd-bWM810FpNp0GvKVjihJxh_iMWhVpZGYDwiFeU1lm7Q594RmUsOIoSLr-n1iRS3qvEirFOSRvS5IhoPd8w';
                var fcm = new FCM(serverKey);

                var message = {
                    to: token, // required
                    priority: "high",
                    notification: {
                        title: title || "Уведомление из Лина",
                        body: messageText || "Новое сообщение",
                        sound: 'default',
                        badge: 1,
                        click_action :"FCM_PLUGIN_ACTIVITY",
                    }
                };

                fcm.send(message, function(err, response){
                    if (err) {
                        console.log("Something has gone wrong!", err);
                        // database.ref('user-token/' + userId).child(String(token)).set(null);
                    } else {
                        console.log("Successfully sent with response: ", response);
                    }
                });
            }, database.ref('user-token/' + userId).off())


    })
}

}