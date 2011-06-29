
var speed_ = 5;
function Rotate(frametime) {
    if (me.HasComponent("EC_Placeable")) {
        var tm = me.placeable.transform;

        tm.rot.z += speed_;
        tm.rot.z = tm.rot.z % 360;
        me.placeable.transform = tm;
    }
}


frame.Updated.connect(Rotate);