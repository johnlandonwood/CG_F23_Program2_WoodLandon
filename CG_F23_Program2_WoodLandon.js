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
var lowerArmID = 1;
var upperArmID = 2;

// Parameters controlling the size of the Robot's arm
var BASE_HEIGHT      = 3.0;
var BASE_WIDTH       = 3.0;
var LOWER_ARM_HEIGHT = 5.0;
var LOWER_ARM_WIDTH  = 0.5;
var UPPER_ARM_HEIGHT = 5.0;
var UPPER_ARM_WIDTH  = 0.5;

// Shader transformation matrices

var modelViewMatrix;
var modelViewMatrixLoc;
var instanceMatrix;
var projectionMatrix;

// Array of rotation angles (in degrees) for each rotation axis

var numNodes = 3;
var numAngles = 3;
var angle = 0;
var theta= [0, 0, 0];


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

function initialize_nodes(ID) {
    var m = mat4(); // m is a model view matrix 


    switch(ID) {
        case baseID:
            m = rotate(theta[baseID], vec3(0, 1, 0 ));
            figure[baseID] = createNode(m, base, null, lowerArmID)
            //console.log(m)
            // console.log("figure[0]: ")
            // console.log(figure[0])
            break;
        case lowerArmID:
            m = mult(m, translate(0.0, BASE_HEIGHT, 0.0));
            m = mult(m, rotate(theta[lowerArmID], vec3(0, 0, 1 )));
            figure[lowerArmID] = createNode(m, lowerArm, upperArmID, null)
            // console.log("figure[1]: ")
            // console.log(figure[1])
            break;
        case upperArmID:
            m = mult(m, translate(0.0, LOWER_ARM_HEIGHT, 0.0));
            m = mult(m, rotate(theta[upperArmID], vec3(0, 0, 1)) );
            figure[upperArmID] = createNode(m, upperArm, null, null)
            // console.log("figure[2]: ")
            // console.log(figure[2])
            break;
    }


}

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

 function base() {
    var s = scale(BASE_WIDTH, BASE_HEIGHT, BASE_WIDTH);
    instanceMatrix = mult( translate( 0.0, 0.5 * BASE_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc,  false, flatten(t)  );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );
}

function lowerArm() {
    var s = scale(LOWER_ARM_WIDTH, LOWER_ARM_HEIGHT, LOWER_ARM_WIDTH);
    instanceMatrix = mult( translate( 0.0, 0.5 * LOWER_ARM_HEIGHT, 0.0 ), s);
    var t = mult(modelViewMatrix, instanceMatrix);
    gl.uniformMatrix4fv( modelViewMatrixLoc,  false, flatten(t)   );
    gl.drawArrays( gl.TRIANGLES, 0, NumVertices );

}

function upperArm() {
    var s = scale(UPPER_ARM_WIDTH, UPPER_ARM_HEIGHT, UPPER_ARM_WIDTH);
    instanceMatrix = mult(translate( 0.0, 0.5 * UPPER_ARM_HEIGHT, 0.0 ),s);
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
    document.getElementById("slider1").onchange = function(event) {
        theta[0] = event.target.value;
        initialize_nodes(baseID);
    };
    document.getElementById("slider2").onchange = function(event) {
         theta[1] = event.target.value;
         initialize_nodes(lowerArmID);
    };
    document.getElementById("slider3").onchange = function(event) {
         theta[2] =  event.target.value;
         initialize_nodes(upperArmID);
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
