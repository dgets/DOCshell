/* rudimentary DOC interface; utilizing OO implementation nao */
/*
 * ddoc2.js
 *
 * by: Damon Getsman
 * started: 18aug14
 * alpha phase: 25oct14
 * beta phase: 
 * finished:
 *
 * a slightly more organized attempt to emulate the DOC shell from
 * within Synchronet's SSJS libraries and functionality
 */

//includes
load("load/dmbase.js");
load("load/dpoast.js");
load("load/dexpress.js");
load("load/dperuser.js");

//pseudo-globals
const excuse = "\n\nNot so fast . . .\n\n",
	debugOnly = false, confine_messagebase = true, topebaseno = 6,
	alwaysLogout = false, std_logging = true;

//a few easier hooks for the ctrl-a codes
const ctrl_a = "\1";
const green = ctrl_a + "g", yellow = ctrl_a + "y", blue = ctrl_a + "b",
        white = ctrl_a + "w", red = ctrl_a + "r", cyan = ctrl_a + "c",
        magenta = ctrl_a + "m", high_intensity = ctrl_a + "h",
	normal = ctrl_a + "n";
const debugFields = ["flow_control", "message_posting", "message_scan",
		     "instant_messaging", "navigation", "file_io", "misc"];
const readlnMax = 1536;

var stillAlive = true;	//ask for advice on the 'right' way to do this

localdebug = null;	// don't need --> , userData = null;

/*
 * obviously, with all of the other places that we've got debugging
 * referenced, we need to go around and make them dependent upon this, 
 * even before we start introducing granularity into the whole mixture
 */

docIface = {
  //top level menu
  //menu properties
  menu :  green + high_intensity +
       //$ctrl_a + "g" + "\n" + "<A>\tSysop commands\n" +
       "\n\n<B>\tChange eXpress beeps\n<b>\tRead forum backward\n" +
       "<C>\tConfig menu\n<D>\tchange Doing field\n" +
       "<^E>\tEnter message with header\n<e>\tenter message normally" +
       "\n<E>\tenter (upload)\n<f>\tread forum forward\n" +
       "<F>\tshow Fortune\n<G>\tGoto next room\n" +
       "<Q>\tAsk a question of a guide\n<i>\tforum information\n" +
       "<j>\tjump to a room name/number\n<k>\tknown rooms list\n" +
       "<l>\tlogout\n<N>\tselect new shell\n" +
       "<n>\tread new msgs\n<o>\tread old msgs reverse" +
       "\n<p>\tprofile user\n<P>\tprofile user (full info)\n" +
       "<s>\tskip room\n<S>\tskip to\n<t>\tCurrent time\n" +
       "<u>\tungoto last room\n<v>\texpress -1\n<w>\tWho's online?\n" +
       "<W>\tshort wholist\n<x>\tsend eXpress message\n" +
       "<X>\ttoggle eXpress status\n<^X>\tcheck old X messages\n" +
       "<y>\tyell\n<z>\tzaproom\n<0-9>\tquickX\n<#>\tRead room by " +
       "number\n<->\tread last n messages\n<%>\ttoggle guideflag " +
       "status\n<@>\taidelist\n<\">\tquote Xes to Sysop\n\n",
  sprompt : high_intensity + yellow + "<A>" + green + "bort " +
       yellow + "<C>" + green + "ontinue " + yellow + "<P>" +
       green + "rint " + yellow + "<S>" + green + "ave " + yellow +
       "<X>" + green + "press -> ",

  //		----++++****====menu methods====****++++----
  /*
   * summary:
   *      global level method exists in order to reduce redundant code by
   *      creating one global level method for exception throwing
   */
  dDocException : function(name, msg, num) {
        this.name = name;
        this.message = msg;
        this.number = num;
  },
  /*
   * summary:
   *	Just a wrapper for console.getkey() at this point.  I honestly can't
   * 	remember why I did this now; leaving it in case I remember
   * returns:
   *	Unmodified return value from console.getkey()
   */
  getChoice : function() {
	return (console.getkey());
  },
  /*
   * summary:
   *	Just to avoid duplicating too much code when logging needs to
   *	be done for both a string and a keystroke afterwards
   * str:
   *	String value
   * key:
   *	Character value
   * returns: nonzero on error
   */
  log_str_n_char : function(str, key) {
	try {
	  bbs.log_str(str);
	  bbs.log_key(key);
	} catch (e) {
	  system.log("TTBBS Error " + e.description +
		" when trying to save str+key to log");
	  return -1;
	}

	return 0;
  },
  /*
   * summary:
   *	Simply displays the docIface top level property 'menu'
   */
  doMainMenu : function() {
	bbs.log_key("?");
	console.putmsg(this.menu);
  },

  //sub-objects
  nav : {
	/*
	 * summary:
	 *	Properly sets the bbs. and user. cursub/curgrp for a given
	 *	room.
	 * room:
	 *	The msg_area.grp_list[].sub_list[] element of the room to jump to.
	 * returns:
	 *	String of the human-readable sub name.
	 */
    setSub : function(room) {
	if (room === null) return "";
	
	bbs.curgrp = room.grp_number;
	bbs.cursub = room.index;
	user.cursub = bbs.cursub_code;
	
	return room.name;
    },
	/*
	 * summary:
	 *	Displays the prompt for a string to search for in the
	 *	available message sub-boards, executes a call to the
	 *	functionality to search for it and find it, and jumps to
	 *	it, if available (via yet another call)
	 * returns:
	 *	boolean true or false regarding success in finding the
	 *	string and executing the sub-board change; not sure if
	 *	there will be a reason to test for it or not
	 */
    jump : function() {
	var uChoice, ouah;

	bbs.log_key("J");

	console.putmsg(green + high_intensity + "Jump to forum " +
	  "name? -> ");
	ouah = this.chk4Room(uChoice = console.getstr().toUpperCase());

	if (localdebug.navigation) {
	  console.putmsg("Got back " + ouah.name + " from chk4Room\n");
	}

	if (ouah == null) {
	  console.putmsg(red + "No list returned\n");
	  return -1;
	} else if (ouah == -1) {
	  console.putmsg(yellow + high_intensity + "Room not found\n");
	  return -2;
	} else {
	  //let's go
	  bbs.log_str("Jumped to " + setSub(ouah));
	}
    },
	/*
	 * summary:
	 *	Pulls a list of rooms, locates the current one, leaves
	 *	current room for the next one in linear fashion, looping
	 *	back to lobby if there is no other room remaining.
	 *	NOTE: This will require heavy modification when
	 *	used in a non-confined environment
	 * confined:
	 *	boolean depending on confinement status (currently
	 *	ignored
	 * returns:
	 *	code for the room (in case other operations need to be
	 *	performed upon that message base by the calling code)
	 */
    skip : function(confined) {
	var rList = docIface.util.getRoomList(confined);
	var ndx = 0, success = false;

	if (localdebug.navigation || localdebug.message_scan) {
	  console.putmsg(red + "Entered docIface.nav.skip(), " +
	    "looking for: " + user.cursub + "\n");
	}

	if (rList === 0) {
	  console.putmsg(red + high_intensity + "Got a null " + 
	    "for the list of rooms that was returned; wut?\n");
	}

	for each (rm in rList) {
	  ndx++;
	  if (localdebug.navigation || localdebug.message_scan) {
	    console.putmsg(yellow + ndx + ": " + rm.name + 
		"\n");
	  }
          if (success || (rm.name.indexOf(user.cursub) == 0)) {
              if (localdebug.navigation || localdebug.message_scan) {
                console.putmsg(yellow + "Skipping to " +
                  rm.name + "\n");
              }
              setSub(rm);
              break;
          }

	  //let's try out the experimental technology
	  if (rm.name.indexOf(user.cursub) == 0) {
	    if (localdebug.navigation || localdebug.message_scan) {
	      console.putmsg(yellow + "Found current sub " +
		user.cursub + " in the list\n");
	    }
	    success = true;
	    if (ndx == rList.length) {
		setSub(rList[0]);
		break;
	    } else {
		if (localdebug.navigation || localdebug.message_scan) {
		  console.putmsg(red + "Setting user.cursub to " +
			user.cursub + "\n");
		}

		setSub(rList[ndx]);
	   	break;
	    }
	  }

	  //I know that's a horrible way to do this, it's just early in
	  //the morning and I haven't had enough coffee to process it
	  //better yet.  :P

	  if (localdebug.message_scan) {
	    console.putmsg(red + "rm.cfg.code to return is: " +
		rm.cfg.code + "\n");
	  }

	  return rm.cfg.code;
	}

    },
	/*
	 * summary:
	 *	Searches for the substring within the list of available 
	 *	sub-boards
	 * srchStr:
	 *	Substring to search for
	 * returns:
	 *	The object for the sub-board if a match, null if rList
	 *	doesn't come back decently, -1 if no match is found
	 *	within a valid list
	 */
    chk4Room : function (srchStr) {
	var rList = docIface.util.getRoomList(true);

	if (rList == null) {
	  return null;
	}

	for each (var rm in rList) {
	  if (rm.description.toUpperCase().indexOf(
				srchStr.toUpperCase()) != -1) {
		if (localdebug.misc) {
		  console.putmsg("Success in chk4Room()\n");
		}
		return rm;	
	  }
	}

	//bad failover method, but whatever
	return -1;
    }
  },
  util : {
	//	--++==**properties**==++--

    preSubBoard : null, 
    preFileDir : null, 
    preMsgGroup : null,

	/*
	 * summary:
	 *	Returns an array of message rooms that are
	 *	accessible; this will be extended as functionality for
	 *	not being confined is expanded.  Also, this may be
	 *	useful in the future for listKnown() and other routines
	 *	in dmbase.js that are recreating the wheel a bit
	 * confined:
	 *	Same as usual; boolean showing whether or not we're in a
	 *	confined instance of ddoc
	 * returns:
	 *	As I redundantly and out-of-proper-orderly mentioned
	 *	above, it returns an array of sub-board objects
	 *	If running non-confined, returns null
	 */
    getRoomList : function(confined /*in the future, group here too*/) {
	//var debugging = true;

	if (confined) {
	  	//damn we don't need anything complex, durrr
		if (localdebug.misc) {
		  console.putmsg(red + "Working with sub list: " +
			msg_area.grp_list[topebaseno].sub_list.toString() +
			"\n");
		}
		return msg_area.grp_list[topebaseno].sub_list;
	} else {
		return null;
	}
    },
	/*
	 * summary:
	 * 	Saves the settings that we want to restore upon exit from the
	 * 	ddoc shell; not sure if this is going to work properly due to
	 * 	JavaScript scope, this is kind of pushing the limits of what
	 * 	I know off the top of my head.  This could also be stored to
	 * 	a scratchpad in the $SBBSHOME/user/ directory, as well.
	 * confined:
	 *	Boolean indicating whether or not this instance is
	 *	confined
	 */
    initDdoc : function(confined) {
	try {
          localdebug = userRecords.userDataIO.getUserInfo();
        } catch (e) {
	  console.putmsg(red + high_intensity + "In initDdoc:\n");
	  console.putmsg(red + "Error: " + e.message + "\t#: " + e.number +
	    "\tName: " + e.name + "\n");
	}

	if (localdebug != null) {
	  userRecords.userDataUI.displayDebugFlags();
          /*console.putmsg("localdebug.message_scan holds: " + 
		localdebug.message_scan + "\n"); */
	} /* else {
	  //call the configuration setting if security access allows
	  //NOTE: This is just an interim solution; there's probably something
	  //better to do with it later on
	  if (user.security.level >= 70) {
		console.putmsg(red + "Not changing debugging settings as " +
		  "this is being called via bogus logic currently\n");
		//localdebug = 
			//userRecords.userDataUI.queryDebugSettings(user.alias);
	  } else {
		for each (dbgProp in debugFields) {
			localdebug.debug[dbgProp] = false;
		}
	  }
	}

	removing this currently because we don't want to waste time in this
	bogus routine when we're not even readding debuggers correctly
	*/

	//console.putmsg("localdebug: " + localdebug.toString() + "\n");

	if (confined) {
		bbs.log_str(user.alias + " is entering dDOC shell and " +
			"confined to " + msg_area.grp_list[topebaseno].name + " group");
	} else {
		bbs.log_str(user.alias + " entering dDOC shell");
	}

	docIface.util.preSubBoard = bbs.cursub;
	docIface.util.preMsgGroup = bbs.curgrp;
	docIface.util.preFileDir = bbs.curdir;

	if (confined) {
	  if (localdebug.flow_control) {
	    console.putmsg("Moving user to " + msg_area.grp_list[topebaseno].name + msg_area.grp_list[topebaseno].sub_list[0] + "\n");
	  }
	  docIface.nav.setSub(msg_area.grp_list[topebaseno].sub_list[0]);
	}

    },
	/*
	 * summary:
	 *	Restores settings that were detected at first going into
	 *	ddoc, in order to restore functionality to where it was
	 *	left off for somebody that may be jumping between
	 *	shells, or the like.  As mentioned above; this may be
	 *	out of scope and needing a better solution.
	 */
    quitDdoc : function() {
	bbs.log_str(user.alias + " is leaving dDOC shell");
	bbs.log_key("L");

	if (localdebug.flow_control) {
	  console.putmsg(red + "\nRestoring bbs.* properties:\n" + 
	    " bbs.cursub: " + docIface.util.preSubBoard + "\n" + 
	    " bbs.curgrp: " + docIface.util.preMsgGroup + "\n" + 
	    " bbs.curdir: " + docIface.util.preFileDir + "\n");
	}

	//restore initial settings prior to exit
	bbs.cursub = docIface.util.preSubBoard;
	user.cursub = bbs.cursub_code;
	bbs.curgrp = docIface.util.preMsgGroup;
	bbs.curdir = docIface.util.preFileDir;

	console.putmsg(blue + high_intensity + "\n\nHope to see you " +
                "again soon!\n\nPeace out!\n");

	bbs.logout();
    },
	/*
	 * summary:
	 *	Searches the correct file in /sbbs/user for the proper
	 *	block of information regarding the current sub/room and
	 *	displays that information with proper DOC-ish heading
	 *	information.
	 */
    dispRoomInfo : function() {
	bbs.log_key("I");

	if (localdebug.misc) {
	  console.putmsg(red + "Entered 'i'nfo (dispRoomInfo()) in " +
		"docIface.util\n");
	}

	//take care of the header
	console.putmsg(green + high_intensity + "Forum Info\n\nForum " +
		"moderator is " + cyan + "<not implemented> " + green +
		" Total messages: " + red + "<not implemented>\n" +
		green + "Forum info last updated: " + magenta +
		"<not implemented> " + green + "by " + cyan +
		"<not implemented>\n\n");

	//here we'll actually pull the room info
    }
	
  }
}

//		---+++***===Execution Begins===***+++---

var preSubBoard, preFileDir, preMsgGrp;
var uchoice;

//save initial conditions

docIface.util.initDdoc(confine_messagebase);

/*
 * changing this to user.curgrp isn't going to work as the user object
 * has no curgrp.  need to find out if bbs.curgrp is going to work, and
 * if not, how do we reverse lookup a group from a sub code name
 */
if (confine_messagebase && (user.curgrp != topebaseno) && 
    localdebug.flow_control) {
  //are we already in a dystopian area?
	console.putmsg(red + "CurGrp: " + bbs.curgrp + normal + "\n" +
		       "Trying a jump . . .\n");
	bbs.curgrp = topebaseno;
} else if (confine_messagebase && (bbs.curgrp != topebaseno)) {
	bbs.curgrp = topebaseno;
}

if (!debugOnly) {
 /* the main program loop */
 while (stillAlive) {
	if (localdebug.flow_control) {
	  console.putmsg("Got " + user.cursub + " in user.cursub\n");
	}

	//dynamic prompt
	dprompt = yellow + high_intensity + user.cursub
	  //msg_area.grp_list[bbs.curgrp].sub_list[user.cursub]
	  + "> ";

	//maintenance
	bbs.main_cmds++;
	
	//check for async messages waiting
	bbs.nodesync();

	console.putmsg(dprompt);
	uchoice = docIface.getChoice();
	//poor aliasing
	if (uchoice == ' ') {
	  uchoice = 'n';
	}

	switch (uchoice) {
		//top menu
		case '?' :
		  docIface.doMainMenu();
		  break;
		//message base entry commands
		case 'b':
		case 'e':
		case 'E':
		case 'r':
		case 'n':
		case 'o':
		case '-':
		  msg_base.entry_level.handler(uchoice, confine_messagebase);
		  break;
		//other msg base shit
		case 'j':
		//jump to new sub-board (room in DOCspeak)
		  docIface.nav.jump();
		  break;
		//list known
		case 'k':
		  msg_base.entry_level.listKnown(confine_messagebase);
		  break;
		//logout
		case 'l':
		  console.putmsg(yellow + high_intensity + "Logout: \n");
		  if (!console.noyes("Are you sure? ")) {
		    docIface.util.quitDdoc();
		    stillAlive = false;
		  } else {
		    console.putmsg(green + high_intensity +
			"Good choice.  ;)\n");
		  }
		  break;
		case 'w':
		  wholist.list_long();
		  break;
		case 'x':
		  express.sendX();
		  break;
		case 'W':
		  wholist.list_short(wholist.populate());
		  break;
		case 'y':
		  poast.yell();
		  break;
		case 'N':
		  bbs.select_shell();
		  /*
		   * please note that after my torpor finishes and I get
		   * back on this tomorrow that this also requires a call
		   * to resetting the defaults/logout procedure for dDOC,
		   * and then finally (perhaps alternate way to dump the
		   * active shell) and then to respawn the user's newly
		   * selected shell; talk to the dues on Synchronet IRC
		   * about the best way to handle this or look in the 
		   * classic shell code
		   */
		  docIface.util.quitDdoc();
		  stillAlive = false;
		  break;
		case 's':
		  docIface.nav.skip(confine_messagebase);
		  break;
		case 'c':
		  userConfig.reConfigure(); 
		default:
		  console.putmsg(excuse);
		  break;
	}
 }
} else {
 if (dMBTesting.init() != 0) {
	console.putmsg(red + "\n\nFUCK\n\n" + normal);
 } else {
	console.putmsg(yellow + "\nCzech and see if it's where it " +
		       "should be theyah, budday\n\n" + normal);
 }
}

console.putmsg(yellow + high_intensity + "\n\nGoodbye!\n");
if (alwaysLogout) {
	bbs.logout();
}


