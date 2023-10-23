"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ), // A
    vec4( -0.5,  0.5,  0.5, 1.0 ), // B
    vec4(  0.5,  0.5,  0.5, 1.0 ), // C
    vec4(  0.5, -0.5,  0.5, 1.0 ), // D
    vec4( -0.5, -0.5, -0.5, 1.0 ), // E
    vec4( -0.5,  0.5, -0.5, 1.0 ), // F
    vec4(  0.5,  0.5, -0.5, 1.0 ), // G
    vec4(  0.5, -0.5, -0.5, 1.0 ) // H
];

// RGBA colors
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 )   // cyan
];




var C_HEIGHT = 2.0;
var C_WIDTH = 0.5;

var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 2.0;
var LOWER_ARM_HEIGHT = 2.0;
var LOWER_ARM_WIDTH  = 0.5;
var UPPER_ARM_HEIGHT = 2.0;
var UPPER_ARM_WIDTH  = 0.5;

// Shader transformation matrices
var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;
var nMatrix, nMatrixLoc;

// Array of rotation angles (in degrees) for each rotation axis
var Base = 0;
var LowerArm = 1;
var UpperArm = 2;
var segment_C = 3;


var theta= [ 0, 0, 0, 0];

var angle = 0;



var vBuffer, cBuffer;

// Variables for camera movement
var dr = 5.0 * Math.PI/180.0;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var radius = 1.5;
var theta_cam = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;



init();

//----------------------------------------------------------------------------

function quad(  a,  b,  c,  d) {
    console.log("--------------------------------------------------------------------------------------------------------------------")
    console.log(a + ', ' + b + ', ' + c + ', ' + d);


    console.log("Adding:")
    console.log("vertexColors[" + a + "]: " + vertexColors[a])
    //console.log("vertices[a]: " + vertices[a])

    console.log("vertices[" + a + "]: " + vertices[a])


    // console.log("vertexColors[a]: " + vertexColors[a])
    console.log("vertices[" + b + "]: " + vertices[b])

    // console.log("vertexColors[a]: " + vertexColors[a])
    console.log("vertices[" + c + "]: " + vertices[c])


    // console.log("vertexColors[a]: " + vertexColors[a])
    console.log("vertices[" + a + "]: " + vertices[a])

    // console.log("vertexColors[a]: " + vertexColors[a])
    console.log("vertices[" + c + "]: " + vertices[c])

    // console.log("vertexColors[a]: " + vertexColors[a])
    console.log("vertices[" + d + "]: " + vertices[d])


    colors.push(vertexColors[a]);
    points.push(vertices[a]);

    colors.push(vertexColors[a]);
    points.push(vertices[b]);

    colors.push(vertexColors[a]);
    points.push(vertices[c]);

    colors.push(vertexColors[a]);
    points.push(vertices[a]);

    colors.push(vertexColors[a]);
    points.push(vertices[c]);

    colors.push(vertexColors[a]);
    points.push(vertices[d]);

    // console.log("points:")
    // console.log(points)
    // console.log("colors:")
    // console.log(colors)
}


function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


//--------------------------------------------------


function init() {

    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 0.75, 0.75, 0.75, 1.0 );
    gl.enable( gl.DEPTH_TEST );

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );

    gl.useProgram( program );

    colorCube();

    // Load shaders and use the resulting shader program

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Create and initialize  buffer objects

    vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( colorLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );

    document.getElementById("slider0").onchange = function(event) {
        theta[0] = event.target.value;
    };
    document.getElementById("slider1").onchange = function(event) {
         theta[1] = event.target.value;
    };
    document.getElementById("slider2").onchange = function(event) {
         theta[2] =  event.target.value;
    };
    document.getElementById("slider3").onchange = function(event) {
        theta[3] =  event.target.value;
   };

   document.getElementById("Button5").onclick = function(){theta_cam += dr;};
   document.getElementById("Button6").onclick = function(){theta_cam -= dr;};
   document.getElementById("Button7").onclick = function(){phi += dr;};
   document.getElementById("Button8").onclick = function(){phi -= dr;};

   modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
   projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
   nMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    
    //gl.uniformMatrix4fv( gl.getUniformLocation(program, "projectionMatrix"),  false, flatten(projectionMatrix) );

    render();
}

function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}


function lowerArm() {
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    var instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)   );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}

function upperArm() {
    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}

function draw_segment_C() {
    var s = scale(C_WIDTH, C_HEIGHT, C_WIDTH);
    var instanceMatrix = mult(translate( 0.0, 0.5 * C_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // console.log("theta[base]:" + theta[Base])


    eye = vec3(radius*Math.sin(theta_cam)*Math.cos(phi),
        radius*Math.sin(theta_cam)*Math.sin(phi), radius*Math.cos(theta_cam));

    modelViewMatrix = lookAt(eye, at , up);
    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    nMatrix = normalMatrix(modelViewMatrix, true);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix)  ); // TODO: Necessary for camera movement?

    // TODO:
    // Is modifying this code to create a more complex figure, like an octopus/spider with lots of legs and joints,
    // "substantially the same" as the provided examples? Am I good to move forward with this idea?
    // Or back to the drawing board?

    // TODO:
    // For making an octopus/spider, we need each arm to be attached to different points
    // how do we do that?
    // If we add more parts they just keep getting concatenated to the previous segment.
    // Is this because the mv matrix has not been reset?
    // Is this possible using the instanced drawing idea or not?

    // TODO: Why is my camera rotation not working? It works without the instanced drawing but not with it.


    // gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

    modelViewMatrix = rotate(theta[Base], vec3(0, 1, 0 ));
    base();

    modelViewMatrix = mult(modelViewMatrix, translate(0.5 * BASE_WIDTH, 0.0, 0.0));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[LowerArm], vec3(0, 0, 1 )));
    //console.log("theta[LowerArm]:" + theta[LowerArm])
    lowerArm();

    // TODO: Is here where I would reset MVM?

    modelViewMatrix  = mult(modelViewMatrix, translate(-0.5 * BASE_WIDTH, 0.0, 0.0));
    modelViewMatrix  = mult(modelViewMatrix, rotate(theta[UpperArm], vec3(0, 0, 1)) );
    upperArm();

    // printm( translate(0.0, BASE_HEIGHT, 0.0));
    // printm(modelViewMatrix);



    // modelViewMatrix  = mult(modelViewMatrix, translate(0.0, C_HEIGHT, 0.0));
    // modelViewMatrix  = mult(modelViewMatrix, rotate(theta[segment_C], vec3(0, 0, 1)) );
    // draw_segment_C();

//printm(modelViewMatrix);

    requestAnimationFrame(render);
}
