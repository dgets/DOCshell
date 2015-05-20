/*
 * by: Damon Getsman
 * contributing/refactoring also by: @Ntwitch (github.com)
 * started: 26Jan15
 * alpha phase: 28Feb15
 * beta phase: 13May15
 * finished:
 *
 * This file is for any of the functionality that I still need to work on that
 * will rely on per-room record keeping, settings, etc.  Functionality such as
 * room info, zapped rooms, etc, will be handled from within this particular
 * code snippet.
 */

roomData = {
  //properites - try to determine why these are not accessible (NaN) in areas
  userDir : system.data_dir + "user/",
  roomSettingsFilename : "docrooms",
  maxInfoLines : 160,
  userRoomSettingsFilename : "durooms",

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
		  //"alias" : null,
		  "zRooms" : []
		}

		return roomList;
	}
  },
  roomSettingsUX : {
	/*
	 * summary:
	 *	Calls displayRoomInfo(), determines permissions for changing the
         *	room info, calls changeRoomInfo() if appropriate
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
	 *	Changes room info by calling poast.getTextBlob(); then calls
         *	roomData.fileIO.saveRoomInfo() in order to commit the changes
	 */
    changeRoomInfo : function() {
	  var infoTxt = new Array();

	  if ((infoTxt = poast.getTextBlob(this.maxInfoLines)) != null) {
		//save the new room info
		try {
		  roomSettings[bbs.cursub_code] =
                      roomData.fileIO.saveRoomInfo(infoTxt, bbs.cursub_code);
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
	  roomSettings[bbs.cursub_code] = snagRoomInfoBlob();
	} catch (e) {
	  console.putmsg("Unable to snagRoomInfoBlob(): " + e.name +
              "\nMsg: " + e.message + "\n");
	}

	if (roomSettings[bbs.cursub_code].info.length == 0) {
	  //or should we be looking for null here?
	  console.putmsg(green + high_intensity +
	    "The scroll is blank!\n\n");
	} else {
	  for each (var ln in roomSettings[bbs.cursub_code].info) {
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

	/*if (roomSettings[bbs.cursub_code] == null) {
	  if (userSettings.debug.misc) {
	    console.putmsg(green + high_intensity +"\nNo roominfo has been " +
	      "set yet for " + cyan + bbs.cursub_code + "\n\n");
	  }

	  roomSettings[bbs.cursub_code] = { };
	  roomSettings[bbs.cursub_code].settings = 
	    new roomData.roomRecords.defaultSettings();

	  //this will have to throw an exception after we learn to create
	  //the new entries
	} this should now be unnecessary, handled in file_io areas */

	console.putmsg(green + high_intensity + "\nForum Moderator is " +
	  cyan + roomSettings[bbs.cursub_code].moderator + ".  " +
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
	  roomSettings[bbs.cursub_code].infoCreationDate + green +
	  " by " + cyan + roomSettings[bbs.cursub_code].moderator +
	  "\n\n");

	mBase.close();
    }
  },
  /*
   * summary:
   *	Desperately in need of refactoring, but this was supposed to just
   *	contain the different methods/properties necessary for file IO internal
   *	to the processing in this file
   */
  fileIO : {
    //getting and setting the different shit above
    //--++==**properties**==++--
    roomRecFilename : this.userDir + 
		      this.roomSettingsFilename,
    /*userZapRecFilename : this.userDir + 
			 this.userRoomSettingsFilename, */
    userZapRecFilename : "/sbbs/data/user/durooms",

    //--++==**methods**==++--
	/*
	 * summary:
	 *	Method saves room info blob in general; if the current room
         *	does not exist in the roomSettings object it creates a new one
         *	with the default information
	 */
    saveRoomInfo : function() {
        var roomInfoLoc = "/sbbs/data/user/docrooms";   //how to fix this?
        var roomInfoFile = new File(roomInfoLoc);
        //make sure to have a special case to initialize a new room's info
        //if it doesn't already exist in the roomSettings (freshly created)
        if (roomSettings[bbs.cursub_code] == null) {
            roomSettings[bbs.cursub_code] =
                roomData.roomRecords.defaultSettings();
        }

        try {
            roomInfoFile.open("w");
        } catch (e) {
            if (userSettings.debug.file_io) {
                console.putmsg(red + "Unable to open " + roomInfoLoc +
                  " for writing!\n");
            }
            throw new dDocException("saveRoomInfo() Exception", e.message, 1);
        }

        try {
            roomInfoFile.write(JSON.stringify(roomSettings));
        } catch (e) {
            if (userSettings.debug.file_io) {
                console.putmsg(red + "Unable to stringify/write roomSettings " +
                  "to " + roomInfoLoc + "!\n");
            }
            throw new dDocException("saveRoomInfo() Exception", e.message, 2);
        } finally {
            roomInfoFile.close();
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

	if ((configurationFile == null) || (!configurationFile.is_open) ||
	    (!configurationFile.exists)) {
	  if (userSettings.debug.file_io) {
	    console.putmsg(red + "Unable to open conf file: " + 
		configurationFile + "\n");
	  }
	  throw new docIface.dDocException("Unable to open JSON conf file",
		"Unable to open " + configurationFile, 1);
	}
	/*configurationFile = userRecords.userDataIO.stripComments(
				configurationFile); */

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

	if (userSettings.debug.file_io) {
	  console.putmsg(yellow + "Got back chunky: " + chunky + " in " +
	    "stripNRead()\n");
	}

	return chunky;
    },
	/*
	 * summary:
	 *	Method attempts to open roomInfoLoc (not sure still why the
         *	constant definition of this is not working :-?), read its
         *	contents into a string, and parse into roomSettings.  If the
         *	room info file doesn't exist yet, it'll create an object with
         *	all of the current dystopian rooms and the default settings,
         *	then writing such.
	 */
    snagRoomInfoBlob : function() {
        var roomInfoLoc = "/sbbs/data/user/docrooms";   //how to fix this?
        var roomInfoFile = new File(roomInfoLoc);
        var blob = new String();

        if (roomInfoFile.exists) {
            try {
                roomInfoFile.open("r");
            } catch (e) {
                if (userSettings.debug.file_io) {
                    console.putmsg(red + "Error opening " + roomInfoLoc + "\n" +
                      "Message: " + e.message + "\n");
                }
                throw new dDocException("snagRoomInfoBlob() Exception",
                    e.message, 1);
            }

            try {
                blob = roomInfoFile.read();
            } catch (e) {
                if (userSettings.debug.file_io) {
                    console.putmsg(red + "Error reading from: " + roomInfoLoc +
                      "\nMessage: " + e.message + "\n");
                }
                throw new dDocException("snagRoomInfoBlob() Exception",
                    e.message, 2);
            } finally {
                roomInfoFile.close();
            }

            try {
                roomSettings = JSON.parse(blob);
            } catch (e) {
                if (userSettings.debug.file_io) {
                    console.putmsg(yellow + "Error parsing JSON from: " +
                      roomInfoLoc + "\nMessage: " + e.message + "\n");
                }
                throw new dDocException("snagRoomInfoBlob() Exception",
                    e.message, 3);
            }
        } else {
            //looks like the info file doesn't exist yet
            for each(room in msg_area.grp_list[topebaseno].sub_list) {
                if (userSettings.debug.misc) {
                    console.putmsg(green + "Setting room info for " +
                      room.code + "\n");
                }
                roomSettings[room.code] =
                    roomData.roomRecords.defaultSettings();
                //guess we might as well just write it now, as well
                try {
                    this.saveRoomInfo();
                } catch (e) {
                    if (userSettings.debug.file_io) {
                        console.putmsg(red + "Unable to save " + roomInfoLoc +
                          "\nMessage: " + e.message + "\n");
                    }
                    throw new dDocException("snagRoomInfoBlob() Exception" +
                      " while calling saveRoomInfo()", e.message, 4);
                }
            }
        }
    },
	/*
	 * summary:
	 *	Method opens file of user's zapped rooms (still need to
	 *	come up with the JSON for that), strips irrelevant,
	 *	and [ideally] returns the parsed JSON that should just
	 *	include the user's list of zapped rooms (prolly by #)
	 * returns:
	 *	Just the array of rooms zapped for this user; also sets the
	 *	global zappedRooms object with all of the data for each user
	 *	though this is not strictly necessary or even advisable at
	 *	this point
	 */
      snagUserZappedRooms : function() {
	var zappedFile = new File(this.userZapRecFilename);
	var zappedChunx = { }, success = false;
	var blob;

	if (userSettings.debug.navigation) {
	  console.putmsg(yellow + "Testing for existance of: " +
	    zappedFile.name + ": " + zappedFile.exists + "\n");
	}

	if (!zappedFile.exists) {
	  //create a dummy file or move it from misc, throw exception,
	  //something for the love of all things holy
	  //if (zappedRooms[user.number] == null) {
	    zappedRooms = zappedChunx;
	    zappedRooms[user.number] = { };
	    zappedRooms[user.number].zRooms = [ ];
	  //}

	  if (userSettings.debug.navigation) {
	    console.putmsg(red + "Couldn't find " + zappedFile.name + "\n");
	  }

	  try {
	    zappedFile.open("w");
	  } catch (e) {
	    zappedFile.close();
	    throw new docIface.dDocException("Exception opening " +
	      zappedFile.name + " for writing", e.message, 3);
	  }

	  //let's try to figure out why in the hell shit is ending up 
	  //undefined here
	  if (userSettings.debug.navigation) {
	    console.putmsg(red + "Trying to write to: " + zappedFile.name +
		"\nzappedRooms: " + JSON.stringify(zappedRooms) + "\n");
	  }

	  try {
	    zappedFile.write(JSON.stringify(zappedRooms));
	  } catch (e) {
	    zappedFile.close();
	    throw new docIface.dDocException("Exception writing to " +
	      zappedFile.name, e.message, 5);
	  }

	  //with all good luck, that is it
	  zappedFile.close();
	  blob = JSON.stringify(zappedRooms);
	} else {
	  if (userSettings.debug.navigation) {
	    console.putmsg(red + "Allegedly " + zappedFile.name + " exists, " +
	      "according to zappedFile.exists: " + zappedFile.exists + "\n");
	  }

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
	    zappedFile.close();
	    console.putmsg(yellow + "Error in stripNRead(): " +
		e.message + "\n");
	    throw new docIface.dDocException("Exception in stripNRead()",
		e.message, 2);
	  }

	  if (userSettings.debug.navigation) {
	    console.putmsg(yellow + "Got back blob: " + blob + "\n");
	  }

	  /*
	   * TODO: This should end up holding the contents of the default
	   * record if things haven't been set just yet as a precursor to
	   * saving the new user's zapped array
	   */	
	  if ((blob == null) || (blob.length == 0)) {
	    //create template?
	    throw new docIface.dDocException("Exception: blob zero length/null",
		"blob null or length == 0", 4);
	  }

	  zappedChunx = JSON.parse(blob);

	  for each(entry in zappedChunx) {
	    if (entry.number == user.number) {
		success = true;		//shouldn't be necessary now
		//zappedRooms = zappedChunx;
		return entry.zRooms;
		break;
	    }
	  }

	  zappedRooms = zappedChunx;
	  if (!success) {
		return [ ];
	  }
	}
      },
	/*
	 * summary:
	 *	Writes out whole block of zapped rooms, creating the file if
	 *	necessary, to record the entries
	 */
      writeUserZappedRooms : function() {
	//var success = false;
	/*var outfile = new File(this.roomData.userDir + 
				this.userRoomSettingsFilename); */
	var outfile = new File(system.data_dir + "user/durooms");

	if (userSettings.debug.navigation) {
	  console.putmsg("Working with zapped data:\n" + cyan +
		JSON.stringify(zappedRooms) + "\n");
	}
	for each(ouah in zappedRooms) {
	  /*if (userSettings.debug.navigation) {
		console.putmsg(cyan + JSON.stringify(ouah));
	  }*/
	  if (ouah.number == user.number) {
		success = true;
	  }
	}

	/*if (!success) {
	  zappedRooms[user.number].alias = user.alias;
	  zappedRooms[user.number].zRooms = [ ];
	}*/

	try {
	  //userRecords.userDataIO.openFileWrap(outfile, "r+");
	  outfile.open("w");
	  //outfile = userRecords.userDataIO.stripComments(outfile);
	  //outfile.truncate(outfile.position);
	  outfile.write(JSON.stringify(zappedRooms));
	  //outfile.close();
	} catch (e) {
	  console.putmsg(red + "Unable to save in writeUserZappedRooms():\n" +
	    e.message + "\n");
	} finally {
	  outfile.close();
	}

      }
  },
  tieIns : {
        /*
         * summary:
         *      Method scans for the room number that it is passed within the
         *      zappedRooms.zRooms array; if it finds the number it signifies
         *      that this room is, indeed, zapped, and should be eschewed from
         *      the message scan
         * roomNo:
         *      Room number being tested
         * return:
         *      True for success (room is zapped), false otherwise
         */
    isZapped : function(roomNo) {
        if (zappedRooms[user.number] == null) {
          zappedRooms[user.number] = roomData.roomRecords.defaultSettings;
          return false;
        } else {
         for each(var zNo in zappedRooms[user.number].zRooms) {
          if (roomNo == zNo) {
                return true;
          }
         }
         return false;
        }
    },
    zapRoom : function(roomNo) {
	if (zappedRooms[user.number] == null) {
	    zappedRooms[user.number] = { };
	    zappedRooms[user.number].zRooms = [ roomNo ];
	} else if (this.isZapped(roomNo)) {
	  //see if it's already there
	  //let's use what we've already got, mm'kay?
		if (userSettings.debug.navigation) {
		  console.putmsg(yellow + "Room already exists in zRooms.\n");
		}
	} else {
		zappedRooms[user.number].zRooms[
		  zappedRooms[user.number].zRooms.length] = roomNo;
		if (userSettings.debug.navigation) {
		  console.putmsg(yellow + "Added to zRooms.\n");
		}
	}

	try {
	  roomData.fileIO.writeUserZappedRooms();
	} catch (e) {
	  console.putmsg("Error in writeUserZappedRooms(): " + e.message +
		"\n");
	}
    },
    unzapRoom : function(roomNo) {
	var tmp = 0;
	var curZapped = new Array; //, newCurZapped = new Array;

	for each(var ouah in zappedRooms[user.number].zRooms) {
	  if (ouah != roomNo) {
	    curZapped[tmp++] = ouah;
	  }
	}

	zappedRooms[user.number].zRooms = curZapped;
        try {
          roomData.fileIO.writeUserZappedRooms();
        } catch (e) {
          console.putmsg("Error in writeUserZappedRooms(): " + e.message +
                "\n");
        }
    }
  }
}

