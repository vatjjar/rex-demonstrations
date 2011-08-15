function GetRandomVector(magnitude) {
    v = new Vector3df();
    v.x = Math.random();
    v.y = Math.random();
    v.z = Math.random();
    
    v = GetUnitVector(v);
    v.x = magnitude * v.x;
    v.y = magnitude * v.y;
    v.z = magnitude * v.z;
    return v;
}


function GetUnitVector(v) {
    u = new Vector3df();
    var l = GetMagnitude(v);
    if(l == 0)
        throw 'Zero vector';
    
    u.x = v.x/l;
    u.y = v.y/l;
    u.z = v.z/l;
    
    return u;
}

function GetMagnitude(v) {
    return Math.sqrt(Math.pow(v.x,2) + Math.pow(v.y,2) + Math.pow(v.z, 2));
}

function GetLimitedVector(v, max, min) {
    var l = GetMagnitude(v);
    if(l > max) {
        v = GetUnitVector(v);
        v = VectorMult(v, max);
    }
    else if (min != undefined && l < min) {
        v = GetUnitVector(v);
        v = VectorMult(v, min);
    }
    return v;
}

function VectorMult(v, i) {
    u = new Vector3df();
    u.x = v.x*i;
    u.y = v.y*i;
    u.z = v.z*i;
    return u;
}

function VectorDiv(v, i) {
    if(i == 0) {
        return v;
    }
    u = new Vector3df();
    u.x = v.x/i;
    u.y = v.y/i;
    u.z = v.z/i;
    return u;
}

function VectorSum(v1, v2) {
    u = new Vector3df();
    u.x = v1.x + v2.x;
    u.y = v1.y + v2.y;
    u.z = v1.z + v2.z;
    return u;
}

// v1 - v2
function VectorSub(v1, v2) {
    u = new Vector3df();
    u.x = v1.x - v2.x;
    u.y = v1.y - v2.y;
    u.z = v1.z - v2.z;
    return u;
}

function PrintVector(v) {
    print(v.x+' '+v.y+' '+v.z);
}

function Get2DDistance(v1, v2) {
    return Math.sqrt(Math.pow((v1.x-v2.x),2) + Math.pow((v1.y-v2.y),2));
}

function GetDistance(v1, v2) {
    return Math.sqrt(Math.pow((v1.x-v2.x),2) + Math.pow((v1.y-v2.y),2) + Math.pow((v1.z-v2.z),2));
}