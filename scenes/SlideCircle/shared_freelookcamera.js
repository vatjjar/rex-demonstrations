// A shared, server-created freelook camera script. Tweaked from the bundled local one.
// Upon run, creates necessary components if they don't exist yet, and hooks to the InputMapper's
// input context to process camera movement (WASD + mouse)

var rotate_sensitivity = 0.3;
var move_sensitivity = 30.0;
var motion_z = 0;
var motion_y = 0;
var motion_x = 0;

Initialize();

//not activated at start, but with the push of a gui button
function setActive(now, prev) {
    now.camera.SetActive();
    now.soundlistener.active = true;
    if (prev) {
        prev.soundlistener.active = false;
    }
}

function Initialize() {
    // Create components & setup default position/lookat for the camera
    var camera = me.GetOrCreateComponent("EC_Camera");
    var inputmapper = me.GetOrCreateComponent("EC_InputMapper");
    var placeable = me.GetOrCreateComponent("EC_Placeable");
    var soundlistener = me.GetOrCreateComponent("EC_SoundListener");

    /*
    var transform = placeable.transform;
    var initialRot = camera.InitialRotation();
    transform.rot = initialRot;
    placeable.transform = transform;
    */

    // Hook to update tick
    frame.Updated.connect(Update);
    // Register press & release action mappings to the inputmapper, use higher priority than RexMovementInput to be sure
    inputmapper.contextPriority = 101;
    inputmapper.takeMouseEventsOverQt = true;
    inputmapper.modifiersEnabled = false;
    inputmapper.RegisterMapping("W", "Move(forward)", 1);
    inputmapper.RegisterMapping("S", "Move(back)", 1);
    inputmapper.RegisterMapping("A", "Move(left)", 1);
    inputmapper.RegisterMapping("D", "Move(right)", 1);
    inputmapper.RegisterMapping("Space", "Move(up)", 1);
    inputmapper.RegisterMapping("C", "Move(down)", 1);
    inputmapper.RegisterMapping("W", "Stop(forward)", 3);
    inputmapper.RegisterMapping("S", "Stop(back)", 3);
    inputmapper.RegisterMapping("A", "Stop(left)", 3);
    inputmapper.RegisterMapping("D", "Stop(right)", 3);
    inputmapper.RegisterMapping("Space", "Stop(up)", 3);
    inputmapper.RegisterMapping("C", "Stop(down)", 3);
    inputmapper.RegisterMapping("Up", "Move(forward)", 1);
    inputmapper.RegisterMapping("Down", "Move(back)", 1);
    inputmapper.RegisterMapping("Left", "Move(left)", 1);
    inputmapper.RegisterMapping("Right", "Move(right)", 1);
    inputmapper.RegisterMapping("Up", "Stop(forward)", 3);
    inputmapper.RegisterMapping("Down", "Stop(back)", 3);
    inputmapper.RegisterMapping("Left", "Stop(left)", 3);
    inputmapper.RegisterMapping("Right", "Stop(right)", 3);

    // Connect actions
    me.Action("Move").Triggered.connect(HandleMove);
    me.Action("Stop").Triggered.connect(HandleStop);
    me.Action("MouseLookX").Triggered.connect(HandleMouseLookX);
    me.Action("MouseLookY").Triggered.connect(HandleMouseLookY);

    // Connect gestures
    var inputContext = inputmapper.GetInputContext();
    if (inputContext.GestureStarted && inputContext.GestureUpdated)
    {
	    inputContext.GestureStarted.connect(GestureStarted);
	    inputContext.GestureUpdated.connect(GestureUpdated);
    }
}

function IsCameraActive()
{
    return me.camera.IsActive();
}

function Update(frametime)
{
    if (!IsCameraActive())
    {
        motion_x = 0;
        motion_y = 0;
        motion_z = 0;
        return;
    }

    //console.LogInfo(motion_x + ", " + motion_y + ", " + motion_z);
    if (motion_x == 0 && motion_y == 0 && motion_z == 0)
        return; //no-op when nothing to do, to not conflict with networked shared usage of same freecam

    var placeable = me.placeable;
    var motionvec = new float3(motion_x * move_sensitivity * frametime,
                               motion_y * move_sensitivity * frametime,
                               -motion_z * move_sensitivity * frametime);
    motionvec = placeable.Orientation().Mul(motionvec);
    var newpos = placeable.Position().Add(motionvec);
    placeable.SetPosition(newpos.x, newpos.y, newpos.z);
}

function HandleMove(param)
{
    if (param == "forward")
        motion_z = 1;
    if (param == "back")
        motion_z = -1;
    if (param == "right")
        motion_x = 1;
    if (param == "left")
        motion_x = -1;
    if (param == "up")
        motion_y = 1;
    if (param == "down")
        motion_y = -1;
}

function HandleStop(param)
{
    if ((param == "forward") && (motion_z == 1))
        motion_z = 0;
    if ((param == "back") && (motion_z == -1))
        motion_z = 0;
    if ((param == "right") && (motion_x == 1))
        motion_x = 0;
    if ((param == "left") && (motion_x == -1))
        motion_x = 0;
    if ((param == "up") && (motion_y == 1))
        motion_y = 0;
    if ((param == "down") && (motion_y == -1))
        motion_y = 0;
}

function HandleMouseLookX(param)
{
    if (!IsCameraActive())
        return;

    var move = parseInt(param);
    var placeable = me.GetComponent("EC_Placeable");

    var move = parseInt(param);
    
    var transform = me.placeable.transform;
    transform.rot.y -= rotate_sensitivity * move;
    
    me.placeable.transform = transform;
}

function HandleMouseLookY(param)
{
    if (!IsCameraActive())
        return;

    var move = parseInt(param);
    
    var transform = me.placeable.transform;
    transform.rot.x -= rotate_sensitivity * move;
    if (transform.rot.x > 90.0)
        transform.rot.x = 90.0;
    if (transform.rot.x < -90.0)
        transform.rot.x = -90.0;

    me.placeable.transform = transform;
}

function GestureStarted(gestureEvent)
{
    if (!IsCameraActive())
        return;

    if (gestureEvent.GestureType() == Qt.TapAndHoldGesture)
    {
        if (motion_z == 0)
            HandleMove("forward");
        else
            HandleStop("forward");
        gestureEvent.Accept();
    }
    else if (gestureEvent.GestureType() == Qt.PanGesture)
    {
        var offset = gestureEvent.Gesture().offset.toPoint();
        HandleMouseLookX(offset.x());
        HandleMouseLookY(offset.y());
        gestureEvent.Accept();
    }
}

function GestureUpdated(gestureEvent)
{
    if (!IsCameraActive())
        return;

    if (gestureEvent.GestureType() == Qt.PanGesture)
    {
        var delta = gestureEvent.Gesture().delta.toPoint();
        HandleMouseLookX(delta.x());
        HandleMouseLookY(delta.y());
        gestureEvent.Accept();
    }
}

function getActiveCamera() {
    var cameraEnts = scene.GetEntitiesWithComponent("EC_Camera");
    for (idx in cameraEnts) {
        var ent = cameraEnts[idx];
        if (ent.camera.IsActive())
            return ent;
    }
    console.LogWarning("Shared_Freelookcam: no active camera found.");
}

var prev_cam = null;
function toggleActive() {
    if (!me.camera.IsActive()) {
        prev_cam = getActiveCamera();
        setActive(me, prev_cam);
    }
    else {
        setActive(prev_cam, me);
    }
}

//GUI: activate toggle button
if(!framework.IsHeadless()) {
    engine.ImportExtension("qt.core");
    engine.ImportExtension("qt.gui");

    var actbut = new QPushButton();
    actbut.checkable = true;
    actbut.checked = me.camera.IsActive();
    actbut.text = "Presentation View";
    actbut.clicked.connect(toggleActive);

    var proxy = new UiProxyWidget(actbut);
    ui.AddProxyWidgetToScene(proxy);
    proxy.windowFlags = 0;
    proxy.effect = 0;
    proxy.focusPolicy = Qt.NoFocus;

    function windowResized(w, h) {
        proxy.x = w - 150;
        proxy.y = h - 50;
    }

    var window = ui.MainWindow();    
    ui.MainWindow().WindowResizeEvent.connect(windowResized);
    windowResized(window.width, window.height);

    actbut.show();
}