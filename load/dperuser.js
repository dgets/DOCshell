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

var debugging = true;

userRecords = {
  //information that would be stored in 'i'nfo and 'p'rofile on a DOC style
  //BBS system

  //	----++++****====userRecords properties====****++++----
  userDir : "/sbbs/data/user/",
  debuggersFile : "ddocdbgr",
  maxInfoLines : 5,
  doingChars : 55,

  //	----++++****====userRecord methods====****++++----

  //	----++++****====userRecord sub-objects====****++++----

  userDataIO : {
    //pulling or pushing the information stored in the user profile/info

    //	---++++****====userDataIO methods====****++++----
	/*
	 * summary:
	 *	saveInfo() takes your passed text and saves it to
	 *	the user dir under a file called user#.ddoc-info
	 * newInfo:
	 *	array of the new lines of text to save as the user's
	 *	current info string
	 * returns:
	 *	-1 upon error writing, else 0
	 */
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

	return 0;
    },
	/*
	 * summary:
	 *	method retrieves the debugging statistics for the
	 *	current user
	 * returns:
	 *	the per-user sub-object starting after .debug; thus
	 *	basically a list of properties w/boolean values as to
	 *	whether or not they are debugging each type of code.
	 *	Negative values, as usual, are indicative of error caught
	 */
    getDebuggers : function() {
	var dbgFile = new File(userRecords.userDir + 
			       userRecords.debuggersFile);
	var tmpLine;
	var debugging = true;

	try {
	  dbgFile.open("r");
	  tmpLine = dbgFile.readln();

	  console.putmsg(red + "tmpLine: " + tmpLine + "\n");
	  console.putmsg(yellow + tmpLine + "\n");

	  userData = JSON.parse(tmpLine);
	} catch (e) {
	  console.putmsg(red + "In getDebuggers():\n");
	  console.putmsg("Caught: " + e.message + "\t" + "#: " + e.number +
		"\tError: " + e.name + "\n");
	  dbgFile.close();
	  return -2;
	}

	while ((!dbgFile.eof) && (userData.user != user.name)) {
	  try {
	    tmpLine = dbgFile.readln();
	    userData = JSON.parse(tmpLine);
	  } catch (e) {
	    console.putmsg(red + "Error reading tmpLine (2nd+ try):\n" +
		"Caught: " + e.message + "\t#: " + e.number + "\tError: " +
		e.name + "\n");
	    console.putmsg(red + high_intensity + "Got JSON: " +
		userData.toString() + "\n\n");
	    dbgFile.close();
	    return -3;
	  }
	}

	/* while ((userData != user.name) && (tmpLine != null)) {
	  try {
	    tmpLine = dbgFile.readln();
	    userData = JSON.parse(tmpLine);
	  } catch (e) {
	    console.putmsg(red + "Error reading tmpLine (later):\n" +
		"Caught: " + e.message + "\t#: " + e.number + "\tError: " +
		e.name + "\n");
	    dbgFile.close();
	    tmpLine = null;
	    return 0;
	  }
	} */

	dbgFile.close();

	return userData.debug;
    },
	/*
	 * summary:
	 *	method reads in the current list of per-user options,
	 *	parses them into an object, changes whatever options are
	 *	currently being utilized by that user, and re-writes the
	 *	JSON blob back to the file with changes made
	 * uname:
	 *	user whose data is being changed
	 * opts:
	 *	object full of the user's options to be changed to
	 * returns:
	 *	-1 for error opening the per-user data file
	 *	-2 for error reading from the per-user data file
	 *	-3 for error re-opening file after closing in the
	 *	   preceding 'finally' block
	 *	-4 for error parsing the JSON
	 *	-5 for error writing the blob back to disk
	 *	0 for alles ist sehr gut
	 */
    writeDebugger : function(uname, opts) {
	var genUserFile = new File();
	var blob, blobGuts;

	genUserFile.name = userRecords.userDir + userRecords.debuggersFile;

	try {
	  genUserFile.open();
	} catch (e) {
	  console.putmsg(red + "In writeDebugger():\n");
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  genUserFile.close();
	  return -1;
	}

	try {
	  blob = genUserFile.readAll();
	} catch (e) {
	  console.putmsg(red + "In writeDebugger() (#2):\n");
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
	  console.putmsg(red + "In writeDebugger() (#3):\n");
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  return -4;
	}

	try {
	  genUserFile.open();
	} catch (e) {
	  console.putmsg(red + "In writeDebugger() (#4):\n");
	  console.putmsg("Caught: " + e.message + "\t#: " + e.number +
		"\tError: " + e.name + "\nReturning w/error\n");
	  genUserFile.close();
	  return -3;
	}

	try {
	  genUserFile.write(blob);
	} catch (e) {
	  console.putmsg(green + "In writeDebugger() (#5):\n");
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
	/*
	 * summary:
	 *	obtains a new list of lines of text to utilize as the
	 *	info field from the user
	 * returns:
	 *	this (up to 5 line) array of user info text
	 */
    getInfo : function() {
	var uInp = new Array(), cntr = 0;

	console.putmsg(green + high_intensity + "Enter a description " +
		", up to 5 lines\n\n");

	while ((uInp[cntr] != "\r") && (uInp[cntr] != "\n") &&
	       (uInp.length < userRecords.maxInfoLines)) {
	  console.putmsg(green + high_intensity + ">");
	  console.getstr(uInp[cntr++], 77);
	}

	return uInp;
    },
	/*
	 * summary:
	 *	queries the user for whether or not they want the true
	 *	or false value set on each debugging option; security
	 *	level checking will have to be put in here at some point
	 *	before beta deployment
	 * uname:
	 *	name of the user whose debug flags are being set
	 */
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
	    //so yeah this can be taken care of a lot more efficiently :|
	    if (console.yesno("Would you like to help debugging " +
			      opt + "? ")) {
	      availableOpts[opt] = true;
	    }
	  }

	  if (console.noyes("Do you need to go through these again? ")) {
		done = true;
	  } 

        }

	this.userRecords.userDataIO.writeDebugger(uname, availableOpts);
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
	/*
	 * summary:
	 *	menu choice response for user configuration options
	 */
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
