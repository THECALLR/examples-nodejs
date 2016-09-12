'use strict';
// assumes CALLR api credentials have been exported as environment variables

var callr = require('callr');
var app = require('commander');
var fs = require('fs');

var api;

try {
    api = new callr.api(process.env.CALLR_LOGIN, process.env.CALLR_PASS);
} catch (e) {
    console.error(`exception thrown: ${e}, did you export your credentials?`);
    process.exit(1);
}

app.version('0.0.1');

app.command('create-tts <tts_voice>')
    .description(`create tts media using given tts voice`)
    .option('-t --text "<text>"', 'text to convert into voice media')
    .option('-n --name "<name>"', 'name of created media')
    .action(createMediaTts);

app.command('upload <media_file>')
    .description('upload media file')
    .option("-n --name '<name>'", 'name of created media')
    .action(uploadMedia);

app.command('delete <media_ids...>')
    .description('delete media from your library')
    .action(deleteMedias);

app.command('list')
    .description('list medias')
    .option('-s --filter-source [source]', 'filter by media source')
    .action(listMedias);

app.parse(process.argv);

if (!process.argv.slice(2).length) { app.outputHelp(); }

/**
 * Create tts media
 * @param {String} voice - tts voice to use 
 * @param {Object} options - name of media, text to convert to voice
 */
function createMediaTts(voice, options) {
    var voices = [];
    api.send('media/tts.get_voice_list', [])
        .success((result) => {
            for (let r of result) {
                voices = voices.concat(r.voices);
            }

            if (voices.indexOf(voice) < 0 || !voice) {
                return console.error(`Error: unknown voice type \r\nRequired one of: ${voices.join(", ")}`);
            } else {
                api.send('media/library.create', [options.name])
                    .success((mediaId) => {
                        api.send('media/tts.set_content', [mediaId, options.text, voice, null])
                            .success((res) => {
                                console.log(`media created, id: ${mediaId}`);
                            })
                            .error(error);
                    })
                    .error(error);
            }
        })
        .error(error);
}

/**
 * delete tts media
 * @param {Array} media - array of media ids to delete 
 */
function deleteMedias(medias) {
    for (let m of medias) {
        api.send('media/library.delete', [m])
            .success((res) => {
                console.log(`removed media id: ${m}`);
            })
            .error(error);
    }
}
/**
 * upload media file
 * @param {String} file - file to upload 
 * @param {Object} options - name of media
 */
function uploadMedia(file, options) {
    var media = fs.readFileSync(file);
    let b64 = new Buffer(media).toString('base64');

    api.send('media.import_file_from_base64_async', [b64, null])
        .success((jobId) => {
            console.log(`Import job id: ${jobId}, ${options.name}`);
            return setTimeout(checkMediaUploadStatus, 1000, jobId, options);
        })
        .error(error);
}

function checkMediaUploadStatus(jobId, options) {
    api.send('jobs.get', [jobId])
        .success((res) => {
            if (res.status !== 'DONE') {
                setTimeout(checkMediaUploadStatus, 1000, jobId, options);
            } else {
                api.send('media/library.create', [options.name])
                    .success((mediaId) => {
                        api.send('media/library.set_content_from_file', [mediaId, res.result.filename])
                            .success((res) => {
                                console.log(`Media uploaded: ${options.name}, id: ${mediaId}`);
                            })
                            .error(error);
                    })
                    .error(error);
            }
        })
        .error(error);
}

/**
 * Create tts media
 * @param {Object} options - filter output
 */
function listMedias(options) {
    api.send('media/library.get_list', [null])
        .success((res) => {
            for (var m in res) {
                if (options.filterSource && res[m].source == options.filterSource) {
                    console.log(`media id: ${res[m].id}, name: ${res[m].name},` +
                        ` content: ${res[m].content}, voice: ${res[m].voice}, source: ${res[m].source}`);
                } else if (!options.filterSource) {
                    console.log(`media id: ${res[m].id}, name: ${res[m].name},` +
                        ` content: ${res[m].content}, voice: ${res[m].voice}, source: ${res[m].source}`);
                }
            }
        })
        .error(error);
}

function error(err) {
    console.error(`error: ${err.message}, code: ${err.code}, data: ${err.data}`);
}