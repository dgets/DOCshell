/*
 * dexpress.js
 * by: Damon Getsman
 * started: 12oct14 (lol I'm 37 today; lawd the helpless aging)
 * finished;
 *
 * Handles text entry and the like for the ddoc suite, strictly for
 * 'express message' functionality.
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

  //collect the wholist into three arrays; short, long, and one
  //populated solely by the user numbers for easier access when Xing
  populate : function() {
	var ul = new Array();
	var tu = 0;

	for (var n = 0; n < system.nodes; n++) {
	  //god ouahful debugging
	  /*if (wholist.debugging) {
		console.putmsg(yellow + "In the goddamn for loop\n" +
		  green);
	  }*/

	  if (system.node_list[n] && NODE_INUSE) {
		ul[tu++] = User(system.node_list[n].useron);
		/*if (wholist.debugging) {
		  console.putmsg(red + "Debug: #" + tu + " - " +
		    ul[tu - 1] + ", Raw: " +
		    User(system.node_list[n].useron) + green +
		    "\n");
		}*/
	  }
	}

	return ul;
  },
  //just do a raw Synchronet wholist for the long version
  list_long : function() {
	//this is the easy one
	bbs.whos_online();
  },
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
  //read the number of lines specified; return an array of such after
  //text processing/input is done
  //NOTE: Finding out that console.getstr() has the functionality that
  //I've been painstakingly rewriting by hand here will make this much
  //easier.  We hates rewriting the wheel, thats we does.
  readBuf : function(lns) {
	var mTxt = new Array(), abort = false;

	for (var ouah = 0; ouah < lns; ouah++) {
	  var mLn = '', lPos = 0, x;

	  while ((lPos < 65) && (!abort)) {
	    x = console.getkey();

	    if (x == '\03') {
		//Ctrl-C handling
		abort = true;
	    } else if ((x == '\r') && (lPos == 0)) {
		//done
		if (ouah == 0) {
			abort = true;
		} else {
		  //send it off
		  //return mTxt;

		  //nope: we need to do this concatted
		  if (mTxt.length == 1) {
			return mTxt[0];
		  } else {
		    var fullBuf = mTxt[0]; //need \n?
		    for (var x = 1; x < mTxt.length; x++) {
			fullBuf += mTxt[x];
		    }
		    return fullBuf;
		  }
		}
	    } else if (x == '\r') {
		  //next line
		  lPos = 0;
	    } else {
		//standard entry/copy
		
	    }

	  }

	  if (abort) { break; }
	}

	if (abort) { return null; }
  },
  chkRcp : function(ul) {
	//check to make sure the recipient is valid
	var recip = null, success = false;

	console.putmsg(green + "Message eXpress\nRecipient: ");
	//note that a default user from previous expresses will
	//have to be added here to keep people from bitching

	recip = console.getstr();
	for each (u in ul) {
	  if (u.name == recip) {
	    success = true;
	    return recip;
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
