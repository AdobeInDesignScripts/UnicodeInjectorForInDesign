//DESCRIPTION: Insert Unicode Character
/*

MIT License
-----------

Copyright (c) 2020 Kris Coppieters

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

About
-----

Also see:

  https://github.com/zwettemaan/UnicodeInjectorForInDesign

This script will insert a sequence of one or more Unicode
characters at the current insertion point in InDesign.

This script is a bit odd in that it is configured by renaming a 
copy of the UnicodeInjector.jsx file.

The idea is that you make one or more copies of this script,
rename them according to the desired goal, and place these 
copies into your scripts folder.

For example, if you rename a copy of this script to:

  U+0061 U+0062 Insert Unicode chars.jsx

and then copy it into your InDesign Scripts folder, each time
you set your text cursor in some text, then double-click the script 
(or hit a keyboard shortcut if you assign one), it will insert the
Unicode characters U+0061 and U+0062 (that is, 'A' and 'B' - it's a 
silly example).

Installing
----------

If UnicodeInjector is not bundled with your copy of Adobe InDesign, you
need to copy the UnicodeInjector.jsx script into your 'Scripts Panel' 
folder: bring up the Scripts panel in InDesign, right click the 'User' 
folder  on this panel and select 'Reveal in Explorer' or 
'Reveal in Finder' from the context menu. Open the 'Scripts Panel' 
folder you should now see, by double-clicking it. Copy UnicodeInjector.jsx 
file inside the 'Scripts Panel' folder. Then switch back to InDesign.

Once UnicodeInjector.jsx is installed and visible on the Scripts panel, 
either in the Users or Community folder, double-click it.

You will be prompted for a filename of the copied script.

Look up the Unicode characters you desire to insert (e.g. assume we want to 
insert a hair space, U+200A).

Name the copy so it contains the desired unicode(s) as well as some descriptive
text - e.g.

  U+200A Insert a hair space.jsx

To assign a keyboard shortcut to the script, go to the 

Edit - Keyboard Shortcuts... 

menu. If you have not done so some time before, make a new set by
clicking the 'New Set...' button.

If you already have a custom set, feel free to add to that set instead.

Select the 'Scripts' Product Area, and then find your scripts in 
the list. Assign any keyboard shortcuts as desired.

Repeat this procedure as many times as needed - you can have as many
copies of this script as you want.

More info
---------

This script will ignore any descriptive text in the file name.
So in the above example, the text 'Insert Unicode chars' is 
ignored - only the U+0061 and U+0062 is interpreted.

The script understands the following notations:

U+nnnn (U, +, then 1 to 4 hexadecimal digits)
  Examples: U+0041, u+20eF, u+61
0xnnnn (0, x, then 1 to 4 hexadecimal digits)
  Examples: 0x0041, 0x20Ef, 0X61
0dnnnnn (0, d, followed by 1 to 5 decimal digits)
  Examples: 0d65, 0d8431, 0D97 

So the script whose filename is:

  Insert the letter a with code 0d65.jsx

will insert the letter 'a', as it contains '0d' followed 
by a decimal number 65

You might need to insert spaces when using multiple codes
and 0x or 0d notation.

For example, 0x61 0x61 will insert two 0x61 codes, whereas
0x610x61 will insert a single 0x610 code, and will ignore
the x61. 

Where do you find the various unicode characters? 

You can start by consulting the following downloadable text file:

  http://www.unicode.org/Public/UNIDATA/UnicodeData.txt

Example: you can find the following line:

...
200A;HAIR SPACE;Zs;0;WS;<compat> 0020;;;;N;;;;;

This means that to insert a hair space, you'd rename your
script file to something similar to:

  U+200A Insert a hair space.jsx

Then copy it into the scripts palette, double click it to 
insert a hair space.

Version info
------------

UnicodeInjector.jsx

Version 0.0.2

(C) 2011-2020 Rorohiko Ltd.
All rights reserved.
By Kris Coppieters
kris@rorohiko.com

About Rorohiko
--------------

Rorohiko specialises in making printing, publishing and web workflows more efficient.

This script is a free sample of the custom solutions we create for our customers.

If your workflow is hampered by boring or repetitive tasks, inquire at

  sales@rorohiko.com

The scripts we write for our customers repay for themselves within weeks or 
months.

*/

const kUnconfiguredScriptName = "UnicodeInjector.jsx";
const kSampleScriptName       = "U+20AC Euro Sign";

// This is the 'faked' script name used when you run the script from the
// ExtendScript Toolkit
const kDebugSampleScriptName  = "U+0061 U+0062 Insert Unicode chars.jsx";

const kUnicodeRegEx           = /^(.*?u\+([0-9a-f]{1,4}))(.*)$/i;
const kHexaRegEx              = /^(.*?0x([0-9a-f]{1,4}))(.*)$/i;
const kDeciRegEx              = /^(.*?0d([1-9][0-9]*))(.*)$/i;

const kErr_NoError            = 0;
const kErr_NoSelection        = 1;
const kErr_MissingCodes       = 2;

var error = kErr_NoError;

do
{    
    var fileName; 
    try
    {
        if (app.activeScript instanceof File)
        {
            fileName = app.activeScript.name;
        }
        else 
        {
            fileName = kDebugSampleScriptName;
        }
    }
    catch (err)
    {
        fileName = kDebugSampleScriptName;
    }

    if (fileName == kUnconfiguredScriptName) {
        error = kErr_MissingCodes;
        break;
    }    

    if (app.documents.length == 0) {
        error = kErr_NoSelection;
        break;
    }

    if (! (app.selection instanceof Array))
    {
        error = kErr_NoSelection;
        break;
    }

    if (app.selection.length != 1)
    {
        error = kErr_NoSelection;
        break;
    }

    if (! (app.selection[0] instanceof InsertionPoint))
    {
        error = kErr_NoSelection;
        break;
    }

    var fileNameWasPrefixedWithCode;
    var charCode;
    var numberBase;
    var numericalCharCode;
    var matchingRegEx;
    
    error = kErr_MissingCodes;

    // Start a loop that strips code prefixes from the filename 
    // one by one, until all codes have been processed
    do
    {
        fileNameWasPrefixedWithCode = false;
    
        if (fileName.match(kUnicodeRegEx) != null)
        {
            matchingRegEx = kUnicodeRegEx;
            numberBase = 16;
        }
        else if (fileName.match(kHexaRegEx) != null)
        {
            matchingRegEx = kHexaRegEx;
            numberBase = 16;
        }
        else if (fileName.match(kDeciRegEx) != null)
        {
            matchingRegEx = kDeciRegEx;
            numberBase = 10;
        }
        else
        {
            matchingRegEx = null;
        }

        if (matchingRegEx != null)
        {
            charCode = fileName.replace(matchingRegEx,"$2");

            if (charCode != "")
            {
                numericalCharCode = parseInt(charCode, numberBase);
                if (! isNaN(numericalCharCode) && numericalCharCode != 0)
                {
                    error = kErr_NoError;
                    app.selection[0].contents = String.fromCharCode(numericalCharCode);

                    fileNameWasPrefixedWithCode = true;
                    // Strip off the code we just processed, and then loop back to try 
                    // to get the next code, if any
                    fileName = fileName.replace(matchingRegEx,"$3");
                }
            }
        }
    }
    while (fileNameWasPrefixedWithCode);
}
while (false);

switch (error)
{

case kErr_NoSelection:

    alert("Please put the blinking text cursor somewhere in a text frame, but avoid selecting any text.");
    break;

case kErr_MissingCodes:

    var newName = 
        prompt(
            "This script needs to be copied and renamed in order to function.\n" + 
            "To view instructions on how to decide on a name for the copied script, " + 
            "right-click this script on the Scripts panel and choose 'Edit Script'.\n\n" + 
            "Enter the name for the copied script (you can tweak the example shown below):", 
            kSampleScriptName, 
            "Customizing Script");

    if (newName) {

        if (newName.substr(-4).toLowerCase() != ".jsx") {
            newName += ".jsx";
        }

        var destination = File(app.scriptPreferences.scriptsFolder + "/" + newName);
        if (destination.exists) {
            alert("A script by that name already exists. No copy was made.");
        }
        else {
            app.activeScript.copy(destination);
            alert("The Scripts panel will now update.");
            File(app.filePath).execute();
        }
    }
    break;
}