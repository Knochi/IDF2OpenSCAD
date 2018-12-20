# IDF2OpenSCAD

this is a javascript using p5.js library (rarely) to convert two files from IDF (Intermediate Data Format) to an editable OpenScad document. It adheres to <a href=https://www.simplifiedsolutionsinc.com/images/idf_v30_spec.pdf> Version 3.0 (from October 1996)  </a> which is still quite common.

<h1> Progress </h1>

<h2> Header </h2>
<h2> Board Outline </h2>
the board outline coordinates are put into an array. Wherever there is an arc it is translated into polygons in the .scad code. So the resolution the users sets via $fn, $fs or $fr is used. <br>

  <ul>
    <li> thickness -linear_extrude(thickness)
    <li> outline polygon - polygon([[x1,y1],[x2,y2],...,[xn,yn]])
    <li> embedd arcs in outline - via arcGen Function in openscad code
    <li> circles - tbd
    <li> cutouts -tbd
  </ul>

<h2> Drilled Holes </h2>
Drilled holes are substracted from the outline polygon before extrusion.
    <ul>
      <li> diameter - circle(dia)
      <li> coordinates - translate([x,y])
      <li> plating - tbd
      <li> associated part - tbd
      <li> hole type - if (type!=VIA) - vias filtered out because of performance reasons
      <li> owner - ignored
</ul>

<h2> Placement </h2>

<h2> other Outlines </h2>
<ul>
   <li> Panel Outline -tbd
   <li> Other Outline -tbd
</ul>
  
<h2> Areas </h2>
  <ul> 
    <li> Route Outline
    <li> Place Outline
    <li> Via Keepout
    <li> Place KeepOut
    <li> Place Group
    <li> Place Region
  </ul>

<h2> other </h2>
    
  <li> Notes
  
</ul>
