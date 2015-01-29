/*
 * dmbase.js
 *
 * by: Damon Getsman
 * alpha phase: 25oct14
 * beta phase: 
 * started: 21sept14
 * finished:
 * 
 * Moving this to its own file as it's started becoming one hell of a
 * monolith.  It looks like I might've overlooked some functionality in
 * the Synchronet ssjs libraries that might be able to fix up some code
 * that'll now be redundant, like the word-wrap bit.  Need to look
 * through that a bit more.  Other than that, this is just a very
 * lobotomized text entry system, and the much simpler subsystems like a
 * newscan and shit.
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
		  docIface.log_str_n_char(this.log_header, 'n');
		  console.putmsg("\n");
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
    //[left off] RIGHT FAHKIN' HEAH

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
  //dispMsg(), scanSub(), removed uniMsgRead(): scanSub() 
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

	if (debugging) {
	  console.putmsg(red + "base: " + base.cfg.grp_name + "\nptr: "
			 + ptr + "\nbreaks: " + breaks + "\n");
	}

        //try/catch this
        var mHdr = base.get_msg_header(ptr);
        var mBody = base.get_msg_body(ptr);

	//as per echicken's suggestion that perhaps mHdr is returning
	//null due to the fact that it may be hitting an unused or
	//deleted message slot
	if (mHdr === null) {
	  if (debugging) {
	    console.putmsg(red + "echicken was right; mHdr was null " +
			   "due to hitting an unused or deleted msg " +
			   "slot, it appears.\n");
	  }
	  return 1;
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
	 *	Sequentially scans for new messages within one
	 *	particular sub-board
	 * sBoard: String
	 *	Sub-board's internal code
	 * forward: Boolean
	 *	true for forward read & converse
	 * return:
	 *	negative for errors; 1 to move on to the next sub, still
	 *	working on further shite
	 */
  scanSub : function (sBoard, forward) {
	var mBase = new MsgBase(sBoard.code), tmpPtr, ecode, ecode2,
		    inc;
	var fuggit = false;	//because never start with 'fuggit'
	var debugging = true;

	if (debugging) {
	  console.putmsg(red + "In scanSub(); forward = " + forward +
		"\n");
	}

	//open
	try {
	  mBase.open();
	} catch (e) {
	  console.putmsg(red + "Error opening " + sBoard.name +
	    ": " + e.message + "\nError logged.  Feel free to " +
	    "pester the SysOp.\n");
	  log("Error opening " + sBoard.name + ": " + e.message);
	  return -1;
	}

	tmpPtr = sBoard.scan_ptr;
	if (forward) {
	  inc = 1;
	} else {
	  inc = -1;
	}

	while (!fuggit) {
	  debugging = true;
	 
	  if (debugging) {
	    console.putmsg(red + "in while--> tmpPtr: " + tmpPtr + "\n");
	  }
 
	  if ((inc == 1) && (tmpPtr == mBase.last_msg)) {
		//no new, skip to next in external flow to n/sub
		console.putmsg(green + high_intensity + "Next\n");
		return 1;
	  } else if ((inc == 1) && (tmpPtr >= mBase.last_msg)) {
		//corrupt pointers, wtf?
		console.putmsg(red + high_intensity + "Current " +
		  "pointer exceeds last_msg pointer; this is bad."
		  + "\n");
		//insert debug logging to standard log here
		return -3;
	  } else if ((inc == -1) && (tmpPtr < mBase.first_msg)) {
		console.putmsg(green + high_intensity +
			"No preceeding messages\n");
		return 2;	//new value for bottoming out
	  }

	  //wut's up with the last param on this again?
	  ecode2 = this.dispMsg(mBase, tmpPtr, true);
	  if (inc == 1) {
	    //wait wtf is with this again?
	    sBoard.lead_read = tmpPtr;
	  }
	  ecode = this.read_cmd.rcChoice(mBase, (tmpPtr));
	  if (ecode2 == 1) {
	    //echicken's recommendation goes here; probably also in a
	    //conditional with the incrementing code below to make
	    //things more compact

	  }
	  if (ecode == 1) {
	    fuggit = true;
	    break;	//not sure if this is strictly necessary still
	  } else if (ecode == 2) {
	    if (inc == 1) {
		inc = -1;
	    } else {
		inc = 1;
	    }
	  }
	 
	  tmpPtr += inc;
	  if (debugging) {
	    console.putmsg(red + "tmpPtr += " + inc + "= " + tmpPtr +
		"\nfuggit: " + fuggit + "\n");
	  }

	  ecode = null;
	}

	//close
	try {
	  mBase.close();
	} catch (e) {
	  console.putmsg(red + "Error closing " + sBoard.name + ": " +
	    e.message + "\nError logged.  Feel free to pester the " +
	    "SysOp.\n");
	  log("Error opening " + sBoard.name + ": " + e.message);
	  return -2;
	}
  }
}
