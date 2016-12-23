# Nodejs Examples

## Table of contents
* [Requirements](#requirements)
* [Installing](#installing)
* [Running](#running)
    * [Sample scripts](#sample-scripts)
* [Examples](#examples)
    * [Simple voice campaign](#simple-voice-campaign)
    * [Send sms](#send-sms)
    * [Click2Call Full Web Demo](#click2call-full-web-demo)
    * [Create ClickToCall](#create-clicktocall)
* [Further help](#further-help)

- - -

## Requirements
* nodejs >= 0.7.0 [available here](https://nodejs.org/)
* npm - node package manager ( installed by default with nodejs )
* CALLR npm package [available here](https://www.npmjs.com/package/callr)

---

## Installing
1. To get started with the CALLR npm package, first create your project directory then base project files using `npm init`.
**npm init** initialises the project with a *package.json*, which contains meta data about your project or app, including modules needed for it to run.
    ```
    // create your project
    $ mkdir myproject
    $ cd myproject
    $ npm init
    ...
    About to write to /working/myproject:
    {
        "name": "myproject",
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1"
        },
        "author": "",
        "license": "ISC"
    }
    Is this ok? (yes)
    ```

2. Install and add the CALLR SDK to your application dependencies.
    ```
    $ npm install --save callr
    myproject@1.0.0 /working/myproject
    `-- callr@1.0.0

    npm WARN myproject@1.0.0 No description
    npm WARN myproject@1.0.0 No repository field.
    ``` 
3. require the CALLR sdk in your project source to begin using.
    ```javascript
    var callr = require('callr');
    var api = new callr.api('login', 'password');   

    api.call('system.get_timestamp').success(function(response) {
        // success callback
    }).error(function(error) {
        // error callback
    });
    ``` 

---
## Running

Export your CALLR credentials as environment variables:
```
// bash
$ export CALLR_LOGIN=<your_login>
$ export CALLR_PASS=<your_password>

// windows cmd
c:\> set CALLR_LOGIN=<your_login>
c:\> set CALLR_PASS=<your_password>
```

### Sample scripts
Located in `scripts/`  

* send-sms.js - send an sms message to destination
    * *node send-sms -t &lt;destination number&gt; -m '&lt;message&gt;'*
* media.js - manage media, upload media files, create TTS media
    * *node media -h* // display help
    * *node media &lt;command&gt; -h* // display command help
* campaign.js - manage campaigns, create / list / delete
    * *node campaign -h* // display help
    * *node campaign &lt;command&gt; -h* // display command help
* address.js - manage address books, upload / list / delete
    * *node address -h* // display help
    * *node address &lt;command&gt; -h* // display command help
* click2call.js - list, create and start click2call applications
    * *node click2call -h* // display help
    * *node click2call &lt;command&gt; -h* // display command help
 
- - -

## Examples

### Simple voice campaign
This will guide you through the commands and output needed to create a simple voice campaign, that utilises 2 different sources of media.

1. Upload our pre-recorded mp3 and create our TTS media 
    ```
    // upload mp3
    $ node media upload samples/sample-recording.mp3 -n 'mp3 recording'
    Import job id: 358c1467123456789123456789ABCDEFG, mp3 recording
    Media uploaded: mp3 recording, id: 1012345

    // create tts voice message
    $ node media create-tts -n 'my tts' -t 'Hello, welcome to our simple voice campaign' TTS_EN-GB_SERENA
    media created, id: 1023456
    ```

2. We can check our media library to make sure the creation was successful.
    ```
    // list media library contents
    $ node media list
    ...
    media id: 1012345, name: mp3 recording, content: , voice: NONE, source: API_IMPORT
    media id: 1023456, name: my tts, content: Hello, welcome to our simple voice campaign, voice: TTS_EN-GB_SERENA, source: TTS    
    ```

3. Next we need to upload our addressbook, this is done with the *address.js* script:
    ```
    // upload addressbook
    $ node address upload -c FR -n "my addressbook" -p 2 samples/sample-addressbook.csv
    Import job id: 358c146764abcdefghijklmno123, my addressbook
    Addressbook LH9Q92DC - my addressbook successfully uploaded.
    ```
    *  _**-c**_ determines the country code for the phonenumbers listed in the addressbook
    *  _**-p**_ is the zero based index of the phonenumbers column in the csv/excel document.  
    ( see *node address upload -h* for more information )

4. We can list our addressbooks to confirm the upload, or view the ids of already imported addressbooks:
    ```
    // list addressbooks
    $ node address list
    id: LH9QABCD - name: my addressbook, items_count: 5, imported: 2016-01-01 12:00:00
    Total of 1 addressbooks found 
    ```

5. Next we create our simple voice campaign using the campaign script, using the addressbook id, and media ids.  
    ```
    // create voice campaign
    $ node campaign create -t 'my simple voice campaign' -a LH9Q92DC -m 1012345,1023456 VOICE_SIMPLE
    Campaign created ID: QRTCA1B2 
    ```
    * _**-t**_ is our name for the campaign 
    * _**-a**_ determines which addressbook to use for the campaign 
    * _**-m**_ denotes a comma separated list of media files to use for said campaign
    * _**VOICE_SIMPLE**_ denotes the type of campaign we are creating
    ( see *node campaign create -h* for more information )  

6. With our returned campaign id, we can perform different operations, start / stop / pause, retrieve the config or view the status. ( see node campaign -h for more information )
    ```
    // show campaign status
    $ node campaign status QRTCBFTO
    {
    "run_id": 1,
    "state": "CREATED",
    "finished_cause": "NONE",
    "finished_cause_data": null,
    "percent": 0,
    "items_done": 0,
    "items_total": 5,
    "items_total_t": 5,
    "counters": {
        "broadcast": {
            "completed": 0,
            "history": {}
        },
        "cost": "0.00",
        "call_status": {
            "ANSWERED/COMPLETE": 0,
            "ANSWERED/INCOMPLETE": 0,
            "ABSENT/NO_ANSWER": 0,
            "ABSENT/BUSY": 0,
            "ABSENT/VOICEMAIL_DETECTED": 0,
            "ERROR/UNALLOCATED_NUMBER": 0,
            "ERROR/REJECTED": 0,
            "ERROR/BLACKLISTED": 0,
            "ERROR/OTHER": 0
    ...    
    "scheduled": false,
    "started_at": "0000-00-00 00:00:00",
    "ended_at": "0000-00-00 00:00:00",
    "reports": [],
    "state_history": []
    }
    ```

### Send sms
To send a sms, use the send-sms.js script
```
$ node send-sms.js -t +33123456789 -m "Hello, from test sms!"
sms sent id: 6CQLABCD
```

### Click2Call full web demo
Please see the README [here](click2call-web/README.md) for more information on running the full Click2Call web demo application.

### Create ClickToCall
To create a simple click to call application, use *click2call.js*, here we will create a click to call application
with a tts media that will be played to person A before they are connected to person B.

For more information on the Click to Call api, see the [documentation here](http://www.callr.com/docs/api/services/clicktocall/calls/)
and [related objects here](http://www.callr.com/docs/objects/#CLICKTOCALL10).

1. Create our tts media file, with a simple greeting. ( see [Sample scripts](#sample-scripts) for more information on using the media script )
    ```
    $ node media create-tts -t 'Hello, connecting you to home base, please hold' -n 'my greeting' TTS_EN-GB_SERENA
    media created, id: 1051111
    ```

2. Create the click to call application, passing the media to be played to callee A before connecting them to callee B
    ```
    $ node click2call.js create -m 1051111 'my click2call application'
    Click2Call app created, id: N9BUABCD  name: my click2call application
    ```

3. Start the click to call application, passing the 2 telephones to be connected
    ```
    $ node click2call.js start -a +33123456789 -b +33123456987 N9BUABCD
    Click2Call application started, call id: PHABCD1U
    ```

4. A call will be first placed to person A, and the media file passed to Click to call creation will be played before being connected with person B.

---

## Further help
* You will find API documentation and snippets here at [http://www.callr.com/docs/](http://www.callr.com/docs/)
* Or in our github repository [https://github.com/THECALLR/](https://github.com/THECALLR/)
* nodejs sdk github here ([https://github.com/THECALLR/sdk-nodejs](https://github.com/THECALLR/sdk-nodejs))
 
---
