/*
 * dperuser.js
 *
 * by: Damon Getsman
 * started: 26Jan15
 * alpha phase:
 * beta phase:
 * finished:
 *
 * This file is for any of the functionality that I still need to work on that
 * will rely on per-user records.  IE: Zapped rooms/known rooms, user 'i'nfo,
 * etc.  I'll need to run through some of the issues on github and find out
 * which areas, exactly, will need to have functionality here worked with, 
 * other than those bits that I remember.
 */

load("synchronet-json.js");

var debugging = true;

userRecords = {
  //information that would be stored in 'i'nfo and 'p'rofile on a DOC style
  //BBS system

  //	----++++****====userRecords properties====****++++----
  userDir : "/sbbs/data/user/",
  debuggersFile : "ddoc-debuggers",
  maxInfoLines : 5,
  doingChars : 55,

  //	----++++****====userRecord methods====****++++----

  //	----++++****====userRecord sub-objects====****++++----

  userDataIO : {
    //pulling or pushing the information stored in the user profile/info

    //	---++++****====userDataIO methods====****++++----
    saveInfo : function(newInfo) {
	if (newInfo.length == 0) {
	  console.putmsg(red + high_intensity + "No new info found\n");
	  return 1;
	}

	try {
	  var userInfo = new File(userDir + "user" + user.number + 
				  ".ddoc-info");
	} catch (e) {
	  console.putmsg(red + "Error writing user" + user.number +
		".ddoc-info to /sbbs/data/user/ directory\nException: " +
		e.toString() + "\n"); //use constant/property above l8r
	  return -1;
	}

	//of course, there needs to be try/catching around anything like
	//this at all times (add while debugging)
	userInfo.writeln(newInfo);
	userInfo.close();
    },
    getDebuggers : function() {
	var dbgFile = new File();
	var tmpLine;
	var debugging = true;

	dbgFile.name = userRecords.userDir + userRecords.debuggersFile;

	try {
	  dbgFile.open();
	  tmpLine = dbgFile.readAll();

	  console.putmsg(yellow + tmpLine + "\n");

	  userData = JSON.parse(tmpLine);
	} catch (e) {
	  console.putmsg("Caught: " + e.message + "\t" + "#: " + e.number +
		"\tError: " + e.name + "\n");
	  dbgFile.close();
	  return -2;
	}

	dbgFile.close();

	if (debugging) {
	  console.putmsg(red + "working with: " + debuggers.toString() +
		"\n");
	}

	return userData[user.name].debug;
    },
    writeDebugger : function(uname, opts) {
	var genUserFile = new File();
	var blob, blobGuts;

	genUserFile.name = userRecords.userDir + userRecords.debuggersFile;

	try {
	  genUserFile.open();
	} catch (e) {
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  genUserFile.close();
	  return -1;
	}

	try {
	  blob = genUserFile.readAll();
	} catch (e) {
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  return -2;
	} finally {
	  genUserFile.close();
	}

	try {
	  blobGuts = JSON.parse(blob);
	  blobGuts[user.name] = opts;
	  blob = JSON.stringify(blobGuts);
	} catch (e) {
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  return -4;
	}

	try {
	  genUserFile.open();
	} catch (e) {
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  genUserFile.close();
	  return -3;
	}

	try {
	  genUserFile.write(blob);
	} catch (e) {
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  //genUserFile.close();
	  return -5;
	} finally {
	  genUserFile.close();
	}

	return 0;
    }

  },
  userDataUI : {
    //pushing/pulling output from the user (sorry, I can't stop using that
    //terminology now)

    //	  ----++++****====userDataUI methods====****++++----
    getInfo : function() {
	var uInp = new Array(), cntr = 0;

	console.putmsg(green + high_intensity + "Enter a description " +
		", up to 5 lines\n\n");

	while ((uInp[cntr] != "\r") && (uInp[cntr] != "\n") &&
	       (uInp.length < maxInfoLines)) {
	  console.putmsg(green + high_intensity + ">");
	  console.getstr(uInp[cntr++], 77);
	}

	return uInp;
    },
    queryDebugSettings : function(uname) {
	var availableOpts = { 
		"flow_control" 		:	"false",
		"message_posting"	:	"false",
		"message_scan"		:	"false",
		"instant_messaging"	:	"false",
		"navigation"		:	"false",
		"file_io"		:	"false",
		"misc"			:	"false"
	}
	var opt, done = false;

	console.putmsg(yellow + high_intensity + "Oont nao vhe vhill " +
	  "set " + uname + "'s debugging options.\n\n");

	while (!done) {
	  for each (opt in availableOpts.keys()) {
	    if (console.yesno("Would you like to help debugging " +
			      opt + "? ")) {
	      availableOpts[opt] = true;
	    }
	  }

	  if (console.noyes("Do you need to go through these again? ")) {
		done = true;
	  } 

	  this.userRecords.userDataIO.writeDebugger(uname, availableOpts);
        }
    },
    displayInfo : function() {

    }

  }

},
userConfig = {
  //'c'onfig menu stuph

  //	----++++****====userConfig properites====****++++----
  cMenu : high_intensity + green + "<a>ddress\t\t<c>lient\t\t<f>lag" +
	"\n<h>elp\t\t<i>nfo\t\t<o>ptions\n<p>asswd\t\t<q>uit\t\t" +
	"<r>eminder\n<s>ecret\t\t<t>erm\t\te<x>press\n<z>apall\n\n",
  cConfPrompt : high_intensity + yellow + "Change config -> ",

  //	----++++****====userConfig methods====****++++----
  reConfigure : function() {
	var stillAlahv = true, uResponse = null, ecode = null;

	while (stillAlahv) {
	  console.putmsg(this.cConfPrompt);
	  uResponse = console.getkey();

	  switch (uResponse) {
	    case 'i':
		//change user info
		ecode = userRecords.userDataIO.saveInfo(
				userRecords.userDataUI.getInfo());
		if (ecode == 0) {
		  console.putmsg(green + high_intensity + "User info " +
		    "updated.\n\n");
		} else {
		  stillAlahv = false;
		}
	    	break;
	    case 'q':
		//quit out of here
		stillAlahv = false;
		break;
	    case '?':
		//help--derp
		console.putmsg(this.cMenu);
		break;
	    default:
		console.putmsg(excuse);
		break;
	  }

  	}

  }

}
