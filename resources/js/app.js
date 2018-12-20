/* ==========================================================================
   My one lonely global
   ========================================================================== */
// global counter variable so does not get reset to 0 in function call
var counter = 0;



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
  
// create a variable to reference the database.
var database = firebase.database();

// call table refresh immediately so data displayed shows the correct times based on current time
tableRefresh();



/* ==========================================================================
   On click Event to capture user train info input
   ========================================================================== */

$('#enterData').on('click','#submit', function(e) {
    e.preventDefault();
    
    /* capture the user's input 
       leave time of first train as a string, it will be parsed by moment.js below
       convert minutes to integer before moving on to the time manipulation */

    var capturedName = $('#tName').val().trim();
    var capturedDest = $('#tDest').val().trim();
    var capturedFirstRun = $('#tTime').val().trim();
    // must be parsed as an integer
    var capturedFreq = parseInt($('#tFreq').val().trim());

    // do math to update the train's schedule based on initial schedule start time and run frequency
    var retValues = trainMath(capturedFirstRun, capturedFreq);

    // store data collected from user into an object
    var newTrain = {
        storedName: capturedName,
        storedDest: capturedDest,
        storedFirstRun: capturedFirstRun,
        storedFreq: capturedFreq,
        //return data from trainMath (array)
        storedNextTrain : retValues[0],
        storedMinsTill : retValues[1]
    };

    // upload the data to the firebase database.  The DB listener will catch this insert and update the table on-screen
    database.ref().push(newTrain);
 
    // clear form after data is entered into database
    $('#tName').val('');
    $('#tDest').val('');
    $('#tTime').val('');
    $('#tFreq').val('');

});



/* ==========================================================================
   Train Schedule Math
   ========================================================================== */

// takes intial train start time and frequency as arguments
function trainMath(firstRun, runFreq) {
    //console.log('in trainMath');

    // First Time (pushed back 1 day to make sure it comes before current time)
    var capturedTimeConverted = moment(firstRun, 'HH:mm').subtract(1, 'day');

    // Difference between the time 1 day ago and time now in minutes
    var diffTime = moment().diff(moment(capturedTimeConverted), 'minutes');

    // Time apart: difference in mins mod captured train frequency
    var tRemainder = diffTime % runFreq;
    
    // Minutes until next train
    var tMinutesTillTrain = runFreq - tRemainder;

    // Next Train exact time
    var nextTrain = moment().add(tMinutesTillTrain, 'minutes');
    nextTrain = (nextTrain).format('HH:mm');

    // since there are 2 return values, using an array
    return [nextTrain, tMinutesTillTrain];
}



/* ==========================================================================
   Update Table Fuction
   ========================================================================== */

function updateTable(tdName, tdDestination, tdFreq, tdNextTrain, tdMinsTill) {
    
    //console.log('in update table');

    // increment counter and so the table row header can be updated and entered into the table
    counter++;
 
    // append new record from listenter
    $('#myTable').append('<tr id="'+counter+'"><th scope="row">'+counter+'</th><td class=tdn>'+tdName+'</td><td class="tdd">'+tdDestination+'</td><td class="tdf">'+tdFreq+'</td><td class="tdn">'+tdNextTrain+'</td><td class="tdm">'+tdMinsTill+'</td></tr>');
 
}



/* ==========================================================================
   DB Listener for DB Changes
   ========================================================================== */

// database listener that will display updates to database as soon as detected, 'updatedData' is used in our callback function
database.ref().on('child_added', function(updatedData) {

    // Due to the setInterval function that updates the table every 1 mins, must pass 
    // each field indually to updateTable, cannot simply pass updatedData object as a whole
    var tdName = (updatedData.val().storedName);
    var tdDestination = (updatedData.val().storedDest);
    var tdFreq = (updatedData.val().storedFreq);
    var tdMinsTill = (updatedData.val().storedMinsTill);
    var tdNextTrain = (updatedData.val().storedNextTrain);

    // update the table with newly entered record
    updateTable(tdName, tdDestination, tdFreq, tdNextTrain, tdMinsTill);
    
}, function(errorObject) {
    console.log('the DB read to page failed: ', errorObject.code);
    
});



/* ==========================================================================
   Refresh Table Every 1 min
   ========================================================================== */

// this function will run automatically without being explicity called via an event or init()
var myVar = setInterval(tableRefresh, 60000);

// refresh the table with updated data
function tableRefresh() {

    console.log('in tableRefresh');

    // empty the on-screen table
    //$('#myTable').empty();  
    var localCount = 0;

    // get root of DB, this is most logical as we are not assigning ID's but letting Firebase do it
    var dataRoot = database.ref();
    // calls DB with a 'promise' (like ajax call)
    dataRoot.once('value').then(function(snapshot) {
        // iterate through the DB looking at each child, get name
        snapshot.forEach(function(childSnapshot) {
            var childData = childSnapshot.val();

            // do the math to calculate the next train and remaining mins
            var retValues = trainMath(childData.storedFirstRun, childData.storedFreq);
            
            console.log(childData.storedName, childData.storedDest, childData.storedFreq, retValues[0], retValues[1]);
            // via this loop refresh the table with newly entered record
            // each row was given an ID matching its row count
            localCount++;
           
            // by row ID, replace each row in the table, used replaceWith as append will keep adding to table
            $('tr#'+localCount).replaceWith('<tr id="'+localCount+'"><th scope="row">'+localCount+'</th><td class=tdn>'+childData.storedName+'</td><td class="tdd">'+childData.storedDest+'</td><td class="tdf">'+childData.storedFreq+'</td><td class="tdn">'+retValues[0]+'</td><td class="tdm">'+retValues[1]+'</td></tr>');
            
        });
        
    });
}



/* ==========================================================================
   Click Event on Edit Train - CRUD
   ========================================================================== */

// create modal button for train update
var mButton = $('<button>');
mButton.attr('class', 'btn btn-secondary updateTrain float-right');
mButton.attr('data-toggle','modal');
mButton.attr('data-target','#myModal');

// add ion-icon to button
var mButtonIcon = $('<ion-icon>');
mButtonIcon.attr('size','medium');
mButtonIcon.attr('name','build');
mButton.append(mButtonIcon);

// add Button to screen
$('#addTrain').append(mButton);


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

/* ==========================================================================
   Wall Clock - Displayed Above Schedule Table
   ========================================================================== */

var timerVar = setInterval(myTimer, 1000);

function myTimer() {
    var d = new Date();
    var t = d.toLocaleTimeString();
    document.getElementById('wallClock').innerHTML = t;
}