//raspi display has 800x480px
//pixels are non-square if you config the display to be 800x444 it's ok

// 800px /155mm = 5.16
// 480px /  86mm = 5.58
//
// 5.16 / 5.58 = 0.9247
//
// 480px * 0.9247 = 444px
var board, library, shell;
var pcbOutline;

function preload(){
  board=loadStrings("data/ain.idf");
  library=loadStrings("data/ain.lib");
  shell=loadStrings("data/IDFshell.scad");
}

function setup() {
  //noCanvas();
  noLoop();
  // put setup code here
  // var cnv = createCanvas(windowWidth, windowHeight);
  // cnv.style('display','block');
  inputIDF=new Lexer(board, library);
  outputSCAD=new Parser(shell);
}

function draw() {
  // put drawing code here
  // background(0);
  // fill(200,100,30);
  // text(regMap.name,10,50);
  //navBtn.display();
  inputIDF.analyzeBoard();
  inputIDF.analyzeLibrary();
  inputIDF.output();

  /*outputSCAD.generateSCAD("output",
                           inputIDF.outlineVerts,
                           inputIDF.drilledHoles,
                           inputIDF.PCBThick,
                           inputIDF.placedParts,
                           inputIDF.components);*/
  outputSCAD.generateSCAD("output",
                          inputIDF.pcbData,
                          inputIDF.components);
}


class Lexer{

  constructor(board,library){
    this.rawData=board;
    this.rawLib=library;

    this.unit;

    this.PCBThick=0;

    // -- Outline --
    this.outlineArcs=0;
    this.outlineVerts=[];
    //this.outline=[];

    // -- Drilled Holes --
    this.drilledHoles=[]; //array of hole Objects

    // -- Placement --
    this.placedParts=[]; //array of part Objects

    // -- Component Library
    this.components=[];

    //this.compOutlineArcs=[];
  }


  analyzeLibrary(){

    //each components starts with .ELECTRICAL and end with .END_ELECTRICAL


    for (var i=0;i<this.rawLib.length;i++){
      if (match(this.rawLib[i],"\\.ELECTRICAL") != null){
        i++;
        var record2 = split(this.rawLib[i], " ");
        i++;

        var compOutlineVerts=[];
        var compOutlineCircle=false; //is the Outline a Circle?
        var arcCnt=0;
        var component = new Component(record2[0]);

        while  (match(this.rawLib[i],"\\.END_ELECTRICAL") == null){ //unless the next line isn't the end
        var record3 = split(this.rawLib[i], " ");
        if ((int(record3[3])) && !(int(record3[3])==360)) {
          arcCnt++; //increment ArcCounter
        }
        else if (int(record3[3])==360)
          compOutlineCircle=true;

        compOutlineVerts.push(new Vert(int(record3[0]), //label
                                         float(record3[1]),  //x
                                         float(record3[2]),  //y
                                         float(record3[3])   //angle
                                          ));
         i++;
         if (i>this.rawLib.length){
           print("Error, EOF");
           break;
         }
       } //while not end

        component.num=record2[1]; //number
        component.unit=record2[2]; //unit
        if (float(record2[3])) //if there is a height
          component.height=float(record2[3]); //height
        component.outline=compOutlineVerts;  //outline
        component.outlineArcs=arcCnt;
        component.outlineCircle=compOutlineCircle;

        this.components.push(component);

      }
    }
  }

  analyzeBoard(){
    var drillStart, drillEnd;
    var placeStart, placeEnd;
    var outLineStart, outLineEnd;
    var thick, unit;
    var arcCnt =0;

    for (var i=0; i<this.rawData.length; i++){
      if (match(this.rawData[i],"\\.HEADER") != null){
        this.unit=split(this.rawData[i+2], " ")[1];
      }
      if (match(this.rawData[i],"\\.BOARD_OUTLINE") != null){
        outLineStart=i;
        this.PCBThick=float(this.rawData[i+1]);
      }

      if (match(this.rawData[i],"\\.END_BOARD_OUTLINE") != null)
        outLineEnd=i;

      if (match(this.rawData[i],"\\.DRILLED_HOLES") != null){
        drillStart=i;
      }
      if (match(this.rawData[i],"\\.END_DRILLED_HOLES") != null){
        drillEnd=i;
      }
      if (match(this.rawData[i],"\\.PLACEMENT") != null){
        placeStart=i;
      }
      if (match(this.rawData[i],"\\.END_PLACEMENT") != null){
        placeEnd=i;
      }

      if ((outLineStart) && !(outLineEnd)){ //in the Outline Section
        var row= split(this.rawData[i]," ");
        if (row.length==4){
          if ((int(row[3])) && !(int(row[3])==360)) {
            arcCnt++; //increment ArcCounter
          }
          this.outlineVerts.push(new Vert(int(row[0]), //label
                                           float(row[1]),//x
                                           float(row[2]),//y
                                           float(row[3])));//angle

          //this.outline.push(new Coordinate(float(row[1]),float(row[2])));
          }

      }
      if ((drillStart) && !(drillEnd)){ //in the drilled holes Section
        var row= split(this.rawData[i]," ");
        if (row.length==7){//check for correct length
          this.drilledHoles.push(new DrilledHole(float(row[0]), //dia
                                                 float(row[1]), //x
                                                 float(row[2]), //y
                                                 row[3], //plate
                                                 row[4], //part
                                                 row[5] //type
                                               ));
         }
      }
    } //end for loop


    //get the parts
    for (var i=placeStart+1;i<placeEnd;i=i+2){//two lines per part
      var record1=split(this.rawData[i]," ");
      var record2=split(this.rawData[i+1]," ");
      //print(record1[0]);
      this.placedParts.push(new PlacedPart(record1[0], //name
                                           record1[1], //number
                                           record1[2], //refDesignator
                                           float(record2[0]), //xPos
                                           float(record2[1]), //yPos
                                           float(record2[2]), //zPos
                                           float(record2[3]), //rot
                                           record2[4],  //side
                                           record2[5]));  //status
    }
    // create and fill the PCBData Object
    this.pcbData= new PCBData(this.PCBThick,this.unit);
    this.pcbData.outline= this.outlineVerts;
    this.pcbData.outlineArcs = arcCnt;
    this.pcbData.holes= this.drilledHoles;
    this.pcbData.parts= this.placedParts;

  }

  output(){
    print("Found an Outline with " + this.outlineVerts.length + " coordinates.");
    //print("The Outline contains " + this.outlineArcs.length + " arcs.");
    print("PCBThickness is " + this.PCBThick + " " + this.unit);
    print("Found " + this.drilledHoles.length + " drilled Holes");
    print("Found " + this.placedParts.length + " placed Parts");
    print("Found " + this.components.length + " unique components");
    print("Example Component No1 " + this.components[1].name);
  }

} //end of lexxer class


class Parser{
  constructor(shell){
    this.shell=shell; //load the shell as string
  }

  //generateSCAD(filename, pcbOutline, pcbHoles, pcbThick, placedParts, componentLib){
  generateSCAD(filename, pcbData, componentLib){
    var headerSec;
    var outlineSec;
    var compSec;
    var footerSec;
    var footerStart=8;

    var codeLine;

    this.pcb=pcbData;
    this.components=componentLib;

    headerSec = this.shell.slice(0,1);
    footerSec = this.shell.slice(footerStart,this.shell.length);

    outlineSec=   "pcbOutline =" +
                  this.compileOutline(this.pcb) +
                  ";\r\n" +
                  "\r\n" +
                  "pcbThick="+this.pcb.thick+";\r\n"+
                  "color(\""+this.pcb.color+"\") " +
                  "linear_extrude(pcbThick) " +
                  "difference(){\r\n" +
                  "  polygon(pcbOutline);\r\n" +
                  this.compileHoles() +
                  "}\r\n";

    compSec=this.compileParts();

    this.output = headerSec.concat(outlineSec).concat(compSec).concat(footerSec);
    saveStrings(this.output, filename,"scad");
  }



  compilePartOutline(partName){ //query for a part and create it's outline
    var codeLine = "";
    for (var i=0;i<this.components.length;i++){
      if (this.components[i].name == partName){

        //if (this.components[i].height<=0) this.components[i].height=0.05;

        codeLine = "linear_extrude(" +
                   this.components[i].height +
                   ")\r\n";
        if (this.components[i].outlineCircle){
          var p1= "[" +
                  this.components[i].outline[0].x +
                  ","+
                  this.components[i].outline[0].y +
                  "]";
          var p2= "[" +
                  this.components[i].outline[1].x +
                  ","+
                  this.components[i].outline[1].y +
                  "]";
          codeLine += "  circle(d=norm(" + p1 + "," + p2 + "));\r\n";
        }

        else {
          codeLine += "  polygon(" + this.compileOutline(this.components[i]);
          codeLine += ");\r\n"
        }
      }
    }
    return codeLine;
  }

  compileOutline(targetObj){
    var codeLine="";
    var x1,y1,x2,y2,angle;
    //last coordinate is same then first

    if (targetObj.outlineArcs) //need the concat operator, if we have arcs
      codeLine += "concat(\r\n";
    for (var i=0;i<targetObj.outline.length-1;i++){
      x1=targetObj.outline[i].x;
      y1=targetObj.outline[i].y;
      x2=targetObj.outline[i+1].x;
      y2=targetObj.outline[i+1].y;
      angle=targetObj.outline[i+1].angle;

      //Arc
      if ((i<(targetObj.outline.length-2)) && (targetObj.outline[i+1].angle != 0)) {
        codeLine += "  arcGen([" + x1 +","+ y1 +"]," +
                             "["+ x2 +","+ y2 +"],"+
                                + angle +
                               "),\r\n";
        if ((i<(targetObj.outline.length-3)) && (targetObj.outline[i+2].angle == 0)) {
          i++;
          codeLine+="  [";
        }
      }
      //straight line
      else {
        if (i==0)
          codeLine += "  [";
        //else codeLine += "  ";
        codeLine = codeLine + "[" + x1 + "," + y1 +"]";
        if ((i<(targetObj.outline.length-3)) && (targetObj.outline[i+2].angle != 0))
          codeLine+="]";
        if (i!=targetObj.outline.length-2)
          codeLine += ",\r\n"; //add CrLf at each line except last
        else
          codeLine += "]\r\n";
      }

    }
    if (targetObj.outlineArcs) //close the concat operator, if we have arcs
      codeLine += ")";
    return codeLine;
  }

  compileHoles(){
    var codeLine = "";
    var showVias = false;
    for (var i=0;i<this.pcb.holes.length;i++){
      if (showVias || (this.pcb.holes[i].type != "VIA"))  {
      codeLine+= "  translate([" +
                  this.pcb.holes[i].x + "," +
                  this.pcb.holes[i].y + "]) circle(d="+
                  this.pcb.holes[i].dia + ");\r\n";
                }
    }
    return codeLine;
  }

  compileParts(){
    var codeLine = "";
    for (var i=0;i<this.pcb.parts.length;i++){

      codeLine += "color(\"" + this.pcb.parts[i].color +"\")"
      codeLine += "translate(["+ this.pcb.parts[i].x + "," +
                                 this.pcb.parts[i].y + "," +
                                 this.pcb.parts[i].z;

      if (this.pcb.parts[i].side == "TOP") //if on TOP add PCB thickness
        codeLine+= "+ pcbThick]) ";


      else //else mirror to the other side
        codeLine+="]) mirror([0,0,1]) ";

      if (this.pcb.parts[i].rot)
          codeLine+="rotate(" + this.pcb.parts[i].rot + ") ";

      codeLine+=this.compilePartOutline(this.pcb.parts[i].name);


    } //parts

    return codeLine;

  }

}//class


// --- helper Objects ---
class Arc{
  constructor(line,angle){
    this.line=line;
    this.angle=angle;
  }
}

class Point{
  constructor(line,label,xPos,yPos){
    this.line=line
    this.x=xPos;
    this.y=yPos;
    this.label=label
  }
}

class Vert{
  constructor(label,xPos,yPos,angle){
    this.angle=angle;
    this.x=xPos;
    this.y=yPos;
    this.label=label;
  }
}

class Coordinate{
  constructor(xPos,yPos){
    this.x=xPos;
    this.y=yPos;
  }
}

class DrilledHole{
  constructor(diameter,xPos,yPos,plating,part,type,owner){
    this.dia=diameter;
    this.x=xPos;
    this.y=yPos;
    this.plate=plating;
    this.part=part;
    this.type=type;
    this.owner=owner;
  }
}

class PlacedPart{
  constructor(name,number,refDesignator,xPos,yPos,zOffset,zRotation,side,status){
    this.name=name;
    this.num=number;
    this.refDes=refDesignator;
    this.x=xPos;
    this.y=yPos;
    this.z=zOffset;
    this.rot=zRotation;
    this.side=side;
    this.status=status;
    this.color="grey";
  }
}

class Component{
  constructor(name){
    this.name=name;
    this.num="none";
    this.unit="MM";
    this.height=0.05;
    this.outline=[];
    this.outlineArcs=0;
    this.outlineCircle=false;

  }
}

// the Master Object holding the whole PCB (relevant) data
class PCBData{
  constructor(pcbThickness,unit){
    this.thick=pcbThickness; //thickness of the PCB
    this.unit=unit;
    this.holes=[];
    this.parts=[];
    this.outline=[];
    this.outlineArcs=0;
    this.color="green";
  }
}



function parseOutline(){
  var isOutline=false;
  var thick=0;
  var point;
  var polygon;
  var codeLine="linear_extrude(";

  for (var i=0; i<board.length; i++){
      if (match(board[i],"\\.BOARD_OUTLINE") != null){
        isOutline=true;
        thick=board[i+1];
        i++;
        codeLine = codeLine + thick + ")" + "\n\r" + "  polygon([\n\r";
      }
      else if (match(board[i],"\\.END_BOARD_OUTLINE") != null){
        isOutline=false;
      }
      else if (isOutline){ //building the outline
        point=split(board[i]," "); //split line into blocks
        nextPoint=split(board[i+1]," "); //look into next row
        if (match(board[i+1],"\\.END_BOARD_OUTLINE")){
          nextPoint[3]=0;
        }
        if (nextPoint[3]==0){ //no Arc
          codeLine = codeLine + "    ["+point[1]+","+point[2]+"],\n\r"; //append x,y coordinates
        }
        else{
          codeLine = codeLine + "    ["+"arc"+","+"arc"+"],\n\r"; //append x,y coordinates
        }

      }
  }
    print(codeLine.slice(0,codeLine.length-3)+"]);"); //remove "\n\r,"
} //end of parser function

class Btn{
  constructor(xPos, yPos){
    this.frameThck=2; //frame thickness
    this.frameCol="grey"; //frame color
    this.x = xPos;
    this.y = yPos;
    this.xSize=180;
    this.ySize=160;
  }

  display(){
    push();
    noFill();
    stroke(this.frameCol);
    strokeWeight(this.frameThck);
    translate(this.x,this.y);
    rect(0,0,this.xSize,this.ySize);
  }
}
