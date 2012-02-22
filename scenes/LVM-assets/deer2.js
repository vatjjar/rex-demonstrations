// Deer2 - copy-pasted from guard.js which is perhaps more suitable than WandererAi .. for accurate travel between points
const ANIM_FADE_TIME = 0.25;
const TERRAIN_DELTA = 0.02;

var currentAnimState = '';
var animState = null;

var velocity = new float3(1.0, 0, 0);

var maxSpeed = 0.917;
var minSpeed = 0.2;
var maxSteer = 0.05;
reachedDistance = 0.5;

$ = { 
    name: scene.GetEntityByName
}; //again getting the jquery feel :)
var target = null;
    
var targetidx = 0;
var turning = 0;
    
var terrainEntity = scene.GetEntity(scene.GetEntityIdsWithComponent('EC_Terrain')[0]);
var terrain;
if(terrainEntity)
    terrain = terrainEntity.terrain;
else {
    print('Terrain not found');
    terrain = null;
}
        
function serverUpdate(dt) {
    var tm = me.placeable.transform;

    if(!target) {
        target = getTarget();
    }
    
    // Are we are pursuing something
    if(target) {
        //print("Target: " + target);
        //distance check in 2d
        var meflat = new float3(tm.pos.x, 0, tm.pos.z);
        var tflat = new float3(target.x, 0, target.z);
        var distance = tflat.Sub(meflat).Length();
        //print("Distance: " + distance);
        if(distance < reachedDistance) {
            target = null;
            //print("Reached target.");
        }
        else {
            updateVelocity(dt);
            updateOrientation(dt);
            updatePosition(dt);
        }
    }
        
    updateAnimationState(dt);
    // this.updateAnimation(dt);
}

function getTarget() {
    targetidx++;
    
    next = $.name("DeerTarget" + targetidx);

    if (next) {
	return next.placeable.transform.pos;
    }
    else {
	if (targetidx == 1) { //not even the first target was there yet
	    return null;
	}
	targetidx = 0;
	return getTarget();
    }
}

function updateVelocity(dt) {
    var tm = me.placeable.transform;
    
    if(!target)
        return;
    
    var direction = velocity.Normalized();
    var slowDown = 0;
    
    // // Angle between current direction and target
    // var w = new float3(0,0,0);
    // w.x = target.x - tm.pos.x;
    // w.y = target.y - tm.pos.y;
    // var dotProduct = direction.x*w.x + direction.y*w.y;
    // var cos = dotProduct/w.Length();
    // var dirDiff = Math.acos(cos)
    // 
    // var maxDiff = Math.PI/6; // 30 degree
    // print(dirDiff*57.3)
    // if(Math.abs(dirDiff) > maxDiff) { 
    //     // Target is outside guard's front sector
    //     // print('outside front sector');
    //     
    //     if(dirDiff > 0)
    //         var dir = maxDiff;
    //     else
    //         var dir = -maxDiff;
    //     
    //     var tmpTarget = new float3(0,0,0);
    //     tmpTarget.x = direction.x*Math.cos(dir) - direction.y*Math.sin(dir);
    //     tmpTarget.y = direction.x*Math.sin(dir) + direction.y*Math.cos(dir);
    //     // tmpTarget = tmpTarget.Mul(5);
    //     tmpTarget.x += tm.pos.x;
    //     tmpTarget.y += tm.pos.y;
    //     
    //     var steer = this.get2DSteer(tm.pos, tmpTarget, maxSteer, maxSpeed, slowDown);   
    // }
    // else {
    //     // Steer towards the target
    //     // print('ahead!')
    //     var steer = this.get2DSteer(tm.pos, target, maxSteer, maxSpeed, slowDown);
    // }
    
    var steer = get2DSteer(tm.pos, target, maxSteer, maxSpeed, slowDown);
    
    velocity.x += steer.x;
    velocity.z += steer.z;
    
    // Limit XZ-speed
    var v = new float3(velocity.x, 0, velocity.z);
    v = getLimitedVector(v, maxSpeed, minSpeed);
    
    velocity.x = v.x;
    velocity.z = v.z;
 }

// Turns object to right direction and sets this.turning_ for animation
function updateOrientation(dt) {
    var tm = me.placeable.transform;
    
    /*var d = new float3(0,0,0);
    d.x = 1; d.y = 0; d.z = 0;
    
    var r = new float3(0,0,0);
    r.x = velocity.x;
    r.y = velocity.y;
    r.z = velocity.z;
    
    var rot = me.placeable.GetRotationFromTo(d, r);
    rot.x = 0;
    var delta = rot.z - tm.rot.z;
    if(delta > 0.1)
        turning = -1;
    else if(delta < -0.1)
        turning = 1;
    else 
        turning = 0;*/

    if (terrain) {

		tm.FromFloat3x4(float3x4(Quat.LookAt(float3.unitZ, terrain.Tangent(tm.pos, velocity), float3.unitY, float3.unitY), tm.pos));
/*
		var tangentFrame = terrain.TangentFrame(tm.pos);
		var worldTM = float3x4.LookAt(new float3(0,1,0), tangentFrame.Col(1).Normalized(), new float3(0,0,1), velocity.Normalized());
		worldTM.SetTranslatePart(tangentFrame.Col(3));
		tm.FromFloat3x4(worldTM);
*/
        me.placeable.transform = tm;
    }
}

function updatePosition(dt) {
    var tm = me.placeable.transform;
    tm.pos = tm.pos.Add(velocity.Mul(dt));

    /*var pointInHeightmapspace = new float3(tm.pos.x, tm.pos.z, tm.pos.y);
    var distanceToTerrain = terrain.GetDistanceToTerrain(pointInHeightmapspace);
    print("distanceToTerrain: " + distanceToTerrain);
    if (distanceToTerrain != 0) {
        tm.pos.y -= distanceToTerrain;
        tm.pos.y += TERRAIN_DELTA;
    }*/
    var p = terrain.GetPointOnMap(tm.pos);
//    p.y -= 2.2 //adjust to workaround GetPointOnMap behaviour
    tm.pos = p;
    
    me.placeable.transform = tm;
}

function updateAnimationState(dt) {
    var speed = velocity.Length();
    var state = null;
    
    me.Exec(7, 'PlayLoopedAnim', 'Walk_1-38', ANIM_FADE_TIME);
    me.Exec(7, 'SetAnimSpeed', 'Walk_1-38', 1);
    me.Exec(7, 'SetAnimWeight', 'Walk_1-38', 1);
}

/*    if(this.turning_ == -1)
        state = 'turn left';
    else if(this.turning_ == 1)
        state = 'turn right';
    else if(speed < SLOW_SWIM_SPEED)
        state = 'swim slow';
    else if(speed < MEDIUM_SWIM_SPEED)
        state = 'swim medium';
    else
        state = 'swim fast';

    if( this.animState_ != state ) {
        this.animState_ = state;
        
        entity.Exec(7, 'StopAllAnims', ANIM_FADE_TIME);
        
        if(state == 'turn left') {
            entity.Exec(7, 'PlayLoopedAnim', 'Turning_L_1-11', ANIM_FADE_TIME);
            entity.Exec(7, 'SetAnimWeight', 'Turning_L_1-11', 0.6);
        }
        else if(state == 'turn right') {
            entity.Exec(7, 'PlayLoopedAnim', 'Turning_R_1-11', ANIM_FADE_TIME);
            entity.Exec(7, 'SetAnimWeight', 'Turning_R_1-11', 0.6);
        }
        else if(state == 'swim slow') {
            entity.Exec(7, 'PlayLoopedAnim', 'Walk', ANIM_FADE_TIME);
            entity.Exec(7, 'SetAnimSpeed', 'Walk', 0.3);
            entity.Exec(7, 'SetAnimWeight', 'Walk', 0.6);
        }
        else if(state == 'swim medium') {
            entity.Exec(7, 'PlayLoopedAnim', 'Walk', ANIM_FADE_TIME);
            entity.Exec(7, 'SetAnimSpeed', 'Walk', 0.4);
            entity.Exec(7, 'SetAnimWeight', 'Walk', 0.7);
        }
        else if(state == 'swim fast') {
            entity.Exec(7, 'PlayLoopedAnim', 'Walk', ANIM_FADE_TIME);
            entity.Exec(7, 'SetAnimSpeed', 'Walk', 0.7);
            entity.Exec(7, 'SetAnimWeight', 'Walk', 0.8);
        }         
    }
*/


/*function updateAnimation(dt) {
    var state = me.animationcontroller.animationState;
    if(state == this.currentAnimState_)
        return;
//         
//     if(state == 'swim slow' || state == 'swim medium' || state == 'swim fast') {
//         if(animationcontroller.IsAnimationActive('Turning_L'))
//             animationcontroller.StopAnim('Turning_L', ANIM_FADE_TIME);
//         
//         if(animationcontroller.IsAnimationActive('Turning_R'))
//             animationcontroller.StopAnim('Turning_R', ANIM_FADE_TIME);
//         
//         if(!animationcontroller.IsAnimationActive('Walk'))
//             animationcontroller.EnableAnimation('Walk', true, ANIM_FADE_TIME);
//     }
//     
//     
//     if(state == 'turn left') {
//         animationcontroller.StopAllAnims(ANIM_FADE_TIME);
//         animationcontroller.EnableAnimation('Turning_L', true, ANIM_FADE_TIME);
//         animationcontroller.SetAnimationWeight('Turning_L', 0.6); 
//     }
//     else if(state == 'turn right') {
//         animationcontroller.StopAllAnims(ANIM_FADE_TIME);
//         animationcontroller.EnableAnimation('Turning_R', true, ANIM_FADE_TIME);
//         animationcontroller.SetAnimationWeight('Turning_R', 0.6); 
//     }
//     else if(state == 'swim slow') {
//         animationcontroller.SetAnimationSpeed('Walk', 0.3);
//         animationcontroller.SetAnimationWeight('Walk', 0.6);    
//     }
//     else if(state == 'swim medium') {
//         animationcontroller.SetAnimationSpeed('Walk', 0.4);
//         animationcontroller.SetAnimationWeight('Walk', 0.7);
//     }
//     else if(state == 'swim fast') {
//         animationcontroller.SetAnimationSpeed('Walk', 0.7);
//         animationcontroller.SetAnimationWeight('Walk', 0.8);
//     }
//     
//     this.currentAnimState_ = state;
// }
*/
function getLimitedVector(v, max, min) {
    var l = v.Length();
    if(l > max) {
        v.Normalize();
        v = v.Mul(max);
    }
    else if (min != undefined && l < min) {
        v.Normalize();
        v = v.Mul(min);
    }
    return v;
}

function get2DSteer(pos, target, maxSteer, maxSpeed, slowDownDistance) {
    // Ignore Y
    var steer = null;
    
    var desired = target.Sub(pos);
    desired.y = 0;
    
    var distance = desired.Length();
    if(distance > 0) {
        if(slowDownDistance) {
            // Slowdown before reaching the target
            if(distance < slowDownDistance ) { 
                desired = desired.Mul(maxSpeed * (distance/slowDownDistance));
            }
            else {
                desired = desired.Mul(maxSpeed);
            }
        }
        else {
            desired = desired.Mul(maxSpeed);
        }
        var v = new float3(velocity.x, 0, velocity.z);
        steer = desired.Sub(v);
        steer = getLimitedVector(steer, maxSteer);
    }
    else {
        steer = new float3(0,0,0);
    }
    return steer;
}

frame.Updated.connect(serverUpdate);