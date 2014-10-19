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
