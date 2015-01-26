/*
 * dperuser.js
 *
 * by: Damon Getsman
 * started: 26Jan15
 * alpha phase:
 * beta phase:
 * finished:
 *
 * This file is for any of the functionality that I still need to work on that
 * will rely on per-user records.  IE: Zapped rooms/known rooms, user 'i'nfo,
 * etc.  I'll need to run through some of the issues on github and find out
 * which areas, exactly, will need to have functionality here worked with, 
 * other than those bits that I remember.
 */

var debugging = true;

userRecords = {
  //information that would be stored in 'i'nfo and 'p'rofile on a DOC style
  //BBS system

  //	----++++****====userRecords properties====****++++----
  maxInfoLines : 5,
  doingChars : 55,

  //		----++++****====userRecord methods====****++++----

  //		----++++****====userRecord sub-objects====****++++----

  userDataIO : {
    //pulling or pushing the information stored in the user profile/info
    

  },
  userDataUI : {
    //pushing/pulling output from the user (sorry, I can't stop using that
    //terminology now

    //	  ----++++****====userDataUI methods====****++++----
    getInfo : function() {
	
    },
    displayInfo : function() {

    }

  }

}
