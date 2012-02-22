// Deer2 - copy-pasted from guard.js which is perhaps more suitable than WandererAi .. for accurate travel between points
engine.IncludeFile("vector.js");
engine.IncludeFile("thejit_pathruntime.js");
engine.IncludeFile("pathdata.js");

const ANIM_FADE_TIME = 0.25;
const TERRAIN_DELTA = 0.02;

var currentAnimState = '';
var animState = null;

var trans = me.mesh.nodeTransformation;
trans.rot.z = 0;
me.mesh.nodeTransformation = trans;
    
var velocity = new float3(0,0,0);
velocity.x = 1.0;

var maxSpeed = 0.917;
var minSpeed = 0.2;
var maxSteer = 0.05;
reachedDistance = 0.5;

function getgraph() {
    //print(pathdata);
    
    g = Loader.construct(pathdata);

    g.eachNode(function(n) {
        n.pos.x = n.data.posx;
        n.pos.y = n.data.posy;
    });
    
    return g;
}
    
var navgraph = getgraph();
var targetnode = navgraph.getNode("path2");
var targetvec = null;
var turning = 0;
    
var terrainEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_Terrain')[0]);
var terrain;
if(terrainEntity)
    terrain = terrainEntity.terrain;
else {
    throw 'Terrain not found';
    terrain = null;
}
        
function serverUpdate(dt) {
    var tm = me.placeable.transform;

    if(!targetvec) {
        targetnode = getTargetNode(targetnode);
        targetvec = vecFromGraphnode(targetnode);
    }
    
    // Are we are pursuing something
    if(targetvec) {
        //print("Target: " + target);
        var distance = Get2DDistance(targetvec, tm.pos);
        //print("Distance: " + distance);
        if(distance < reachedDistance) {
            targetvec = null;
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

function vecFromGraphnode(node) {
    var scenex = (node.pos.x + 1.0648120130503267) / 8.964784339867826;
    var sceney = (node.pos.y + 54.95458387873319) / -8.95580731022745;
    print(node.pos.x + ", " + node.pos.y + " ==> " + scenex + ", " + sceney);

    var vec = new float3(0,0,0); //constructor no worky XXX scenex, sceney, 0);
    vec.x = scenex;
    vec.y = sceney;
    vec.z = 0; //XXX get terrain height here
    return vec;
}

function getTargetNode(currentnode) {
    //graphpos = $jit.Complex(0, 0); //me.placeable.position
    //nearest = navgraph.getClosestNodeToPos(graphpos);
    var adjs = [];
    currentnode.eachAdjacency(function(adj) { 
        adjs.push(adj.nodeTo);
    });
    var nextnode = adjs[Math.floor ( Math.random() * adjs.length)]; //random.choice
    return nextnode;
}

function updateVelocity(dt) {
    var tm = me.placeable.transform;
    
    if(!targetvec)
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
    
    var steer = get2DSteer(tm.pos, targetvec, maxSteer, maxSpeed, slowDown);
    
    velocity.x += steer.x;
    velocity.y += steer.y;
    
    // Limit XY-speed
    var v = new float3(0,0,0);
    v.x = velocity.x; 
    v.y = velocity.y
    v.z = 0;
    v = GetLimitedVector(v, maxSpeed, minSpeed);
    
    velocity.x = v.x;
    velocity.y = v.y;
        
    // Set Z-speed
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
    
	var t = terrain.TangentFrame(tm.pos);

	scene.ogre.DebugDrawFloat3x4(t, 10, 2, 1,1,1);
	tm.FromFloat3x4(terrain.TangentFrame(tm.pos));
//    tm.rot = terrain.GetTerrainRotationAngles(tm.pos.x, tm.pos.y, tm.pos.z, velocity);
    me.placeable.transform = tm;
}

function updatePosition(dt) {
    var tm = me.placeable.transform;
    tm.pos = tm.pos.Add(velocity.Mul(dt));
    
    var distanceToTerrain = terrain.GetDistanceToTerrain(tm.pos);
    tm.pos.z -= distanceToTerrain;
    tm.pos.z += TERRAIN_DELTA;
    
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

function get2DSteer(pos, target, maxSteer, maxSpeed, slowDownDistance) {
    // Ignore Z
    var steer = null;
    
    var desired = target.Sub(pos);
    desired.z = 0;
    
    var distance = desired.Length();
    if(distance > 0) {        
        if(slowDownDistance) {
            // Slowdown before reaching the target
            if(distance < slowDownDistance ) { 
                desired = desired.Mul(maxSpeed*(distance/slowDownDistance));
            }
            else {
                desired = desired.Mul(maxSpeed);
            }
        }
        else {
            desired = desired.Mul(maxSpeed);
        }
        var v = new float3(0,0,0);
        v.x = velocity.x;
        v.y = velocity.y;
        steer = desired.Sub(v);
        steer = GetLimitedVector(steer, maxSteer);
    }
    else {
        steer = new float3(0,0,0);
    }
    return steer;
}

frame.Updated.connect(serverUpdate);