//client only code for an individual particle system which swarms together with a few others in a cluster (school, i.e. swarm)
//only the movement of the schools is executed on the server, to save bandwidth

engine.IncludeFile("vector.js");

var systemSize = new float3(1.5, 1.5, 0.3);
    
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
    this.velocity_   = new float3(0,0,0);
    
    this.entity_ = scene.CreateEntity(scene.NextFreeIdLocal(), ['EC_Placeable', 'EC_ParticleSystem', 'EC_RigidBody', 'EC_Mesh']);
    this.entity_.SetName(name);
    this.entity_.SetTemporary(true);
       
    var placeable = this.entity_.placeable;
    var transform = placeable.transform;
    transform.pos = this.pos_;
    placeable.transform = transform;
    
    var particleSystem = this.entity_.particlesystem;
    // particleSystem.paritcleId = 'plankton.particle';
    var r = particleSystem.particleRef;
    r.ref = 'plankton.particle';
    particleSystem.particleRef = r;
    
    var systemBody = this.entity_.rigidbody;
    // systemBody.mass = 1;                  // To make body non-static, but
    systemBody.linearFactor = new float3(0,0,0);  // not affected by any forces
    systemBody.angularFactor = new float3(0,0,0); //
    systemBody.shapeType = 0;
    systemBody.size = systemSize;
    
    var waterEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_WaterPlane')[0]);
    if(waterEntity) {
        this.waterLevel_ = waterEntity.waterplane.position.z;
    }
    else
        throw 'No water found';
    
    //this.entity_.Action('Die').Triggered.connect(this, this.die);
    scene.EmitEntityCreated(this.entity_);
    
    //time interval for calculating new velocity / direction in swarming, to save cpu
    this.prev_velcalc = LOGICINTERVAL; //is done at start so initing with the max val
}

// System.prototype.getPointOnSurface = function(point) {
//     if(!this.water_) {
//         var waterEntity = scene.GetEntityRaw(scene.GetEntityIdsWithComponent('EC_WaterPlane')[0]);
//         if(waterEntity)
//             this.water_ = waterEntity.GetComponent('EC_WaterPlane');
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
            this.terrain_ = terrainEntity.GetComponent('EC_Terrain');
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

    var delta = this.velocity_.Mul(dt); //XXX check if could use this for placeable.Translate
    this.pos_ = this.pos_.Add(delta);     


    var placeable = this.entity_.placeable;
    var tm = placeable.transform;
    tm.pos = this.pos_;
/*

    placeable.transform = tm;
*/
}

System.prototype.updateVelocity = function(schoolPos, systems) { //schoolVelocity
    var steer = new float3(0,0,0);
    steer = steer.Add(this.getSeparateSteer(systems).Mul(1.8));
    steer = steer.Add(this.getCohesionSteer(schoolPos).Mul(1.5));
    // steer = steer.Add(this.getAlignSteer(schoolVelocity));
    steer = steer.Add(this.getAvoidSurfaceSteer().Mul(3.0));
    steer = steer.Add(this.getAvoidTerrainSteer().Mul(2.0));

    steer = GetLimitedVector(steer, this.maxSteer_);

    this.velocity_ = GetLimitedVector(this.velocity_.Add(steer), this.maxSpeed_);
}

System.prototype.getAvoidSurfaceSteer = function() {
    var steer = new float3(0,0,0);
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
    var steer = new float3(0,0,0);
    var pos = this.pos_;
    var terrainPos = this.getPointOnTerrain(pos);
    
    var distance = Math.abs(terrainPos.z - pos.z);
    if(distance > 0.2 && pos.z > terrainPos.z) // No effect
        return new float3(0,0,0);
    
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
   var desired = schoolPos.Sub(pos);
   var distance = desired.Length();
   if(distance > 0) {
       desired = desired.Normalized();
       desired = desired.Mul(this.maxSpeed_);

       steer = desired.Sub(velocity);
       steer = GetLimitedVector(steer, this.maxSteer_);
   }
   else {
       steer = new float3(0,0,0);
   }
   return steer;
}

System.prototype.getAlignSteer = function(schoolVel) {
   var pos = this.pos_;
   var velocity = schoolVel;
   
   var steer = velocity;
   if( steer.Length() > 0 ) {
       steer = steer.Normalized();
       steer = steer.Mul(this.maxSpeed_);
       steer = steer.Sub(velocity);
       steer = GetLimitedVector(steer, this.maxSteer_);
   }
   return steer;
}

System.prototype.getSeparateSteer = function(systems) {
   var pos = this.pos_;
   var velocity = this.velocity_;
   
   var steer = new float3(0,0,0);
   var count = 0;
   for(var i = 0; i < systems.length; ++i) {
       var other = systems[i];
       var otherPos = other.pos_;
       var dist = pos.Distance(otherPos);
       if( dist > 0 && dist < this.separation_ ) {
           var diff = pos.Sub(otherPos);
           diff = diff.Normalized();
           diff = diff.Div(dist);
           steer = steer.Add(diff);
           count += 1;
       }
   }
   if( count > 0 ) {
       steer = VectorDiv(steer, count);
   }
   if( steer.Length() > 0 ) {
       steer = steer.Normalized();
       steer = steer.Mul(this.maxSpeed_);
       steer = steer.Sub(velocity);
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