// Striped bass



engine.IncludeFile("vector.js");

const SLOW_SWIM_SPEED = 1.5;
const MEDIUM_SWIM_SPEED = 2.0;

const ANIM_FADE_TIME = 0.25;

const SURFACE_DELTA = 0.18;
const TERRAIN_DELTA = 0.12;

var scale = new float3(0.2, 0.2, 0.2);

function Guard(entity, pos) {
    this.currentAnimState_ = '';
    this.entity_ = entity;
    this.placeable_ = entity.placeable;
    this.animState_ = null;
    
    var placeable = entity.placeable;
    var tm = this.placeable_.transform;
    tm.pos = pos;
    tm.size = scale;
    placeable.transform = tm;
    
    
    var mesh = this.entity_.mesh;
    var meshRef = mesh.meshRef;
    meshRef.ref = 'stripedbass2.mesh';
    mesh.meshRef = meshRef;
    var skelRef = mesh.skeletonRef;
    skelRef.ref = 'stripedbass2.skeleton';
    mesh.skeletonRef = skelRef;
    
    var materials = mesh.meshMaterial;
    materials = ['stripedbass2.material'];
    mesh.meshMaterial = materials;
    
    var meshTm = mesh.nodeTransformation;
    meshTm.rot.x = 90;
    meshTm.rot.z = 90;
    meshTm.scale = scale;
    mesh.nodeTransformation = meshTm;
    
    var rigidbody = this.entity_.rigidbody
    rigidbody.mass = 0;
    rigidbody.linearFactor = new float3(0,0,0);
    rigidbody.angularFactor = new float3(0,0,0);
    rigidbody.shapeType = 0; 
    
    // This script updates animations
    // var script = this.entity_.script;
    // script.type = "js";
    // script.runOnLoad = true;
    // var r = script.scriptRef;
    // r.ref = "guard_animation_controller.js";
    // script.scriptRef = r;
    
    this.velocity_ = new float3(0,0,0);
    this.maxSpeed_ = 3.0;
    this.minSpeed_ = 0.5;
    this.maxSteer_ = 0.08;
    this.maxPursuingDistance_ = 10.0;
    // this.maxPursuingSpeed_ = 4.0;
    // this.maxPursuingSteer_ = 0.02;

    
    this.velocity_.x = 1;
    this.target_ = null;
    this.pursuing_ = false;
    this.turning_ = 0;
    
    //this.school_ = scene.GetEntityByName('School_1');
    
    // Terrain
    var terrainEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_Terrain')[0]);
    if(terrainEntity)
        this.terrain_ = terrainEntity.GetComponent('EC_Terrain');
    else {
        throw 'Terrain not found';
        this.terrain_ = null;
    }
        
    // Water
    var waterEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_WaterPlane')[0]);
    if(waterEntity) {
        this.waterLevel_ = waterEntity.waterplane.position.z;
    }
    else {
        this.waterLevel_ = null;
    }
    
    
    var area = scene.GetEntityByName('FishGameArea');
    var areaPl = area.placeable;
    var areaTm = areaPl.transform;
    var areaBody = area.rigidbody;
    this.areaPos_ = areaTm.pos;
    this.areaSize_ = areaBody.size;
    this.areaVolumeTrigger_ = area.volumetrigger;
    
    frame.Updated.connect(this, this.serverUpdate);
    
}

Guard.prototype.getDistanceToTerrain = function(point) {
    if (!this.terrain_)
        return 0;
    else
        return this.terrain_.GetDistanceToTerrain(point);
}

Guard.prototype.getDistanceToSurface = function(point) {
    if (!this.waterLevel_)
        return 0;
    else
        return point.z - this.waterLevel_;
        //return this.water_.GetDistanceToWaterPlane(point);
}


Guard.prototype.serverUpdate = function(dt) {
    var tm = this.placeable_.transform;

    if(!this.prey_) {
        // Try to find new prey to chase if there's currently none
        this.prey_ = this.getPrey();
    }
    
    // Are we are pursuing something
    if(this.prey_) {
        try {
            this.prey_.placeable;
        } catch (e) {
            print("Prey disappeared from server.");
            this.prey_ = null;
        }
        
        // Get distance to prey
        var distance = this.prey_.distanceTo(tm.pos);
        // Check prey's position
        if(this.canEatPrey()) {
            this.eatPrey();
            this.target_ = null;
            this.prey_ = null;
            this.pursuing_ = false;
        }
        else if(distance < this.maxPursuingDistance_) {
            //print('pursuing prey');
            try {
                this.target_ = this.prey_.getPos();
                this.pursuing_ = true;
            } catch (e) {
                print('prey exists no more, player left game?');
                this.preylost();
            }
        }
        // Prey is already too far, stop chasing
        else {
            print('lost prey');
            this.preylost();
        }
    }
    else { // We are not currently pursuing prey so we have to do something else
        if(this.target_) {
            // We have some random target, check if we are there yet
            var distance = Get2DDistance(this.target_, tm.pos);
            if(distance < 0.5) {
                this.target_ = null;
            }
        }
        else {
            // Get new target and set random cruising speed
            this.target_ = this.getWanderingTarget();
            // this.maxSpeed_ = 1+Math.random()*(MAX_SPEED-1);
            // TODO: Stay still?
        }
    }
    
    this.updateVelocity(dt);
    this.updateOrientation(dt);
    this.updatePosition(dt);
    
    this.updateAnimationState(dt);
    // this.updateAnimation(dt);
}

Guard.prototype.preylost = function () {
    this.target_ = null;
    this.prey_ = null;
    this.pursuing_ = false;
}

Guard.prototype.canEatPrey = function() {
    if(!this.prey_)
        return false;
    
    // TODO: This isnt very accurate
    var tm = this.placeable_.transform;
    var distance = this.prey_.distanceTo(tm.pos);
    if(distance < 0.1) //0.5
        return true;
    else
        return false;
}


Guard.prototype.eatPrey = function() {
    if(!this.prey_)
        return false;
    
    this.prey_.die();
    //removeAvatar(this.prey_.getID());
}


Guard.prototype.getPrey = function() {
    var tm = this.placeable_.transform;
    // print('guard getPrey');
    for (var i=0; i < avatars.length; ++i) {
        var avatar = avatars[i];
        var avatarPos = avatar.getPos();
        var distance = tm.pos.Distance(avatarPos);
        if(distance < this.maxPursuingDistance_) {
            return avatar;
        }
    }
    return null;
}

Guard.prototype.getWanderingTarget = function() {
    var target = new float3(0,0,0);
    target.x = this.areaPos_.x + (Math.random() - 0.5)*this.areaSize_.x;
    target.y = this.areaPos_.y + (Math.random() - 0.5)*this.areaSize_.y;
    target.z = this.areaPos_.z + (Math.random() - 0.5)*this.areaSize_.z;
    return target;
} 

Guard.prototype.updateVelocity = function(dt) {
    var tm = this.placeable_.transform;
    
    if(!this.target_)
        return;
    
    var target = this.target_;
    var direction = this.velocity_.Normalized();
    var maxSpeed = this.maxSpeed_;
    var maxSteer = this.maxSteer_;
    var minSpeed = this.minSpeed_;
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
    
    var steer = this.get2DSteer(tm.pos, target, maxSteer, maxSpeed, slowDown);
    
    this.velocity_.x += steer.x;
    this.velocity_.y += steer.y;
    
    
    // Steer towards center if trying to leave the game area
    var aPos  = this.areaPos_;
    var aSize = this.areaSize_;
    var p = tm.pos;
    
    if(p.x < aPos.x-aSize.x/2 || p.x > aPos.x+aSize.x/2 || p.y < aPos.y-aSize.y/2 || p.y > aPos.y+aSize.y/2) {
        var steer = this.get2DSteer(tm.pos, aPos, maxSteer, maxSpeed);
        this.velocity_.x += steer.x;
        this.velocity_.y += steer.y;
        this.target_ = null;
        this.pursuing_ = false;
    }
    
    // Limit XY-speed
    var v = new float3(0,0,0);
    v.x = this.velocity_.x; v.y = this.velocity_.y; v.z = 0;
    v = GetLimitedVector(v, maxSpeed, minSpeed);
    
    this.velocity_.x = v.x;
    this.velocity_.y = v.y;
    
    
    // Set Z-speed
    
    var xDelta = 0.4;
    var deltaPoint = new float3(0,0,0);
    deltaPoint.x = xDelta;
    deltaPoint = this.placeable_.LocalToWorld().MulDir(deltaPoint);
    deltaPoint.z = 0; 
    var point = tm.pos.Add(deltaPoint); // A point in front of fish
    
    var distanceToTerrain = this.getDistanceToTerrain(point);
    var distanceToSurface = this.getDistanceToSurface(point);
    
    var desiredZVel = 0;
    
    if(distanceToSurface > SURFACE_DELTA) {
        var nextPos = point.Add(v.Mul(dt));
        var distanceToSurface = this.getDistanceToSurface(nextPos);
        nextPos.z -= distanceToSurface;
        nextPos.z -= SURFACE_DELTA;
        var zDiff = nextPos.z - point.z;
        desiredZVel = zDiff/dt;
        //print("SURFACE_DELTA desired Z: " + desiredZVel);
    }
    
    else if(distanceToTerrain < TERRAIN_DELTA) {
        var nextPos = point.Add(v.Mul(dt));
        nextPos.z -= this.getDistanceToTerrain(nextPos);
        nextPos.z += TERRAIN_DELTA;
        var zDiff = nextPos.z - point.z;
        desiredZVel = zDiff/dt;
        //print("TERRAIN_DELTA desired Z: " + desiredZVel);
    }
    else {
        var xySpeed = v.Length();
        var xyDistance = Get2DDistance(tm.pos, target);
        var timeToTarget = xyDistance/xySpeed;
        
        desiredZVel = (target.z-tm.pos.z)/timeToTarget;
        //print("TARGET desired Z: " + desiredZVel);
    }
        
    var zSteer = desiredZVel - this.velocity_.z;
    var maxZSteer = 0.03;
    if(zSteer > maxZSteer)
        zSteer = maxZSteer;
    else if(zSteer < -maxZSteer)
        zSteer = -maxZSteer;
    
    this.velocity_.z += zSteer;
    var maxZSpeed = 2.0;
    if(this.velocity_.z > maxZSpeed)
        this.velocity_.z = maxZSpeed;
    else if(this.velocity_.z < -maxZSpeed)
        this.velocity_.z = -maxZSpeed;
}

// Turns object to right direction and sets this.turning_ for animation
Guard.prototype.updateOrientation = function(dt) {
return;
    var tm = this.placeable_.transform;
    var d = new float3(1,0,0);
    
    var r = new float3(this.velocity_);
    print("TODO REWRITE THIS: IT IS NOT MATH!");
    var rot = this.placeable_.GetRotationFromTo(d, r);
    rot.x = 0;
    
    var delta = rot.z - tm.rot.z;
    
    if(delta > 0.1)
        this.turning_ = -1;
    else if(delta < -0.1)
        this.turning_ = 1;
    else 
        this.turning_ = 0;
    
    tm.rot = rot;
    this.placeable_.transform = tm;
}

Guard.prototype.updatePosition = function(dt) {
    var tm = this.placeable_.transform;
    tm.pos = tm.pos.Add(this.velocity_.Mul(dt));
    this.placeable_.transform = tm;
}

Guard.prototype.updateAnimationState = function(dt) {
    var entity = this.entity_;
    var speed = this.velocity_.Length();
    var state = null;

    if(this.turning_ == -1)
        state = 'turn left';
    else if(this.turning_ == 1)
        state = 'turn right';
    else if(speed < SLOW_SWIM_SPEED)
        state = 'swim slow';
    else if(speed < MEDIUM_SWIM_SPEED)
        state = 'swim medium';
    else
        state = 'swim fast';
        
/*
Animations:
    Eat
    Walk
    Boost_1-33
    Turning_R_1-11
    Turning_L_1-11
*/
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
}

// Guard.prototype.updateAnimation = function(dt) {
//     var animationcontroller = this.entity_.animationcontroller;
//     var state = animationcontroller.animationState;
//     if(state == this.currentAnimState_)
//         return;
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

Guard.prototype.get2DSteer = function(pos, target, maxSteer, maxSpeed, slowDownDistance) {
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
        v.x = this.velocity_.x;
        v.y = this.velocity_.y;
        steer = desired.Sub(v);
        steer = GetLimitedVector(steer, maxSteer);
    }
    else {
        steer = new float3(0,0,0);
    }
    return steer;
}

Guard.prototype.remove = function() {
    print(this.entity_.id);
    scene.RemoveEntityRaw(this.entity_.id, 0);
}
