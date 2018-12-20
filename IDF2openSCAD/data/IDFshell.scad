/* This is the shell for the IDF2OpenSCAD JS Parser */

//x and y Coordinates of outline polygon
pcbOutline=[]; 

linear_extrude() 
  difference(){
    polygon(pcbOutline);
    translate() circle();
  }


function arcGen(P1,P2, angle, iter=0, result=[])=
  let (
    dist=norm(P1-P2),
    arcRadius= (P1.x<=P2.x) ? dist/(2*sin(-angle/2)) : dist/(2*sin(+angle/2)), //radius of the Arc
    fragments=getFragmentsFromR(arcRadius), //number of fragmets to draw the arc with resulting from fn,
    alpha1= (P1.x<=P2.x) ? (180 + angle)/2 : (180 - angle)/2,
    alpha2=asin((P1.y-P2.y)/dist),
    beta=alpha2+alpha1-90,   
    Mx=(P1.x<=P2.x) ? P1.x - sin(beta)*arcRadius : P1.x + sin(beta)*arcRadius,
    My=P1.y - cos(beta)*arcRadius,
    M=[Mx,My],
    //result = (result==[]) ? [M] : result, //initialise with M
    angOffset=(P1.x<=P2.x) ? 180-alpha1 - alpha2 : alpha1 +alpha2,
  
    x = arcRadius * cos(angOffset+angle/fragments*iter),
    y = arcRadius * sin(angOffset+angle/fragments*iter),
    
    steps = ceil(fragments * abs(angle)/360), // abs(($fn/360)*angle), //using ceiling function helps sometimes but not everytime
    stepSize = fragments/steps
  )
  (iter<=fragments) ? arcGen(P1,P2,angle,iter+stepSize, concat(result,[M+[x,y]])):result;
    
function getFragmentsFromR(r)= 
  ($fn>0) ? $fn : ceil(max(min(360/$fa,r*2*PI/$fs),5));