'use strict';
// assumes CALLR api credentials have been exported as environment variables

var callr = require('callr');
var app = require('commander');

var api;
const campaignTypes = ["SMS_SIMPLE", "VOICE_IVR", "VOICE_SIMPLE"];

try {
    api = new callr.api(process.env.CALLR_LOGIN, process.env.CALLR_PASS);
} catch (e) {
    console.error(`exception thrown: ${e}, did you export your credentials?`);
    process.exit(1);
}

app.version('0.0.1');

app.command('create <click2call_name>')
    .description(`create click2call application, plays passed media to party a before connecting`)
    .option('-m --media <media>', 'media file to play to party a before connecting')
    .action(createClick2Call);

app.command('start <click2call_appid>')
    .option('-a --person-a <person_a>', 'First person to call')
    .option('-b --person-b <person_b>', 'Second person to call')
    .description('launch created click2call application')
    .action(startClick2Call);

app.command('list')
    .description('list clicktocall apps avaiable')
    .action(listClick2Call);

app.command('delete <apps...>')
    .description('delete clicktocall apps avaiable')
    .action(deleteClick2CallApps);

app.parse(process.argv);

if (!process.argv.slice(2).length) {
    app.outputHelp();
}

function deleteClick2CallApps(apps){
    for(let a of apps){
        api.send('apps.delete', [a])
        .success((res)=>{
            console.log(`Click2Call app ${a} successfully deleted.`);
        })
        .error(error);  
    }
}

/**
 * start click to call application, outputs call ID on success.
 * @param {String} appId - id of created click to call application
 * @param {Object} options - options to pass to call: personA, personB
 */
function startClick2Call(appId, options) {
    let targetA = { number: options.personA, timeout: 30 };
    let targetB = { number: options.personB, timeout: 30 };

    api.send('clicktocall/calls.start_2', [appId, [targetA], [targetB], null])
        .success((res) => {
            console.log(`Click2Call application started, call id: ${res}`);
        })
        .error(error);
}

/**
 * create click to call application
 * @param {String} appname - name of application
 * @param {Object} options - options to pass to creation of application: media
 */
function createClick2Call(appname, options) {
    let click2callObject = {
        "medias": {
            "A_welcome": options.media
        },
        "options": {},
        "vms": {}
    };

    api.send('apps.create', ['CLICKTOCALL10', appname, click2callObject])
        .success((app) => {
            console.log(`Click2Call app created, id: ${app.hash}, name: ${app.name}`);
        })
        .error(error);
}

/**
 * List all click to call apps available
 */
function listClick2Call() {
    api.send('apps.get_list', [false])
        .success((apps) => {
            for (let a of apps) {
                if (a.package.type === 'CLICKTOCALL')
                    console.log(`hash: ${a.hash} - name: ${a.name}, type: ${a.package.type}`);
            }
        })
        .error(error);
}

/**
 * Error output function
 * @param {Object} err - error object containing message, code, data as properties
 */
function error(err) {
    return console.error(`error: ${err.message}, code: ${err.code}, data: ${err.data}`);
}
