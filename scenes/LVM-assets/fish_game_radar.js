// !ref: fishradaricon.png

//this is included by fish_avatar_controller, 
//so using this scoping trick (which coffeescript also uses) to not make global vars leak to outside this file
(function() {    
    engine.ImportExtension("qt.core");
    engine.ImportExtension("qt.gui");

    var qtscene = new QGraphicsScene();
    var qtview = new QGraphicsView(qtscene);

    var radarimgAsset = asset.GetAsset("fishradaricon.png").get();
    print(radarimgAsset.DiskSource());
    var radarimgFileName = radarimgAsset.DiskSource();
    var radarimg = new QPixmap(radarimgFileName);

    enemyIcon = new QPixmap(radarimg);

    var enemyPlaceables = [];
    var enemyItems =  [];
            
    var proxy = ui.AddWidgetToScene(qtview);    
    qtview.setStyleSheet("QWidget#" + qtview.objectName + "{background-color: transparent;}");
    qtview.resize(180, 180);

    proxy.windowFlags = 0; // No borders
    proxy.visible = !proxy.visible;
            
    // this.scene_.setSceneRect(0,0,200,200);
    // this.view_.setScene(this.scene_);
                
    function updateEnemyItemPositions() {
        // Laske kalan suunnan ja vastustajan sijainnin v‰linen kulma
        // .. tai n‰ytet‰‰n vaan paikat kuten minim‰piss‰? taitaa suhteellinen tutka olla kuitenkin parempi
        //var sceneWidth = this.scene_.width();
        //var sceneHeight = this.scene_.height();
        
        var deleted = [];
        
        for(var i = 0; i < enemyPlaceables.length; ++i) {
            var item = enemyItems[i];
            var place = enemyPlaceables[i];

            try {
                place.transform
            } catch (e) { //entity had been removed, probably eaten
                deleted += i;
                continue;
            }
            
            var t = place.transform; 
            //item.setPos(sceneWidth/2, sceneHeight/2);
            item.setPos(t.pos.y*3, t.pos.x*3);
            item.setRotation(-t.rot.z);
            //print("enemy.placeable:" + place.transform.pos.y + ", " + place.transform.pos.x);
        }
        
        var d;
        for (var i = 0; i < deleted.length; i++) {
            d = deleted[i];
            enemyPlaceables.splice(d, 1);

            var qitem = enemyItems.splice(d, 1)[0];
            qtscene.removeItem(qitem); //doesn't seem to work, some qtscript prob? goes as null/0 to c++
        }
    }
    
    function gameobjectname(s) {
        var names = ['Guard', 'FishAvatar', '-System_'];
        var n;
        for (var i=0; i < names.length; ++i) {
            n = names[i];
            //print(n + " in " + s);
            if (s.indexOf(n) != -1) {
                //print(".. hit!");
                return true;
            }
        }
        return false;
    }
        
    function createEnemyItems() {
            var ids = scene.GetEntityIdsWithComponent('EC_Name');
            for (var i=0; i < ids.length; ++i) {
                var e = scene.GetEntityRaw(ids[i]);
                if (gameobjectname(e.name)) {
                    enemyPlaceables.push(e.placeable);
                    
                    var item = qtscene.addPixmap(enemyIcon);
                    item.setTransformOriginPoint(enemyIcon.height()/2, enemyIcon.width()/2); 
                    enemyItems.push(item);
                }
            }
        }

    //XXX Note: this should be done always when a new player joins or leaves the game, or if food info changes etc.
    createEnemyItems();
    frame.Updated.connect(updateEnemyItemPositions);
}).call(this);
