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

app.command('create <campaign_type>')
    .description(`create SENDR campaign, possible types are ${campaignTypes.join(', ')}`)
    .option('-t --title <title>', 'title of campaign')
    .option('-a --addressbook <addressbook>', 'ID of addressbook to use')
    .option('-b --bridge <bridge>', 'telephone number to bridge voice campaign. (for use only with VOICE_IVR)')
    .option('-m --media <media>', 'media file/s to use for campaign, separated by commas, eg: 123456,234567,1212121')
    .option('-c --content <content>', 'content of text message to send for campaign, (for use only with SMS_SIMPLE)')
    .action(createCampaign);

app.command('list')
    .description('list campaigns')
    .action(listCampaigns);

app.command('dumpconfig <campaign_hash>')
    .description('dump configuration in JSON format for given campaign id')
    .action(dumpConfig);

app.command('start <campaign_hash>')
    .description('start a campaign, given a campaign id')
    .action((id) => {
        doCompaignAction('started', 'sendr/10/campaign.start', id);
    });

app.command('stop <campaign_hash>')
    .description('stop a campaign, given a campaign id')
    .action((id) => {
        doCompaignAction('stopped', 'sendr/10/campaign.stop', id);
    });

app.command('pause <campaign_hash>')
    .description('pause a campaign, given a campaign id')
    .action((id) => {
        doCompaignAction('paused', 'sendr/10/campaign.pause', id);
    });

app.command('delete <campaign_hash>')
    .description('delete campaign, given a campaign id')
    .action((id) => {
        doCompaignAction('deleted', 'sendr/10/campaign.delete', id);
    });

app.command('status <campaign_hash>')
    .description('get campaign status, given a campaign id')
    .action(statusCampaign);

app.parse(process.argv);

if (!process.argv.slice(2).length) {
    app.outputHelp();
}

/**
 * Create campaign for given type
 * @param {String} type - type of campaign to create. 
 * @param {Object} options - options to pass to campaign creation
 */
function createCampaign(type, options) {
    if (campaignTypes.indexOf(type) < 0) {
        return console.error(`Error: unknown campaign type \r\nRequired one of: ${campaignTypes.join(', ')}`);
    }

    if (!options.title || !options.addressbook) {
        console.error('[1] Error: incomplete command, see campaign create -h for more information');
        app.outputHelp();
        return;
    }

    api.send('sendr/10/campaign.get_object_template', [type])
        .success((campaignObject) => {
            switch (type) {
                case 'VOICE_IVR':
                    doVoiceIvr(campaignObject, options);
                    break;

                case 'VOICE_SIMPLE':
                    doVoiceSimple(campaignObject, options);
                    break;

                case 'SMS_SIMPLE':
                    doSmsSimple(campaignObject, options);
                    break;

                default:
                    break;
            }
        })
        .error(error);
}

/**
 * Create simple sms campaign 
 * @param {Object} campaignObject - campaign object
 * @param {Object} options - options to pass to campaign ( passed from commander )
 */
function doSmsSimple(campaignObject, options) {
    if (!options.content) {
        console.error('[5] Error: incomplete command, see campaign create -h for more information');
        app.outputHelp();
        return;
    }

    campaignObject.name = options.title;
    campaignObject.ivr.text = options.content;
    campaignObject.addressbook.hash = options.addressbook;

    checkCampaignObject(campaignObject, (res) => {
        api.send('sendr/10/campaign.save', [campaignObject])
            .success((campaign) => {
                console.log(`Campaign created ID: ${campaign.hash}`);
            })
            .error(error);
    });
}

/**
 * Create voice ivr campaign with call bridging, 
 * the first media id passed will be reused for the IVR prompt
 * @param {Object} campaignObject - campaign object
 * @param {Object} options - options to pass to campaign ( passed from commander )
 */
function doVoiceIvr(campaignObject, options) {
    if (!options.bridge || !options.media) {
        console.error('[6] Error: incomplete command, see campaign create -h for more information');
        app.outputHelp();
        return;
    }

    api.send('sendr/10/campaign.get_voice_ivr_action_objects_templates', [])
        .success((ivrObjects) => {
            var target = {
                number: options.bridge,
                timeout: 15
            };
            var bridgeAction = ivrObjects.BRIDGE;
            var media = options.media.split(',');

            bridgeAction.targets = [target];
            campaignObject.ivr.keys.key_1.action = "BRIDGE";
            campaignObject.ivr.keys.key_1.params = bridgeAction;

            // we reuse our first media for the ivr prompt
            campaignObject.ivr.prompt = media[0];
            campaignObject.name = options.title;
            campaignObject.ivr.broadcast = media;
            campaignObject.addressbook.hash = options.addressbook;
            campaignObject.ivr.voicemail_detect_method = 'AUTO';

            checkCampaignObject(campaignObject, (res) => {
                api.send('sendr/10/campaign.save', [campaignObject])
                    .success((campaign) => {
                        console.log(`Campaign created ID: ${campaign.hash}`);
                    })
                    .error(error);
            });
        })
        .error(error);

}

/**
 * Create simple voice campaign
 * @param {Object} campaignObject - campaign object
 * @param {Object} options - options to pass to campaign ( passed from commander )
 */
function doVoiceSimple(campaignObject, options) {
    if (!options.media) {
        console.error('[7] Error: incomplete command, see campaign create -h for more information');
        app.outputHelp();
        return;
    }

    campaignObject.name = options.title;
    campaignObject.ivr.broadcast = options.media.split(',');
    campaignObject.addressbook.hash = options.addressbook;
    campaignObject.ivr.voicemail_detect_method = 'AUTO';

    checkCampaignObject(campaignObject, (res) => {
        api.send('sendr/10/campaign.save', [campaignObject])
            .success((campaign) => {
                console.log(`Campaign created ID: ${campaign.hash}`);
            })
            .error(error);
    });
}

/**
 * Validate campaign object configuration
 * @param {Object} campaignObject - object to validate
 * @param {function} callback - callback to execute on return of result
 */
function checkCampaignObject(campaignObject, callback) {
    api.send('sendr/10/campaign.check', [campaignObject])
        .success((res) => {
            if (res.length !== 0) {
                console.error(`Campaign object error: ${res.join(',')}`);
                return;
            } else {
                callback();
            }
        })
        .error(error);
}

/**
 * Create campaign for given type, dumps campaign config in JSON format.
 * @param {String} id - ID of campaign
 */
function dumpConfig(id) {
    api.send('sendr/10/campaign.get', [id])
        .success((res) => {
            console.log(JSON.stringify(res, null, 4));
        })
        .error(error);
}

/**
 * Print list of campaigns attributed to account
 */
function listCampaigns() {
    api.send('sendr/10/campaign.search', [null, null])
        .success((res) => {
            for (var c of res.hits) {
                console.log(`id: ${c.hash}, type: ${c.type}, name: ${c.name}, state: ${c.status.state}`);
            }
        })
        .error(error);
}

/**
 * Print JSON formatted status object for campaign
 * @param {String} id - campaign id
 */
function statusCampaign(id) {
    api.send('sendr/10/campaign.get', [id])
        .success((res) => {
            return console.log(JSON.stringify(res.status, null, 4));
        })
        .error(error);
}

/**
 * Helper function to perform campaign action (start,stop,pause,delete)
 * @param {String} action - action to perform (for debug output purposes only)
 * @param {String} call - api call to perform
 * @param {String} id - id of campaign to perform action on
 */
function doCompaignAction(action, call, id) {
    api.send(call, [id])
        .success((res) => {
            console.log(`Campaign ${id} ${action}`);
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