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
	  var userInfo = new File("user" + user.number + ".ddoc-info");
	} catch (e) {
	  console.putmsg(red + "Error writing user" + user.number +
		".ddoc-info to /sbbs/user/ directory\nException: " +
		e.toString() + "\n");
	  return -1;
	}

	//of course, there needs to be try/catching around anything like
	//this at all times (add while debugging)
	userInfo.writeln(newInfo);
	userInfo.close();
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
	  console.putmsg(cConfPrompt);
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
	    default:
		console.putmsg(excuse);
		break;
	  }

  }

}
