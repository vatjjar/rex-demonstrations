engine.IncludeFile("local://vector.js");
engine.IncludeFile("local://wandererAi.js");
engine.IncludeFile("local://fishgame_schoolconst.js");

var School = AiWanderer.extend({
   init: function(entity, pos) {
       this._super();
       
       this.entity_     = entity;
       this.pos_        = pos;
       this.velocity_   = new Vector3df();
       this.systems_    = [];
       
       this.maxSpeed_ = 0.3;
       this.maxSteer_ = 0.001;
   
       var volumes = this.GetTriggerVolumes('FishGameArea');
       if(volumes.length < 1)
           throw 'FishGameArea not found';

       this.volume_ = volumes[0];
       // Get volume size and pos
       var volumeEntity = this.volume_.GetParentEntity();
       var volumeBody = volumeEntity.GetComponentRaw('EC_RigidBody');
       var volumePlaceable = volumeEntity.GetComponentRaw('EC_Placeable');
       if(!volumeBody)
           throw 'FishGameArea has no rigidbody';
       if(!volumePlaceable)
           throw 'FishGameArea has no placeable';

       var volumeTm = volumePlaceable.transform;
       
       this.volumePos_ = volumeTm.pos;
       this.volumeSize_ = volumeBody.size;
       
       
       this.targetPos_ = new Vector3df();
       this.updateTarget();
       
       
       var placeable = this.entity_.placeable;
       var transform = placeable.transform;

       transform.pos = this.pos_;
       
       /*var rigidbody = this.entity_.rigidbody;
       rigidbody.mass = 0;
       rigidbody.shapeType = 0;
       rigidbody.size = schoolSize;*/
       
       placeable.transform = transform;
       
       frame.Updated.connect(this, this.serverUpdateSchool);
   },
      
   serverUpdateSchool: function(dt) {
       var placeable = this.entity_.placeable;
       var tm = placeable.transform;
       
       if(GetDistance(this.pos_, this.targetPos_) < 1.0) {
           this.updateTarget();
       }
       
       var steer = this.getSteer();
       this.velocity_ = VectorSum(this.velocity_, steer);
       var delta = VectorMult(this.velocity_, dt);
       
       this.pos_ = VectorSum(this.pos_, delta);
       tm.pos = this.pos_;
       placeable.transform = tm;       
   },
      
    GetAction: function() {
       //print('getAction');
       var action = {
           time: 10,
           minTime: 1,
           maxTime: 2,
           name: 'Walk',
           type: 'walk',
           loop: true
       }
       return action;
    },
   
    WalkTo: function(dt) {
    },
   
    UpdateInternals: function(dt) {
       //print('UpdateInternals');
    },
   
   updateTarget: function() {
       this.targetPos_.x = this.volumePos_.x + (Math.random()-0.5)*this.volumeSize_.x;
       this.targetPos_.y = this.volumePos_.y + (Math.random()-0.5)*this.volumeSize_.y;
       this.targetPos_.z = this.volumePos_.z + (Math.random()-0.5)*this.volumeSize_.z;
   },
   
   getSteer: function() {
       var steer = null;
       var desired = VectorSub(this.targetPos_, this.pos_);
       var distance = GetMagnitude(desired);
       if(distance > 0) {
           desired = GetUnitVector(desired);
           desired = VectorMult(desired, this.maxSpeed_);
           
           steer = VectorSub(desired, this.velocity_);
           steer = GetLimitedVector(steer, this.maxSteer_);
       }
       else {
           steer = new Vector3df();
       }
       return steer;
   },
   
    remove: function() {
        for(var i in this.systems_) {
            var system = this.systems_[i];
            system.remove();
        }
        
        scene.RemoveEntityRaw(this.entity_.id);
    }   
});

