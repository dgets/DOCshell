/*
 * dexpress.js
 * by: Damon Getsman
 * started: 12oct14 (lol I'm 37 today; lawd the helpless aging)
 * finished;
 *
 * Handles text entry and the like for the ddoc suite, strictly for
 * 'express message' functionality.
 */

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
		abort = true;
	    } else if ((x == '\r') && (lPos == 0)) {
		//done

	    } else if (x == '\r') {
		//next line

	    } else {
		//standard entry/copy
	
	    }

	  }

	  if (abort) { break; }
	}

	if (abort) { return null; }
  },
  sendX : function() {

  }

}
