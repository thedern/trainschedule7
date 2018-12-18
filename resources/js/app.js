

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

    // append new table row each time database listener function fires
    $('#myTable').append('<tr><th scope="row">'+counter+'</th><td>'+tdName+'</td><td>'+tdDestination+'</td><td>'+tdFreq+'</td><td>'+tdNext+'</td><td>'+tdMins+'</td></tr>');
    
}, function(errorObject) {
    console.log('the DB read to page failed: ', errorObject.code);
});