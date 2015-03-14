/*
 * by: Damon Getsman
 * contributing/refactoring also by: @Ntwitch (github.com)
 * started: 26Jan15
 * alpha phase: 28Feb15
 * beta phase:
 * finished:
 *
 * This file is for any of the functionality that I still need to work on that
 * will rely on per-room record keeping, settings, etc.  Functionality such as
 * room info, zapped rooms, etc, will be handled from within this particular
 * code snippet.
 */

roomData = {
  //properites
  userDir : system.data_dir + "user/",
  roomSettingsFilename : "docrooms",
  maxInfoLines : 160,
  userRoomSettingsFilename : "userrooms",

  //sub-objects
  roomRecords : {
    //--++==**methods**==++--
        /*
         * summary:
         *      new defaults for new/undefined rooms
         */
    defaultSettings : function() {
	var settings = {
	  moderator : "none set",
	  infoCreationDate : "",
	  info : []
	}
    }
  },
  userRoomSettings : {
	//this will include more than just zapped rooms for now, but we're
	//just going to handle that for the time being
	/*
	 * summary:
	 *	Empty for the filling
	 */
	defaultSettings : function() {
		var roomList = {
		  zRooms : []
		}
	}
  },
  fileIO : {
    //getting and setting the different shit above
    //--++==**properties**==++--
    roomRecFilename : this.userDir + 
		      this.roomSettingsFilename,
    userZapRecFilename : this.userDir + 
			 this.userRoomSettingsFilename,

    //--++==**methods**==++--
	/*
	 * summary:
	 *	Method is takes open JSON w/comments file and tests that
	 *	it is open; strips comments and blank lines, then reads
	 *	the remaining (presumably JSON) to return to caller
	 * configurationFile:
	 *	The [already open] File object to be worked upon
	 * returns:
	 *	Unparsed [presumably JSON] blob
	 */
    stripNRead : function(configurationFile) {
	var chunky;

	if ((configurationFile == null) || (!configurationFile.is_open)) {
	  if (userSettings.debug.file_io) {
	    console.putmsg(red + "Unable to open conf file: " + 
		configurationFile + "\n");
	  }
	  throw new dDocException("Unable to open JSON conf file",
		"Unable to open " + configurationFile, 1);
	}
	configurationFile = userRecords.userDataIO.stripComments(
				configurationFile);

	try {
	  chunky = configurationFile.read();
	} catch (e) {
	  if (userSettings.debug.file_io) {
		console.putmsg(yellow + "Unable to read configurationFile\n");
	  }
	  throw new dDocException("Exception reading configurationFile\n",
		"Unable to read from " + configurationFile, 2);
	} finally {
	  configurationFile.close();
	}

	return chunky;
    },
	/*
	 * summary:
	 *	Method opens room info settings file, strips the bullshit
	 *	out of it, and [hopefully] parses it as a JSON blob to
	 *	be returned to extract room information from
	 * returns:
	 *	JSON blob specified above
	 */
    snagRoomInfoBlob : function() {
	var roomInfoFile = new File(roomRecFilename);

	try {
	    chunky = this.stripNRead(roomInfoFile);
	} catch (e) {
	    console.putmstg(yellow + "Error in stripNRead(): " +
		e.message + "\n");
	    throw new dDocException("Exception in stripNRead()",
		e.message, 1);
	}

	if ((chunky == null) || (chunky.length < 30)) {
	    //one would think that creating a template would be good here
	    throw new dDocException("Exception: blob too small/null",
		"blob null or length < 30", 4);
	}

	chunky = JSON.parse(chunky);

	//any more testing here?
	return chunky;

	}
	/*
	 * summary:
	 *	Method opens file of user's zapped rooms (still need to
	 *	come up with the JSON for that), strips irrelevant,
	 *	and [ideally] returns the parsed JSON that should just
	 *	include the user's list of zapped rooms (prolly by #)
	 * returns:
	 *	JSON object specified above
	 */
      snagUserZappedRooms : function() {
	var zappedFile = new File(userZapRecFilename);
	var chunky;

	if (!file_esists(zappedFile.name)) {
	  //create a dummy file or move it from misc, throw exception,
	  //something for the love of all things holy

	} else {
	  try {
	    zappedFile.open("r");
	  } catch (e) {
	    zappedFile.close();
	    throw new dDocException("Exception opening " + zappedFile.name,
		e.message, 1);
	  }

	  try {
	    chunky = this.stripNRead(zappedFile);
	  } catch (e) {
	    console.putmsg(yellow + "Error in stripNRead(): " +
		e.message + "\n");
	    throw new dDocException("Exception in stripNRead()",
		e.message, 2);
	  }
	
	  if ((chunky == null) || (chunky.length < 30)) {
	    //create template?
	    throw new dDocException("Exception: blob too small/null",
		"blob null or length < 30", 5);
	  }

	  chunky = JSON.parse(chunky);

	  return chunky;
	}
      }
  }
}

