/*
 * dmbase.js
 *
 * by: Damon Getsman
 * contributing/refactoring also by: @Ntwitch (github.com)
 * alpha phase: 25oct14
 * beta phase: 11mar15
 * started: 21sept14
 * finished:
 *
 * All routines for accessing the message base are ending up here.  I did 
 * try to break it up a bit, but it's still got some monoliths forming in
 * the structures, so there'll be another pass to break it down more once
 * I get it through and into active beta testing. 
 */

//directives for JSLint
/*global red, cyan, blue, green, magenta, high_intensity, white, normal,
	  yellow, base, ndx, userSettings, console, bbs, load, K_NOECHO */
/*jslint devel: true, node: true, sloppy: true, vars: true, white: true */

load("sbbsdefs.js");
load("dpoast.js");
load("dperuser.js");

//message base menu
msg_base = {
	/*
	 * summary:
	 *	String to prepend before a key is hit and logged to
	 *	signify that it was at this menu
	 */
  log_header : "dDOC Read menu command: ",
        /*
         * summary:
         *      Sub-object representing the message read command menu
         *      properties and methods
         */
  read_cmd : {
        rcMenu : "\n" + green + high_intensity +
          "<?> help         <a>gain           <A>gain (no More prompt)\n" +
          "<b>ack           <D>elete msg      <e>nter msg\n" +
          "<E>nter (upload) <h>elp            <i>nfo (forum)\n" +
          "<n>ext           <p>rofile author  <s>top\n" +
          "<w>ho's online   <x>press msg      <X>press on/off\n\n" +
	  "<I> change room info\n",
        /*
         * summary:
         *      Reads choice for valid selection
         * base: MsgBase object 
         *      currently in use (and opened)
         * ndx: Integer
         *      index of the current message
         * returns:
         *      1 to stop
         *      2 to change direction
         *      0 for message entered successfully or next msg also
         */
        rcChoice : function(base, ndx) {
          var uchoice;
          var valid = false;
          var hollaBack = 0;    //can be used to switch dir, etc

	  if (base === undefined) {
	    throw new docIface.dDocException("base not defined to rcChoice()");
	  }

	  if (userSettings.debug.message_posting) {
	    console.putmsg(red + "rcChoice() called w/base: " + base.cfg.code +
		"\tndx: " + ndx + "\n");
	  }

          while (!valid) {
	    msg_base.doMprompt(base, ndx);
            uchoice = "";

            do {
        	bbs.nodesync();       //check for xpress messages
        	uchoice = console.inkey(K_NOECHO, 1000);
            } while (uchoice === "");

            switch (uchoice) {
                case '?':
		  bbs.log_key("?");
                case 'h':	//see menu
		  if (uchoice == "h") {
		    bbs.log_key("h");
		  }
                  console.putmsg(this.rcMenu);
                  break;
                case 'a':	//see message again
		  bbs.log_key("a");
		  console.putmsg(green + high_intensity + "Again\n");
		  msg_base.dispMsg(base, ndx, true);
		  break;
                case 'A':	//see message again
				//NOTE: not implemented properly
		  bbs.log_key("A");
		  console.putmsg(green + high_intensity + 
			"Again (no breaks)\n");
		  msg_base.dispMsg(base, ndx, false);
		  break;
                case 'b':	//change scan direction
		  bbs.log_key("b");
                  valid = true; hollaBack = 2;
		  docIface.log_str_n_char(this.log_header, 'b');
                  console.putmsg(green + high_intensity + "Back (change " +
                        "direction)...\n");
                  break;
                //case 'D':
                case 'i':	//display room info
		  bbs.log_key("i");
		  roomSettings.roomSettingsUX.displayRoomInfo();
		  break;
		case 'I':	//prompt for room info
		  //change room info
		  bbs.log_key("I");
		  roomData.roomSettingsUX.promptUserForRoomInfo();
		  break;
                case 'p':
		  bbs.log_key("p");
                case 'w':	//long wholist
		  if (uchoice == "w") {
		    bbs.log_key("w");
		  }
		  wholist.list_long(wholist.populate);
                  /* console.putmsg(yellow + "Not supported (yet)" +
                        "...\n"); */
                  break;
                case 'E':	//enter (upload) message
		  bbs.log_key("E");
                  console.putmsg(red + "\nI'm too dumb yet, just " +
				 "wait\n");
                  break;
                case 's':	//stop scan
		  bbs.log_key("s");
                  valid = true; hollaBack = 1;
		  docIface.log_str_n_char(this.log_header, 's');
                  console.putmsg(yellow + high_intensity + "Stop\n");
                  break;
                case 'e':	//enter message
		  bbs.log_key("e");
                  console.putmsg(green + high_intensity +
                        "Enter message\n");
		  if (userSettings.debug.message_posting) {
			console.putmsg(red + "Adding message via " +
			  "poast.addMsg() where base: " +
			  base.cfg.name + "\n");
		  }

		  try {
                    poast.addMsg(base, false, 'All');  //not an upload
		  } catch (e) {
		    console.putmsg(red + high_intensity + "Error " +
			"in poast.addMsg(): " + e.message + "\n");
		  }

                  break;
		case ' ':
		  bbs.log_key(" ");
		case 'n':	//next message
		  if (uchoice == "n") {
		    bbs.log_key("n");
		  }
		  valid = true; hollaBack = 0;
		  docIface.log_str_n_char(this.log_header, 'n');
		  console.putmsg(green + high_intensity + "Next\n");
		  break;
		case 'l':	//logout
		  bbs.log_key("l");
		  docIface.util.quitDdoc();
		  break;
		case 'x':	//send X
		  bbs.log_key("x");
		case 'X':
		  if (uchoice == "X") {
		    bbs.log_key("X");
		  }
		  express.sendX();
		  break;
		case 'd':	//delete message
		  bbs.log_key("d");
		  try {
		    msg_base.util.deleteMsg(base, ndx);
		  } catch (e) {
		    console.putmsg(red + "Got: " + e.message + ", errno: " +
			e.number + " back.  :(\n");
		  }
		  break;
                default:
                  console.putmsg(normal + yellow + "Invalid choice\n");
                  break;
            }
          }

        return hollaBack;
        }
  },
  /*
   * summary:
   *	Sub-object holds all of the components to deal with Mail> properly
   */
  uMail : {
    //mailPrompt : yellow + high_intensity + "Mail> ",
	/*
	 * summary:
	 *	Method finds the current pseudo-scan_ptr for the mail 
	 *	pseudo-sub
	 * return:
	 *	Returns the integer pointer, or 0
	 */
    getMailScanPtr : function(mmBase) {
        var mNdx = 0;
        var mHdr;

        for (var i = 0; i < mmBase.total_msgs; ++i) {
          try {
            mHdr = mmBase.get_msg_header(true, i, true);
          } catch (e) {
            console.putmsg(red + high_intensity + "Error reading mail " +
                "headers!\n");
            throw new dDocException("readMail() exception",
                "Unable to read message header(s): " + e.message, 2);
          }

          if ((mHdr.to_ext == user.number) &&
              ((mHdr.attr & MSG_READ) == MSG_READ)) {
                mNdx = i;
          }
        }

	return mNdx;
    },
	/*
	 * summary:
	 *	Method exists to read mail, pump it into the DOC format,
	 *	and display it to the end user
	 */
    readMail : function() {
	var mmBase = new MsgBase("mail");
	var fuggit = false, increment = 1;
	var mNdx, uChoice, mHdr, mBody;

	try {
	  mmBase.open();
	} catch (e) {
	  console.putmsg(red + high_intensity + "Unable to open mmBase\n");
	  throw new dDocException("readMail() exception",
	    "The cave is too dark to read yr scroll", 1);
	}

	
	//so that mess should have gotten us the current message index scan
	//pointer (or pseudo-version thereof); now we can start
	mNdx = this.getMailScanPtr(mmBase);

	while (!fuggit) {
	  //let's read da shit
	  console.putmsg(yellow + high_intensity + "Mail> ");//this.mailPrompt);
	  uChoice = console.getkey();	//NOTE: this will have to be replaced
					//w/one checking for Xes

	  if (userSettings.debug.message_scan) {
	    //should probably add a 'mail' option to the debugging opts
	    console.putmsg(yellow + "Working with mNdx: " + mNdx + "\n");
	  }

	  switch (uChoice) {
	    case 'n':
	    case ' ':
		//display, if exists, otherwise exit
		if (((mNdx == mmBase.total_msgs) && (increment == 1)) ||
		    ((mNdx == 0) && (increment == -1))) {
		  console.putmsg(green + high_intensity + "Goto\n");
		  return;	/* there should probably be a different
				   exit from this for reverse reading, in the
				   future :P */
		}

		try {
		  mHdr = mmBase.get_msg_header(true, mNdx);
		  mBody = mmBase.get_msg_body(true, mNdx);
		} catch (e) {
		  console.putmsg(red + high_intensity + "Unable to read " +
		    "mail header|body\n");
		  throw new dDocException("readMail() exception",
		    "Unable to fetch this mail's header|body: " + e.message, 
		    3);
		}

		//display header
		msg_base.doMPrompt(mmBase, mNdx);

		//display body
		msg_base.dispMsg(mmBase, (mNdx += increment), false);

	    break;
	    case 'b':
		//switch direction
		increment *= -1;

		if (userSettings.debug.message_scan) {
		  console.putmsg("Changed increment to: " + increment + "\n");
		}
	    break;
	    case 'd':
		//delete message

	
	    break;
	    case 's':
		//stop reading Mail>
		console.putmsg(yellow + high_intensity + "Stop\n");
		fuggit = true;
	    break;
	    default:
		//wut
		console.putmsg(yellow + high_intensity + "Wut?\n\n");
	    break;

	  }

	}
    }
  },
  /*
   * summary:
   *	Sub-object created for msgDelete() and any other methods/properties
   *	that may need to exist that don't exactly fall under reading
   *	messages
   */
  util : {
	/*
	 * summary:
	 *	Deletes the message (if appropriate permissions) at the current
	 *	message
	 * mBase:
	 *	The open message base object for the current room/sub
	 * ndx:
	 *	Index to try to delete
	 */
    deleteMsg : function(mBase, ndx) {
	var mHdr;

	if ((!mBase.is_open) || (mBase == null)) {
	  throw new dDocException("deleteMsg() exception",
	    "You cannot consume the cockatrice egg!", 1);
	}

	try {
	  mHdr = mBase.get_msg_header(ndx);
	} catch (e) {
	  console.putmsg(yellow + "Unable to delete message, sysop " +
		"has been notified\n");
	  throw new dDocException("deleteMsg() exception",
	    "Unable to snag message header: " + e.message, 2);
	}

	if ((mHdr.from_ext == user.number) || (mHdr.from == user.alias) ||
	    (mHdr.from == user.name)) {
	  //we are go for trying to delete this message
	  try {
	    mBase.remove_msg(ndx);
	  } catch (e) {
	    console.putmsg(yellow + "Unable to delete message, sysop " +
		"has been notified\n");
	    throw new dDocException("deleteMsg() exception",
	      "Unable to remove_msg(" + ndx + "):" + e.message, 3);
	  }
	}

	console.putmsg(red + high_intensity + "Message baleeted . . .\n"); 

    }
  },
  /*
   * summary:
   *	Sub-object for methods utilized when dropping through from the
   *	main-menuing system.  I think that these methods might also be
   *	utilized from rcChoice, also, which kind of puts my OO structure
   *	into question here...  Need to look at that at some point, or
   *	else place improper methods somewhere more appropriate.
   */
  entry_level : {
        /*
         * summary:
         *      Forward command to the appropriate methods for entry
         *      into the message reading routines in general
         * choice: char
         *      Code for the menu choice
         */
    handler : function(choice) {
	var base = null;

	docIface.setNodeAction(NODE_RMSG);

	docIface.log_str_n_char(msg_base.log_header, choice);

        //which way do we go with this?
        switch (choice) {
          //purely message related functionality
          case 'n':     //read new
	    console.putmsg(green + high_intensity + "Read new\n");
	    try {
		msg_base.readNew();
	    } catch (e) {
		console.putmsg(yellow + "Exception reading new: " +
		      e.toString() + "\n");
	    }
            break;
	  case 'b':	// scan backwards
	    console.putmsg(green + high_intensity + "Read backward\n");
	    try {
	        msg_base.scanSub(msg_area.sub[bbs.cursub_code], false);
	    } catch (e) {
		console.putmsg(yellow + "Exception reading backwards: " +
		      e.toString() + "\n");
	    }
	    break;
          case 'k':     //list scanned bases
	    console.putmsg(green + high_intensity + "Known rooms list\n");
            this.listKnown();
            break;
          case 'e':     //enter a normal message
	    console.putmsg(green + high_intensity + "Enter message\n");

	    base = msg_base.openNewMBase(user.cursub);
	    if (base === null) {
		console.putmsg(yellow + "Could not open MsgBase: "
		      + user.cursub + "\n");
		break;
	    }
	    try {
		docIface.setNodeAction(NODE_PMSG);
		poast.addMsg(base, false, 'All');
	    } catch (e) {
		console.putmsg(red + high_intensity + "Error " +
		      "in poast.addMsg(): " + e.message + "\n");
	    }
            break;
          //other functionality tie-ins
          case 'w':     //normal wholist
            wholist.list_long(wholist.populate());
            break;
          case 'W':     //short wholist
            wholist.list_short(wholist.populate());
           break;
          case 'x':     //express msg
            express.sendX();
            break;
	  case 'l':	//logout
	    docIface.util.quitDdoc();
	    break; 
          default:
            if (userSettings.debug.navigation) {
              console.putmsg("\nNot handled yet . . .\n\n");
	    }
            break;
        }
    },
        /*
         * summary:
         *      Lists all known message sub-boards (broken down by
         *      message base group, optionally)
         */
    listKnown : function() {
        console.putmsg("\n" + green + high_intensity);

        //we can fuck with multi-columns later
        if (!userSettings.confined) {
         for each (uMsgGrp in msg_area.grp_list) {
          if (userSettings.debug.navigation) {
                console.putmsg(uMsgGrp.description + "\n\n");
          }
          for each (uGrpSub in uMsgGrp.sub_list) {
                console.putmsg("\t" + uMsgGrp.name + ": " +
                  uGrpSub.description + "\n");
          }
         }
        } else {
         //uMsgGrp = msg_area.grp_list[topebaseno].sub_list
         for each (uGrpSub in msg_area.grp_list[topebaseno].sub_list) {
                console.putmsg("\t" + uGrpSub.description + "\n");
         }
        }
        console.putmsg("\n");
    }

  },
  //msg_base properties
  //these may not be determined dynamically (pretty sure), so this
  //will be a bug that needs to be fixed inline on a per-message read
  //basis
  menu : green + high_intensity + "\n\n<?> help\t\t" +
         "<a>gain\t\t<A>gain (no More prompt)\n<b>ack\t\t<D>" +
         "elete msg\t<e>nter msg\n<E>nter (upload)\t<h>elp\t\t\t" +
         "<i>nfo (forum)\n<n>ext\t\t<p>rofile author\t<s>top\n" +
         "<w>ho's online\t<x>press msg\t<X>press on/off\n\n",

  //---+++***===msg_base methods follow===***+++---
	/*
	 * summary:
	 *	Displays the read menu with room name, message number,
	 *	and remaining messages.
	 * base:
	 *	The active and open MsgBase object
	 * ndx:
	 *	Index of the current message
	 * NOTE: I chose to make the message number 1-based for
	 *	display purposes only.
	 */
  doMprompt : function(base, ndx) {
	docIface.setNodeAction(NODE_RMSG);

	base.close();  // Refresh base for any new messages
	base.open();
	if (userSettings.debug.message_scan) {
	    console.putmsg(red + "Reopened " + base.cfg.code
		  + " to check for updates\n");
	}
	console.putmsg(yellow + high_intensity + "\n[" + base.cfg.name +
	      "> msg #" + (ndx + 1) + " (" + (mBase.total_msgs - ndx) +
	      " remaining)] " + cyan + "Read cmd -> ");
  },
        /*
	 * summary:
	 *	Displays message with or without pauses
	 * base: MsgBase object
	 *	Open message base object currently being read
	 * ptr: Integer
	 *	Current message index #
	 * breaks: Boolean
	 *	Default: true
	 *	true for screen pauses
	 */
  dispMsg : function(base, ptr, breaks) {
	var mHdr, mBody, fHdr;

	if (breaks != false) { 
	    breaks = true;
	}

        //try/catch this
        mHdr = base.get_msg_header(ptr);
        mBody = base.get_msg_body(ptr);

	if (userSettings.debug.message_scan) {
	    console.putmsg(red + "ptr: " + ptr + "\tbase.last_msg: "
		+ base.last_msg + "\n");
	}

	if (mHdr === null) {
	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "Invalid message? base.cfg.code: "
		      + base.cfg.code + " ptr: " + ptr + "\n");
	    }
	    return;	// Invalid message, skip
	}

	fHdr = "\n" + magenta + high_intensity + mHdr.date + green + " from "
	      + cyan + mHdr.from + "\n" + green;

	if (breaks) {
	    console.putmsg(fHdr + mBody, P_WORDWRAP);   // add fHdr into the
		// putmsg here so it gets included in the line count for breaks
        } else {
	    console.putmsg(fHdr + mBody, (P_NOPAUSE | P_WORDWRAP));
	}

	return 0;
  },
  /*
   * summary:
   *	Opens a new message base (modularizing)
   * mb:
   *	Code of the new message base to open
   * return:
   *	new message base object (already open), or 'null' for error
   */
  openNewMBase : function(mb) {
        try {  
	  //take care of this in calling code
          //mBase.close();
          mBase = new MsgBase(mb);
	  mBase.open();
          if (userSettings.debug.message_scan) {
            console.putmsg(red + "Opened: " + mb +
        	           " allegedly . . .\n");
	    console.putmsg(red + "mBase.error: " + mBase.error + "\n");
          }
        } catch (e) {
          console.putmsg(red + "Error opening new mBase:\n"
		+ e.toString() + "\n");
          log("Error skipping through scanSub(): " +
            e.toString());
          return null;
        }

	return mBase;
  },
	/*
	 * summary:
	 *	Sequentially scans for new messages within one
	 *	particular sub-board; don't forget to add the support
	 *	for whether confined or not after this is beta working
	 * sBoard: String
	 *	Synchronet Sub-board object
	 * forward: Boolean
	 *	true for forward read & converse
	 * return:
	 *	null/negative for errors; 1 to move on to the next sub, 
	 *	still working on further shite
	 */
  scanSub : function(sBoard, forward) {
	var tmpPtr, inc, choice = 0;

	if (userSettings.debug.message_scan) {
	  console.putmsg("Entered scanSub(); forward = " + forward +
	    "  user.cursub: " + user.cursub + "\nsBoard.code: " +
	    sBoard.code + "\n");
	}

	mBase = this.openNewMBase(sBoard.code);

	if (mBase === null) {
	    if (userSettings.debug.message_scan) {
		console.putmsg("Error in openNewMBase()\n");
	    }
	    throw new docIface.dDocException("scanSubException",
		  "Error in openNewMBase()", 1);
	}

	tmpPtr = sBoard.scan_ptr;
	if (userSettings.debug.message_scan) {
	  console.putmsg("sBoard.scan_ptr = " + sBoard.scan_ptr + "\n");
	  console.putmsg("mBase.first_msg = " + mBase.first_msg + "\n");
	  console.putmsg("mBase.total_msgs = " + mBase.total_msgs + "\n");
	  console.putmsg("mBase.last_msg = " + mBase.last_msg + "\n");
	}
	
	if (forward) { inc = 1; } else { inc = -1; }
	
	// if starting in reverse from the room prompt, unskip one message
	if (!forward) tmpPtr += 1;  // so we start with the most recently read
	// message.  In all other cases we want to skip one.
	
	if (userSettings.debug.message_scan) {
	  console.putmsg("Inc: " + inc + "\tbased on forward\n");
	}

	//primary message scan loop
	while (true) {	// a bit shady, but we exit from within the switch/case
	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "In main scanSub() loop\ttmpPtr: "
		      + tmpPtr + " total_msgs: " + mBase.total_msgs
		      + " is_open: " + (mBase.is_open ? "yes" : "no") + "\n");
	    }

	    switch (choice) {
		case 1:		// Stop scan
		    if (userSettings.debug.message_scan) {
			console.putmsg("DEBUG: Stopping scan\n");
		    }
		    mBase.close();
		    return null;
		case 2:		// Reverse scan direction
		    if (userSettings.debug.message_scan) {
			console.putmsg(red + "DEBUG: Reversing direction\n");
		    }
		    inc *= -1;
		    //Fall through to read message
		    //break;
		case 0:		// Next message
		    if (userSettings.debug.message_scan) {
			console.putmsg("DEBUG: Next Msg\n");
		    }
		    if ((tmpPtr <= 0) && (inc == -1)) {
			mBase.close();
			return 0;   // do we reverse scan from room to room also?
		    } else if ((tmpPtr >= mBase.total_msgs) && (inc == 1)) {
			mBase.close();
			return 1;   // skip to next room
		    }
		    tmpPtr += inc;
		    if ((tmpPtr >= 0) && (tmpPtr <= mBase.total_msgs)) {
			this.dispMsg(mBase, tmpPtr, true);
			if (inc == 1) sBoard.scan_ptr = tmpPtr;
		    }
		    break;
		default:
		    console.putmsg(red + "\nUnexpected value from rcChoice: "
			  + choice + "\n");
		    return null;
	    }

	    if (userSettings.debug.message_scan) {
		console.putmsg(red + "End of scanSub() main loop\n"
		      + "tmpPtr: " + tmpPtr + "\tinc: " + inc + "\n");
	    }
	    choice = this.read_cmd.rcChoice(mBase, tmpPtr);
	}

	mBase.close();
	if (userSettings.debug.message_scan) {
	  console.putmsg(red + "Closed mBase: " + sBoard.code + "\n");
	}
    },
	/*
	 * summary:
	 *	Read any new messages in the current room, then call findNew to
	 *	move to the next room with unread messages
	 */
    readNew : function() {
	var mBase = this.openNewMBase(bbs.cursub_code);
	
	if (msg_area.sub[bbs.cursub_code].scan_ptr < mBase.total_msgs) {
	    this.scanSub(msg_area.sub[bbs.cursub_code], true);
	}
	docIface.nav.findNew();
	mBase.close();
	return;
    }

}
