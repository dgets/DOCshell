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

wholist = {
  //collect the wholist into three arrays; short, long, and one
  //populated solely by the user numbers for easier access when Xing
  populate : function() {
	var ul = new Array(User);
	var tu = 0;

	for (var n = 0; n < system.nodes; n++) {
	  if (system.node_list[n] == NODE_INUSE) {
		ul[tu++] = User(system.node_list[n].useron);
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

	for (var ouah = 0; ouah < ul.length; ouah++) {
	  unames[ouah] = ul[ouah].alias;
	  if (unames[ouah].length > maxALen) {
	    maxALen = unames[ouah].length;
	  }
	  tu++;
	}

	//assuming 80 column screens for now
	cols = Math.round(80 / (maxALen + 2));

	//there should probably be some sort of nice heading here
	console.putmsg(green + "\n");
	for (var ouah = 1; ouah <= tu; ouah++) {
	  console.putmsg(unames[ouah] + "  ");
	  if ((ouah % cols) == 0) {
		console.putmsg("\n");
	  }
	}
  }
},
express = {
  //read the number of lines specified; return an array of such after
  //text processing/input is done
  readBuf : function(lns) {
	var mTxt = new Array(), abort = false;

	for (var ouah = 0; ouah < lns; ouah++) {
	  var mLn = '', lPos = 0;

	  while ((lPos < 65) && (!abort)) {
	    var x = console.getkey();

	    if (x == '\03') {
		//Ctrl-C handling
		abort = true;
	    } else if ((x == '\r') && (lPos == 0)) {
		//done
		if (ouah == 0) {
			abort = true;
		} else {
			//send it off
			return mTxt;
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
  sendX : function(mTxt) {

  }

}
