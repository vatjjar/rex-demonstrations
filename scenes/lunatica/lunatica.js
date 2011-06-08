// !ref: local://info_mobs2.png

engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");

//------------------------ ui info gfx things -------------------------

//var label = new QLabel();
function InfoLabel() {
    QLabel.call(this);
}
InfoLabel.prototype = new QLabel;
var label = new InfoLabel;

var infoimgAsset = asset.GetAsset("local://info_mobs2.png").get();
//var infoimgFile = "/home/antont/src/rexlunatica/info_mobs2.png"; //infoimgAsset.DiskSource();
var infoimgFile = infoimgAsset.DiskSource();
var infoimg = new QPixmap(infoimgFile);
//print("infoimg alpha: " + infoimg.hasAlpha());

label.setAttribute(Qt.WA_TranslucentBackground);
//label.setAlignment(Qt.AlignCenter);
label.setPixmap(infoimg);

var proxy = ui.AddWidgetToScene(label);
proxy.x = 100;
proxy.y = 30;
proxy.windowFlags = Qt.Widget;
//proxy.visible = true;
function hideInfo() {
    proxy.visible = false;
}
InfoLabel.prototype.mousePressEvent = hideInfo;

function showInfo() {
    proxy.visible = true;
}
var planet = scene.GetEntityByName("planet");
planet.Action("MousePress").Triggered.connect(showInfo)


print("-->");

// ---------------- local entity creations: cam, cursor -------------------

/*var cament = scene.GetEntityByName("FreeLookCamera");
var camt = cament.placeable.transform;
camt.pos.x = 0;
camt.pos.y = 0;
camt.pos.z = 22;
camt.rot.x = 0;
camt.rot.y = 0;
camt.rot.z = 180;
cament.placeable.transform = camt;*/
var cament = scene.GetEntityByName("gamecamera");
var cam_ec = cament.GetOrCreateComponentRaw("EC_OgreCamera");
cam_ec.AutoSetPlaceable();
cam_ec.SetActive();
var starfield = scene.GetEntityByName("backgroundparticles");
starfield.placeable.SetParent(cament.placeable);

//invisible control node - again not needed, as went back to stationary planet & orbiting cam
/*var controlent = scene.CreateEntityRaw(scene.NextFreeIdLocal());
controlent.SetName("AvatarCamera");
controlent.SetTemporary(true);
controlent.GetOrCreateComponentRaw("EC_Placeable");
//if planet was somewhere else: controlent.placeable.transform = planet.placeable.transform
cament.placeable.SetParent(controlent.placeable);
*/

//but cursor we need for sure!
var cursor = scene.GetEntityByName("cursor");
if (!cursor) { //first run
    cursor = scene.CreateEntityRaw(scene.NextFreeIdLocal());
    cursor.SetName("cursor");
    cursor.SetTemporary(true);
}
var curplc = cursor.GetOrCreateComponentRaw("EC_Placeable");
/*var curmesh = cursor.GetOrCreateComponentRaw("EC_Mesh");
var r = curmesh.meshRef;
r.ref = "local://cursor.mesh";
curmesh.meshRef = r;*/
//easiest to move by making a child of the cam!
curplc.SetParent(cament.placeable);
var t = curplc.transform;
t.pos.z = -17;
t.rot.x = 90;
curplc.transform = t;

//not needed now that planet doesn't move/rotate
//boomer = scene.GetEntityByNameRaw("sunboom")
//boomer.placeable.SetParent(planet.placeable);

//testing creating player chars from xml, which made with the gui, instead of js code
charxml = ' \
<!DOCTYPE Scene> \
<scene> \
 <entity id="8"> \
  <component type="EC_Mesh" sync="1"> \
   <attribute value="0,0,0,90,0,180,1,1,1" name="Transform"/> \
   <attribute value="local://hahmo.mesh" name="Mesh ref"/> \
   <attribute value="local://hahmo-hahmorig.skeleton" name="Skeleton ref"/> \
   <attribute value="hahmo.material" name="Mesh materials"/> \
   <attribute value="0" name="Draw distance"/> \
   <attribute value="false" name="Cast shadows"/> \
  </component> \
  <component type="EC_Placeable" sync="1"> \
   <attribute value="0,0,0,0,0,0,0.023,0.023,0.023" name="Transform"/> \
   <attribute value="false" name="Show bounding box"/> \
   <attribute value="true" name="Visible"/> \
  </component> \
  <component type="EC_Name" sync="1"> \
   <attribute value="hahmo" name="name"/> \
   <attribute value="" name="description"/> \
   <attribute value="false" name="user-defined"/> \
  </component> \
 </entity> \
</scene> \
';

var id;
var chr;
if (server.IsAboutToStart()) {
    id = 0;
    var name = "char" + id;
    chr = scene.GetEntityByName(name)
    if(!chr) {
	chr = scene.CreateContentFromXml(charxml, false, 2)[0];
	chr.SetName(name); //name = name;
	print("created player char:" + chr.name);
    }
}
var chrplc = chr.placeable;

function update(frametime) {
    chrplc.SetPosition(curplc.GetDerivedPosition());
    chrplc.SetOrientation(curplc.GetDerivedOrientation());
}

frame.Updated.connect(update);

// ----------- input & control things -----------

// Create a nonsynced inputmapper
var inputmapper = me.GetOrCreateComponentRaw("EC_InputMapper", 2, false);
inputmapper.contextPriority = 101;
inputmapper.takeMouseEventsOverQt = true;
inputmapper.modifiersEnabled = false;
inputmapper.executionType = 1; // 1:local. 2:Execute actions on server
    
inputmapper.RegisterMapping("W", "Rotate(up)", 1);
inputmapper.RegisterMapping("A", "Rotate(left)", 1);
inputmapper.RegisterMapping("D", "Rotate(right))", 1);
inputmapper.RegisterMapping("S", "Rotate(down))", 1);
inputmapper.RegisterMapping("Up", "Rotate(up)", 1);
inputmapper.RegisterMapping("Down", "Rotate(left)", 1);
inputmapper.RegisterMapping("Left", "Rotate(right))", 1);
inputmapper.RegisterMapping("Right", "Rotate(down))", 1);

inputmapper.RegisterMapping("L", "Start()", 1); //actually just wanted local RegisterKeyEvent now but didn't find an example and was in a hurry
inputmapper.RegisterMapping("K", "Stop()", 1); //actually just wanted local RegisterKeyEvent now but didn't find an example and was in a hurry

/*inputmapper.RegisterMapping("W", "Stop(forward)", 3);
inputmapper.RegisterMapping("A", "StopRotate(left)", 3);
inputmapper.RegisterMapping("D", "StopRotate(right))", 3);*/
        
/*inputmapper.RegisterMapping("Space", "Dash()", 1);
inputmapper.RegisterMapping("Space", "Dash()", 3);*/

var inputContext = inputmapper.GetInputContext();
inputContext.MouseMove.connect(clientHandleMouseMove);

function multiply_quats(q, r) {
    var w = q.scalar()*r.scalar() - q.x()*r.x() - q.y()*r.y() - q.z()*r.z();
    var x = q.scalar()*r.x() + q.x()*r.scalar() + q.y()*r.z() - q.z()*r.y();
    var y = q.scalar()*r.y() + q.y()*r.scalar() + q.z()*r.x() - q.x()*r.z();
    var z = q.scalar()*r.z() + q.z()*r.scalar() + q.x()*r.y() - q.y()*r.x();
    var t = new QQuaternion(w, x, y, z);
    return t;
}

//now done by parenting to cam
/*function updatecursor() {
    dist = 5.5;
    t = curplc.transform;
    var camdir = cament.placeable.transform.pos;
    camdir = camdir.normalize();
    t.pos.x = camdir.x * dist; 
    t.pos.y = camdir.y * dist;
    t.pos.z = camdir.z * dist;
    
    t.rot.x = camdir.x * 180;
    t.rot.y = camdir.y * 180;
    t.rot.z = camdir.z * 180;
    
    curplc.transform = t;
    //curplc.LookAt(QVector3);
    //print(camdir.x + "->" + cursor.placeable.transform.pos.x);
}*/

function clientHandleMouseMove(ev) {
    //print(ev.relativeX + ", " + ev.relativeY);
    
    //planet was rotated in single player, but that doesn't work for multiplayer
    //now we rotate an invisible control entity instead, to which cam & bg gfx are parented
    //.. that didn't solve everything automagically, so going back to orbiting cam
    /*var p = controlent.placeable;

    if (ev.relativeX != 0) {
	p.SetPitchWorld(ev.relativeX * -0.01);
    }

    if (ev.relativeY != 0) {
	p.SetRollWorld(ev.relativeY * 0.01);
    }*/

    //instead, here's copy-paste from objectcamera.js to do orbiting around the planet
    var pivot = planet.placeable.transform.pos;
    var pos = cament.placeable.transform.pos;

    var dir = new Vector3df();
    dir.x = pos.x - pivot.x;
    dir.y = pos.y - pivot.y;
    dir.z = pos.z - pivot.z;

    var quat = QQuaternion.fromAxisAndAngle(cament.placeable.LocalYAxis, ev.relativeX);
    quat = multiply_quats(quat, QQuaternion.fromAxisAndAngle(cament.placeable.LocalXAxis, ev.relativeY));
    var dirq = quat.rotatedVector(new QVector3D(dir.x, dir.y, dir.z));
    dir.x = dirq.x();
    dir.y = dirq.y();
    dir.z = dirq.z();

    var new_pos = new Vector3df();
    new_pos.x = pivot.x + dir.x;
    new_pos.y = pivot.y + dir.y;
    new_pos.z = pivot.z + dir.z;

    var camtrans = cament.placeable.transform;
    camtrans.pos.x = new_pos.x;
    camtrans.pos.y = new_pos.y;
    camtrans.pos.z = new_pos.z; 

    cament.placeable.transform = camtrans;
    cament.placeable.LookAt(new QVector3D(pivot.x, pivot.y, pivot.z));
}

function serverHandleRotate(param) {
    return;
    print("rot: " + param);
    p = controlent.placeable;
    t = p.transform;
    var d = 0.5;
    if (param == "left" || param == "down") {
	d = -d;
    }

    if (param == "up" || param == "down") {
	t.rot.x += d;
    }
    else {
	t.rot.y += d;
    }

    p.transform = t
    print(d + " => " + p.transform.rot.z + ", " + p.transform.rot.x);
}

function serverHandleStopRotate(param) {
    print("stoprot: " + param);
}

function serverHandleMouseX(param) {
    print("mouse x: " + param);
}

function serverHandleMouseY(param) {
    print("mouse y: " + param);
}

function serverHandleStart(param) {
    print("Setting up Lunatica");
    cam_ec.SetActive();
    cam_ec.SetFarClip(50);
    
    var env = scene.GetEntityByNameRaw("Environment");
    //crash prone if do only this: env light can still sometimes use ogreenv
    //env.environmentlight.useCaelumAttr = false;
    //print("use caelum: " + env.environmentlight.useCaelumAttr);
    if (env) {
	scene.RemoveEntityRaw(env.id);
    }

    var ogreenv = scene.GetEntitiesWithComponentRaw("EC_OgreEnvironment");
    if (ogreenv.length != 1) {
	return;
    }
    ogreenv = ogreenv[0];
    print(ogreenv);
    scene.RemoveEntityRaw(ogreenv.id);
}

function serverHandleStop(param) {
    print("Lunatica returns to freecam.");
    var freecam = scene.GetEntityByNameRaw("FreeLookCamera");
    freecam.camera.SetFarClip(500);
    freecam.camera.SetActive();
}

function serverInit() {
    // Connect actions
    /*me.Action("Move").Triggered.connect(serverHandleMove);
    me.Action("Stop").Triggered.connect(serverHandleStop);*/
    me.Action("Rotate").Triggered.connect(serverHandleRotate);
    me.Action("StopRotate").Triggered.connect(serverHandleStopRotate);
    me.Action("Start").Triggered.connect(serverHandleStart);
    me.Action("Stop").Triggered.connect(serverHandleStop);
    //me.Action("Dash").Triggered.connect(serverHandleDash);
        
    me.Action("MouseLookX").Triggered.connect(serverHandleMouseX);
    me.Action("MouseLookY").Triggered.connect(serverHandleMouseY);
}

serverInit();