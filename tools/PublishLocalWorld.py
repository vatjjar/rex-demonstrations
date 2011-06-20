#!/usr/bin/python
#
# Author: Jarkko Vatjus-Anttila <jvatjusanttila@gmail.com>
#
# For conditions of distribution and use, see copyright notice in license.txt
#
######
#
# This script takes a locally created world and publishes it into format
# which is directly deployable to web. Usage of the program is as follows:
#
# PublishLocalWorld.py -i inputTXML -o outputTXML -u URLprefix -f folderprefix
#
# The script traverses through input TXML and changes all asset references
# to point into URLprefix+folderprefix destination. All textual assets found
# from the TXML file are parsed recursively using the same parsing engine.
# All binary asset references are copied as-is.
#
# After the process, outputTXML file contains all web references, and
# folderprefix folder in the root directory contain all re-formatted
# copies of the assets. Output TXML and folderprefix contents are directly
# deployable with Tundra + Apache2 server combination.
#

import sys, os, io

############################################################################

class PublishTundraWorld():
    """ class PublishTundraWorld():
    """

    def __init__(self, urlprefix="", folderprefix=""):
        """
        """
        self.set_urlprefix(urlprefix)
        self.set_folderprefix(folderprefix)

############################################################################
#
#

    def set_urlprefix(self, urlprefix):
        if not urlprefix.endswith(os.sep):
            urlprefix = urlprefix + os.sep
        self.urlprefix = str(urlprefix)

    def get_urlprefix(self):
        return self.urlprefix

    def set_folderprefix(self, folderprefix):
        if not folderprefix.endswith(os.sep):
            folderprefix = folderprefix + os.sep
        self.folderprefix = str(folderprefix)

    def get_folderprefix(self):
        return self.folderprefix

############################################################################
#
#

    def printmessage(self, message, newline="\n"):
        sys.stdout.write(message + newline)

    def printerror(self, message, newline="\n"):
        sys.stderr.write("ERROR: " + str(message) + newline)

#############################################################################
# TXML malipulators
#

    def get_assetname(self, url, offset):
        """ get_assetname() runs through the stripped string and pulls all
            separate assets refs into list. Purpose of the method is to call it
            recursively by the parent.
            Return value: next offset and the name of asset. If there is no next
                          asset name, then offset will be -1
        """
        assetname = ""
        for i in range(offset, len(url)):
            if url[i] == "\"":
                #self.printmessage("INFO: Assetname '"+assetname+"' ending with \"")
                return -1, assetname
            if url[i] == ";":
                #self.printmessage("INFO: Assetname '"+assetname+"' ending with ;")
                return i+1, assetname
            if url[i] == "\n":
                #self.printmessage("INFO: Assetname '"+assetname+"' ending with \\n")
                return -1, assetname
            assetname = assetname + url[i]
        return -1, assetname

    def parse_core(self, inputfile, outputfile, search, replacewith):
        self.printmessage("INFO: Starting to parse '"+inputfile+"'", "\n")
        try:
            infile = open(inputfile, "r")
        except IOError:
            self.printmessage("WARNING: input file '"+ str(inputfile) + "' open failed. Skipping!")
            return False
        try:
            outfile = open(outputfile, "w")
        except IOError:
            infile.close()
            self.printmessage("WARNING: output file '"+ str(outputfile) + "' open failed. Skipping!")
            return False

        for line in infile:
            position = line.find(search)
            if position == -1:
                outfile.write(line)
            else:
                #self.printmessage("Entering reference parsing loop")
                while position != -1:
                    position = position + len(search)
                    position, assetname = self.get_assetname(line, position)
                    self.parse_assetreference(assetname)
                #self.printmessage("Exiting reference parsing loop")
                outfile.write(line.replace(search, replacewith))
        infile.close()
        outfile.close()
        return True

    def parse_assetreference(self, assetname):
        if assetname.endswith(".material"):
            self.parse_core(assetname, self.folderprefix+assetname, "\ttexture ", "\ttexture "+self.urlprefix+self.folderprefix)
        elif assetname.endswith(".js"):
            self.parse_core(assetname, self.folderprefix+assetname, "local://", self.urlprefix+self.folderprefix)
        else:
            import shutil
            # All other types we simply copy to asset directory
            self.printmessage("INFO: Making a binary copy of '"+assetname+"'", "\n")
            try:
                shutil.copy(assetname, self.folderprefix+assetname)
            except IOError:
                self.printmessage("WARNING: Copy of '"+assetname+"' failed. Skipping!")

#############################################################################

if __name__ == "__main__": # if run standalone
    import getopt

    try:
        opts, args = getopt.getopt(sys.argv[1:], "hi:o:u:f:", ["help", "input=", "output=", "urlprefix=", "folderprefix="])
    except getopt.GetoptError, err:
        # print help information and exit:
        print "Usage: program <-i inputTXML> <-o outputTXML> <-u URLprefix> <-f FolderPrefix>"
        print "Example: program -i world.txml -o world_public.txml -u http://server.com -f assets"
        sys.exit(2)

    in_txml = ""
    out_txml = "default.txml"
    urlprefix = ""
    folderprefix = ""

    for o, a in opts:
        if o in ("-h", "--help"):
            print "help"
            sys.exit(0)
        elif o in ("-i", "--input"):
            in_txml = a
        elif o in ("-o", "--output"):
            out_txml = a
        elif o in ("-u", "--urlprefix"):
            urlprefix = a
        elif o in ("-f", "--folderprefix"):
            folderprefix = a
        else:
            print "Unhandled option!"
            sys.exit(2)

    if not os.path.exists(in_txml):
        print "Input file '" + str(in_txml) + "' does not exist. Aborting!"
        sys.exit(2)
    if os.path.exists(out_txml):
        print "Output file '" + str(out_txml) + "' already exists. Aborting!"
        sys.exit(2)

    try:
        os.stat(folderprefix)
    except:
        print "Output target dir '"+str(folderprefix)+"' does not exist. Creating!"
        os.makedirs(folderprefix)

    print "Using settings:"
    print "in_txml:      " + in_txml
    print "out_txml:     " + out_txml
    print "urlprefix     " + urlprefix
    print "folderprefix: " + folderprefix

    parser = PublishTundraWorld(urlprefix, folderprefix)
    parser.parse_core(in_txml, out_txml, "local://", parser.urlprefix+parser.folderprefix)

    print "Done!"
