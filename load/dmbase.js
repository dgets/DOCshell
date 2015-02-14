/*
 * dmbase.js
 *
 * by: Damon Getsman
 * alpha phase: 25oct14
 * beta phase: 
 * started: 21sept14
 * finished:
 *
 * All routines for accessing the message base are ending up here.  I did 
 * try to break it up a bit, but it's still got some monoliths forming in
 * the structures, so there'll be another pass to break it down more once
 * I get it through and into active beta testing. 
 */

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
          "<?> help         <a>gain           <A>gain (no More" +
          "prompt)\n" +
          "<b>ack           <D>elete msg      <e>nter msg\n" +
          "<E>nter (upload) <h>elp            <i>nfo (forum)\n" +
          "<n>ext           <p>rofile author  <s>top\n" +
          "<w>ho's online   <x>press msg      <X>press on/off\n\n",
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

          while (!valid) {
            uchoice = console.getkey();
            switch (uchoice) {
                case '?':
                case 'h':
                  console.putmsg(rcMenu);
                  break;
                case 'a':
                case 'A':
                  console.putmsg(yellow + "Not supported (yet)" +
                        "...\n");
                  break;
                case 'b':
                  valid = true; hollaBack = 2;
		  docIface.log_str_n_char(this.log_header, 'b');
                  console.putmsg(green + "Back (change " +
                        "direction)...\n");
                  break;
                case 'D':
                case 'i':
                case 'p':
                case 'w':
                case 'x':
                case 'X':
                  console.putmsg(yellow + "Not supported (yet)" +
                        "...\n");
                  break;
                case 'E':
                  //dispMsg();  //how to pass parameters?
                  console.putmsg(red + "\nI'm too dumb yet, just " +
				 "wait\n");
                  break;
                case 's':
                  valid = true; hollaBack = 1;
		  docIface.log_str_n_char(this.log_header, 's');
                  console.putmsg(yellow + high_intensity + "Stop\n");
                  break;
                case 'e':
                  valid = true; //I think we want to change this
                  console.putmsg(green + high_intensity +
                        "Enter message\n\n");
                  addMsg(base, false, 'All');  //not an upload
                  break;
		case ' ':
		case 'n':
		  valid = true; hollaBack = 0;
		  if (debugging) {
		    console.putmsg(red +
			"xxxx DEBUGING  xxxx   dmbase.js    prior to " +
			"  docIface.log_str_n_char\n");
		  }
		  docIface.log_str_n_char(this.log_header, 'n');
		  if (debugging) {
			console.putmsg("xxxx DEBUGING  xxxx   dmbase.js" +
				"    after docIface.log_str_n_char\n");
		  }
		  console.putmsg("\n");
		  break;
		case 'l':
		  docIface.util.quitDdoc();
		  break;
                default:
                  console.putmsg(normal + yellow + "Invalid choice\n");
                  //console.putmsg(msg_base.mprompt);
                  //uchoice = console.getkey();
                  break;
            }

          //write the prompt again here, durrr; other flow control
          //issues, as well, here probably
          }

        return hollaBack;
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
         * confined: Boolean
         *      true if restricted to Dystopian Utopia message group
         */
    handler : function(choice, confined) {
	docIface.log_str_n_char(msg_base.log_header, choice);

        //which way do we go with this?
        switch (choice) {
          //purely message related functionality
          case 'n':     //read new
	    //NOTE: we'll need an enclosing loop to route through
	    //separate sub-boards now
	    msg_base.scanSub(msg_area.sub[bbs.cursub_code], true);
            //console.getkey();
            break;
          case 'k':     //list scanned bases
            this.listKnown(confined);
            break;
          case 'e':     //enter a normal message
            poast.addMsg(docIface.nav.chk4Room(user.cursub), false, 'All');
            break;
          //other functionality tie-ins
          case 'w':     //normal wholist
            wholist.list_long();
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
            if (debugging)
              console.putmsg("\nNot handled yet . . .\n\n");
            break;
        }
    },
        /*
         * summary:
         *      Lists all known message sub-boards (broken down by
         *      message base group, optionally)
         * confined: Boolean
         *      true if restricted to Dystopian Utopia message group
         */
    listKnown : function(confined) {
        console.putmsg("\n\n" + green + high_intensity);

        //we can fuck with multi-columns later
        if (!confined) {
         for each (uMsgGrp in msg_area.grp_list) {
          if (debugging) {
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
  //should end up replacing most of newScan() [above] and some other
  //areas, I'm sure
	/*
	 * summary:
	 *	Displays message with or without pauses
	 * base: MsgBase object
	 *	Open message base object currently being read
	 * ptr: Integer
	 *	Current message index #
	 * break: Boolean
	 *	true for screen pauses
	 */
  dispMsg : function(base, ptr, breaks) {
	var debugging = true;	//we're good here -- LIES!!!

        if (breaks != false) { 
	  breaks = true;
	}

        //try/catch this
        var mHdr = base.get_msg_header(ptr);
        var mBody = base.get_msg_body(ptr);

	if (debugging) {
	  console.putmsg(red + "ptr: " + ptr + "\tbase.last_msg: " +
		base.last_msg + "\n");
	}

	if ((mHdr === null) && (ptr == (base.last_msg - 1))) {
	  //this is where echicken's suggestion must go
	  return -1;	//code for we're out of messages here, skip to
			//next
	} else if (mHdr === null) {
	  return -2;	//just increment the pointer and try again
	}

        if (breaks) {
          console.putmsg(magenta + high_intensity + mHdr.date +
                green + " from " + cyan + mHdr.from + "\n" +
                green);
          console.putmsg(mBody);  //this may need to have formatting
                                  //fixes for vdoc emulation
          console.putmsg(yellow + high_intensity + "\n[" +
                msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].name 
		+ "> msg #" + ptr + " (" +
                (base.last_msg - ptr) + " remaining)] " +
                cyan + "Read cmd -> ");
        }

	return 0;
  },
	/*
	 * summary:
	 *	Creates and displays the dynamic end of message prompt
	 */
  doMPrompt : function() {
    console.putmsg(yellow + high_intensity + user.cursub + "> msg #" +
	msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].scan_ptr +
	" (" +
	(msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].max_msgs -
	msg_area.grp_list[bbs.curgrp].sub_list[bbs.cursub].scan_ptr) +
	" remaining)] " + green + high_intensity + "Read cmd -> ");
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
          if (localdebug.message_scan) {
            console.putmsg(red + "Opened: " + mb +
        	           " allegedly . . .\n");
          }
        } catch (e) {
          console.putmsg(red + "Error closing old mBase or " +
            "opening the new one after skip:\n" + e.message +
            "\nError logged\n\n");
          log("Error skipping through scanSub(): " +
            e.message);
          return null;
        }

	return mBase;
  },
  verifyBounds : function(mBase, inc, tp) {
          //make sure that we're within proper bounds
          if ((inc == 1) && (tp == mBase.last_msg)) {
            if (localdebug.message_scan) {
		console.putmsg(red + "tp: " + tp + "\tinc: " + inc +
		  "\tmBase.last_msg: " + mBase.last_msg + "\n");
                console.putmsg("Hit last message, returning 1\n");
            }
            return 1;
          } else if ((inc == 1) && (tp >= mBase.last_msg)) {
            console.putmsg(red + "Over last_msg; this should not " +
                "ever happen.  :|\n");
            return null;
          } else if ((inc == -1) && (tp < mBase.first_msg)) {
            console.putmsg(green + high_intensity + "No preceeding " +
                "messages\n");
            return null;
          }
  },
	/*
	 * summary:
	 *	Sequentially scans for new messages within one
	 *	particular sub-board; don't forget to add the support
	 *	for whether confined or not after this is beta working
	 * sBoard: String
	 *	Sub-board's internal code
	 * forward: Boolean
	 *	true for forward read & converse
	 * return:
	 *	null/negative for errors; 1 to move on to the next sub, 
	 *	still working on further shite
	 */
  scanSub : function(sBoard, forward) {
	var mBase, tmpPtr, ecode, ecode2, inc;
	var fuggit = false;

	if (localdebug.message_scan) {
	  console.putmsg("Entered scanSub(); forward = " + forward +
	    "\tuser.cursub: " + user.cursub + "\tsBoard.code: " +
	    sBoard.code + "\n");
	}

	mBase = this.openNewMBase(sBoard.code);
	if (mBase === null) {
	  if (localdebug.message_scan) {
		console.putmsg("Error in openNewMBase()\n");
	  } 
	  return null;
	}

	tmpPtr = sBoard.scan_ptr;	//is this right?
	if (forward) { inc = 1; } else { inc = -1; }
	if (localdebug.message_scan) {
	  console.putmsg("Inc: " + inc + "\tbased on 'forward'\n");
	}

	while (!fuggit) {
	  if (localdebug.message_scan) {
	    console.putmsg(red + "In main scanSub() loop\ttmpPtr: " +
		tmpPtr + "\n");
	  }

	  //make sure that we're within proper bounds
	  ecode = this.verifyBounds(mBase, inc, tmpPtr);
	  if ((ecode === null) || (ecode == 1)) { return ecode; }
	  else {
	    console.putmsg(red + "Bogus code back from verifyBounds()\n");
	    return null;
	  }

	  ecode = this.dispMsg(mBase, tmpPtr, true);

	  //this loop may be the source of a double display issue or
	  //something of the sort
	  while (ecode == -2) {
	    //skip through deleted/invalid messages
	    if (localdebug.message_scan) {
		console.putmsg(red + "In scanSub(), ecode = -2, skipping " +
		  "current message (invalid/deleted)\n");
	    }

	    tmpPtr += inc;
	    if (tmpPtr <= mBase.last_msg) {
		ecode = this.dispMsg(mBase, tmpPtr, true);
	    } else {
		if (localdebug.message_scan) {
		  console.putmsg(red + "Hit end of sub/room\n");
		}
		return 1;
	    }
	  }

	  ecode = this.read_cmd.rcChoice(mBase, tmpPtr);
	  if (ecode == 1) {
	    fuggit = true;
	  } else if (ecode == 2) {
	    if (inc == 1) { inc = -1; } else { inc = 1; }
	  }

	  tmpPtr += inc;
	  if (localdebug.message_scan) {
	    console.putmsg(red + "End of scanSub() main loop\n" +
		"tmpPtr: " + tmpPtr + "\tinc: " + inc + "\tfuggit: " +
		fuggit + "\n");
	  }

	}

	mBase.close();
	if (localdebug.message_scan) {
	  console.putmsg(red + "Closed mBase: " + mBase.code + "\n");
	}
	return -2;
  }
}
