print(" --- Loading Knon script.");
engine.IncludeFile("local://KnonCore.js");
engine.IncludeFile("local://YTools.js");

var speed = 1.0; 
var kc = new KnonCore(["geom-kn_fire","geom-kn_reload","geom-kn_reset"],["geom-kn_left","geom-kn_top","geom-kn_right","geom-kn_down"]);

//
function Update(frametime){
	kc.anim(frametime);
}
function init(){
}
//ik_chain.addChain("geom-kn_support","geom-kn_canon_left");
frame.DelayedExecute(1).Triggered.connect(this, init);
frame.Updated.connect(Update);