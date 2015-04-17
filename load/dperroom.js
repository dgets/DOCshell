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
	 * return:
	 *	new empty object for room settings
         */
    defaultSettings : function() {
	var settings = {
	  moderator : null,
	  infoCreationDate : "",
	  info : []
	}

	return settings;
    }
  },
  userRoomSettings : {
	//this will include more than just zapped rooms for now, but we're
	//just going to handle that for the time being
	/*
	 * summary:
	 *	Empty for the filling
	 * return:
	 *	new empty object for userRoomSettings
	 */
	defaultSettings : function() {
		var roomList = {
		  zRooms : []
		}

		return roomList;
	}
  },
  roomSettingsUX : {
	/*
	 * summary:
	 *	Call to prompt user and change room info
	 */
    promptUserForRoomInfo : function() {
	this.displayRoomInfo();

	if (!console.noyes("Change this?")) {
	  //can we moderate this?
	  if ((roomSettings.moderator == user.alias) ||
	      (((roomSettings.moderator == "none set") ||
		(roomSettings.moderator == null)) &&
	       (user.security.level >= 80))) {
		console.putmsg(green + high_intensity + 
			"Enter new room info here:\n");
		this.changeRoomInfo();
	  } else {
	    console.putmsg(yellow + high_intensity + "You're not allowed!\n\n");
	  }
	} else {
	  console.putmsg(green + high_intensity + "\nStaying the same for " +
		"now . . .\n");
	}
    },
	/*
	 * summary:
	 *	Resets room info
	 */
    changeRoomInfo : function() {
	  var infoTxt = new Array();

	  if ((infoTxt = poast.getTextBlob(this.maxInfoLines)) != null) {
		//save the new room info
		try {
		  roomData.fileIO.saveRoomInfo(infoTxt);
		} catch (e) {
		  console.putmsg(red + "changeRoomInfo() exception: " +
		    e.name + "\nmessage: " + e.message + "\tnum: " + e.number +
		    "\n");
		}
          }
    },
	/*
	 * summary:
	 *	Displays the room info header, then displays room info (if
	 *	set, otherwise amusing nethack message)
	 */
    displayRoomInfo : function() {
	this.displayRoomInfoHdr();

	try {
	  roomSettings = snagRoomInfoBlob();
	} catch (e) {
	  console.putmsg("Unable to snagRoomInfoBlob()\n");
	}

	if (roomSettings[bbs.cursub_code].settings.info.length == 0) {
	  //or should we be looking for null here?
	  console.putmsg(green + high_intensity +
	    "The scroll is blank!\n\n");
	} else {
	  for each (var ln in roomSettings[bbs.cursub_code].settings.info) {
	    console.putmsg(green + high_intensity + ln + "\n");
	  }
	}

	console.putmsg("\n");
    },
	/*
	 * summary:
	 *	Displays header for the room info, consisting of the
	 *	moderator's alias, total messages, info modification date,
	 *	and all that jazz properly formatted
	 */
    displayRoomInfoHdr : function() {
	var mBase = new MsgBase(bbs.cursub_code);

	if (roomSettings[bbs.cursub_code] == null) {
	  if (userSettings.debug.misc) {
	    console.putmsg(green + high_intensity +"\nNo roominfo has been " +
	      "set yet for " + cyan + bbs.cursub_code + "\n\n");
	  }

	  roomSettings[bbs.cursub_code] = { };
	  roomSettings[bbs.cursub_code].settings = 
	    new roomData.roomRecords.defaultSettings();

	  //this will have to throw an exception after we learn to create
	  //the new entries
	} 

	console.putmsg(green + high_intensity + "\nForum Moderator is " +
	  cyan + roomSettings[bbs.cursub_code].settings.moderator + ".  " +
	  "Total messages: ");

	try {
	  mBase.open();
	} catch (e) {
	  console.putmsg(red + "\nUnable to obtain room information; " +
	    "throwing exception!\nThe wizard is about to die!\n\n");
	  throw new docIface.dDocException("displayRoomInfoHdr() exception",
	    "Unable to open mBase: " + e.message, 1);
	}

	console.putmsg(red + high_intensity + mBase.total_msgs + "\n" +
	  green + "Forum info last updated: " + magenta + 
	  roomSettings[bbs.cursub_code].settings.infoCreationDate + green +
	  " by " + cyan + roomSettings[bbs.cursub_code].settings.moderator +
	  "\n\n");

	mBase.close();
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
	 *	Method saves the text as room info
	 */
    saveRoomInfo : function(roomInfo) {
	var blob = this.snagRoomInfoBlob(this.roomRecFilename, bbs.cursub_code);
	var rmInfoz = { };

	try {
	  rmInfoz = JSON.parse(blob);
	} catch (e) {
	  if (userSettings.debug.misc) {
		console.putmsg(red + "Unable to parse rmInfoz\n");
	  }
	  //no need to throw an error for now
	  rmInfoz[bbs.cursub_code] = { 
		"defaultSettings" : {
			"infoCreationDate" : null,
			"info" : [ ]
		}
	  };
	}
	
	rmInfoz[bbs.cursub_code].defaultSettings.infoCreationDate = Date.now();
	rmInfoz[bbs.cursub_code].defaultSettings.info = roomInfo;

	var infoFile = new File(this.userDir + this.roomSettingsFilename);

	try {
	  infoFile.open("w");
	} catch (e) {
	  console.putmsg(yellow + "Error opening info file\n");
	  throw new docIface.dDocException("Exception in saveRoomInfo()",
		e.message , 1);
	}

	try {
	  if (userSettings.debug.misc) {
	    console.putmsg(yellow + "Trying to save rmInfoz blob\n");
	  }
	  infoFile.write(rmInfoz);
	} catch (e) {
	  if (userSettings.debug.misc) {
	    console.putmsg(red + "Error trying to save rmInfoz blob: " +
		e.message + "\n");
	  }
	  throw new docIface.dDocException("Exception in saveRoomInfo()",
		e.message, 2);
	} finally {
	  infoFile.close();
	}
    },
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
	  throw new docIface.dDocException("Unable to open JSON conf file",
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
	  throw new docIface.dDocException("Exception reading " +
		"configurationFile\n",
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
    snagRoomInfoBlob : function(roomFile, roomReq) {
	var roomInfoFile = new File(this.roomRecFilename);

	if (roomInfoFile.exists) {
	  try {
	    chunky = this.stripNRead(roomInfoFile);
	  } catch (e) {
	    console.putmsg(yellow + "Error in stripNRead(): " +
		e.message + "\nFile: " + roomInfoFile.name
		+ "\n");
	    throw new docIface.dDocException("Exception in stripNRead()",
		e.message, 1);
	  }
	} else {
	  return roomData.roomRecords.defaultSettings;
	}


	if ((chunky == null) || (chunky.length == 0)) {
	    //one would think that creating a template would be good here
	    /* throw new docIface.dDocException("Exception in stripNRead()",
		"blob null or length < 30", 2); */
	    return roomData.roomRecords.defaultSettings;
	}

	chunky = JSON.parse(chunky);

	//any more testing here?
	if (chunky[roomReq] != null) {
	  return chunky[roomReq];
	} else {
	  return roomData.roomRecords.defaultSettings;
	}

     },
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
	var zappedChunx = { };
	var blob;

	if (!file_esists(zappedFile.name)) {
	  //create a dummy file or move it from misc, throw exception,
	  //something for the love of all things holy

	} else {
	  try {
	    zappedFile.open("r");
	  } catch (e) {
	    zappedFile.close();
	    throw new docIface.dDocException("Exception opening " + 
		zappedFile.name, e.message, 1);
	  }

	  try {
	    blob = this.stripNRead(zappedFile);
	  } catch (e) {
	    console.putmsg(yellow + "Error in stripNRead(): " +
		e.message + "\n");
	    throw new docIface.dDocException("Exception in stripNRead()",
		e.message, 2);
	  }
	
	  if ((blob == null) || (blob.length == 0)) {
	    //create template?
	    throw new docIface.dDocException("Exception: blob too small/null",
		"blob null or length == 30", 5);
	  }

	  zappedChunx = JSON.parse(blob);

	  return zappedChunx;
	}
      }
  }
}

