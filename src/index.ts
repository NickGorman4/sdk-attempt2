//////////////////////////////////////////////////////////
//This begins the section that sets up the sdk

//This is for saving the Scene.jsonn files
var FileSaver = require('file-saver');


//This graps the iframe with id "showcase"
const showcase = document.getElementById("showcase") as HTMLIFrameElement;
const key = "96296aaaf1964968ad92128f7469bd99";




// declare this file is a module
export {};

// augment window with the MP_SDK property
declare global {
  interface Window {
    MP_SDK: any;
  }
}
//Still not sure what this event listener business is, but here is where all the coding starts
showcase.addEventListener("load", async function () {
  let sdk;
  try {
    sdk = await showcase.contentWindow.MP_SDK.connect(showcase, key, "3.2");
  } catch (e) {
    console.error(e);
    return;
  }

  console.log("%c  Hello Bundle SDK! ", "background: #333333; color: #00dd00");
  console.log(sdk);

  //This allows for what we add to actually be seen
  //You can screw with the lights for a different effect.
  //I thought maybe this could be used to display different modes, i.e. editing mode vs showing-off mode
  const lights = await sdk.Scene.createNode();
  lights.addComponent("mp.lights");
  lights.start();

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This is the Sum() example from the matterport.github.io page. This displays how to bind component inputs to outputs
  //This is the architecture for defining, adding, and using components

  //Define the component. I am not sure why it must be in the form of a function instead of a class
  function Sum() {
    //Inputs are mutable
    this.inputs = {
      augend: 0,
      addend: 0,
    };

    //Outputs should not be mutable
    this.outputs = {
      sum: 0,
    };

    // if any input changes, recompute the sum.
    this.onInputsUpdated = function () {
      this.outputs.sum = this.inputs.augend + this.inputs.addend;
    };
  }

  //This is the function that returns the new component. Necessary for adding it
  function SumFactory() {
    return new Sum();
  }

  //Quick display of the general structure and use of the sum component
  //This is setting up an instance of the component
  var sum = SumFactory();
  sum.inputs.augend = 1;
  sum.inputs.addend = 99;
  sum.onInputsUpdated();
  console.log(sum.outputs.sum);

  //This is how you register the component to add it later
  sdk.Scene.register("sum", SumFactory);

  //This is how you add the component. Create a node and then add components. The components to be bound need to be in the same node (I think)
  var node = await sdk.Scene.createNode();
  var comp1 = node.addComponent("sum");
  var comp2 = node.addComponent("sum");
  var comp3 = node.addComponent("sum");

  // This binds comp2's augend to comp1's sum. The order of arguments can be a little confusing.
  comp1.bind("augend", comp2, "sum");
  comp1.bind("addend", comp3, "sum");

  node.start();

  comp2.inputs.augend = 5;
  comp3.inputs.addend = 6;

  //This is necessary and the order is important. The highest component in the architecture needs to be called last.
  comp2.onInputsUpdated();
  comp3.onInputsUpdated();
  comp1.onInputsUpdated();

  console.log(
      "%c  " + comp1.outputs.sum + "  ",
      "background: #333333; color: #00dd00"
  );

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This function is to move stuff around. It returns the cursor position to be assigned to an object position

  function getCursorPosition() {
    var cartesian = [];

    //Not sure what this does
    sdk.Pointer.intersection.subscribe(function (intersectionData) {
      cartesian = [
          //This is the actual cartesian location. I believe this relies on raycasting from the three.js underneath
        intersectionData.position.x,
        intersectionData.position.y,
        intersectionData.position.z,

         //This is the normal vector to determine where on the object the user has clicked
        intersectionData.normal.x,
        intersectionData.normal.y,
        intersectionData.normal.z,

      ];
      //console.log(cartesian)
    });

    return cartesian;
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This is an example of defining a class for a three.js primitive that will actually appear. It could be a cylinder, sphere, cube, text, etc.

  function Renderable() {
//Mutable inputs
    this.inputs = {
      name: null,
      visible: false,
      color: "yellow",
      opacity: 1,
    };

//This is basically an "onInputsUpdatedFunction". I used to change the color, so I called it every animation frame. I would not
//be surprised to hear there is a more efficient way than constantly calling it
//I set it up so a button will change one of the inputs and this function will implement the change
    this.update = function () {
      const THREE = this.context.three;
      this.material.color = new THREE.Color(this.inputs.color);
      this.material.opacity = this.inputs.opacity;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //This is the function that creates the geometry
    this.onInit = function () {
      //gotta do this context business , not sure how it works, but it allows for the use of the underlying three.js
      const THREE = this.context.three;


      var geometry = new THREE.BoxGeometry(.5, .5, .5);


      //This is how to wrap an object with a texture/photo.
      //First load the texture


      /*
      var texture = new THREE.TextureLoader().load(
        "../BMcD/perspective-logo-large.png"
      );
      */

      //Then map this texture to the material
      //this.material = new THREE.MeshLambertMaterial({map: texture});

      //Viola



      //Check out the three.js documentation to mess with the material. (https://threejs.org/)
      //It will change how the light reflects off the object. Perhaps another way to display modes?
      //this.material = new THREE.MeshPhongMaterial();

      //Regular ole textureless cube, with a nice color
      this.material = new THREE.MeshLambertMaterial();
      this.material.color = new THREE.Color(this.inputs.color);

      //Transparency must be true to change the opacity
      this.material.transparent = true;

      //Now you can make stuff translucent. Also a good way to display different modes/situation
      //I wanted to find a way to make the entire scene translucent to see overlap between objects n whatnot
      this.material.opacity = this.inputs.opacity;

      //Make the shape real, create the mesh
      var mesh = new THREE.Mesh(geometry, this.material);

      //This allows the object to distort the cursor so to be clickable
      this.outputs.objectRoot = mesh;
      this.outputs.collider = mesh;

    };

    //////////////////////////////////////////////////////////////////////////
    //Events are yuge
    this.onEvent = function (eventType: string) {
      //If you plan to change shape with events, gotta get the context first
      //const THREE = this.context.three;


      //I updated the sdk on August 3rd and now there are ton of events of which I am uncertain on how to use
      //The general structure I used is:

      //if(eventType == ""INTERACTION.WHATEVER")
      //{
      //do some stuff
      //}


      //Click events
      //I used variable like {eventType}Count to determine to have select and deselect functionality
      //I just used modulo clickCount to determine if it's odd or even

      /*if ((this.eventType = "INTERACTION.CLICK" && clickCount % 2 == 0)) {
        clickCount++;
        this.material.color = new THREE.Color("royalblue");
      } else if (
        (this.eventType = "INTERACTION.CLICK" && clickCount % 2 != 0)
      ) {
        clickCount++;
        this.material.color = new THREE.Color("white");
      }*/

      //hover events
      //Basically the same things as the click deal. For hover events, the event fires when you hover and unhover
      /*
      if (eventType == "INTERACTION.HOVER" && hoverCount % 2 == 0) {
        this.material.color = new THREE.Color(this.inputs.color);
        hoverCount++;
      } else if (eventType == "INTERACTION.HOVER" && hoverCount % 2 != 0) {
        this.inputs.color = "royalblue"
        this.material.color = new THREE.Color(this.inputs.color);
        hoverCount++;
      }
       */


      //drag events
      //Drag events are fired every animation frame, so it will not work to do a while. This if statement will be called
      //every frame
      if (eventType == "INTERACTION.DRAG") {

        //var cartesian = getCursorPosition();

        //I sort of cheated and went straight to the node that I had already created to change the location. I think it would be better to
        //add another input to this component definition and then use that to change the location in the node

        //here.obj3D.position.set(cartesian[0], 0.5, cartesian[2]);
      }
    };

    //Matterport does this in all their examples. I think it would be good to put the update function calls in hear, and then just call onTick
    this.onTick = function (tickDelta) {};

  }

//Now make the factory function and register the component with the sdk
  function renderableFactory(){
    return new Renderable();
  };
  sdk.Scene.register("testy", renderableFactory);
////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////

/*  function Rack() {
    this.inputs = {
      name: null,
      visible: false,
      color: "yellow",
      opacity: 1,
    };

    this.update = function () {
      const THREE = this.context.three;
      this.material.color = new THREE.Color(this.inputs.color);
      this.material.opacity = this.inputs.opacity;
    }

    this.onInit = function () {

    };
    this.onEvent = function (eventType: string) {

      if (eventType == "INTERACTION.HOVER" && hoverCount % 2 == 0) {
        hoverCount++;
      } else if (eventType == "INTERACTION.HOVER" && hoverCount % 2 != 0) {
        hoverCount++;
      }

      //drag events (ha)
      if (eventType == "INTERACTION.DRAG") {
        var cartesian = getCursorPosition();
        here.obj3D.position.set(cartesian[0], 0.5, cartesian[2]);
      }
    };

    this.onTick = function (tickDelta) {};

  }


  function rackFactory() {
    return new Rack();
  }
  sdk.Scene.register("testy", rackFactor);*/


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////
  //this spawner will be where new stuff will be spawned. This is a three.js primitives

  var spawnerPosition = [-5, 0.1, 5.5];

  function Spawner() {
    this.inputs = {
      name: null,
      visible: false,
      color: "white",
      opacity: 1,
    };

    this.update = function () {
      const THREE = this.context.three;
      this.material.color = new THREE.Color(this.inputs.color);
      this.material.opacity = this.inputs.opacity;
    }

    this.onInit = function () {
      const THREE = this.context.three;
      var geometry = new THREE.CylinderGeometry(.5, .5, .01, 50);

      this.material = new THREE.MeshLambertMaterial();
      this.material.color = new THREE.Color(this.inputs.color);
      this.material.transparent = true;
      this.material.opacity = this.inputs.opacity;

      var mesh = new THREE.Mesh(geometry, this.material);
      this.outputs.objectRoot = mesh;
      this.outputs.collider = mesh;
    };
    this.onEvent = function (eventType: string) {
      if (eventType == "INTERACTION.DRAG") {
        var cartesian = getCursorPosition();
        spawnNode.obj3D.position.set(cartesian[0], .1, cartesian[2]);
        spawnerPosition = cartesian;
      }
    };

    this.onTick = function (tickDelta) {};

  }

  function spawnFactory() {
    return new Spawner();
  }
  sdk.Scene.register("spawn", spawnFactory);

  const spawnNode = await sdk.Scene.createNode();

  const spawner = spawnNode.addComponent("spawn");

  //Gotta do this in order to make the events usable.
  spawner.events["INTERACTION.HOVER"] = true;
  spawner.events["INTERACTION.DRAG"] = true;
  spawner.events["INTERACTION.CLICK"] = true;

  //The position is controlled from the node. This is a little odd, which is why
  spawnNode.obj3D.position.set(-5, .1, 5.5)
  spawner.inputs.opacity = 1;
  spawnNode.start();
  //end of spawner definition
//////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This was the method for creating multiple instances of the same object. THe end goal was to have a palette of objects to choose from
  //Possibly link the palette the 3D library online
  var rackArray = [];
  var rackNodeArray = [];
  var rackIndex = 0;
  var rackSelected = 0;
  var pastRackSelection = 0;

//New object button
  document.getElementById("clickMe6").onclick = async function newRack() {

    //Create new node. Because each node has obj3D.position so we need a new node for each
    rackNodeArray[rackIndex] = await sdk.Scene.createNode();

    //Load the rack and link it to the node
    rackArray[rackIndex] = rackNodeArray[rackIndex].addComponent(sdk.Scene.Component.FBX_LOADER, {
      url: "./fbx/Telecom/Telecom.fbx",
    });

    //This is the scale necessary for this specific fbx model. THis required tuning that was a bit of a hassle to do
    //I loaded the object into the model with the scale of 1, then measured a side. I used this as the scale factor using the true measurement
    rackArray[rackIndex].inputs.localScale = {
      x: 0.022,
      y: 0.022,
      z: 0.022,
    };

    //This spawns the object at the spawner
    rackNodeArray[rackIndex].obj3D.position.set(spawnerPosition[0], 0, spawnerPosition[2]);
    rackArray[rackIndex].events["INTERACTION.HOVER"] = true;
    rackArray[rackIndex].events["INTERACTION.DRAG"] = true;
    rackArray[rackIndex].events["INTERACTION.CLICK"] = true;

    //The name is the method I used to determine which rack was selected
    rackArray[rackIndex].name = rackIndex;
    console.log(rackNodeArray[rackIndex]);
    console.log(rackArray[rackIndex]);

    //Here are the events. Events are loaded into the component, not the node
    rackArray[rackIndex].onEvent = function (eventType: string) {

      //Clicking the rack will select the rack
      if (eventType == "INTERACTION.CLICK") {
        pastRackSelection = rackSelected;
        console.log(pastRackSelection);
        rackSelected = this.name;
        console.log(rackSelected)
      }

      //I also select the rack if the user drags it. The selection will come in handy if a toolbox is developed
      if (eventType == "INTERACTION.DRAG") {
        pastRackSelection = rackSelected;
        rackSelected = this.name;

        var cartesian = getCursorPosition();

        //This is was the method to determine which face the user is clicking. cartesian[3], cartesian[4], and cartesian[5] are the normal positions for x, y, and z respectively
        //If the face in the x or -x direction is clicked, only move in the +/- z direction
        if(cartesian[3] == 1 || cartesian[3] ==  -1)
        {
          rackNodeArray[rackSelected].obj3D.position.z = cartesian[2];

        }

        //If the face in the y direction (only the top from dollhouse view) is clicked, it can move in the x-z plane
        if(cartesian[4] == 1)
        {
          rackNodeArray[rackSelected].obj3D.position.set(cartesian[0], 0, cartesian[2])
        }

        //If the face in the z or -z direction is clicked, only move in the +/- x direction
        if(cartesian[5] == 1 || cartesian[5] ==  -1)
        {
          rackNodeArray[rackSelected].obj3D.position.x = cartesian[0];
        }
       }

      //Attempt at one of the new events
      if (eventType == "INTERACTION.SCROLL") {
        console.log("scrollin scrollin scrollin")
      }

    };

    //Start it and increment the index
    rackNodeArray[rackIndex].start();
    rackIndex++;

  }

//Delete the selected rack
  document.getElementById("clickMe7").onclick = async function deleteRack() {

    //Stop the node
    rackNodeArray[rackSelected].stop();

    //I do not want to pop/slice the deleted rack cuz then our indices are off. So I replace them with null placeholders
    rackNodeArray[rackSelected] = null
    rackArray[rackSelected] = null
  }

  //Rotate the selected rack. When there are more than just racks, a directory should be used to determine which object is selected
  //I was thinking a naming system that would be a array of ["object string", integer name]. Then only one rotate button would be necessary
  //Instead of a bunch of buttons for each type of object.
  document.getElementById("clickMe8").onclick = async function rotateRack() {
    //It may be better to use a slider, because sometimes the layout is not always square to the object faces. This will help with the feng shui
   rackNodeArray[rackSelected].obj3D.rotation.y += Math.PI/2;
  }


  //This is a poor patch for the bug with the spawner. For some reason when the user first clicks the spawner it disapears, but after this button is clicked, it's all good.
  //I do not know why this happens
  document.getElementById("clickMe9").onclick = async function find() {
    spawnNode.obj3D.position.set(-5, .1, 5.5)
  }


  //This is the save button. It will automatically download the "Scene.json" file
  document.getElementById("clickMe10").onclick = async function save() {
    //Gotta give it the nodes
    var scene = await sdk.Scene.serialize(rackNodeArray)

    //Now save the sucker
    var file = new File([scene], "Scene.json", {type: "text/plain;charset=utf-8"});
    FileSaver.saveAs(file);
  }

  //This is the load button
  var file = null;
  var nodes = [];
  var reader =  new FileReader()
  const fileSelector = document.getElementById('clickMe11');
  fileSelector.addEventListener('change', async (event) => {
        //I had to cheat. I don't know why but I need this event.target.files, and it'll give me errors if I dont ts-ignor it
        // @ts-ignore
        const fileList = event.target.files;

        //I had to take this from the internet. I don't know what's going on in the background.
        reader.onload = async function () {
          file = reader.result;
          console.log(file);
          nodes = await sdk.Scene.deserialize(file);
          console.log(nodes);

          var i = 0;
          for (i = 0; i < nodes.length; i++) {

            //I name the nodes, which is sort of pointless right now
            //Because this deserialize method is just the nodes, it seems like I do not have access to the
            //Component. If I could access the component, it would be easy to load the racks and we'd be good to go
            //Because of I'm not accessing the components, I can't change/create the onEvent function, so all the
            //racks are stuck
            nodes[i].name = i;
            nodes[i].start();
            console.log(nodes[i]);
            console.log(rackSelected);
          }


        }

        reader.readAsText(fileList[0]);
      }
  );

  console.log(sdk)

  //This is the sort of animation dealio. Gotta do it, not sure why
  const tick = function () {
    requestAnimationFrame(tick);
    //fan.obj3D.rotation.y = rot;
    // rot = rot + 0.02
  //bull.update();
  //updateSelection();
  };

  //Looks recursive idk
  tick();
});
