/*
 * ddebug.js
 * by: Damon Getsman
 * started on: 12sept14
 * finished on:
 *
 * I've found that the generalized debugging dumps to the screen is
 * proving a little bit troublesome, in the BBS shell environment that
 * I'm working with right now.  So I started working on a routine that
 * will make a little window full of each of the properties of an object
 * that I pass to it; it tabulates and shows a column of the results of
 * each object, as well.  Pretty perfect for doing debugging in a
 * display where I want to preserve the content near the bottom of the
 * screen.  It's not debugged yet, and is cluttering up my primary
 * source file, thus it must be cut 'n pasted here for modularity's
 * sake.
 *
 * Not using frames.js on this one; might try to implement that later.
 * I just don't think it'll go too well with a shell that's meant to be
 * utilized in a purely linear ascii dump format
 */

//ouahful local file definitions
const ddebug = true;

headsUpDbg = {
  //my debugging code has proven to be inadequate; might as well do
  //something that'll work a little better and not clutter my shiyit
  //properties
  reqX : 2,
  reqY : 2,
  //methods
  init : function(dDat) {
        var stX, stY,
            reqX = 2, reqY = 2; //borders, duh (not starting @ 0)
        var cT = 1;

        console.pushxy();
        //determine the size of the box we need based on dDat's
        //properties, build it, and display the crapola
        for (var p in Object.keys(dDat)) {
          reqY++;
          if ((p.toString().length + 1 + dDat[p].length) > reqX)
                reqX = 3 + p.toString().length + dDat[p].length;
          //find out 'tabstop' for the data column
          if (cT < dDat[p].length) cT = dDat[p].length;
        }

        stX = console.screen_columns - reqX;
        stY = console.screen_rows - reqY;

        //build box
        /*
         * according to echicken, frame.js provides an almost ncurses
         * ported to javascript for node.js; however to provide an
         * emulated vDOC environment as close to original as possible
         * I'm only going to break this ANSI dump to current cursor
         * position standard enough to insert my debugging window
         */
        console.putmsg(red);
        for (var cX = (console.screen_columns - (reqX + 1));
             cX < console.screen_columns; cX++) {
                for (var cY = (console.screen_rows - (reqY + 1));
                     (cY < console.screen_rows); cY++) {
                        console.gotoxy(cX, cY);
                        console.putmsg("#");
                }
        }

        var cY = 1;

        for (var p in Object.keys(dDat)) {
          cY++; cX = 1;

          console.gotoxy((stX + cX), (stY + cY));
          console.putmsg(green + p);
          console.gotoxy((cX + stX + cT), (stY + cY));
          console.putmsg(yellow + dDat[p]);
        }

  }
}

