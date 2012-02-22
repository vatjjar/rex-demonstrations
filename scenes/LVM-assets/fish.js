engine.IncludeFile("wandererAi.js");

function frac(x)
{
	return x - Math.floor(x);
}

var Fish = AiWanderer.extend({
    init: function(entity) {
         print("fishctor");
         this.entity = entity;
         this.r_ = 0;
         this.currentDirection_ = 0;
         this.angularSpeed_ = 0.025;
         this.speed_ = 0.1;
         this.terrainDelta_= 0.5;
         this.waterDelta_ = 0.10;

         var meshComp = this.entity.mesh;
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

//		 this.fishScale_ = 0.1 + 0.5*Math.random(); // Who the hell designed these "0.1 scale miniature fishes?" No way we are keeping those. Replace with random fish sizes.. -jj

// Todo: Convert to using script classes, to be able to use the above, and not this hack.
		 this.fishScale_ = 0.1 + 0.5*frac(Math.random() * 0.8 * this.placeable_.transform.pos.x * this.placeable_.transform.pos.y * this.placeable_.transform.pos.z * 123414.0);

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
                var nameComp = ent.GetComponent("EC_Name");
                if (nameComp != null && nameComp.name == "FishVolume")
                {
                    var placeableComp = ent.GetComponent("EC_Placeable");
                    if (placeableComp != null)
                    {
                       var pos = placeableComp.transform.pos;
                       var d = this.orginalPos_.DistanceSq(pos);
                       if (d < smallestDistance)
                       {
                            smallestDistance = d;
                            nearestVolume = ent;
                       }
                    }
                }
            }
            
            if ( nearestVolume != null )
            {
                      var pl = nearestVolume.GetComponent("EC_Placeable");
                      // Now set that "orginal" pos is our volume trigger center..our object triest to always get there.
                      this.orginalPos_ = pl.transform.pos;
            }
        }
         
        this.rigidBody_ = this.entity.GetComponent("EC_RigidBody");
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
        tm.pos.z += this.speed_ * time * Math.sin(angle * 3.14)*4;
        
        var distanceToTerrain = this.GetDistanceToTerrain(tm);
        
        var waterPlane = this.GetWaterPlane(tm);
        
        if ( waterPlane != null )
        {
            var tm_new = tm;
            tm_new.pos.y -= distanceToTerrain;
            tm_new.pos.y += this.terrainDelta_; 
            
            var distanceToWater = waterPlane.GetDistanceToWaterPlane(tm_new.pos);   
            if ( distanceToWater < 0 && Math.abs(distanceToWater) > this.waterDelta_ )
            {
                // New position is below water plane so it is ok.
                tm = tm_new;
            }
            else if ( distanceToWater > 0 )
            {
               // We are above water plane force as below water plane
               tm_new.pos.y -= distanceToWater;
               tm_new.pos.y -= this.waterDelta_;
               tm = tm_new;   
            }
            else if ( Math.abs(distanceToWater) < this.waterDelta_ )
            {
                // We are below water plane, but too near surface.
                tm_new.pos.y -= this.waterDelta_;
                tm = tm_new;
            }
        }
        else
        {
            tm.pos.y -= distanceToTerrain;
            tm.pos.y += this.terrainDelta_; 
        }
        

        var direction = new float3(Math.cos(angle * 3.14), 0, Math.sin(angle * 3.14));

        if (this.terrain_ != null) {

//			var s = tm.scale; // To save and restore the original scale.
			var s = float3.FromScalar(this.fishScale_); // To use our modified scale.
			tm.FromFloat3x4(float3x4(Quat.LookAt(float3.unitZ, this.terrain_.Tangent(tm.pos, direction), float3.unitY, float3.unitY), tm.pos));
			tm.scale = s;
        }
        
        // Teleporting.
        var d = this.orginalPos_.DistanceSq(tm.pos);
        if (d > this.tooFar)
        {
            tm.pos = this.orginalPos_;
            
            distanceToTerrain = this.GetDistanceToTerrain(tm);
            tm.pos.y -= distanceToTerrain;
            tm.pos.y += this.terrainDelta_; 
            
            waterPlane = this.GetWaterPlane(tm);
            
            if (waterPlane != null)
            {
                var tm_new = tm;
                tm_new.pos.y -= distanceToTerrain;
                tm_new.pos.y += this.terrainDelta_; 
            
                var distanceToWater = waterPlane.GetDistanceToWaterPlane(tm_new.pos);   
                if (distanceToWater < 0 && Math.abs(distanceToWater) > this.waterDelta_)
                {
                    // New position is below water plane so it is ok.
                    tm = tm_new;
                }
                else if (distanceToWater > 0)
                {
                    // We are above water plane force as below water plane
                    tm_new.pos.y -= distanceToWater;
                    tm_new.pos.y -= this.waterDelta_;
                    tm = tm_new;   
                }
                else if (Math.abs(distanceToWater) < this.waterDelta_)
                {
                    // We are below water plane, but too near surface.
                    tm_new.pos.y -= this.waterDelta_;
                    tm = tm_new;
                }
            }
            
            direction.x = Math.cos(angle * 3.14);
            direction.y = 0;
            direction.z = Math.sin(angle * 3.14);
        
            // Calculate rotation.
            if (this.terrain_ != null) {

//			var s = tm.scale; // To save and restore the original scale.
			var s = float3.FromScalar(this.fishScale_); // To use our modified scale.
			tm.FromFloat3x4(float3x4(Quat.LookAt(float3.unitZ, this.terrain_.Tangent(tm.pos, direction), float3.unitY, float3.unitY), tm.pos));
			tm.scale = s;
            }
        }   
           
        if (this.rigidBody_ != null && !this.rigidBody_.IsActive())
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
        tm.pos.y -= this.GetDistanceToTerrain(tm);
        tm.pos.z += this.speed_ * this.currentAction_.time * Math.sin(this.r_ * 3.14) * 4;   
        
        if (this.CheckPosition(tm.pos))
        {
            var waterPlane = this.GetWaterPlane(tm);
            if (waterPlane != null)
                return true;
        }
        return false;
        
    },
    
    UpdateInternals: function(time) {
       
       
        for ( var i = 0; i < 100; ++i)
        {
            this.r_ = Math.random() * 2;
            if (this.CheckDirection())
            {
                return;
            }
        
        }
        
        
        // Ok we cannot find good direction
        // Create direction vector to trigger volume pivot point. Or if there exist many trigger volumes, to orginal position of opossum.  
        var tm = this.placeable_.transform;
      
        var target = new float3(this.orginalPos_.x - tm.pos.x, 0, this.orginalPos_.z - tm.pos.z);
        //var r = Math.sqrt(target.x * target.x + target.y * target.y);
        
        this.r_ = Math.atan2(target.z, target.x)/3.14;                 
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

function FishObject(entity, component)
{
         print("fishobject");
  this.entity = entity;
  this.p_ = new Fish(entity);
  if (!client.IsConnected())
  {
    frame.Updated.connect(this.p_, "Update");
  }
}
/*
var p_ = new Fish;

function Update(frametime) {
     p_.Update(frametime);
}

if (!client.IsConnected())
{
    frame.Updated.connect(Update);
}
*/
 // JScript source code
