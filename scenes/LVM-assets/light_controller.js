//apparently for additional lights that use the sunColor from Environment
//(so not only caelum but also these lights use that color, right? i didn't write this, only cleaned a bit..)

var envlight_ = null;
var environment_ = null;

function FindEnvironmentLight() {
  if (environment_ == null) {  
    environment_ = scene.GetEntityByNameRaw("Environment");
    envlight_ = environment_.environmentlight;
  }
}

function Update(frametime)
{ 
  if (envlight_ == null) {
    envlight_ = FindEnvironmentLight();
  }
 
  if (envlight_ != null) {
    if (me.light) {
     light.diffColor = environment_.sunColorAttr;
    }
  }
}

frame.Updated.connect(Update);