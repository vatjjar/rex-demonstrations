//client only code for an individual particle system which swarms together with a few others in a cluster (school, i.e. swarm)
//only the movement of the schools is executed on the server, to save bandwidth

engine.IncludeFile("local://vector.js");

var systemSize = new Vector3df();
    systemSize.x = 1.5;
    systemSize.y = 1.5;
    systemSize.z = 0.3;
    
// const SYSTEM_DIAMETER_X = 1.5;
// const SYSTEM_DIAMETER_Y = 1.5;
// const SYSTEM_DIAMETER_Z = 0.3;
const LOGICINTERVAL = 0.3;

function System(name, pos) {
    this.maxSpeed_   = Math.random()+0.3;//1.5;
    this.maxSteer_   = 0.005 * (1.0 / LOGICINTERVAL);
    this.separation_ = Math.random()+2;//2.0;
    
    this.capacity_ = 10; //how much food this has. to be changed to be the actual number of particles in the system, but that's not implemented yet
    this.pos_        = pos;
    this.velocity_   = new Vector3df();
    
    this.entity_ = scene.CreateEntityRaw(scene.NextFreeIdLocal(), ['EC_Placeable', 'EC_ParticleSystem', 'EC_RigidBody', 'EC_Mesh']);
    this.entity_.SetName(name);
    this.entity_.SetTemporary(true);
       
    var placeable = this.entity_.placeable;
    var transform = placeable.transform;
    transform.pos = this.pos_;
    placeable.transform = transform;
    
    var particleSystem = this.entity_.particlesystem;
    // particleSystem.paritcleId = 'local://plankton.particle';
    var r = particleSystem.particleRef;
    r.ref = 'local://plankton.particle';
    particleSystem.particleRef = r;
    
    var systemBody = this.entity_.rigidbody;
    // systemBody.mass = 1;                  // To make body non-static, but
    systemBody.linearFactor = new Vector3df();  // not affected by any forces
    systemBody.angularFactor = new Vector3df(); //
    systemBody.shapeType = 0;
    systemBody.size = systemSize;
    
    var waterEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_WaterPlane')[0]);
    if(waterEntity) {
        this.waterLevel_ = waterEntity.waterplane.position.z;
    }
    else
        throw 'No water found';
    
    //this.entity_.Action('Die').Triggered.connect(this, this.die);
    scene.EmitEntityCreatedRaw(this.entity_);
    
    //time interval for calculating new velocity / direction in swarming, to save cpu
    this.prev_velcalc = LOGICINTERVAL; //is done at start so initing with the max val
}

// System.prototype.getPointOnSurface = function(point) {
//     if(!this.water_) {
//         var waterEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_WaterPlane')[0]);
//         if(waterEntity)
//             this.water_ = waterEntity.GetComponentRaw('EC_WaterPlane');
//         else {
//             this.water_ = null;
//             throw 'Water not found';
//         }
//     }
//     return this.water_.GetPointOnPlane(point);
// }

System.prototype.getPointOnTerrain = function(point) {
    if(!this.terrain_) {
        var terrainEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_Terrain')[0]);
        if(terrainEntity)
            this.terrain_ = terrainEntity.GetComponentRaw('EC_Terrain');
        else {
            this.terrain_ = null;
            throw 'Terrain not found';
        }
    }
    return this.terrain_.GetPointOnMap(point);
}

System.prototype.update = function(dt, pos, systems) {
    this.prev_velcalc += dt;
    if (this.prev_velcalc > LOGICINTERVAL) {
        this.updateVelocity(pos, systems);
        this.prev_velcalc = 0;
    }
    
    var delta = VectorMult(this.velocity_, dt); //XXX check if could use this for placeable.Translate
    this.pos_ = VectorSum(this.pos_, delta);     

    var placeable = this.entity_.placeable;
    var tm = placeable.transform;
    tm.pos = this.pos_;

    placeable.transform = tm;
}

System.prototype.updateVelocity = function(schoolPos, systems) { //schoolVelocity
    var steer = new Vector3df();
    steer = VectorSum(steer, VectorMult(this.getSeparateSteer(systems), 1.8));
    steer = VectorSum(steer, VectorMult(this.getCohesionSteer(schoolPos), 1.5));
    // steer = VectorSum(steer, this.getAlignSteer(schoolVelocity));
    steer = VectorSum(steer, VectorMult(this.getAvoidSurfaceSteer(), 3.0));
    steer = VectorSum(steer, VectorMult(this.getAvoidTerrainSteer(), 2.0));

    steer = GetLimitedVector(steer, this.maxSteer_);

    this.velocity_ = GetLimitedVector(VectorSum(this.velocity_, steer), this.maxSpeed_);
}

System.prototype.getAvoidSurfaceSteer = function() {
    var steer = new Vector3df();
    var pos = this.pos_;
    
    var waterDelta = 0.4;
    if(pos.z + waterDelta > this.waterLevel_) {
        var distance = Math.abs(this.waterLevel_ - pos.z);
        steer.z = -0.4/distance;
        steer.z -= this.velocity_.z;
        steer = GetLimitedVector(steer, this.maxSteer_);
    }
    return steer;
}

System.prototype.getAvoidTerrainSteer = function() {
    var steer = new Vector3df();
    var pos = this.pos_;
    var terrainPos = this.getPointOnTerrain(pos);
    
    var distance = Math.abs(terrainPos.z - pos.z);
    if(distance > 0.2 && pos.z > terrainPos.z) // No effect
        return new Vector3df();
    
    steer.z = 0.4/distance;
    //steer.z -= this.velocity_.z;
    steer = GetLimitedVector(steer, this.maxSteer_);
    // print('avoiding terrain: '+steer.z);
    
    return steer;
}
//
System.prototype.getCohesionSteer = function(schoolPos) {
   var pos = this.pos_;
   var velocity = this.velocity_;

   var steer = null;
   var desired = VectorSub(schoolPos, pos);
   var distance = GetMagnitude(desired);
   if(distance > 0) {
       desired = GetUnitVector(desired);
       desired = VectorMult(desired, this.maxSpeed_);

       steer = VectorSub(desired, velocity);
       steer = GetLimitedVector(steer, this.maxSteer_);
   }
   else {
       steer = new Vector3df();
   }
   return steer;
}

System.prototype.getAlignSteer = function(schoolVel) {
   var pos = this.pos_;
   var velocity = schoolVel;
   
   var steer = velocity;
   if( GetMagnitude(steer) > 0 ) {
       steer = GetUnitVector(steer);
       steer = VectorMult(steer, this.maxSpeed_);
       steer = VectorSub(steer, velocity);
       steer = GetLimitedVector(steer, this.maxSteer_);
   }
   return steer;
}

System.prototype.getSeparateSteer = function(systems) {
   var pos = this.pos_;
   var velocity = this.velocity_;
   
   var steer = new Vector3df();
   var count = 0;
   for(var i = 0; i < systems.length; ++i) {
       var other = systems[i];
       var otherPos = other.pos_;
       var dist = GetDistance(pos, otherPos);
       if( dist > 0 && dist < this.separation_ ) {
           var diff = VectorSub(pos, otherPos);
           diff = GetUnitVector(diff);
           diff = VectorDiv(diff, dist);
           steer = VectorSum(steer, diff);
           count += 1;
       }
   }
   if( count > 0 ) {
       steer = VectorDiv(steer, count);
   }
   if( GetMagnitude(steer) > 0 ) {
       steer = GetUnitVector(steer);
       steer = VectorMult(steer, this.maxSpeed_);
       steer = VectorSub(steer, velocity);
       steer = GetLimitedVector(steer, this.maxSteer_);
   }
   return steer;
}

System.prototype.remove = function() {
    scene.RemoveEntityRaw(this.entity_.id);
}

if (!isserver) {
    s = new System();
}