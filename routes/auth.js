/**
 * Created by LeshaReva on 3/10/17.
 */
var express = require('express');
var router = express.Router();

var request = require('request');

/* GET home page. */
router.get('/', function(req, res, next) {

    var options = { method: 'POST',
        url: 'https://leandesign.eu.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body:
            { grant_type: 'authorization_code',
                client_id: 'rkmpGJYs11zfwePEDmFKP23wuESCRXt6',
                client_secret: '5Irpt_Ufn2Jj8cENnOKXmTw8PUGtze8JBJXCcrMazN_4E65lqgWDcLaWOjUeCR2r',
                code: 'YOUR_AUTHORIZATION_CODE',
                redirect_uri: 'https://leandesign.eu.auth0.com/mobile' },
        json: true };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);

        console.log(body);
    });
});



router.post('/', function (req, res, next) {


});

function onLogin(loginResponse) {
    console.log('Digits login succeeded.');
    var oAuthHeaders = parseOAuthHeaders(loginResponse.oauth_echo_headers);

    var options = {
        type: 'POST',
        url: '/digits',
        data: oAuthHeaders,
        success: onDigitsSuccess
    };
}



router.post('/digits', function (req, res, next) {
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


module.exports = router;