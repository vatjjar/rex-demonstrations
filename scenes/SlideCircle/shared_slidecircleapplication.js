/*
  SlideCircle
  - circling around slide thingies for your sliding pleasure

  Supports two alternative camera control codes:
  a) an automatic one (original slidecircle) which generates a path from view target positions
  b) (not in this semipublic version now)

*/

//globals used in here & autopathcam
var screens = [];
var debug = 1;
var camera = scene.GetEntityByName("Shared_FreeLookCamera"); //used in manualpathcam too

engine.IncludeFile("local://autopathcam.js");
engine.IncludeFile("local://manualpathcam.js");

function pad(number, length) {
    // pads a a number with zeros (js doesn't have format strings
    var string = '' + number;
    while (string.length < length) {
        string = '0' + string;
    }
    return string;
}

function changeSlide(index) {
    print("changeSlide: " + index + " : "  + screennumber);
    var currentScreen = screens[index % screennumber];
    var newurl = slideinfo.GetAttribute("slide" + (index));
    var oldurl = currentScreen.material.parameters;

    //ecmat loading hackstery
    var inputmat = currentScreen.material.inputMat;
    currentScreen.material.inputMat = "";
    currentScreen.material.inputMat = inputmat;
    
    if (debug) {
        print("oldurl " + oldurl);
        print("newurl " + newurl);
    }
    if (oldurl != newurl) {
        if (debug) {
            print("It changes");
        }
        
        currentScreen.material.parameters = ["texture = " + newurl];
    }
    changes += 1;
}

function HandleGotoNext() {
    var slideinfo = me.GetComponent("EC_DynamicComponent", "SlideCircleInfo");
    var currentIndex = slideinfo.GetAttribute("current");
    if (debug) {
        print("Current screen is");
        print(screens[currentIndex % screennumber]);
        print("Current index is " + currentIndex);
    }

    var newIndex = currentIndex + 1;
    if (newIndex > endIndex) {
    newIndex = 0;
    }
    if (debug) {
        print("New index is " + newIndex);
        print("Goto screen " + (newIndex % screennumber));
        print(screens[newIndex % screennumber]);
    }

    var from = screens[currentIndex % screennumber];
    var to = screens[newIndex % screennumber];
    camcontroller.GotoNext(from, to);

    slideinfo.SetAttribute("current", newIndex);

    changeSlide(newIndex);
}

function HandleGotoPrev() {
    var slideinfo = me.GetComponent("EC_DynamicComponent", "SlideCircleInfo");
    var currentIndex = slideinfo.GetAttribute("current");
    if (debug) {
        print("Current screen is");
        print(screens[currentIndex % screennumber]);
        print("Current index is " + currentIndex);
    }
    var newIndex = currentIndex -1;
    if (newIndex < 0) {
    newIndex = endIndex;
    }
    if (debug) {
        print("New index is " + newIndex);
        print("Goto screen " + (newIndex % screennumber));
        print(screens[newIndex % screennumber]);
    }

    var from = screens[currentIndex % screennumber];
    var to = screens[newIndex % screennumber];
    camcontroller.GotoPrev(from, to);

    slideinfo.SetAttribute("current", newIndex);
    changeSlide(newIndex);
}

function animationUpdate(dt) {
    if (!camcontroller.needupdate()) {
        return;
    }
    camcontroller.update(dt);
}

function reset() {
    var slideinfo = me.GetComponent("EC_DynamicComponent", "SlideCircleInfo");
    slideinfo.SetAttribute("current", 0);
    initializeScreenMaterials();
    camcontroller.reset(screens[0]);
}

function updateSettings() {
    var settings = me.GetComponent("EC_DynamicComponent", "SlideCircleSettings");
    cameramode = settings.GetAttribute('cameramode');
    infront = settings.GetAttribute('infront');
    close = settings.GetAttribute('close');
    far = settings.GetAttribute('far');
}

function initializeScreenMaterials() {
	for (i = 0; i < screens.length; i++) {
		var url = slideinfo.GetAttribute("slide" + i);
		//screens[i].material.parameters = ["texture = " + url];
		var ent = screens[i];
		var mat = ent.material;
		//print("MAAAAAAAATTTTTTTTTTTTTTTTTT: " + mat);
		if (!mat) {
			print("SlideCircle WARNING: no mat component in slide showing entity? " + ent.name); //+ " - not displaying slide url: " + url + " . " + mat);
			print("WORKING MODE: Creating EC_Material");
			mat = ent.CreateComponent("EC_Material"); //could use GetOrCreateComponent, but this is exceptional / not for end users, so separating

			//here we also need to config the mesh in this screen to use this material
			//print(".. config the mesh in this screen to use this material");
			mat.inputMat = "19-Default.material";
			mat.outputMat = "screen" + i + ".material";
			var meshmats = ent.mesh.meshMaterial
			meshmats[1] = mat.outputMat; //HACK for Cyberlightning World, where display is on second submesh / mat index
			ent.mesh.meshMaterial = meshmats;
			print(".. done preparing screen / . ");
		}

		if (url) {
			mat.parameters = ["texture = " + url];
			print("SlideCircle INFO: displaying image " + url + " in entity " + ent.name);
		}
	}
}

var slideinfo = me.GetComponent("EC_DynamicComponent", "SlideCircleInfo");

function find_screens() {
    //!!! begin hack for current cyberslide scene draft
    //tied to the camera mode setting now:
    if (cameramode == "manualpath") {
        var i = 1;
        while(true) {
            var scr_ent = scene.GetEntityByName("screen" + i); 
            print(scr_ent);
            if (!scr_ent) {
                print("found screens up to: " + i);
                break;
            }
            screens.push(scr_ent);
            i++;
        }
    } else {
        /* We look for anything that has a SlideScreenInfo and circulate between them */
        var ents = scene.GetEntitiesWithComponent("EC_DynamicComponent");
        
        for (i = 0; i < ents.length; i++) {
            var candidate = ents[i];
            if (candidate.dynamiccomponent.name == 'SlideScreenInfo') {
                screens.push(candidate);
            }
        }
    }
    
    if (debug) {
        print(screens);
        for (i = 0; i < screens.length; i++) {
            print(screens[i].name + ", id: " +screens[i].id);
        }
    }
}

var settings, cameramode, infront, close, far;
function initSettings() {
    settings.AttributeChanged.connect(updateSettings);
    updateSettings();
}
settings = me.GetComponent("EC_DynamicComponent", "SlideCircleSettings");
if (settings) {
    initSettings();
}
else {
    me.ComponentAdded.connect(checkComponent);
}
//Check if the required settings component is added after EC_Script to Entity
function checkComponent(comp, type) {
    if (comp.typeName == "EC_DynamicComponent" &&
        comp.name == "SlideCircleSettings") {
        settings = comp;
        initSettings();
    }
}
            

var recordstarted = false;
var waitTicks = 0;

var animationFrame = 0;
var changes = 0;

//camera mode identification string mapping to implementing modules
camid2module =
    {
    'manualpath': manualpathcam_module,
    'autopath': autopathcam_module
    };
var camcontroller = camid2module[cameramode];

find_screens();
camcontroller.init();

//initialize screens
 print("--------------- initialize screens -------------------");

initializeScreenMaterials();

var currentIndex = slideinfo.GetAttribute("current");
var endIndex = slideinfo.GetAttribute("slidenumber") - 1; 
var screennumber = screens.length

var inputmapper = me.GetOrCreateComponent("EC_InputMapper", 2, false);

//freecam overrides these buttons, consider using a clean cam
//inputmapper.RegisterMapping("Left", "HandleGotoNext()", 1);
//inputmapper.RegisterMapping("Right", "HandleGotoPrev()", 1);
//inputmapper.RegisterMapping("Space", "NextTarget()", 1);
//inputmapper.RegisterMapping("Left", "HandleGotoNext()", 1);

//didn't work for some reason so keeping the old way of going via ent actions
//inputmapper.RegisterMapping('n', "HandleGotoPrev()", 1);
//inputmapper.RegisterMapping('p', "NextTarget()", 1);
//inputmapper.RegisterMapping('r', "reset()", 1)
//inputmapper.RegisterMapping('v', "StartRecord()", 1);

inputmapper.RegisterMapping('n', "GotoNext", 1);
inputmapper.RegisterMapping('p', "GotoPrev", 1);
inputmapper.RegisterMapping("Space", "GotoNext", 1);
inputmapper.RegisterMapping("Right", "GotoNext", 1);
inputmapper.RegisterMapping('Left', "GotoPrev", 1);
inputmapper.RegisterMapping('r', "ResetShow", 1)
inputmapper.RegisterMapping('Esc', "ResetShow", 1)

// variables for viewpoint infront is the distance where you want to
// end up (and leave) close is the distance to which you back up still
// looking at the screen two points are counted for Bezier
// curves. These distances are read from the dynamic component

me.Action("GotoNext").Triggered.connect(HandleGotoNext);
me.Action("GotoPrev").Triggered.connect(HandleGotoPrev);
me.Action("ResetShow").Triggered.connect(reset);

frame.Updated.connect(animationUpdate);
print('Slide circle started');
