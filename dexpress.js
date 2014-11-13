/*
 * dexpress.js
 * by: Damon Getsman
 * started: 12oct14 (lol I'm 37 today; lawd the helpless aging)
 * finished;
 *
 * Handles text entry and the like for the ddoc suite's express message
 * functionality
 *
 * Please note that this also contains the wholist array collection
 * method functionality (in order to select appropriate recipients, etc)
 */

load("sbbsdefs.js");

/*
 * BUGS:
 *
 * At this point there is still no duplicate user checking; this should
 * probably be taken care of at some point.
 */

wholist = {
  debugging : true,	//just for wholist/populate, etc

  /*
   * summary:
   *	Cycles through system's nodes, checking to see if they're in use
   *	and then compiling an array of the usernames
   * returns:
   *	Array() of User objects
   */
  populate : function() {
	var ul = new Array();
	var tu = 0;

	for (var n = 0; n < system.nodes; n++) {
	  if (system.node_list[n] && NODE_INUSE) {
		ul[tu++] = User(system.node_list[n].useron);
	  }
	}

	if (debugging) {
	  console.putmsg(red + "Debugging wholist.populate():\n");
	  for each (cu in ul) {
	    console.putmsg(blue + high_intensity + cu.alias + " ");
	  }
	  console.putmsg("\n");
	}

	return ul;
  },
  /*
   * summary:
   *	Simply a wrapper for Synchronet's 'whos_online()' method
   */
  list_long : function() {
	//this is the easy one
	bbs.whos_online();
  },
  /*
   * summary:
   *	Displays a shorter (multicolumn, though spacing isn't perfectly
   *	figured out on that yet) format listing of who is online
   * ul:
   *	Array() of User objects for those currently online
   */
  list_short : function(ul) {
	//this one we'll have to make multi-column
	var unames = new Array();
	var maxALen = 0, tu = 0, cols;

	console.putmsg(green + high_intensity + 
	  "\nWholist (Short)\n---------------\n");

	for (var ouah = 0; ouah < ul.length; ouah++) {
	  unames[ouah] = ul[ouah].alias;
	  if (unames[ouah].length > maxALen) {
	    maxALen = unames[ouah].length;
	  }
	  tu++;
	}

	//assuming 80 column screens for now
	cols = Math.round(80 / (maxALen + 2));

	//generate wholist
	for (var ouah = 0; ouah < tu; ouah++) {
	  console.putmsg(unames[ouah] + "  ");
	  if ((ouah > 0) && ((ouah % cols) == 0)) {
		console.putmsg("\n");
	  }
	}
  }
},
express = {
  	/*
	 * summary:
	 *	Reads in a buffer of up to 5 77 column lines, checking
	 *	each line for end-of-input criteria (ie ABORT, or a
	 *	blank line prematurely), sending it off to be sent via a
	 *	Synchronet telegram by the calling routine
	 * returns:
	 *	null if aborted; an array of Strings, with up to 5
	 *	elements.  Assume nothing else.
	 */
  readBuf : function() {
	var mTxt = new Array(), abort = false;

	//heading should've already been taken care of
	for (var ouah = 0; ouah < 5; ouah++) {
	  var ln = '';

	  console.putmsg(green + "> ");
	  if (ouah < 4) {
	    mTxt[ouah] = console.getstr("", 77, K_WRAP);
	  } else {
	    mTxt[ouah] = console.getstr("", 77);
	  }

	  if (((mTxt[ouah] == "ABORT") || (mTxt[ouah] == "ABORT\r")) ||
	      (((mTxt[ouah] == "\r") || (mTxt[ouah] == "")) && 
		(ouah == 0))) {
	    abort = true; break;
	  } else if ((mTxt[ouah] == "") || (mTxt[ouah] == "\r")) {
	    //didn't fill up all 5 lines, but done
	    if (ouah == 0) { abort = true; }
	    break;	//will require post-processing to avoid sending
			//all 5 of those lines
	  }
	}

	if (abort) {
	  return null;
	} else {
	  return mTxt;	//postprocessing elsewhere, gotta hurry up 2nite
	}
  },
  /*
   * summary:
   *	Executes the portion of the express message to [recipient]
   *	interface for 'X' functionality.  Upon the user's entry of the
   *	recipient's name, it verifies whether or not the user is logged
   *	in/valid in general.  More functionality will be added as the
   *	skeleton is first implemented.
   * returns:
   *	Negative value for user not found, zero for success
   */
  chkRcp : function(ul) {
	//check to make sure the recipient is valid
	var recip = null, success = false;

	console.putmsg(green + "Message eXpress\nRecipient: ");
	//note that a default user from previous expresses will
	//have to be added here to keep people from bitching

	recip = console.getstr();
	for each (u in ul) {
	  if (u.alias.toUpperCase() == recip.toUpperCase()) {
	    success = true;
	    return u.alias;
	  }
	}

	//offline?
	if ((!success) && (system.matchuser(recip) == 0)) {
	  //not found
	  console.putmsg(red + high_intensity +
		"User record not found\n" + green);
	  return -1;
	} else {
	  //user offline
	  //NOTE: there will have to be a better solution here
	  console.putmsg(yellow + high_intensity +
		"User is currently offline; try Mail>\n" +
		green);
	  return 0;
	}
  },
  /*
   * summary:
   *	The enclosing logic for the entire Xpress message sending
   *	routine, from 'x' at the main menu, as well as from any other
   *	area where it will be implemented (ie message save menus,
   *	message read menus, etc)
   * returns:
   *	Negative value for fuggup
   */
  sendX : function() {
	var recip, ouah, mTxt;

	recip = express.chkRcp(wholist.populate());
	if (recip <= 0) {
	  //oopthieoopth!
	  return -1;
	}

	mTxt = express.readBuf();
	
	if (mTxt != null) {
	  system.put_telegram(system.matchuser(recip), mTxt);
	  console.putmsg(green + "Message sent!\n");
	}
  }
}
