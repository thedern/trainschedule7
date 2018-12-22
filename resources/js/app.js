/* ==========================================================================
   Global
   ========================================================================== */
// global counter variable so does not get reset to 0 in function call
var counter = 0;
// trainID for used in CRUD functions
var trainID;

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

    // create ID for each Train
    
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

function updateTable(tdName, tdDestination, tdFreq, tdNextTrain, tdMinsTill, key) {
    
    //console.log('in update table');

    // increment counter and so the table row header can be updated and entered into the table
    counter++;
 
    // append new record from listenter
    $('#myTable').append('<tr id="'+counter+'"><th scope="row">'+counter+'</th><td class=tdn>'+tdName+'</td><td class="tdd">'+tdDestination+'</td><td class="tdf">'+tdFreq+'</td><td class="tdn">'+tdNextTrain+'</td><td class="tdm">'+tdMinsTill+'</td><td><ion-icon class="editBtn" id="'+key+'" size="medium" name="build"></ion-icon></td></tr>');

 
}



/* ==========================================================================
   DB Listener for DB Changes
   ========================================================================== */

// database listener that will display updates to database as soon as detected, 'updatedData' is used in our callback function
database.ref().on('child_added', function(updatedData) {

    // Due to the setInterval function that updates the table every 1 mins, must pass 
    // each field indually to updateTable, cannot simply pass updatedData object as a whole
    var key = updatedData.ref.key;
    var tdName = (updatedData.val().storedName);
    var tdDestination = (updatedData.val().storedDest);
    var tdFreq = (updatedData.val().storedFreq);
    var tdMinsTill = (updatedData.val().storedMinsTill);
    var tdNextTrain = (updatedData.val().storedNextTrain);

    
    // update the table with newly entered record
    updateTable(tdName, tdDestination, tdFreq, tdNextTrain, tdMinsTill, key);
    
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
            // get key value of each object entry in DB
            var key = childSnapshot.ref.key;
            var childData = childSnapshot.val();
            // do the math to calculate the next train and remaining mins
            var retValues = trainMath(childData.storedFirstRun, childData.storedFreq);
            
            // console.log(childData.storedName, childData.storedDest, childData.storedFreq, retValues[0], retValues[1]);
            // within loop, refresh the table with updated record, each row was given an ID matching its row count
            localCount++;
           
            // by row ID, replace each row in the table, used replaceWith as append will keep adding to table
            $('tr#'+localCount).replaceWith('<tr id="'+localCount+'"><th scope="row">'+localCount+'</th><td class=tdn>'+childData.storedName+'</td><td class="tdd">'+childData.storedDest+'</td><td class="tdf">'+childData.storedFreq+'</td><td class="tdn">'+retValues[0]+'</td><td class="tdm">'+retValues[1]+'</td><td><ion-icon class="editBtn" id="'+key+'" size="medium" name="build"></ion-icon></td></tr>');
            
        });
        
    });
}



/* ==========================================================================
   Click Event on Edit Train - CRUD
   ========================================================================== */

// click the editBtn td cell, trigger modal
$(document).on('click', '.editBtn', function() {
    //console.log('this is ',$(this).attr('id'));
    trainID = $(this).attr('id');
    $('#myModal').modal('toggle');
    
});

// delete train from DB
$('#myModal').on('click', '#delTrain', function() {
    console.log(trainID);
    database.ref(trainID).remove();
    // refresh table to display changes
    tableRefresh();
});

// collect update information from modal after the update button has been clicked
$('#myModal').on('click','#submitUpdateData', function(e) {
    e.preventDefault();
    var uName = $('#updateTNames').val().trim();
    var uDest = $('#updateTDest').val().trim();
    var uTime = $('#updateTTime').val().trim();
    var uFreq = parseInt($('#updateTFreq').val().trim());

    // store updated data
    if ((uName.length !== 0 && uTime.length !== 0 && uFreq !== 0 && uDest.length !== 0)) {
        
        // do math to update the train's schedule based on initial schedule start time and run frequency
        var retValues = trainMath(uTime, uFreq);
        database.ref(trainID).update( {
            storedName: uName,
            storedDest: uDest,
            storedFirstRun: uTime,
            storedFreq: uFreq,
            toredNextTrain : retValues[0],
            storedMinsTill : retValues[1]
        });
        
    } else {
        alert('For the sake of he developers laziness, please update all data');
       
    }

    // refresh table to display changes
    tableRefresh();

    // clear modal
    $('#updateTNames').val('');
    $('#updateTDest').val('');
    $('#updateTTime').val('');
    $('#updateTFreq').val('');

    
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