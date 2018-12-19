

/* ==========================================================================
   Basic Instructions
   ========================================================================== */
/*
When adding trains, administrators should be able to submit the following:
Train Name <== Done
Destination  <== Done
First Train Time -- in military time <== Done
Frequency -- in minutes  <== Done
Code this app to calculate when the next train will arrive; this should be relative to the current time.
Users from many different machines must be able to view same train times.
Styling and theme are completely up to you. Get Creative!*/

/* ==========================================================================
   Connect to Firebase
   ========================================================================== */

// ensure you swap the config object with the connection information from your database
var config = {
    apiKey: "AIzaSyBg5uXwZLSCCy_Owik-Mx2Tib5p1rlGMus",
    authDomain: "homework7t.firebaseapp.com",
    databaseURL: "https://homework7t.firebaseio.com",
    projectId: "homework7t",
    storageBucket: "homework7t.appspot.com",
    messagingSenderId: "849143971661"
};
  

// connect to firebase
firebase.initializeApp(config);
  
// Create a variable to reference the database.
var database = firebase.database();
console.log(database);

// global variables to use to capture data from form and feed into datase
var capturedName, capturedDest, capturedTime, capturedFreq;
var counter = 0;

/* ==========================================================================
   On Click Event to capture user input
   ========================================================================== */

$('#enterData').on('click','#submit', function(e) {
    e.preventDefault();
    
    /* capture the user's input 
       leave time of first train as a string, it will be parsed by moment.js below
       convert minutes to integer before moving on to the time manipulation */

    capturedName = $('#tName').val().trim();
    capturedDest = $('#tDest').val().trim();
    capturedTime = $('#tTime').val().trim();
    // must be parsed as an integer
    capturedFreq = parseInt($('#tFreq').val().trim());

    // log to ensure data is captured
    console.log('data captured ', capturedName, capturedDest, capturedTime, capturedFreq);

    // First Time (pushed back 1 day to make sure it comes before current time)
    var capturedTimeConverted = moment(capturedTime, 'HH:mm').subtract(1, 'day');
    console.log('capturedTime subtract 1 day ago ' + capturedTimeConverted);

    // Difference between the time 1 day ago and time now in minutes
    var diffTime = moment().diff(moment(capturedTimeConverted), 'minutes');
    console.log('DIFFERENCE IN TIME: ' + diffTime);

    // Time apart: difference in mins mod captured train frequency
    var tRemainder = diffTime % capturedFreq;
    console.log('remainder from mod div of captured train frequency and diffed time: ', tRemainder);

    // Minutes until next train
    var tMinutesTillTrain = capturedFreq - tRemainder;
    console.log('MINUTES TILL TRAIN: ' + tMinutesTillTrain);

    // Next Train exact time
    var nextTrain = moment().add(tMinutesTillTrain, 'minutes');
    nextTrain = (nextTrain).format('HH:mm');
    console.log('Next Train Arrival ', nextTrain);

    // store data collected from user into an object
    var newTrain = {
        storedName: capturedName,
        storedDest: capturedDest,
        storedFirstRun: capturedTime,
        storedFreq: capturedFreq,
        storedMinsTill : tMinutesTillTrain,
        storedNextTrain : nextTrain
    };
    console.log(newTrain);

    // upload the data to the firebase database
    database.ref().push(newTrain);
 
    // clear form after data is entered into database
    $('#tName').val('');
    $('#tDest').val('');
    $('#tTime').val('');
    $('#tFreq').val('');

});


/* ==========================================================================
   Update DB and Display in table on screen
   ========================================================================== */

// Enable continuous updates



// database listener that will display updates to database as soon as detected
// the variable 'fromDB' is used in our callback function
database.ref().on('child_added', function(fromDB) {
    
    // increment counter and so the table row header can be updated and entered into the table
    counter++;

    // pull data from DB
    var tdName = (fromDB.val().storedName);
    var tdDestination = (fromDB.val().storedDest);
    var tdFreq = (fromDB.val().storedFreq);
    var tdMins = (fromDB.val().storedMinsTill);
    var tdNext = (fromDB.val().storedNextTrain);

    // create modal button
    // rigger the modal with a button
    // <button type="button" class="btn btn-info btn-lg" data-toggle="modal" data-target="#myModal">Open Modal</button>
    var mButton = $('<button>');
    mButton.attr('class', 'btn btn-secondary m-2 updateTrain');
    mButton.attr('data-toggle','modal');
    mButton.attr('data-target','#myModal');

    // add ion-icon to button
    var mButtonIcon = $('<ion-icon>');
    mButtonIcon.attr('size','medium');
    mButtonIcon.attr('name','build');
    mButton.append(mButtonIcon);


    // append new table row each time database listener function fires
    // tr id matches the counter number
    $('#myTable').append('<tr id="'+counter+'"><th scope="row">'+counter+'</th><td class=tdn>'+tdName+'</td><td class="tdd">'+tdDestination+'</td><td class="tdf">'+tdFreq+'</td><td class="tdn">'+tdNext+'</td><td class="tdm">'+tdMins+'</td></tr>');

    // append the button to the table record.  For some reason if I added the button to the table in the method above,
    // the button would be added as an 'object' not a button element
    $('#myTable tr:last').append(mButton);
    
}, function(errorObject) {
    console.log('the DB read to page failed: ', errorObject.code);

});

/* ==========================================================================
   Click Event on Update
   ========================================================================== */

/*  
Grab what is in the current doc and display in modal
Update associated record in database
Update table
*/

// collect update information from modal after the update button has been clicked
$('#myModal').on('click','#submitUpdateData', function(e) {
    e.preventDefault();
    // var btnParent = $(this).parent();
    //if value length !== 0 udpate db with value
    var updateCapturedName = $('#updateTNames').val().trim();  
    console.log(updateCapturedName);
    var updateCapturedDest = $('#updateTDest').val().trim();
    var updateCapturedTime = $('#updateTTime').val().trim();
    // must be parsed as an integer
    var updateCapturedFreq = parseInt($('#updateTFreq').val().trim());

    if (updateCapturedName.length !== 0) {
        updatingDB(updateCapturedName);
    }
    if (updateCapturedDest.length !== 0) {
        updatingDB(updateCapturedDest);
    }
    if (updateCapturedTime.length !== 0) {
        updatingDB(updateCapturedTime);
    }
    if (updateCapturedFreq.length !== 0) {
        updatingDB(updateCapturedFreq);
    }
    

    // update ... how do I update the correct record

    /*
    validation.js:218 Uncaught Error: Reference.update failed: First argument  must be an object containing the children to replace.
    at Object.t.validateFirebaseMergeDataArg (validation.js:218)
    at t.update (Reference.js:131)
    at updatingDB (app.js:189)
    at HTMLAnchorElement.<anonymous> (app.js:174)
    at HTMLDivElement.dispatch (jquery-3.3.1.min.js:2)
    at HTMLDivElement.y.handle (jquery-3.3.1.min.js:2) */
    function updatingDB(newVal) {
        database.ref().update(newVal);
    }
    
    // listener should pick up updates

});