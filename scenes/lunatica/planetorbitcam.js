//copy-pasted from tundra object cam, which rotates around a given pivot point with mouse.
//not adapted at all yet, but probably the way to go to make this multiplayer
//.. i.e. don't rotate planet, like in original lunatica, but move cam instead. or?
//(is it more fun to have a scene with a lot of planets that rotate as ppl play? no, can't work for multiplayer sensibly, right?)
//all movement code etc. in the old logic code is in planet's coordsys anyway so doesn't change that.

function mouseMove(event)
{
    if(objectcamera_mode)
    {
        var width = renderer.GetWindowWidth();
        var height = renderer.GetWindowHeight();

        var x = 4*Math.PI*event.relativeX/width;
        var y = 4*Math.PI*event.relativeY/height;

        var transform = objectcameraentity.placeable.transform;       
        var pos = new Vector3df();
        pos.x = transform.pos.x;
        pos.y = transform.pos.y;
        pos.z = transform.pos.z;

        var pivot = last_clicked_pos;

        var dir = new Vector3df();
        dir.x = pos.x - pivot.x;
        dir.y = pos.y - pivot.y;
        dir.z = pos.z - pivot.z;

        var quat = QQuaternion.fromAxisAndAngle(objectcameraentity.placeable.LocalYAxis, (-x*180)/Math.PI);
        quat = multiply_quats(quat, QQuaternion.fromAxisAndAngle(objectcameraentity.placeable.LocalXAxis, (-y*180)/Math.PI));
        var dirq = quat.rotatedVector(new QVector3D(dir.x, dir.y, dir.z));
        dir.x = dirq.x();
        dir.y = dirq.y();
        dir.z = dirq.z();

        var new_pos = new Vector3df();
        new_pos.x = pivot.x + dir.x;
        new_pos.y = pivot.y + dir.y;
        new_pos.z = pivot.z + dir.z;

        transform.pos.x = new_pos.x;
        transform.pos.y = new_pos.y;
        transform.pos.z = new_pos.z; 

        objectcameraentity.placeable.transform = transform;
        objectcameraentity.placeable.LookAt(new QVector3D(pivot.x, pivot.y, pivot.z));
    }
}
