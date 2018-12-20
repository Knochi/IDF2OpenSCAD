# IDF2OpenSCAD

this is a javascript using <a href=p5js.org> p5.js </a> library (rarely) to convert two files from IDF (Intermediate Data Format) to an editable OpenScad document. It adheres to <a href=https://www.simplifiedsolutionsinc.com/images/idf_v30_spec.pdf> Version 3.0 (from October 1996)  </a> which is still quite common.

<h1> Progress </h1>

<h2> Board, Panel File </h2>
<h3> Header </h3>
<h3> Board Outline </h3>
the board outline coordinates are put into an array. Wherever there is an arc it is translated into polygons in the .scad code. So the resolution the users sets via $fn, $fs or $fr is used. <br>

  <ul>
    <li> thickness -linear_extrude(thickness)
    <li> outline polygon - polygon([[x1,y1],[x2,y2],...,[xn,yn]])
    <li> embedd arcs in outline - via arcGen Function in openscad code
    <li> circles - tbd
    <li> cutouts -tbd
  </ul>

<h3> Drilled Holes </h3>
Drilled holes are substracted from the outline polygon before extrusion.
    <ul>
      <li> diameter - circle(dia)
      <li> coordinates - translate([x,y])
      <li> plating - tbd
      <li> associated part - tbd
      <li> hole type - if (type!=VIA) - vias filtered out because of performance reasons
      <li> owner - ignored
</ul>

<h3> Placement </h3>
Parts are placed at their respective coordinates with an extruded polygon created out of the part description file (.emp or .lib)
<ul>
  <li> package name - tbd
  <li> part number - tbd
  <li> redDes - tbd
  <li> coordinates and Offset - translate([x,y,Offset])
  <li> rotation Angle - rotate(angle)
  <li> side of the board - mirror([0,0,1])
  <li> status - tbd
  
<h3> other Outlines </h3>
<ul>
   <li> Panel Outline -tbd
   <li> Other Outline -tbd
</ul>
  
<h3> Areas </h3>
  <ul> 
    <li> Route Outline
    <li> Place Outline
    <li> Via Keepout
    <li> Place KeepOut
    <li> Place Group
    <li> Place Region
  </ul>

<h3> other </h3>
<ul>    
  <li> Notes
</ul>

<h3> library file </h3>

