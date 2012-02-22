function GetRandomVector(magnitude) {
    v = new float3(0,0,0);
    v.x = Math.random();
    v.y = Math.random();
    v.z = Math.random();
    
    v.Normalize();
    v.x = magnitude * v.x;
    v.y = magnitude * v.y;
    v.z = magnitude * v.z;
    return v;
}

/*
// Instead call v.Normalized();
function GetUnitVector(v) {
    u = new float3(0,0,0);
    var l = v.Length();
    if(l == 0)
        throw 'Zero vector';
    
    u.x = v.x/l;
    u.y = v.y/l;
    u.z = v.z/l;
    
    return u;
}

// Instead call v.Length();
function GetMagnitude(v) {
    return Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2) + Math.pow(v.z, 2));
}
*/
function GetLimitedVector(v, max, min) {
	var l = v.LengthSq();
	var maxmax = max*max;
	var minmin = min*min;
	if (l >= maxmax)
		return v.ScaledToLength(max);
	else if (l <= minmin)
		return v.ScaledToLength(min);
	else
		return v;
}

// Instead, use v.Mul(i);
/*
function VectorMult(v, i) {
    u = new float3(0,0,0);
    u.x = v.x*i;
    u.y = v.y*i;
    u.z = v.z*i;
    return u;
}
*/

// Instead, use v.Div(i);
/*
function VectorDiv(v, i) {
    if(i == 0) {
        return v;
    }
    u = new float3(0,0,0);
    u.x = v.x/i;
    u.y = v.y/i;
    u.z = v.z/i;
    return u;
}
*/

// Instead, use v1.Add(v2)
/*
function VectorSum(v1, v2) {
    u = new float3(0,0,0);
    u.x = v1.x + v2.x;
    u.y = v1.y + v2.y;
    u.z = v1.z + v2.z;
    return u;
}
*/

// Instead, use v1.Sub(v2)
/*
// v1 - v2
function VectorSub(v1, v2) {
    u = new float3(0,0,0);
    u.x = v1.x - v2.x;
    u.y = v1.y - v2.y;
    u.z = v1.z - v2.z;
    return u;
}
*/

// Instead, use print(v) or print(v.toString());
/*
function PrintVector(v) {
    print(v.x+' '+v.y+' '+v.z);
}
*/

function Get2DDistance(v1, v2) {
    return Math.sqrt(Math.pow((v1.x-v2.x),2) + Math.pow((v1.y-v2.y),2));
}

// Instead, use v1.Distance(v2)
/*
function GetDistance(v1, v2) {
    return Math.sqrt(Math.pow((v1.x-v2.x),2) + Math.pow((v1.y-v2.y),2) + Math.pow((v1.z-v2.z),2));
}
*/
