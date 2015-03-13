/* rudimentary DOC interface; utilizing OO implementation nao */
/*
 * ddoc2.js
 *
 * by: Damon Getsman
 * contributing/refactoring also by: @Ntwitch (github.com)
 * started: 18aug14
 * alpha phase: 25oct14
 * beta phase: 10mar14
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
//load("load/dperroom.js");

//other includes
load("/sbbs/exec/load/sbbsdefs.js");
load("/sbbs/exec/load/nodedefs.js");

//pseudo-globals
const excuse = "\n\nNot implemented yet. . .\n\n",
	debugOnly = false, topebaseno = 6,
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
const maxnodes = 10;

var stillAlive = true;	//ask for advice on the 'right' way to do this

userSettings = null;

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
   *    pseudo-global level method exists in order to reduce redundant code by
   *    creating one global level method for exception throwing
   * setname:
   *	the exception name to be given
   * setmsg:
   *	the exception message
   * setnum:
   *	exception number
   * toString():
   *	Used for returning a concise message on the exception
   */
  dDocException : function(setname, setmsg, setnum) {
        this.name = setname;
        this.message = setmsg;
        this.number = setnum;
	
	this.toString = function () {
	    return this.name + ": " + this.message + "\t#: " + this.number;
	};
  },
	/*
	 * summary:
	 *	Method is utilized to set the BBS status correctly for
	 *	the node at whatever applicable point
	 * nodeStatus:
	 *	Found in nodedefs.js, the correct flag to set for where
	 *	we are at right now
	 */
  setNodeStatus : function(nodeStatus) {
        //set the node status
        if (userSettings.debug.misc) {
          console.putmsg(red + "Checking node #: ");
        }
        for (var ouah = 1; ouah <= maxnodes; ouah++) {
          if (userSettings.debug.misc) {
            console.putmsg(red + high_intensity + ouah + " ");
          }
          if (system.node_list[ouah].useron == user.number) {
            if (userSettings.debug.misc) {
                console.putmsg(yellow + "Hit!  Trying to set status\n");
            }
            system.node_list[ouah].action = nodeStatus;
            break;
          }
        }
  },
  /*
   * summary:
   *	Just a wrapper for console.getkey() at this point.  I honestly can't
   * 	remember why I did this now; leaving it in case I remember
   * returns:
   *	Unmodified return value from console.getkey()
   */
  getChoice : function() {
	var cmd = "";

	this.setNodeStatus(NODE_MAIN);

	do {
	  bbs.nodesync();	//check for xpress messages
	  cmd = console.inkey(K_NOECHO, 1000);
	} while (cmd == "");

	return cmd;
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
	//we need to implement paging here
	var brokenMenu = this.menu.split("\n");

	if (userSettings.debug.misc) {
	  console.putmsg(red + "console.getlines(): " + 
	    console.getlines() + "\tbrokenMenu.length: " +
	    brokenMenu.length + "\n");
	}

	for (var linecount = 0; linecount < brokenMenu.length; linecount++) {
	  /* if (Number.isInteger(linecount % (console.getlines() - 2))) {
		console.putmsg(green + "--" + high_intensity +
		  "more" + normal + green + "--");
		console.getkey();
		console.putmsg("\n"); 
	  }  THIS NEEDS TO BE FIXED */
	  console.putmsg(green + high_intensity + brokenMenu[linecount] +
	    "\n");
	}

	//console.putmsg(this.menu);
  },

  //sub-objects
  nav : {
	/*
	 * summary:
	 *	Properly sets the bbs. and user. cursub/curgrp for a given
	 *	room.
	 * room:
	 *	The msg_area.grp_list[].sub_list[] element of the room to jump
	 *	to
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
	 *	Scans through known rooms (not zapped) starting from
	 *	the current room and looks for new messages.  If new messages
	 *	are found, call setSub to point the user at the room.
	 * returns:
	 *	sub-board object if new messages were found
	 *	null if no new messages were found
	 */
    findNew : function() {
	var subList = msg_area.grp_list[bbs.curgrp].sub_list;
	var ndx = subList[bbs.cursub].index;
	var mBase;

	for ( /* ndx already set */ ; ndx < subList.length ; ndx += 1 ) {
	    // TODO: tie this into the zapped rooms list once it is finished
	    if (true /* if (room not zapped) */ ) {
		mBase = msg_base.openNewMBase(subList[ndx].code);
		if (mBase == null) break;

		if (subList[ndx].scan_ptr != mBase.total_msgs) {
		    docIface.nav.setSub(subList[ndx]);
		    mBase.close();
		    return subList[ndx];
		}
		mBase.close();
	    }
	}
	// No new messages, reset to first room
	docIface.nav.setSub(subList[0]);
	return null;
    },

	/*
	 * summary:
	 *	Displays the prompt for a string to search for in the
	 *	available message sub-boards, executes a call to the
	 *	functionality to search for it and find it, and jumps to
	 *	it, if available (via yet another call)
	 */
    jump : function() {
	var uChoice, ouah;

	bbs.log_key("J");

	console.putmsg(green + high_intensity + "Jump to forum " +
	  "name? -> ");
	try {
	  ouah = this.chk4Room(uChoice = console.getstr().toUpperCase());
	} catch (e) {
	  if (e.number == 1) {
	    console.putmsg(red + "No list returned\n");
	  } else if (e.number == 2) {
	    console.putmsg(red + high_intensity + "Room not found");
	  }

	  return;
	}

	if (userSettings.debug.navigation) {
	  console.putmsg("Got back " + ouah.name + " from chk4Room\n");
	}

	bbs.log_str("Jumped to " + this.setSub(ouah));
	return;
    },
      /*
	* summary:
	*	Mark all messages as read in the current room and
	*	call findNew() to change to the next room with unread messages
	*/
    skip: function () {
	// mark all messages as read in current room
	var mBase = msg_base.openNewMBase(bbs.cursub_code);

	if (mBase != null) {
	    msg_area.sub[bbs.cursub_code].scan_ptr = mBase.total_msgs;
	    mBase.close();
	}
	// use findNew to change to next room with unread messages
	this.findNew();
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
	  throw new dDocException("chk4Room() exception",
		"Roomlist is null", 1);
	}

	for each (var rm in rList) {
	  if (rm.description.toUpperCase().indexOf(
				srchStr.toUpperCase()) != -1) {
		if (userSettings.debug.misc) {
		  console.putmsg("Success in chk4Room()\n");
		}
		return rm;	
	  }
	}

	//bad failover method, but whatever
	throw new dDocException("chk4Room() exception", "No match", 2);
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
	 * returns:
	 *	As I redundantly and out-of-proper-orderly mentioned
	 *	above, it returns an array of sub-board objects
	 *	If running non-confined, returns null
	 */
    getRoomList : function(/*in the future, group here too*/) {
	//var debugging = true;

	if (userSettings.confined) {
	  	//damn we don't need anything complex, durrr
		if (userSettings.debug.misc) {
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
	 */
    initDdoc : function() {
	userSettings = userRecords.defaultSettings(user.number);
	try {
          userSettings = userRecords.userDataIO.loadSettings(user.number);
        } catch (e) {
	  console.putmsg(red + high_intensity +
		"Loading userSettings in initDdoc:\n");
	  console.putmsg(red + e.toString() + "\n");
	}

	if (userSettings.debug.misc) {
		userRecords.userDataUI.displayDebugFlags(user.number);
		console.putmsg("Turning off Synchronet defaults for dDoc\n");
	}
	
	this.turnOffSynchronetDefaults();
	if (userSettings.confined) {
		bbs.log_str(user.alias + " is entering dDOC shell and " +
			"confined to " + msg_area.grp_list[topebaseno].name + 
			" group");
	} else {
		bbs.log_str(user.alias + " entering dDOC shell");
	}

	//set node status here, maybe?
	docIface.setNodeStatus(NODE_MAIN);

	//turn on asynchronous message arrival
	bbs.sys_status &=~ SS_MOFF;
	//turn off time limit
	user.security.exemptions |= UFLAG_H;
	//this is how it SHOULD work, anyway

	docIface.util.preSubBoard = bbs.cursub;
	docIface.util.preMsgGroup = bbs.curgrp;
	docIface.util.preFileDir = bbs.curdir;

	if (userSettings.confined) {
	  if (userSettings.debug.flow_control) {
	    console.putmsg("Moving user to " + 
		msg_area.grp_list[topebaseno].name + ":" + 
		msg_area.grp_list[topebaseno].sub_list[0].name + "\n");
	  }
	  docIface.nav.setSub(msg_area.grp_list[topebaseno].sub_list[0]);
	}

    },
	/*
	 * summary:
	 *	method exists solely to turn off defaults from synchronet that
	 *  	are unwanted in the dDoc interface
	 */
    turnOffSynchronetDefaults : function() {
	//turn off scans
	user.settings &= ~USER_ASK_NSCAN;
	user.settings &= ~USER_ASK_SSCAN;
	user.settings &= ~USER_ANFSCAN;
	//turn off garish interface settings
	/* user.settings &= USER_NOPAUSESPIN;	//set this, too, why not
	user.settings &= USER_SPIN; */
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

	if (userSettings.debug.flow_control) {
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

	//disable H exemption in case they go back to usual shell so that
	//we can handle events, etc
	user.security.exemptions &= ~UFLAG_H;
	//restore asynchronous message status (if necessary)
	bbs.sys_status ^= SS_MOFF;

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

	if (userSettings.debug.misc) {
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

docIface.util.initDdoc();

/*
 * changing this to user.curgrp isn't going to work as the user object
 * has no curgrp.  need to find out if bbs.curgrp is going to work, and
 * if not, how do we reverse lookup a group from a sub code name
 */
if (userSettings.confined && (bbs.curgrp != topebaseno) && 
    userSettings.debug.flow_control) {
  //are we already in a dystopian area?
	console.putmsg(red + "CurGrp: " + bbs.curgrp + normal + "\n" +
		       "Trying a jump . . .\n");
	bbs.curgrp = topebaseno;
} else if (userSettings.confined && (bbs.curgrp != topebaseno)) {
	bbs.curgrp = topebaseno;
}

if (!debugOnly) {
 /* the main program loop */
 while (stillAlive) {
	if (userSettings.debug.flow_control) {
	  console.putmsg("Got " + user.cursub + " in user.cursub\n");
	}

	//dynamic prompt
	dprompt = yellow + high_intensity + msg_area.sub[user.cursub].name +
		  "> ";

	//maintenance
	bbs.main_cmds++;
	
	//check for async messages waiting
	bbs.nodesync();

	console.putmsg("\n" + dprompt);
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
		case 'k':
		case '-':
		  msg_base.entry_level.handler(uchoice);
		  break;
		//other msg base shit
		case 'j':
		//jump to new sub-board (room in DOCspeak)
		  try {
		    docIface.nav.jump();
		  } catch (e) {
		    console.putmsg(red + "Error in jump()\n" + e.message +
			"\t#: " + e.number + "\n");
		  }
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
		  wholist.list_long(wholist.populate());
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
		  console.putmsg(green + high_intensity + "Skip room\n");
		  /*  temp remove to make skip act like vDOC
		  if (docIface.nav.skip() == null) {
		      docIface.nav.setSub(msg_area.grp_list[bbs.curgrp].sub_list[0]);
		  }
		  */
		  docIface.nav.skip();
		  break;
		case 'c':
		  userConfig.reConfigure();
		  break;
		case 'D':
		  console.putmsg(green + high_intensity + "Change doing field\n");
		  userSettings.doing = userRecords.userDataUI.getDoing();
		  try {
		    userRecords.userDataIO.saveSettings(user.number,
			  userSettings);
		      // next line will not execute if there is an exception
		      // while saving
		      console.putmsg(green + high_intensity + "Doing field " +
			    "updated.\n\n");
		  } catch (e) {
		      console.putmsg(red + "Exception saving settings: "
			    + e.toString() + "\n");
		  }
		  break;
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


