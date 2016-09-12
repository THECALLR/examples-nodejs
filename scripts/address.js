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
// commandline parsing
app.version('0.0.1');

app.command('upload <file>')
    .description('upload .csv or excel spreadsheet addressbook to server')
    .option('-c --country <country>', 'country code of phonenumbers stored in addressbook. eg: FR, US, RU')
    .option('-n --name "<name>"', 'name to apply to addressbook')
    .option('-d --description "[description]"', 'addressbook description')
    .option('-p --phone-col <phone-col>', 'zero based index of phonenumber column in addressbook')
    .action(uploadAddressbook)

app.command('list')
    .description('list address books')
    .action(listAddressbooks);

app.command('delete <addressbooks...>')
    .description('delete address books, addressbooks used for campaigns are classed as "in use" and cannot be deleted.')
    .action(deleteAddressbooks);

app.parse(process.argv);

if (!process.argv.slice(2).length) {
    app.outputHelp();
}

// command functions
function listAddressbooks() {
    api.send('sendr/10/addressbook.search', [null, null])
        .success((res) => {
            for (let a of res.hits) {
                console.log(`id: ${a.hash} - name: ${a.name}, items_count: ${a.items_count}, imported: ${a.imported_at}`);
            }
            console.log(`Total of ${res.total} addressbooks found.`)
        })
        .error(error);
}

function deleteAddressbooks(addressbooks){
    for(let b of addressbooks){
        api.send('sendr/10/addressbook.delete', [b])
        .success((res)=>{
            console.log(`Addressbook ${b} successfully deleted.`);
        })
        .error(error);  
    }
}

function uploadAddressbook(file, options) {

    if(!options.name || !options.phoneCol || !options.country){
        console.error('Error: incomplete command, see address upload -h for more information');
        app.outputHelp();
        return;
    }

    var book = fs.readFileSync(file);
    let b64 = new Buffer(book).toString('base64');
    options.description = options.description ? options.description : options.name;

    api.send('media.import_file_from_base64_async', [b64, null])
        .success((jobId) => {
            console.log(`Import job id: ${jobId}, ${options.name}`);
            return setTimeout(checkBookUploadStatus, 1000, jobId, options);
        })
        .error(error);
}

function checkBookUploadStatus(jobId, options) {
    api.send('jobs.get', [jobId])
        .success((res) => {
            if (res.status !== 'DONE') {
                return setTimeout(checkBookUploadStatus, 1000, jobId, options);
            } else {
                api.send('sendr/10/addressbook.create', [options.name, options.description])
                    .success((addressbook) => {
                        api.send('sendr/10/addressbook.append_file_async', [addressbook.hash, res.result.filename, options.phoneCol, options.country, null])
                            .success((res) => {
                                console.log(`Addressbook ${addressbook.hash} - ${options.name} successfully uploaded.`);
                            })
                            .error(error);
                    })
                    .error(error);
            }
        })
        .error(error);
}

function error(err) {
    return console.error(`error: ${err.message}, code: ${err.code}, data: ${err.data}`);
}