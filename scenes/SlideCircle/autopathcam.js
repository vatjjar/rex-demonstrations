autopathcam_module = function() {

var targets = [];

var curveposition;
var origrot;
var targetrot;
var yoffset = 0;

// Lookat functions. At some point start using the ones in c++ libraries
function lookAtPoint(from, what) {
    var targetLookatDir = what.Sub(from);
    targetLookatDir = targetLookatDir.Normalized();
    var endRot = Quat.LookAt(scene.ForwardVector(), targetLookatDir, scene.UpVector(), scene.UpVector());
    return endRot;
}

function lookAt(entity, what) {
    entity.placeable.SetOrientation(lookAtPoint(entity.placeable.Position(), what));
    /*var tpos = entity.placeable.WorldPosition();
    tpos.y += yoffset;
    what.y += yoffset;
    entity.placeable.SetOrientation(lookAtPoint(tpos, what));*/
}

function conjg(quat, v) {
    // calculates the conjugate?
    var qvec = new float3(quat.x, quat.y, quat.z);

    var uv = qvec.Cross(v);
    var uuv = qvec.Cross(uv);
    uv = uv.Mul(2.0 * quat.w);
    uuv = uuv.Mul(2.0);
    
    return v.Add(uuv.Add(uv));
}

function getNormal(entity, distance) {
    print("getNormal:");
    print(entity);
    /* returns the place in front of entity from distance */
    var placeable = entity.placeable;
    var q = placeable.WorldOrientation();

    var un = new float3(0, 0, 1);

    var v = conjg(q, un);
    var pos = placeable.WorldPosition().Add(v.Mul(distance));
    pos.y += yoffset;

    return pos;
}

function viewScreen(screen) {
    var pos = getNormal(screen, infront);
    pos.y += yoffset;
    camera.placeable.SetPosition(pos);
    var tpos = screen.placeable.WorldPosition();
    tpos.y += yoffset;
    lookAt(camera, tpos);
}

/* calculates to point to move and look */
function getPoints(from, to) {
    curveposition = 0;

    targets = [];
    targets.push(getNormal(from, close));
    targets.push(getNormal(from, close));
    targets.push(getNormal(from, far));
    targets.push(getNormal(to, far));
    targets.push(getNormal(to, close));
    targets.push(getNormal(to, infront));

    lookAtTargets = [];
    var frompos = from.placeable.WorldPosition();
    frompos.y += yoffset;
    var topos = to.placeable.WorldPosition();
    topos.y += yoffset;
    lookAtTargets.push(frompos);
    lookAtTargets.push(topos);

    origrot = camera.placeable.Orientation();

    var point = getNormal(to, 0);
    targetrot = lookAtPoint(targets[5], point);
}

function getBezier(t) {
    if (t <= 0) {
	return targets[0];
    }
    if (t >= 1) {
	targets.splice(0, 4);
	return undefined;
    }
    
    var p0 = targets[0];
    var p1 = targets[1];
    var p2 = targets[2];
    var p3 = targets[3];

    // (1-t)^3 p0 + 3t(1-t)^2 p1 + 3t^2(1-t) p2 + t^3 p3

    return p0.Mul(Math.pow(1 - t, 3)).Add(p1.Mul(3 * Math.pow(1 - t, 2) * t)).Add(p2.Mul(3 * Math.pow(t, 2) * (1 -t))).Add(p3.Mul(Math.pow(t, 3)));
}

function autopathcam_update(dt) {
    //backing from front and closing to front also, yes
    if ((targets.length == 6) || (targets.length == 1)) {
	var target = targets[0];
	var pos = camera.placeable.Position();

	var dist = pos.Distance(target);
	lookAt(camera, lookAtTargets[0]);
	//print(dist);
	// If we're there change targets for moving and looking.
	if (dist <= 0.5) {
	    targets.splice(0, 1);
	    lookAtTargets.splice(0, 1);
	    return;
	}
	
	var direction = target.Sub(pos);
	direction.Normalize();
	
	var newPos = pos.Add(direction.Mul(dt * 2));
	camera.placeable.SetPosition(newPos);
	return;
    }

    curveposition += dt / 3;
    
    var newpos = getBezier(curveposition);
    if (newpos != undefined) {
	camera.placeable.SetPosition(newpos)
    }

    origrot = camera.placeable.Orientation();

    if (curveposition / 5 <= 1) {
	camera.placeable.SetOrientation(origrot.Slerp(targetrot, curveposition / 5));
    } else {
	lookat(camera, screen[currentIndex % screennumber]);
    }
}

function autopathcam_init() {
    print("SCREENS:");
    print(screens);
    var s = screens[0];
    print(s);
    viewScreen(s);
}

function autopathcam_needupdate() {
    return targets.length > 0;
}

function autopathcam_reset(looktarget) {
    targets = [];
    lookAtTargets = [];
    viewScreen(looktarget);
}

return {
    update: autopathcam_update,
    needupdate: autopathcam_needupdate,
    reset: autopathcam_reset,
    init: autopathcam_init,
    GotoNext: getPoints,
    GotoPrev: getPoints,
};
}(); //end namespacing func


