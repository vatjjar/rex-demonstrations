// Animation controller

function EelGrass(entity, comp)
{
         print("eelsgrass");
    this.entity = entity;
    frame.DelayedExecute(10.0).Triggered.connect(this, "StartAnimation");
}

EelGrass.prototype.StartAnimation = function() {
         print("eelgrassanim");
    this.entity.Exec(7, "StopAllAnims", "0.5");
    this.entity.Exec(7, "PlayLoopedAnim", "NlaTrack", "0.5");
}
