console.log("RUNNING RIGHT NOW");

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
  const lights = await sdk.Scene.createNode();
  lights.addComponent("mp.lights");
  lights.start();

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //This is the Sum() example from the matterport.github.io page. This displays how to bind component inputs to outputs
  //This is the architecture for defining, adding, and using components

  //Define the component. I am not sure why it must be in the form of a function instead of a class
  function Sum() {
    this.inputs = {
      augend: 0,
      addend: 0,
    };

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
  var sum1 = SumFactory();
  sum1.inputs.augend = 1;
  sum1.inputs.addend = 99;
  sum1.onInputsUpdated();
  console.log(sum1.outputs.sum);

  //This is how you register the component to add it later
  sdk.Scene.register("sum", SumFactory);

  //This is how you add the component. Create a node and then add components. The components need to be in the same node
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

  //This is necessary and the order is important. The highest component in the architecture needs to be called alst.
  comp2.onInputsUpdated();
  comp3.onInputsUpdated();
  comp1.onInputsUpdated();

  console.log(
    "%c  " + comp1.outputs.sum + "  ",
    "background: #333333; color: #00dd00"
  );
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function getCursorPosition() {
    var cartesian = [];
    sdk.Pointer.intersection.subscribe(function (intersectionData) {
      cartesian = [
        intersectionData.position.x,
        intersectionData.position.y,
        intersectionData.position.z,
      ];
    });
    return cartesian;
  }

  function Box() {
    this.inputs = {
      visible: true,
    };

    this.onInit = function () {
      var THREE = this.context.three;
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      this.material = new THREE.MeshPhongMaterial();
      this.material.color = new THREE.Color("skyblue");
      var mesh = new THREE.Mesh(geometry, this.material);
      this.outputs.objectRoot = mesh;
      this.outputs.collider = mesh;
    };

    this.onEvent = function (type, data) {
      /*      var THREE = this.context.three;
      if (this.type === this.ComponentInteractionType.HOVER) {
        this.material.color = new THREE.Color("red");
      }*/
    };

    this.onInputsUpdated = function (previous) {};

    this.onTick = function (tickDelta) {};

    this.onDestroy = function () {
      this.material.dispose();
    };
  }

  function BoxFactory() {
    return new Box();
  }

  //var clickCount = 0;
  var hoverCount = 0;
  var hoverCountPlant = 0;

  function Renderable() {
    this.onInit = function () {
      const THREE = this.context.three;
      //this.material = new THREE.MeshPhongMaterial();
      var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

      /*
      var texture = new THREE.TextureLoader().load(
        "../BMcD/perspective-logo-large.png"
      );
*/

      this.material = new THREE.MeshLambertMaterial();
      this.material.color = new THREE.Color("royalblue");

      var mesh = new THREE.Mesh(geometry, this.material);
      this.outputs.objectRoot = mesh;
      this.outputs.collider = mesh;

      /*      var loader = new THREE.FontLoader();

      loader.load("../bundle/fonts/mp-font.eot", function (font) {
        var geometry = new THREE.TextGeometry("Hello three.js!", {
          font: font,
          size: 80,
          height: 5,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 10,
          bevelSize: 8,
          bevelOffset: 0,
          bevelSegments: 5,
        });

        this.material = new THREE.MeshLambertMaterial();
        var mesh = new THREE.Mesh(geometry, this.material);
        this.outputs.objectRoot = mesh;
        this.outputs.collider = mesh;
      });*/
    };
    this.onEvent = function (eventType: string) {
      // console.log(eventType + " count: " + hoverCount);
      const THREE = this.context.three;

      //click events
      /*if ((this.eventType = "INTERACTION.CLICK" && clickCount % 2 == 0)) {
        clickCount++;
        console.log("Clickable component was clicked!" + clickCount);
        this.material.color = new THREE.Color("royalblue");
      } else if (
        (this.eventType = "INTERACTION.CLICK" && clickCount % 2 != 0)
      ) {
        clickCount++;
        console.log("Clickable component was clicked!" + clickCount);
        this.material.color = new THREE.Color("white");
      }*/

      //hover events
      if (eventType == "INTERACTION.HOVER" && hoverCount % 2 == 0) {
        this.material.color = new THREE.Color("midnightblue");
        hoverCount++;
      } else if (eventType == "INTERACTION.HOVER" && hoverCount % 2 != 0) {
        this.material.color = new THREE.Color("royalblue");
        hoverCount++;
      }

      //drag events (ha)
      if (eventType == "INTERACTION.DRAG") {
        var cartesian = getCursorPosition();
        //console.log(cartesian);
        here.obj3D.position.set(cartesian[0], 0.25, cartesian[2]);
      }
    };
  }

  function rendyFactor() {
    return new Renderable();
  }
  sdk.Scene.register("testy", rendyFactor);

  // Registering the component with the sdk
  sdk.Scene.register("box", BoxFactory);

  //Necessary for adding objects. This is what will actually
  //put our 3D object into our space
  const modelNode = await sdk.Scene.createNode();
  const littleGuy = await sdk.Scene.createNode();
  const fan = await sdk.Scene.createNode();
  // const test = await sdk.Scene.createNode();

  const here = await sdk.Scene.createNode();

  const bull = here.addComponent("testy");

  here.obj3D.position.set(-5, 0.25, 5.5);
  here.start();

  // Store the fbx component since we will need to adjust it in the next step.
  //Object is stored inside of the project
  //The url could be some internet address where it is stored
  //this leads to a potted plant
  const fbxComponent = modelNode.addComponent(sdk.Scene.Component.FBX_LOADER, {
    url: "./fbx/01Alocasia_fbx/01Alocasia_fbx.FBX",
  });
  const fella = littleGuy.addComponent(sdk.Scene.Component.FBX_LOADER, {
    url: "./fbx/Nokia/Nokia.fbx",
  });

  const fanster = fan.addComponent(sdk.Scene.Component.FBX_LOADER, {
    url: "./fbx/fan/fan.fbx",
  });

  //const testtest = test.addComponent("box");

  //Adjsut the scale of the plant. I do not know any better way than tuning right now
  fbxComponent.inputs.localScale = {
    x: 0.0009 / 1.5,
    y: 0.0009 / 1.5,
    z: 0.0009 / 1.5,
  };

  fella.inputs.localScale = {
    x: 0.02,
    y: 0.02,
    z: 0.02,
  };

  fanster.inputs.localScale = {
    x: 0.01,
    y: 0.01,
    z: 0.01,
  };

  fbxComponent.onEvent = function (eventType: string) {
    // console.log(eventType + " count: " + hoverCount);

    //click events
    /*if ((this.eventType = "INTERACTION.CLICK" && clickCount % 2 == 0)) {
      clickCount++;
      console.log("Clickable component was clicked!" + clickCount);
      this.material.color = new THREE.Color("royalblue");
    } else if (
      (this.eventType = "INTERACTION.CLICK" && clickCount % 2 != 0)
    ) {
      clickCount++;
      console.log("Clickable component was clicked!" + clickCount);
      this.material.color = new THREE.Color("white");
    }*/

    //hover events
    if (eventType == "INTERACTION.HOVER" && hoverCountPlant % 2 == 0) {
      console.log("yerp");
      fbxComponent.inputs.localScale = {
        x: 0.0009 * 1.1,
        y: 0.0009 * 1.1,
        z: 0.0009 * 1.1,
      };
      hoverCountPlant++;
    } else if (eventType == "INTERACTION.HOVER" && hoverCountPlant % 2 != 0) {
      //this.material.color = new THREE.Color("royalblue");
      console.log("yerp1");
      fbxComponent.inputs.localScale = {
        x: 0.0009 / 1.5,
        y: 0.0009 / 1.5,
        z: 0.0009 / 1.5,
      };
      hoverCountPlant++;
    }

    //drag events (ha)
    if (eventType == "INTERACTION.DRAG") {
      //console.log(cartesian);
      modelNode.obj3D.rotation.y += 0.05;
    }
  };

  //Location of the plant. X is "left and right", Y is "up and down", Z is "Forward and back"
  // Relative to "spawn" location of the viewer. If you move those relations will not hold
  modelNode.obj3D.position.set(-7, 0, 7);
  fan.obj3D.position.set(-7, 3, -0.25);
  littleGuy.obj3D.rotation.y = (180 * Math.PI) / 180;
  //test.obj3D.position.set(-6.5, 0.5, 1.21);

  sdk.Pointer.intersection.subscribe(function (intersectionData) {
    // Changes to the intersection data have occurred.
    document.getElementById("demo").innerHTML =
      "X position : " +
      Number.parseFloat(intersectionData.position.x).toFixed(3) +
      " m" +
      "<br/>" +
      "Y position : " +
      Number.parseFloat(intersectionData.position.y).toFixed(3) +
      " m" +
      "<br/>" +
      "Z position : " +
      Number.parseFloat(intersectionData.position.z).toFixed(3) +
      " m";
  });

  //Rot is for the ultra-impressive cosine rotation
  //the .start() is what will actually add the object inside the node to scene

  var rot = 0;
  modelNode.start();
  littleGuy.start();
  fan.start();
  //test.start();

  /* sdk.Mattertag.add([{
     label: "New tag",
     description: "This tag was added through the Matterport SDK",
     anchorPosition : {
       x: 0,
       y: 0,
       z: 0,
     },
     stemVector: { // make the Mattertag stick straight up and make it 0.30 meters (~1 foot) tall
       x: 0,
       y: 0.30,
       z: 0,
     },
     color: { // blue disc
       r: 0.0,
       g: 0.0,
       b: 1.0,
     },
     //floorId?: number, // optional, if not specified the sdk will provide an estimate of the floor id for the anchor position provided.
   }])
 */

  //This runs constantly to allow for animation. I am still unfamiliar with this
  //It is called recursively though, so I think anything after this will not be reached
  // The above is FALSE, it will read past this function. But I think it is still recursive because
  //If a console.log() statement is put inside it is logged hundreds of times

  //console.log(bull.events["INTERACTION.CLICK"]);

  bull.events["INTERACTION.CLICK"] = true;
  bull.events["INTERACTION.HOVER"] = true;
  bull.events["INTERACTION.DRAG"] = true;

  fbxComponent.events["INTERACTION.HOVER"] = true;
  fbxComponent.events["INTERACTION.DRAG"] = true;

  const tick = function () {
    requestAnimationFrame(tick);
    littleGuy.obj3D.position.set(
      -6,
      0.75,
      2.3 * 1.2 - (Math.cos(rot / 2) * 3.14) / 26
    );
    fan.obj3D.rotation.y = rot;
    rot = rot + 0.02;
  };
  tick();
});
