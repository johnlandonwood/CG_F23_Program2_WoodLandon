"use strict";

var canvas, gl, program;

var NumVertices = 36; //(6 faces)(2 triangles/face)(3 vertices/triangle)

var points = [];
var colors = [];

var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
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



// IDs for each segment
var baseID = 0;
var tentacle_1_ID = 1;
var tentacle_2_ID = 2;
var tentacle_3_ID = 3;
var tentacle_4_ID = 4;
var tentacle_5_ID = 5;
var tentacle_6_ID = 6;
var tentacle_7_ID = 7;
var tentacle_8_ID = 8;

// Parameters controlling the size of the Robot's arm
var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 2.0;
var TENTACLE_HEIGHT = 4.0;
var TENTACLE_WIDTH = 0.5;

// var LOWER_ARM_HEIGHT = 5.0;
// var LOWER_ARM_WIDTH  = 0.5;


// var UPPER_ARM_HEIGHT = 5.0;
// var UPPER_ARM_WIDTH  = 0.5;




// Shader transformation matrices

var modelViewMatrix;
var modelViewMatrixLoc;
var instanceMatrix;
var projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var numNodes = 9;
var numAngles = 9;
var angle = 0;
var theta= [0, -60, 60, -60, 60, -60, 60, -60, 60];


var stack = [];
var figure = [];


var vBuffer, cBuffer;


function createNode(transform, render, sibling, child){
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}

function quad(a,  b,  c,  d) {
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
}


function colorCube() {
    quad( 1, 0, 3, 2);
    quad( 2, 3, 7, 6);
    quad( 3, 0, 4, 7);
    quad( 6, 5, 1, 2);
    quad( 4, 5, 6, 7);
    quad( 5, 4, 0, 1);
}


// Function to traverse the tree relationship of figure and render parts in order
function traverse(ID) {
    if (ID == null) {
        return;
    }

    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[ID].transform);
    figure[ID].render();

    if(figure[ID].child != null) {
        traverse(figure[ID].child);
    }

    modelViewMatrix = stack.pop();

    if(figure[ID].sibling != null) {
        traverse(figure[ID].sibling);
    }
 }

// Set axes of rotation for each node
function initialize_nodes(ID) {
    var m = mat4();

    // Axes of rotation set in these functions
    switch(ID) {
        case baseID:
            m = rotate(theta[baseID], vec3(0, 1, 0 ));
            figure[baseID] = createNode(m, base, null, tentacle_1_ID)
            break;
        case tentacle_1_ID:
            m = mult(m, rotate(theta[tentacle_1_ID], vec3(0, 0, 1 ))); // z
            figure[tentacle_1_ID] = createNode(m, tentacle_1, tentacle_2_ID, null) // TODO: Each tentacle will have a "lower" child
            break;
        case tentacle_2_ID:
            m = mult(m, rotate(theta[tentacle_2_ID], vec3(0, 0, 1)) ); 
            figure[tentacle_2_ID] = createNode(m, tentacle_2, tentacle_3_ID, null)
            break;
        case tentacle_3_ID:
            m = mult(m, rotate(theta[tentacle_3_ID], vec3(1, 0, 0)) ); // x
            figure[tentacle_3_ID] = createNode(m, tentacle_3, tentacle_4_ID, null)
            break;
        case tentacle_4_ID:
            m = mult(m, rotate(theta[tentacle_4_ID], vec3(1, 0, 0)) );
            figure[tentacle_4_ID] = createNode(m, tentacle_4, tentacle_5_ID, null)
            break;
        case tentacle_5_ID:
            m = mult(m, rotate(theta[tentacle_5_ID], vec3(1, 0, 1)) ); // xz
            figure[tentacle_5_ID] = createNode(m, tentacle_5, tentacle_6_ID, null)
            break;
        case tentacle_6_ID:
            m = mult(m, rotate(theta[tentacle_6_ID], vec3(1, 0, 1)) );
            figure[tentacle_6_ID] = createNode(m, tentacle_6, tentacle_7_ID, null)
            break;
        case tentacle_7_ID:
            m = mult(m, rotate(theta[tentacle_7_ID], vec3(-1, 0, 1)) ); // -xz 
            figure[tentacle_7_ID] = createNode(m, tentacle_7, tentacle_8_ID, null)
            break;
        case tentacle_8_ID:
            m = mult(m, rotate(theta[tentacle_8_ID], vec3(-1, 0, 1)) ); 
            figure[tentacle_8_ID] = createNode(m, tentacle_8, null, null)
            break;
    }
    


}

// Scales and translations done in these functions
function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    instanceMatrix = mult( translate( 0.0, 0.0, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_1() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult( translate( 0.0, -3.0, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)   );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_2() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult(translate( 0.0, -3.0, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_3() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult(translate( 0.0, -3.0, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_4() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult(translate( 0.0, -3.0, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_5() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult(translate( 0.0, -3.0, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_6() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult(translate( 0.0, -3.0, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_7() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult(translate( 0.0, -3.0, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function tentacle_8() {
    var s = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH);
    instanceMatrix = mult(translate( 0.0, -3.0, 0.0 ),s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}




function init() {

    // Initialize program
    canvas = document.getElementById( "gl-canvas" );
    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );
    gl.enable( gl.DEPTH_TEST );
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Initializes points and colors
    colorCube();

    // Create and initialize buffer objects
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


    // Event listeners
    document.getElementById("slider0").onchange = function(event) {
        theta[0] = event.target.value;
        initialize_nodes(baseID);
        console.log(theta)
    };
    document.getElementById("slider1").onchange = function(event) {
         theta[1] = event.target.value;
         initialize_nodes(tentacle_1_ID);
         console.log(theta)
    };
    document.getElementById("slider2").onchange = function(event) {
         theta[2] =  event.target.value;
         initialize_nodes(tentacle_2_ID);
         console.log(theta)
    };
    document.getElementById("slider3").onchange = function(event) {
        theta[3] = event.target.value;
        initialize_nodes(tentacle_3_ID);
        console.log(theta)
   };
   document.getElementById("slider4").onchange = function(event) {
        theta[4] = event.target.value;
        initialize_nodes(tentacle_4_ID);
        console.log(theta)
    };
    document.getElementById("slider5").onchange = function(event) {
        theta[5] = event.target.value;
        initialize_nodes(tentacle_5_ID);
        console.log(theta)
    };
    document.getElementById("slider6").onchange = function(event) {
        theta[6] = event.target.value;
        initialize_nodes(tentacle_6_ID);
        console.log(theta)
    };
    document.getElementById("slider7").onchange = function(event) {
        theta[7] = event.target.value;
        initialize_nodes(tentacle_7_ID);
        console.log(theta)
    };
    document.getElementById("slider8").onchange = function(event) {
        theta[8] = event.target.value;
        initialize_nodes(tentacle_8_ID);
        console.log(theta)
    };


    // Initialize matrices and bind uniforms
    instanceMatrix = mat4();
    projectionMatrix = ortho(-10, 10, -10, 10, -10, 10);
    modelViewMatrix = mat4();
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "uModelViewMatrix"), false, flatten(modelViewMatrix)  );
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "uProjectionMatrix"), false, flatten(projectionMatrix)  );
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix")
    

    for(i = 0; i < numNodes; i++) {
        initialize_nodes(i);
    } 


    render();
}

for(var i = 0; i < numNodes; i++)  {
    figure[i] = createNode(null, null, null, null);
}

init();

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    traverse(baseID);
    requestAnimationFrame(render);
}
