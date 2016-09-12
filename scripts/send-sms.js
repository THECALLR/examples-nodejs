'use strict';
// node send-sms.js -t <number> -m '<message to send>'
// assumes CALLR api credentials have been exported as environment variables

var callr = require('callr');
var app = require('commander');

app.version('0.0.1')
    .option('-t, --to [to]', 'Destination number (format E.164)')
    .option('-m, --message [message]', 'Message to send')
    .parse(process.argv);

if (!app.to || !app.message) {
    app.outputHelp();
    process.exit(1);
}

try {
    var api = new callr.api(process.env.CALLR_LOGIN, process.env.CALLR_PASS);
} catch (e) {
    console.error(`exception thrown: ${e}, did you export your credentials?`);
    process.exit(1);
}

try {
    api.send('sms.send', ['SMS', app.to, app.message, null])
        .success((res) => {
            console.log(`sms sent id: ${res}`);
        })
        .error((err) => {
            console.error(`error: ${err.message}\r\ncode: ${err.code}\r\ndata: ${err.data}`);
        });
} catch (e) {
    console.error(`exception thrown: ${e}`);
}
