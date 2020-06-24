const showcase = document.getElementById('showcase') as HTMLIFrameElement;
const key = '96296aaaf1964968ad92128f7469bd99';

// declare this file is a module
export {};

// augment window with the MP_SDK property
declare global {
  interface Window {
    MP_SDK: any;
  }
}





showcase.addEventListener('load', async function() {
  let sdk;
  try {
    sdk = await showcase.contentWindow.MP_SDK.connect(showcase, key, '3.2');
  }
  catch(e) {
    console.error(e);
    return;
  }

  console.log('%c  Hello Bundle SDK! ', 'background: #333333; color: #00dd00');
  console.log(sdk);

  //This allows for what we add to actually be seen
  const lights = await sdk.Scene.createNode();
  lights.addComponent('mp.lights');
  lights.start();


  function Box() {

    this.inputs = {
      visible: true,
    };

    this.onInit = function() {
      var THREE = this.context.three;
      var geometry = new THREE.BoxGeometry(1, 1, 1);
      this.material = new THREE.MeshPhongMaterial();
      this.material.color = new THREE.Color('skyblue');
      var mesh = new THREE.Mesh( geometry, this.material );
      this.outputs.objectRoot = mesh;
      this.outputs.collider = mesh;
    };

    this.onEvent = function(type, data) {
   /*   var THREE = this.context.three;
      if(this.type === sdk.Scene.ComponentInteractionType.HOVER) {
       this.material.color = new THREE.Color('red')
       }*/
    }


    this.onInputsUpdated = function(previous) {
    };

    this.onTick = function(tickDelta) {
    }

    this.onDestroy = function() {
      this.material.dispose();
    };
  }

  function BoxFactory() {
    return new Box();
  }

  sdk.Scene.register('box', BoxFactory);

  function Sum() {
    this.inputs = {
      augend: 0,
      addend: 0,
    };

    this.outputs = {
      sum: 0,
    };

    // if any input changes, recompute the sum.
    this.onInputsUpdated = function() {
      this.outputs.sum = this.inputs.augend + this.inputs.addend;
    };
  }
  function SumFactory() {return new Sum();}


  sdk.Scene.register('sum', SumFactory)

// Registering the component with the sdk
  sdk.Scene.register('box', BoxFactory);


// output: 11


  //Necessary for adding objects. This is what will actually
  //put our 3D object into our space
  const modelNode = await sdk.Scene.createNode();
  const littleGuy = await sdk.Scene.createNode();
  const fan = await sdk.Scene.createNode();
  const test = await sdk.Scene.createNode();


  // Store the fbx component since we will need to adjust it in the next step.
  //Object is stored inside of the project
  //The url could be some internet address where it is stored
  //this leads to a potted plant
  const fbxComponent = modelNode.addComponent(sdk.Scene.Component.FBX_LOADER, {
    url: './fbx/01Alocasia_fbx/01Alocasia_fbx.FBX',
  });
  const fella = littleGuy.addComponent(sdk.Scene.Component.FBX_LOADER, {
    url: './fbx/Nokia/Nokia.fbx',
  });

  const fanster = fan.addComponent(sdk.Scene.Component.FBX_LOADER, {
    url: './fbx/fan/fan.fbx',
  });

  const testtest = test.addComponent('box');






  //Adjsut the scale of the plant. I do not know any better way than tuning right now
  fbxComponent.inputs.localScale = {
    x: 0.0009,
    y: 0.0009,
    z: 0.0009
  };

  fella.inputs.localScale = {
    x: .02,
    y: .02,
    z: .02
  };

  fanster.inputs.localScale = {
    x: .01,
    y: .01,
    z: .01
  };

  testtest.inputs.localScale = {
    x: .01,
    y: .01,
    z: .01
  };

  console.log(fan.quaternion);





  //Location of the plant. X is "left and right", Y is "up and down", Z is "Forward and back"
  // Relative to "spawn" location of the viewer. If you move those relations will not hold
  modelNode.obj3D.position.set(-5,0,1);
  fan.obj3D.position.set(-7,3,-.25);
  littleGuy.obj3D.rotation.y = (180)*(Math.PI)/180;
  test.obj3D.position.set(-6.5,.5,1.21);


   sdk.Pointer.intersection.subscribe(function (intersectionData) {
      // Changes to the intersection data have occurred.
      document.getElementById("demo").innerHTML= 'X position : '+ Number.parseFloat(intersectionData.position.x).toFixed(3)  + ' m' + '<br/>' + 'Y position : ' + Number.parseFloat(intersectionData.position.y).toFixed(3)+ ' m' + '<br/>' + 'Z position : ' + Number.parseFloat(intersectionData.position.z).toFixed(3) + ' m';


     //console.log('Intersection normal:', intersectionData.normal);
    });


  //Rot is for the ultra-impressive cosine rotation
  //the .start() is what will actually add the object inside the node to scene


  var  rot = 0;
  modelNode.start();
  littleGuy.start();
  fan.start();
  test.start();




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

  testtest.collider
  const tick = function() {
    requestAnimationFrame(tick);
    littleGuy.obj3D.position.set(-6, .75, 2.3*1.2 - Math.cos(rot/2)*3.14/26);
    fan.obj3D.rotation.y = rot;
    rot = rot + .02;

    testtest.onEvent();

  }
  tick();



});


