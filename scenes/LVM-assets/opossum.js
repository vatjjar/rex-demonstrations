engine.IncludeFile("wandererAi.js");

var Opossum = AiWanderer.extend({
    init: function() {
         
         this.r_ = 0;
         this.currentDirection_ = 0;
         this.angularSpeed_ = 0.025;
         this.speed_ = 0.1;
         this.terrainDelta_= 0.5;
         
         var meshComp = me.GetComponent("EC_Mesh");
         var trans = meshComp.nodeTransformation;
         // Orginal 180 degree. 
         trans.rot.z = 90;
         meshComp.nodeTransformation = trans;
         
         // Get volume triggers that i am intrested.
         this.volumes_ = [];
         
         this._super();
         
         this.orginalPos_ = this.placeable_.transform.pos;
         
         // Get trigger volumes.
         this.volumes_ = this.GetTriggerVolumes("OpossumVolume");
         
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
                if ( nameComp != null && nameComp.name == "OpossumVolume")
                {
                    var placeableComp = ent.GetComponent("EC_Placeable");
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
                      var pl = nearestVolume.GetComponent("EC_Placeable");
                      // Now set that "orginal" pos is our volume trigger center..our object triest to always get there.
                      this.orginalPos_ = pl.transform.pos;
            }
        }
         
         this.rigidBody_ = null;
         
         if ( me.HasComponent("EC_RigidBody") )
         {
            this.rigidBody_ = me.GetComponent("EC_RigidBody");
         } 
         
         /*
         if ( this.volumes_.length == 1 )
         {
            // Take the first, and save its location. 
            var ids = scene.GetEntityIdsWithComponent("EC_VolumeTrigger");
            for (var i = 0; i < ids.length; ++i) {
               
                var ent = scene.GetEntityRaw(ids[i]);
                var nameComp = ent.GetComponent("EC_Name");
                if ( nameComp != null && nameComp.name == "OpossumVolume")
                {
                    var placeableComp = ent.GetComponent("EC_Placeable");
                    if ( placeableComp != null )
                    {
                       this.orginalPos_ = placeableComp.transform.pos;
                       break;
                    }
                }
            }
            
         }
        */
    
    },
    
    GetAction: function() {
         
         action = { time: 8, name: "WalkForward", type: "walk", maxTime: 8, minTime: 2, loop: true };
         
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
        tm.pos.z -= distanceToTerrain;
        tm.pos.z += this.terrainDelta_; 

        var direction = new float3(Math.cos(angle * 3.14), 0, Math.sin(angle * 3.14));

        if (this.terrain_ != null) {

            var rotation = this.terrain_.GetTerrainRotationAngles(tm.pos.x, tm.pos.y, tm.pos.z, direction);
            tm.rot.x = rotation.x;
            tm.rot.y = rotation.y;
            tm.rot.z = rotation.z;
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
            return true;
        
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
      
        var target = new float3(0,0,0);
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


var p_ = new Opossum;

function Update(frametime) {
     p_.Update(frametime);
}

if ( server != null && server.IsRunning() )
{
    frame.Updated.connect(Update);
}

 