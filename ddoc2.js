/* rudimentary DOC interface; utilizing OO implementation nao */
/*
 * ddoc2.js
 *
 * by: Damon Getsman
 * contributing/refactoring also by: @Ntwitch (github.com)
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
load("load/dmail.js");
load("load/dpoast.js");
load("load/dexpress.js");
load("load/dperuser.js");
load("load/dperroom.js");

//other includes
load("/sbbs/exec/load/sbbsdefs.js");
load("/sbbs/exec/load/nodedefs.js");

//pseudo-globals
const excuse = "\n\nThe rothe strikes!  You die!. . .\n\n",
	debugOnly = false, topebaseno = 6,
	alwaysLogout = false, std_logging = true, maxMsgs = 500;

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

userSettings = null; roomSettings = { }; zappedRooms = null;

/*
 * summary:
 *      Top level object for globals and primary program control flow/menu
 */
docIface = {
  //top level menu
  /*
   * summary:
   *    Top-level menu contained within a string
   */
  menu :  green + high_intensity +
       //$ctrl_a + "g" + "\n" + "<A>\tSysop commands\n" +
       "\n\n<B>\tChange eXpress beeps\n<b>\tRead forum backward\n" +
       "<C>\tConfig menu\n<D>\tchange Doing field\n" +
       "<^E>\tEnter message with header\n<e>\tenter message normally" +
       "\n<E>\tenter (upload)\n<f>\tread forum forward\n" +
       "<F>\tshow Fortune\n<G>\tGoto next room\n" +
       "<Q>\tAsk a question of a guide\n<i>\tforum information\n" +
       "<I>\tchange forum information\n" +
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
       "status\n<@>\taidelist\n<\">\tquote Xes to Sysop\n" +
       "<$>\tchange debugging settings\n\n",
  /*
   * summary:
   *    Save text prompt
   */
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
	 * nodeAction:
	 *	Found in nodedefs.js, the correct flag to set for where
	 *	we are at right now
	 */
  setNodeAction : function(nodeAction) {
        //set the node status
        if (userSettings.debug.misc) {
          console.putmsg(red + "Using node #: " + bbs.node_num + "\n");
        }
	bbs.node_action = nodeAction;
	system.node_list[bbs.node_num - 1].action = bbs.node_action;
  },
  /*
   * summary:
   *	Just a wrapper for console.getkey() at this point.  This is utilized for
   *	any prompting situation where we want to be able to make sure that we're
   *	going to receive any X messages (or telegrams/messages or other inter-
   *	node communication) while the prompt is waiting for something from the
   *	user
   * return:
   *	Unmodified return value from console.getkey()
   */
  getChoice : function() {
	var cmd = "";

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
   *
   * NOTE: This might be broken in some areas; as I was doing the documentation
   *       pass I decided to change this one to throw an exception on error and
   *       ditch the return codes since it was so rudimentary
   */
  log_str_n_char : function(str, key) {
	try {
	  bbs.log_str(str);
	  bbs.log_key(key);
	} catch (e) {
	  system.log("TTBBS Error " + e.description +
		" when trying to save str+key to log");
	  throw new dDocException("log_str_n_char() Error", e.message, 1);
	}

	//return 0;
  },
  /*
   * summary:
   *	Simply displays the docIface top level property 'menu'
   * NOTE:
   *    See the commented out area where things need to be fixed in order to
   *    implement pausing (I think that's what it was working with, anyway)
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
	 * return:
	 *	String of the human-readable sub name.
	 */
    setSub : function(room) {
	if (room === null) {
	  throw new dDocException("setSub() error", "Passed null room", 1);
	}

	if (room != "Mail") {
	  bbs.curgrp = room.grp_number;
	  bbs.cursub = room.index;
	  user.cursub = bbs.cursub_code;
	  return room.name;
	} else {
	  return "Mail";
	}
    },
    	/*
	 * summary:
	 *	Scans through known rooms (not zapped) starting from
	 *	the current room and looks for new messages.  If new messages
	 *	are found, call setSub to point the user at the room.
	 * return:
	 *	sub-board object if new messages were found
	 *	null if no new messages were found
	 */
    findNew : function() {
	var subList = msg_area.grp_list[bbs.curgrp].sub_list;
	var ndx = subList[bbs.cursub].index;
	var mBase;

	if (userSettings.debug.message_scan) {
	  console.putmsg(yellow + "Entering findNew()\nWorking with subList" +
	    " of length " + subList.length + "; contents:\n");
          for each(var tmpSub in subList) {
              console.putmsg("* " + cyan + tmpSub.name + "\n");
          }
          console.putmsg("\n");
	}

	for ( /* ndx already set */ ; ndx < subList.length ; ndx += 1 ) {
	    if (userSettings.debug.navigation) {
		console.putmsg(yellow + /*msg_area.sub[bbs.cursub_code].index*/
		  + ndx + ": " + roomData.tieIns.isZapped(ndx)
					/*msg_area.sub[bbs.cursub_code].index)*/
		  + "\n");
	    }

	    if (!roomData.tieIns.isZapped(ndx)) {
		mBase = msg_base.util.openNewMBase(subList[ndx].code);

		if (userSettings.debug.navigation) {
		  console.putmsg("Room not zapped\t\tscan_ptr: " +
                      subList[ndx].scan_ptr + "\t\ttotal: " +
                      mBase.total_msgs + "\n");
		}
                
                if (mBase == null) {
		  break;
		}

		if (subList[ndx].scan_ptr < mBase.total_msgs) {
		    docIface.nav.setSub(subList[ndx]);
		    mBase.close();
		    return subList[ndx];
		} else if (subList[ndx].scan_ptr > mBase.total_msg) {
                    //we've got some corrupt shit to fix here; not sure how it
                    //happened but we might as well have a way to fix it
                    subList[ndx].scan_ptr = mBase.first_msg;
                    if (userSettings.debug.navigation) {
                        console.putmsg(yellow + " just fixed scan ptrs\n");
                    }
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

        console.putmsg(red + "Entered right code\n");

	if (userSettings.debug.navigation) {
	  console.putmsg(green + "Entered jump()\n");
	}

	bbs.log_key("J");

	console.putmsg(green + high_intensity + "Jump to forum " +
	  "name? -> ");

	uChoice = console.getstr().toUpperCase();
	if (uChoice == "MAIL") {
	  if (userSettings.debug.navigation) {
	    console.putmsg("Entering Mail> code\n");
	  }

	  if (uMail.readMail() == -1) {
	    if (userSettings.debug.navigation) {
		console.putmsg(red + "Logout requested from Mail> code\n");
	    }
	    docIface.util.quitDdoc();
	  }
	  ouah = "Mail";	//vestigial?
	} else if (uChoice == "") {
          //abort
          console.putmsg(yellow + "Aborted jump to new room . . .\n");
          return;
        } else {
	  try {
	    ouah = this.chk4Room(uChoice);
	  } catch (e) {
	    if (e.number == 1) {
	      console.putmsg(red + "No list returned\n");
	    } else {
	      console.putmsg(red + high_intensity + "Room not found");
	    }

	    return;
	  }

	  if (userSettings.debug.navigation) {
	    console.putmsg("Got back " + ouah.name + " from chk4Room\n");
	    console.putmsg(yellow + "Zapped contains: " +
		zappedRooms[user.number].zRooms + "\n");
	  }
	}

	if (ouah == "MAIL") {
	  bbs.log_str("Jumped to Mail");
	} else {
	  bbs.log_str("Jumped to " + this.setSub(ouah));
	  if (userSettings.debug.navigation) {
	    console.putmsg(cyan + "Set sub/tmpBase to " + ouah.code + "\n");
	  }

	  var tmpBase = new MsgBase(ouah.code);
	  if (!tmpBase.is_open) {
	    try {
		tmpBase.open();
	    } catch (e) {
		console.putmsg(red + e.message + "\n");
	    }
	  } 

	  if (userSettings.debug.navigation) {
	    console.putmsg(blue + high_intensity + "tmpBase is open: " +
		tmpBase.is_open + "\n");
	    console.putmsg(yellow + "Testing for subnum: " + tmpBase.subnum +
		"\t(File: " + tmpBase.file + ")\n");
	  }

	  if (roomData.tieIns.isZapped(tmpBase.cfg.index)) {
	    //we're working with a zapped room
	    if (userSettings.debug.navigation) {
		console.putmsg(yellow + "Rooms zapped: " + 
		  zappedRooms[user.number].zRooms + "\nUnzapping " + 
		  tmpBase.cfg.index + "\n");
	    }
	    roomData.tieIns.unzapRoom(tmpBase.cfg.index);
	    if (userSettings.debug.navigation) {
		console.putmsg(yellow + "Rooms zapped: " +
		  zappedRooms[user.number].zRooms + "\n");

	    }
	  }
	}

	return;
    },
      /*
	* summary:
	*	Mark all messages as read in the current room and
	*	call findNew() to change to the next room with unread messages
        * NOTE:
        *       skip() should _NOT_ mark all messages in the current room as
        *       read; it should just skip to the next room in the list
	*/
    skip: function () {
	// mark all messages as read in current room
	//var mBase = msg_base.openNewMBase(bbs.cursub_code);

        /* this is the code that is leaving skip adjusting the message pointers
         * that we really don't want to eff with; they need to stay the same
         * for the next return to this sub
	if (mBase != null) {
	    msg_area.sub[bbs.cursub_code].scan_ptr = mBase.total_msgs;
	    mBase.close();
	} */
	// use findNew to change to next room with unread messages
	this.findNew();
    },
	/*
	 * summary:
	 *	Searches for the substring within the list of available 
	 *	sub-boards
	 * srchStr:
	 *	Substring to search for
	 * return:
	 *	The object for the sub-board if a match, exceptions are thrown
         *	on appropriate error conditions
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
  //sub-object
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
	 * return:
	 *	As I redundantly and out-of-proper-orderly mentioned
	 *	above, it returns an array of sub-board objects
	 *	If running non-confined, returns null.  When this feature is
         *	finally ready to be implemented, it might be necessary to return
         *	some sort of JSON or list of arrays in order to handle the
         *	deeper data structure than we're currently utilizing
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
		return null;    //ereh
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
	//load user settings
	userSettings = userRecords.defaultSettings(user.number);
	try {
          userSettings = userRecords.userDataIO.loadSettings(user.number);
        } catch (e) {
	  console.putmsg(red + high_intensity +
		"Loading userSettings in initDdoc:\n");
	  console.putmsg(red + e.toString() + "\n");
	}

	//load room settings -- WHAT THE FUCK IS GOING ON WITH THE NESTED TRY/
        //CATCH BULLSHIT HERE?  Vestigial horror no doubt; fix this
	try {
          try {
              roomData.fileIO.snagRoomInfoBlob();
          } catch (e) {
              if (userSettings.debug.file_io) {
                  console.putmsg(cyan + "Exception reading default room info\n"
                    + "Message: " + e.message + "\tNum: " + e.number + "\n");
              }
          }
	} catch (e) {
	  console.putmsg(red + high_intensity + "Loading room data in " +
		"initDdoc:\n");
	  console.putmsg(red + e.message + "\n");
	}

	if (userSettings.debug.misc) {
		userRecords.userDataUI.displayDebugFlags(user.number);
		console.putmsg("Turning off Synchronet defaults for dDoc\n");
	}

	//save user setting defaults
	this.preUserSettings = user.settings;
	this.turnOffSynchronetDefaults();
	if (userSettings.confined) {
		bbs.log_str(user.alias + " is entering dDOC shell and " +
			"confined to " + msg_area.grp_list[topebaseno].name + 
			" group");
	} else {
		bbs.log_str(user.alias + " entering dDOC shell");
	}

	//set node status here, maybe?
	docIface.setNodeAction(NODE_MAIN);

	//turn on asynchronous message arrival
	bbs.sys_status &=~ SS_MOFF;
	//turn off time limit
	user.security.exemptions |= UFLAG_H;
	//this is how it SHOULD work, anyway
	//turn on user pauses
	user.settings |= USER_PAUSE;

	//save bbs defaults
        if (userSettings.debug.misc) {
            console.putmsg(yellow + "Saving settings for later restoration:\n" +
              "preSubBoard (user.cursub):\t" + green + user.cursub + yellow +
              "\npreMsgGroup (user.curgrp):\t" + green + user.curgrp + yellow +
              "\npreFileDir (user.curdir):\t" + green + user.curdir + "\n");
        }
	this.preSubBoard = user.cursub;
	this.preMsgGroup = user.curgrp;
	this.preFileDir = user.curdir;

	//snag user zapped rooms list
	try {
	  roomData.fileIO.snagUserZappedRooms();
	} catch (e) {
	  console.putmsg(red + "Not sure what happened in " +
	    "snagUserZappedRooms()\nExc:\t" + e.name + "\nMsg:\t" + e.message 
	    + "\nNumber:\t " + e.number + "\n");
	}

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
	/*
	 * NOTE: These should be saved and turned back on afterwards; this
	 * will probably fix the issue with timeouts or at least some of the
	 * aberrant behavior that happens when one drops from this shell back
	 * out to the synchronet default when not logging in with it
	 */
    },
	/*
	 * summary:
	 *	Restores settings that were detected at first going into
	 *	ddoc, in order to restore functionality to where it was
	 *	left off for somebody that may be jumping between
	 *	shells, or the like.  As mentioned above; this may be
	 *	out of scope and needing a better solution.  For some reason
         *	this also refuses to work properly when not called from the
         *	lowest-level primary menu; not sure what's up with that, Digital
         *	Man just referred me to logout.c or something and I couldn't
         *	make heads or tails of it just yet
	 */
    quitDdoc : function() {
	bbs.log_str(user.alias + " is leaving dDOC shell");
	bbs.log_key("L");

	if (userSettings.debug.flow_control) {
	  console.putmsg(red + "\nRestoring user.* properties:\n" +
	    " user.cursub: " + this.preSubBoard + "\n" +
	    " user.curgrp: " + this.preMsgGroup + "\n" +
	    " user.curdir: " + this.preFileDir + "\n");
	  console.putmsg(red + "\nRestoring user.settings . . .\n");
	}

	//restore initial settings prior to exit
	user.cursub = this.preSubBoard;
	//user.cursub = bbs.cursub_code;
	user.curgrp = this.preMsgGroup;
	user.curdir = this.preFileDir;
	user.settings = this.preUserSettings;

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
         * NOTE:
         *      I believe this is completely vestigial at this point; need to
         *      run through and verify before removing it.  This should all be
         *      handled from within dperroom's code right now, though.
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

var preSubBoard, preFileDir, preMsgGrp, preUserSettings;
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

	switch (uchoice) {
		//top menu
		case '?':
		  docIface.doMainMenu();
		  break;
		//message base entry commands
                case ' ':
                  uchoice = 'n';
		case 'b':
		case 'e':
		case 'E':
		case 'r':
		case 'n':
		case 'o':
		case 'k':
		case '-':
                case '%':
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

		  //is this room zapped?
		  if (userSettings.debug.navigation) {
			console.putmsg(yellow + "Testing for zapped status on" +
			  " room no: " + bbs.cursub + "\n");
		  }
                  if (roomData.tieIns.isZapped(bbs.cursub)) {
		    if (userSettings.debug.navigation) {
			console.putmsg(red + "zRooms contents: " +
			  zappedRooms[user.number].zRooms + "\n");	
			console.putmsg(yellow + "Attempting to unZap() " +
			  bbs.cursub + "\n");
		    }
                    //unzap it
                    roomData.tieIns.unzapRoom(bbs.cursub);
		    if (userSettings.debug.navigation) {
			console.putmsg(red + "zRooms contents: " +
			  zappedRooms[user.number].zRooms + "\n");
		    }
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
		case 'i':	//display room info
		  roomData.roomSettingsUX.displayRoomInfo();
		  break;
		case 'I':	//change room info (if applicable)
		  roomData.roomSettingsUX.promptUserForRoomInfo();
		  break;
		case 'z':	//zap room
		  if (console.yesno("Are you sure you want to forget this " +
		      "forum? ")) {
		    roomData.tieIns.zapRoom(bbs.cursub);
		  }
		  break;
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':   //we're going to read message by number here
                  //there will, of course, have to be some error checking for
                  //trying to hit out of bounds messages if dispMsg() doesn't
                  //already have it
                  console.putmsg(green + high_intensity + "Go to message #> ");
                  console.ungetstr(uchoice);    //put it back on the input stack
                  msg_base.dispMsg(new MsgBase(bbs.cursub_code),
                                   console.getnum(maxMsgs), false);
                  break;
                case '$':       //change debugging flags for this user
                  var dropOut = false;
                  var un;

                  if (user.security.level < 80) {
                      userRecords.userDataUI.queryDebugSettings(user.number);
                  } else {
                      console.putmsg(yellow + high_intensity + "User name to " +
                        "modify debug settings for: ");
                      un = bbs.finduser(console.getstr());

                      while (un < 1) {
                          console.putmsg(red + high_intensity + "User not " +
                            "found.  Enter another username or \"DONE\" to " +
                            " escape.\nUsername: ");
                          un = console.getstr();

                          if (un == "DONE") {
                              dropOut = true;
                          } else {
                              un = bbs.finduser(un);
                          }
                      }

                      //we should have a valid # now or else be out of here :P
                      if (!dropOut) {
                          userRecords.userDataUI.queryDebugSettings(un);
                      }
                  }
                  break;
                case 'p':       //profile a user
                  console.putmsg(green + high_intensity +
                      "User to profile -> ");
                  userRecords.userDataUI.profileUser(console.getstr());
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


