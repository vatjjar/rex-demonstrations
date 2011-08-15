engine.IncludeFile("local://wandererAi.js");

var Fish = AiWanderer.extend({
    init: function() {
         
         this.r_ = 0;
         this.currentDirection_ = 0;
         this.angularSpeed_ = 0.025;
         this.speed_ = 0.1;
         this.terrainDelta_= 0.5;
         this.waterDelta_ = 0.10;
         
         var meshComp = me.GetComponentRaw("EC_Mesh");
         var trans = meshComp.nodeTransformation;
         // Orginal 180 degree. 
         trans.rot.z = 0;
         meshComp.nodeTransformation = trans;
         
         // Get volume triggers that i am intrested.
         this.volumes_ = [];
         
         this._super();
         
         this.orginalPos_ = this.placeable_.transform.pos;
         this.tooFar = 1600;
         // Get trigger volumes.
         this.volumes_ = this.GetTriggerVolumes("FishVolume");
         
         if ( this.volumes_.length > 1 )
         {
             // Take the closest, and save its location.
             var ids = scene.GetEntityIdsWithComponent("EC_VolumeTrigger");
             // big number..
             var smallestDistance = 9999999.0;
             var nearestVolume = null;
         
             for (var i = 0; i < ids.length; ++i) 
             {
               
                var ent = scene.GetEntityRaw(ids[i]);
                var nameComp = ent.GetComponentRaw("EC_Name");
                if ( nameComp != null && nameComp.name == "FishVolume")
                {
                    var placeableComp = ent.GetComponentRaw("EC_Placeable");
                    if ( placeableComp != null )
                    {
                       var pos = placeableComp.transform.pos;
                       var d = (this.orginalPos_.x - pos.x)*(this.orginalPos_.x - pos.x)+(this.orginalPos_.y - pos.y)*(this.orginalPos_.y - pos.y)+(this.orginalPos_.z - pos.z)*(this.orginalPos_.z - pos.z);
                       if ( d < smallestDistance )
                       {
                            smallestDistance = d;
                            nearestVolume = ent;
                       }
                    }
                }
            }
            
            if ( nearestVolume != null )
            {
                      var pl = nearestVolume.GetComponentRaw("EC_Placeable");
                      // Now set that "orginal" pos is our volume trigger center..our object triest to always get there.
                      this.orginalPos_ = pl.transform.pos;
            }
        }
         
         this.rigidBody_ = null;
         
         if ( me.HasComponent("EC_RigidBody") )
         {
            this.rigidBody_ = me.GetComponentRaw("EC_RigidBody");
         } 
         
        
    
    },
    
    GetAction: function() {
         
         action = { time: 8, name: "WalkForward", type: "Walk", maxTime: 8, minTime: 2, loop: true };
         
        if (action.loop)
            action.time = Math.floor(Math.random() * action.maxTime + action.minTime);

         return action;
    },
    
    
    
    WalkTo: function(time) {
        
        var tm = this.placeable_.transform;
          
        var angle = this.SlerpDirectionAngle(this.currentDirection_, this.r_, this.angularSpeed_,time);
        
        tm.pos.x += this.speed_ * time * Math.cos(angle * 3.14)*4; 
        tm.pos.y += this.speed_ * time * Math.sin(angle * 3.14)*4;
        
        var distanceToTerrain = this.GetDistanceToTerrain(tm);
        
        var waterPlane = null;
        waterPlane = this.GetWaterPlane(tm);
        
        if ( waterPlane != null )
        {
            var tm_new = tm;
            tm_new.pos.z -= distanceToTerrain;
            tm_new.pos.z += this.terrainDelta_; 
            
            var distanceToWater = waterPlane.GetDistanceToWaterPlane(tm_new.pos);   
            if ( distanceToWater < 0 && Math.abs(distanceToWater) > this.waterDelta_ )
            {
                // New position is below water plane so it is ok.
                tm = tm_new;
            }
            else if ( distanceToWater > 0 )
            {
               // We are above water plane force as below water plane
               tm_new.pos.z -= distanceToWater;
               tm_new.pos.z -= this.waterDelta_;
               tm = tm_new;   
            }
            else if ( Math.abs(distanceToWater) < this.waterDelta_ )
            {
                // We are below water plane, but too near surface.
                tm_new.pos.z -= this.waterDelta_;
                tm = tm_new;
            }
        }
        else
        {
            tm.pos.z -= distanceToTerrain;
            tm.pos.z += this.terrainDelta_; 
        }
        

        var direction = new Vector3df;

        direction.x = Math.cos(angle * 3.14);
        direction.y = Math.sin(angle * 3.14);
        direction.z = 0;

        if (this.terrain_ != null) {

            var rotation = this.terrain_.GetTerrainRotationAngles(tm.pos.x, tm.pos.y, tm.pos.z, direction);
            tm.rot.x = rotation.x;
            tm.rot.y = rotation.y;
            tm.rot.z = rotation.z;
        }
        
        // Teleporting.
        var d = (this.orginalPos_.x - tm.pos.x)*(this.orginalPos_.x - tm.pos.x)+(this.orginalPos_.y - tm.pos.y)*(this.orginalPos_.y - tm.pos.y)+(this.orginalPos_.z - tm.pos.z)*(this.orginalPos_.z - tm.pos.z);
        if ( d > this.tooFar )
        {
            tm.pos.x = this.orginalPos_.x;
            tm.pos.x = this.orginalPos_.y;
            tm.pos.z = this.orginalPos_.z;
            
            distanceToTerrain = this.GetDistanceToTerrain(tm);
            tm.pos.z -= distanceToTerrain;
            tm.pos.z += this.terrainDelta_; 
            
            waterPlane = null;
            waterPlane = this.GetWaterPlane(tm);
            
            if ( waterPlane != null )
            {
                var tm_new = tm;
                tm_new.pos.z -= distanceToTerrain;
                tm_new.pos.z += this.terrainDelta_; 
            
                var distanceToWater = waterPlane.GetDistanceToWaterPlane(tm_new.pos);   
                if ( distanceToWater < 0 && Math.abs(distanceToWater) > this.waterDelta_ )
                {
                    // New position is below water plane so it is ok.
                    tm = tm_new;
                }
                else if ( distanceToWater > 0 )
                {
                    // We are above water plane force as below water plane
                    tm_new.pos.z -= distanceToWater;
                    tm_new.pos.z -= this.waterDelta_;
                    tm = tm_new;   
                }
                else if ( Math.abs(distanceToWater) < this.waterDelta_ )
                {
                    // We are below water plane, but too near surface.
                    tm_new.pos.z -= this.waterDelta_;
                    tm = tm_new;
                }
            }
            
            direction.x = Math.cos(angle * 3.14);
            direction.y = Math.sin(angle * 3.14);
            direction.z = 0;
        
            // Calculate rotation.
            if (this.terrain_ != null) {

                var rotation = this.terrain_.GetTerrainRotationAngles(tm.pos.x, tm.pos.y, tm.pos.z, direction);
                tm.rot.x = rotation.x;
                tm.rot.y = rotation.y;
                tm.rot.z = rotation.z;
            }
        }   
           
        if (  this.rigidBody_ != null && !this.rigidBody_.IsActive())
             this.rigidBody_.Activate();
        
        this.placeable_.transform = tm;
        this.currentDirection_ = angle;        
    
    },
    
    // Checks that is direction good. Meaning that if last point which is calculated in given direction is inside trigger volume.
    // If it is return true else return false.
    
    CheckDirection : function()
    {
        var tm = this.placeable_.transform;
        tm.pos.x += this.speed_ * this.currentAction_.time * Math.cos(this.r_ * 3.14) * 4;
        tm.pos.y += this.speed_ * this.currentAction_.time * Math.sin(this.r_ * 3.14) * 4;   
        tm.pos.z -= this.GetDistanceToTerrain(tm);
        
        if (this.CheckPosition(tm.pos))
        {
            var waterPlane = null;
            waterPlane = this.GetWaterPlane(tm);
            if ( waterPlane != null )
            {
                return true;
            }
           
        }
        return false;
        
    },
    
    UpdateInternals: function(time) {
       
       
        for ( var i = 0; i < 100; ++i)
        {
            this.r_ = Math.random() * 2;
            if ( this.CheckDirection() )
            {
                return;
            }
        
        }
        
        
        // Ok we cannot find good direction
        // Create direction vector to trigger volume pivot point. Or if there exist many trigger volumes, to orginal position of opossum.  
        var tm = this.placeable_.transform;
      
        var target = new Vector3df;
        target.x = this.orginalPos_.x - tm.pos.x; 
        target.y = this.orginalPos_.y - tm.pos.y;
        //var r = Math.sqrt(target.x * target.x + target.y * target.y);
        
        this.r_ = Math.atan2(target.y, target.x)/3.14;
      
      
       
    },
    
    // Returns true that if position is valid, false if not. 
    CheckPosition: function(point) {
        for ( var i = 0; i < this.volumes_.length; ++i)
        {
           if ( this.IsInsideVolume(point, this.volumes_[i]) )
                return true;          
        }
        
        return false;
    },
    
});


var p_ = new Fish;

function Update(frametime) {
     p_.Update(frametime);
}

if ( server != null && server.IsRunning() )
{
    frame.Updated.connect(Update);
}

 // JScript source code
