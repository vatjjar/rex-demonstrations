print("<-- osprey launcher");

/// This is a script which is set to some visible entity. If this is clicked by user it launch osprey game
engine.ImportExtension("qt.core");
engine.ImportExtension("qt.gui");
//engine.ImportExtension("qt.uitools"); //naali core ui wraps this and is in remote js sandbox

// !ref: osprey_controls.ui
// !ref: osprey_game_launch.ui

var sizeX_ = 200;
var sizeY_ = 200;
var widget_ = null;

var launchSizeX_ = 200;
var launchSizeY_ = 200;
var widgetLaunch_ = null;


function LaunchGame() {
    print("Launching Osprey Game");
    var e = scene.GetEntityByName("OspreyGame");
    e.Exec(2, "LaunchGame");  
}

function ShowGameDialog() {
    print("click!");
    var file = "osprey_game_launch.ui";

    if (widgetLaunch_ == null) {

        widgetLaunch_ = ui.LoadFromFile(file, false);

        if (widgetLaunch_ == null) {
            print("OspreyLauncher: LoadFromFile ui-file:" + file + " failed.");
            return;
        }

        // Orginal size.
        launchSizeX_ = widgetLaunch_.width;
        launchSizeY_ = widgetLaunch_.height;

        var butStart = findChild(widgetLaunch_, "Start");
        var butExit = findChild(widgetLaunch_, "Exit");
     
        if (butStart == null || butExit == null) {
            print("OspreyLauncher: Did not find exit and start buttons from ui-file.");
            return;
        }

        butStart.clicked.connect(ShowControls);
        butExit.clicked.connect(Exit);

        var proxy = ui.AddWidgetToScene(widgetLaunch_);

        // No window borders.
        proxy.windowFlags = 0;

        var gscene = ui.GraphicsScene();
        gscene.sceneRectChanged.connect(OnWindowSizeChanged);

        widgetLaunch_.move(gscene.width() / 2.0 - launchSizeX_ / 2.0, gscene.height() / 2.0 - launchSizeY_ / 2.0);

        proxy.visible = true;
    }
    else {
        var gscene = ui.GraphicsScene();
        widgetLaunch_.move(gscene.width() / 2.0 - launchSizeX_ / 2.0, gscene.height() / 2.0 - launchSizeY_ / 2.0);
        widgetLaunch_.show();
    }
}


function ShowControls() {
    if ( widgetLaunch_ != null)
        widgetLaunch_.hide();
    
    var file = "osprey_controls.ui";

    if (widget_ == null) 
    {
        
        widget_ = ui.LoadFromFile(file, false);
    
        if (widget_ == null) {
            print("OspreyLauncher: LoadFromFile ui-file:" + file + " failed.");
            return;
        }
        
        // Orginal size.
        sizeX_ = widget_.width;
        sizeY_ = widget_.height;
        
        var butStart = findChild(widget_, "Start");
   
        if (butStart == null) {
                print("OspreyLauncher: Did not find exit and start buttons from ui-file.");
                return;
            }
        
        butStart.clicked.connect(Start);
        var proxy = ui.AddWidgetToScene(widget_);

        // No window borders.
        proxy.windowFlags = 0;

        var gscene = ui.GraphicsScene();
        gscene.sceneRectChanged.connect(OnWindowSizeChanged);
        
        widget_.move(gscene.width() / 2.0 - sizeX_ / 2.0, gscene.height() / 2.0 - sizeY_ / 2.0);

        proxy.visible = true;
    
    }
    else {
        // Assures that widget is always in center..
        var gscene = ui.GraphicsScene();
        widget_.move(gscene.width() / 2.0 - sizeX_ / 2.0, gscene.height() / 2.0 - sizeY_ / 2.0);
        widget_.show();
    }
   
}

function OnWindowSizeChanged() {
    // Reposition the widget
    if (widget_ != null && widget_.visible) {
        var gscene = ui.GraphicsScene();
        widget_.move(gscene.width() / 2.0 - sizeX_ / 2.0, gscene.height() / 2.0 - sizeY_ / 2.0);
    }
    if (widgetLaunch_ != null && widgetLaunch_.visible) {
        var gscene = ui.GraphicsScene();
        widgetLaunch_.move(gscene.width() / 2.0 - launchSizeX_/ 2.0, gscene.height() / 2.0 - launchSizeY_ / 2.0);
    }


}

function Start() {
    if ( widgetLaunch_ != null )
        widgetLaunch_.hide();
    
    widget_.hide();
    LaunchGame();

    // Hide main right panel
    var e = scene.GetEntityByName("MainHud");
    e.Exec(1, "HideMainUI");
	print("start");
}

function Exit() {
	print("exit");
    widgetLaunch_.hide();
    if ( widget_ != null )
        widget_.hide();
}


function StartAnimation() {
    me.Exec(7, "StopAllAnims", "0.5");
    me.Exec(7, "PlayLoopedAnim", "NlaTrack", "0.5");
}

frame.DelayedExecute(1.0).Triggered.connect(StartAnimation);

me.Action("MousePress").Triggered.connect(ShowGameDialog);
me.Action("ShowControls").Triggered.connect(ShowControls);

