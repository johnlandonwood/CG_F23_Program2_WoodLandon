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
var tentacle_1_lower_ID = 9;
var tentacle_2_lower_ID = 10;

// Parameters controlling the size of the Robot's arm
var BASE_HEIGHT      = 2.0;
var BASE_WIDTH       = 2.0;
var TENTACLE_HEIGHT = 4.0;
var TENTACLE_WIDTH = 0.5;

var LOWER_TENTACLE_HEIGHT = 1.5;
var LOWER_TENTACLE_WIDTH = 0.5;

// Shader transformation matrices
var modelViewMatrix;
var modelViewMatrixLoc;
var instanceMatrix;
var projectionMatrix;

// Number of nodes in the tree (one node for each instance of unit cube to be rendered)
var numNodes = 11;

// Array of rotation angles (in degrees) for each rotation axis
var theta= [0, -60, 60, -60, 60, -60, 60, -60, 60, 0, 0];

// Stack array and figure array of nodes
var stack = [];
var figure = [];

// Scale factor matrices for each type of segment
var base_scale = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH)
var tentacle_scale = scale(TENTACLE_WIDTH, TENTACLE_HEIGHT, TENTACLE_WIDTH)
var lower_tentacle_scale = scale(LOWER_TENTACLE_WIDTH, LOWER_TENTACLE_HEIGHT, LOWER_TENTACLE_WIDTH)

// Vertex and color buffers
var vBuffer;
var cBuffer;

// Camera variables
var radius = 1.0;
var theta_cam = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0)

// Function to create a node representing a segment
function createNode(transform, render, sibling, child){
    var node = {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }
    return node;
}

// Function to render and color a quad
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

// Function to create the base cube used as model for other instances
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
            // m = mult( translate( 0.0, -3.0, 0.0 ), m);
            m = mult(m, rotate(theta[tentacle_1_ID], vec3(0, 0, 1 ))); // z
            figure[tentacle_1_ID] = createNode(m, tentacle_1, tentacle_2_ID, tentacle_1_lower_ID)
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

        // Lower parts of tentacles 
        case tentacle_1_lower_ID:
            // m = translate(0.0, 0, 0.0); // maybe -3.0?
            // m = mult(m, rotate(theta[tentacle_1_lower_ID], vec3(0, 0, 1)) ); 
            figure[tentacle_1_lower_ID] = createNode(m, tentacle_1_lower, null, null)
            // console.log("tentacle 1 lower:")
            // console.log(m)
            break;
    }

}

// in robotarm:
// parent:
    // translate into position
    // set rotation axis
    // scale
    // set instanceMatrix to mult(translate, scale)
    // instanceMatrix = mult(modelView, instanceMatrix)
    // set uniform
    // draw

// child:
    // mvm = mult(mvm, translate into position)
    // mvm = mult(mvm, set rotation axis)
    // set instanceMatrix to mult(translate, scale)
    // instanceMatrix = mult(mvm, instanceMatrix)
    // set uniform 
    // draw
    

// Scales and translations done in these functions
function base() {
    instanceMatrix = mult(translate(0.0, 0.0, 0.0), base_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

// scale, translate, rotate, translate again to where it needs to be

function tentacle_1() {
    // m = mult(m, rotate(theta[tentacle_1_ID], vec3(0, 0, 1 ))); // z
    // instanceMatrix = mult(instanceMatrix, rotate(theta[tentacle_1_ID], vec3(0,0,1)))
    // instanceMatrix = mult(modelViewMatrix, translate(0.0, -3.0, 0.0)) // Translate into position
    // instanceMatrix = mult(instanceMatrix, tentacle_scale) // Scale
    // gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);

    // instanceMatrix = mult(mat4(), figure[tentacle_1_ID])
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_2() {
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_3() {
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_4() {
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_5() {
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_6() {
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_7() {
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_8() {
    instanceMatrix = mult(translate(0.0, -3.0, 0.0), tentacle_scale);
    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    // gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

function tentacle_1_lower() {    
    instanceMatrix = mult(modelViewMatrix, translate(0.0, -5.5, 0.0))
    instanceMatrix = mult(instanceMatrix, rotate(theta[tentacle_1_lower_ID], vec3(0, 0, 1)));
    instanceMatrix = mult(instanceMatrix, lower_tentacle_scale);


    instanceMatrix = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(instanceMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
}

// in figure:
    // upper:
        // case:
            // translate to position
            // set rotation axis
            // createNode
        // function:
            // translate (0, 0.5 * height, 0)
            // scale (width, height, width)
            // set uniform
            // draw
    // lower: 
        // case:
            // translate to position
            // set rotation axis
            // createnode
        // function:
            // translate (0, 0.5 * height, 0)
            // scale (width, height, width)
            // set uniform
            // draw

// in mine:
    // upper:
        // case:
            // set rotation axis
            // createNode
        // function:
            // scale(width, height, width)
            // translate (0, -3, 0)
            // set uniform 
            // draw
    // lower:
        // case:
            // set rotation axis
            // createNode
        // function:
            // scale(width, height, width)
            // translate(0, -5.5, 0)
            // set uniform
            // draw






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
        //  tentacle_1();
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
    document.getElementById("slider9").onchange = function(event) {
        theta[9] = event.target.value;
        initialize_nodes(tentacle_1_lower_ID);
        console.log(theta)
    };
    document.getElementById("Button1").onclick = function(){theta_cam += dr;};
    document.getElementById("Button2").onclick = function(){theta_cam -= dr;};
    document.getElementById("Button3").onclick = function(){phi += dr;};
    document.getElementById("Button4").onclick = function(){phi -= dr;};


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

    var eye = vec3(radius*Math.sin(theta_cam)*Math.cos(phi),
                    radius*Math.sin(theta_cam)*Math.sin(phi),
                    radius*Math.cos(theta_cam));

    modelViewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    traverse(baseID);
    requestAnimationFrame(render);
}


// TODO: Add octopus eyes; maybe as two additional cubes rendered to clip slightly outside the side of the base. Colored black?
// TODO: Add mesh