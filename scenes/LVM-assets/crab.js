engine.IncludeFile("wandererAi.js");

/**
* Crab script. IF you want to use wanderer ai. You need to make object as subclass of AiWanderer and override methods 
* init(), GetAction(),  WalkTo() and optional UpdateInternals(). See Crab-class example below. 
* In this Crab script we assume that its orginal position in world when it is created is 
* inside watercube.
*/

var Crab = AiWanderer.extend({
    init: function() {

        this.r_ = 0;
        this.actions_ = 3;
        this.speed_ = 0.1; // (dimensions m/s )
        this.swim_speed_ = 0.1;
        this.chooseSwimAction_ = false;
        
        this.currentDirection_ = 0;
        this.angularSpeed_ = 0.025;

        // Currently Crab - mesh is authored so that its front (face) is looking to -y -axis.
        // Now we rotated EC_Mesh over z-axis -90 degree so that its front is looking to x-axis.

        var meshComp = me.GetComponentRaw("EC_Mesh");
        var trans = meshComp.nodeTransformation;
        // Orginal 180 degree. 
        trans.rot.z = 90;
        meshComp.nodeTransformation = trans;

        // Get volume triggers that i am intrested.
        this.volumes_ = [];

        // Defines that how much below from water plane we are (makes swim animation looks "better")
        this.waterDelta_ = 0.25;
        this.terrainDelta_ = 0.1;

        // Remember call this, initialises base class.
        this._super();

        // Get trigger volumes.
        this.volumes_ = this.GetTriggerVolumes("CrabVolume");
        
        this.orginalPos_ = this.placeable_.transform.pos;
         
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
                if ( nameComp != null && nameComp.name == "CrabVolume")
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
              }//for
            
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

        var index = 1;
        if (this.chooseSwimAction_ == false) {
            // We are bottom on sea, so choose randomly.
            index = Math.floor(Math.random() * this.actions_ + 1);
        }
        else {
            // We have been just swimming assure that we go to bottom of sea before we start to get new actions.
            index = 4;
        }

        if (index == 1) {
            action = { time: 10, name: "WalkForward", type: "walk", maxTime: 50, minTime: 30, loop: true };
        }
        else if (index == 2) {
            action = { time: 10, name: "Stand", type: "stand", maxTime: 50, minTime: 15, loop: true };
        }
        else if (index == 3) {
            action = { time: 2, name: "Attack", type: "attack", maxTime: 5, minTime: 2, loop: false };
        }
        /// TODO FIX ROTATION BUG
        /*
        else if (index == 4) {

            // Rotate mesh to look -y axis.
            var meshComp = me.GetComponentRaw("EC_Mesh");
            var trans = meshComp.nodeTransformation;
            // Orginal 180 degree. 
            trans.rot.z = 180;
            meshComp.nodeTransformation = trans;

            //Swim actions.
            if (this.chooseSwimAction_ == false) {
                // Ok start swimming, first go to surface.
                action = { time: 10, name: "Surface", type: "swim", maxTime: 20, minTime: 10, loop: true };
                this.chooseSwimAction_ = true;

            }
            else {
                // Dive so long that we are bottom on sea. 
                action = { time: 10, name: "Dive", type: "swim", maxTime: 10, minTime: 5, loop: true };
            }

        }
        */
        if (action.loop)
            action.time = Math.floor(Math.random() * action.maxTime + action.minTime);

        //print("Crab GetAction(), choosed action: " + action.type + " END");

        return action;

    },

    WalkTo: function(time) {

        //print("Crab : WalkTo() START");
        var tm = this.placeable_.transform;

        var angle = this.SlerpDirectionAngle(this.currentDirection_, this.r_, this.angularSpeed_,time);

        // Calculate new position.
        tm.pos.x += this.speed_ * time * Math.cos(angle * 3.14);
        tm.pos.y += this.speed_ * time * Math.sin(angle * 3.14);

        // Check that is new position of crab inside water plane

        var waterPlane = null;
        waterPlane = this.GetWaterPlane(tm);

        if (waterPlane == null) {
            
            // Not inside water cube, trashes debug console, removed currently.
            //print("Crab : WalkTo() Action : " + this.currentAction_.type + " not inside watercube ");
            /// TODO DO THIS BETTER.
            // Force under water.
            this.actionStopTime_ = 0;
            var lastTm = this.placeable_.transform;
            var distanceToTerrain = this.GetDistanceToTerrain(lastTm);

            tm.pos.z -= distanceToTerrain;
            tm.pos.z += this.terrainDelta_;
            
            // Rotate crab correctly
            
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
        
        }
        else {

            // Ok we are below water what are we doing?
            if (this.currentAction_.name == "Surface") {

                // Now we move our crab so that it looks like that it is going to surface. If we are allready on surface we just swim on surface.
                //print("Crab : WalkTo() Action : Surface");

                var lastTm = this.placeable_.transform;
                var distanceToWater = waterPlane.GetDistanceToWaterPlane(lastTm.pos);

                // Now are we moving to surface
                if (distanceToWater < 0 && Math.abs(distanceToWater) > this.waterDelta_) {

                    // We are below surface and going to surface, when we transit to up we go direct path  

                    var move = this.swim_speed_ * time * Math.cos(Math.PI / 4.0);
                    tm.pos.z += move;


                    //Rotate, so that "crab head" is looking same direction as our swimming direction
                    // First rotate it to -y -axis position.
                    var from = new Vector3df;
                    from.x = 0;
                    from.y = -1;
                    from.z = 0;
                    var to = new Vector3df;
                    to.x = Math.cos(angle * 3.14);
                    to.y = Math.sin(angle * 3.14);
                    to.z = Math.cos(Math.PI / 4.0);

                    var rotation = this.placeable_.GetRotationFromTo(from, to);

                    tm.rot.x = rotation.x;
                    tm.rot.y = rotation.y;
                    tm.rot.z = rotation.z;

                }
                else {
                    // We are on surface so we just swim.. on random direction.
                    tm.pos.z -= distanceToWater;
                    tm.pos.z -= this.waterDelta_;

                    // Special case check position.
                    if (!this.CheckPosition(tm.pos))
                    {
                       
                       var tmTmp = this.placeable_.transform;
      
                       var target = new Vector3df;
                       target.x = this.orginalPos_.x - tmTmp.pos.x; 
                       target.y = this.orginalPos_.y - tmTmp.pos.y;
                       //var r = Math.sqrt(target.x * target.x + target.y * target.y);
        
                       this.r_ = Math.atan2(target.y, target.x)/3.14;
                       // Note here is added little bit angular speed --> turn faster to correct direction.
                       angle = this.SlerpDirectionAngle(this.currentDirection_, this.r_, this.angularSpeed_+0.1,time);
                     
                    }

                    var from = new Vector3df;
                    from.x = 0;
                    from.y = -1;
                    from.z = 0;
                    var to = new Vector3df;
                    to.x = Math.cos(angle * 3.14);
                    to.y = Math.sin(angle * 3.14);
                    to.z = 0;
                    
                    //to.z = Math.cos(Math.PI / 4.0);

                    var rotation = this.placeable_.GetRotationFromTo(from, to);

                    tm.rot.x = rotation.x;
                    tm.rot.y = rotation.y;
                    tm.rot.z = rotation.z;
                }



            }
            else if (this.currentAction_.name == "Dive") {


                // Now we move our crab so that it looks like that it, is going to surface to bottom..
                var lastTm = this.placeable_.transform;
                var distanceToTerrain = this.GetDistanceToTerrain(lastTm);

                if (distanceToTerrain > 0 && Math.abs(distanceToTerrain) > this.terrainDelta_) {
                  
                    var move = this.swim_speed_ * time * Math.cos(Math.PI / 4.0);
                    tm.pos.z -= move;

                    //Rotate, so that "crab head" is looking same direction as our swimming direction

                    var from = new Vector3df;
                    from.x = 0;
                    from.y = -1;
                    from.z = 0;
                    var to = new Vector3df;
                    to.x = Math.cos(angle * 3.14);
                    to.y = Math.sin(angle * 3.14);
                    to.z = -Math.cos(Math.PI / 4.0);

                    var rotation = this.placeable_.GetRotationFromTo(from, to);
                    tm.rot.x = rotation.x;
                    tm.rot.y = rotation.y;
                    tm.rot.z = rotation.z;

                }
                else {
                    // We are bottom.

                    this.chooseSwimAction_ = false;
                    this.actionStopTime_ = 0;

                    var distanceToTerrain = this.GetDistanceToTerrain(tm);
                    tm.pos.z -= distanceToTerrain;

                    // Rotate mesh to look -y axis.
                    var meshComp = me.GetComponentRaw("EC_Mesh");
                    var trans = meshComp.nodeTransformation;

                    // Orginal 180 degree. 
                    trans.rot.z = 90;
                    meshComp.nodeTransformation = trans;

                    // Rotate crab:

                    var direction = new Vector3df;

                    direction.x = Math.cos(angle * 3.14);
                    direction.y = Math.sin(angle * 3.14);
                    direction.z = 0;

                    // Rotate crab correctly
                    if (this.terrain_ != null) {

                        var rotation = this.terrain_.GetTerrainRotationAngles(tm.pos.x, tm.pos.y, tm.pos.z, direction);
                        tm.rot.x = rotation.x;
                        tm.rot.y = rotation.y;
                        tm.rot.z = rotation.z;
                    }

                }

            }
            else if (this.currentAction_.name == "WalkForward") {
                // Just walk.

                var distanceToTerrain = this.GetDistanceToTerrain(tm);
                tm.pos.z -= distanceToTerrain;

                // Rotate crab:

                var direction = new Vector3df;

                direction.x = Math.cos(angle * 3.14);
                direction.y = Math.sin(angle * 3.14);
                direction.z = 0;

                // Rotate crab correctly
                if (this.terrain_ != null) {

                    var rotation = this.terrain_.GetTerrainRotationAngles(tm.pos.x, tm.pos.y, tm.pos.z, direction);
                    tm.rot.x = rotation.x;
                    tm.rot.y = rotation.y;
                    tm.rot.z = rotation.z;
                }

            }

        }

        // Set entity new position.
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

        if ( this.currentAction_.name == "Dive" ){
            
            var distanceToTerrain = this.GetDistanceToTerrain(tm);
           
            // We dive as long that we are on terrain so time which is needed is
            var diff = Math.abs(distanceToTerrain) - this.terrainDelta_;
           
            var dive_time = diff/this.swim_speed_; 
            
            // Calculate position when dive ends.
            
            tm.pos.x += this.speed_ * dive_time * Math.cos(this.r_ * 3.14);
            tm.pos.y += this.speed_ * dive_time * Math.sin(this.r_ * 3.14);
            tm.pos.z -= this.swim_speed_ * dive_time * Math.cos(Math.PI / 4.0);
          
            if (this.CheckPosition(tm.pos))
                return true;
       
        }
        
        if ( this.currentAction_.name == "Surface" )
        {
            var waterPlane = null;
            waterPlane = this.GetWaterPlane(tm);
           
            var distanceToWater = waterPlane.GetDistanceToWaterPlane(tm.pos);     
           
            var diff = Math.abs(distanceToWater) - this.waterDelta_;
       
            // We swim as long that we are on waterplain so time which is needed is
            var swim_time = diff/this.swim_speed_; 
         
            // Calculate position when dive ends.
            
            tm.pos.x += this.speed_ * swim_time * Math.cos(this.r_ * 3.14);
            tm.pos.y += this.speed_ * swim_time * Math.sin(this.r_ * 3.14);
            tm.pos.z += this.swim_speed_ * swim_time * Math.cos(Math.PI / 4.0);
                 
            if (this.CheckPosition(tm.pos))
                return true;
        
        }
        
        if ( this.currentAction_.name == "WalkForward" )
        {
            // Calculate new position.
            tm.pos.x += this.speed_ * this.currentAction_.time * Math.cos(this.r_ * 3.14);
            tm.pos.y += this.speed_ * this.currentAction_.time * Math.sin(this.r_ * 3.14);   
            tm.pos.z -= this.GetDistanceToTerrain(tm);
        
            if (this.CheckPosition(tm.pos))
                return true;
        }
        
        return false;
        
    },


    UpdateInternals: function(time) {
        
        // Update direction
        
        // Check that new direction is that kind that after action our entity is inside trigger volume.
       
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


/**
* IF you want to run script through signal, you need to make this kind HACK. Direct 
* frame.Updated.connect(p_.Update) does not work correctly (all objects attributes are undefined?).
*/
var p_ = new Crab;

function Update(frametime) {
    //print("Call Update START");
    p_.Update(frametime);
    //print("Call Update END");
}

if ( server != null && server.IsRunning() )
{
    frame.Updated.connect(Update);
}

//me.Action("MousePress").Triggered.connect(Update);



