 // initial seeds
const rootSeed = [0x5A4A,0x0248,0xB753]

s0 = rootSeed[0]
s1 = rootSeed[1]
s2 = rootSeed[2]

const twoCharTokens = ["AL","LE","XE","GE","ZA","CE","BI","SO","US","ES","AR","MA","IN","DI","RE","A","ER","AT","EN","BE","RA","LA","VE","TI","ED","OR","QU","AN","TE","IS","RI","ON"]
const govTypes = ["Anarchy","Feudal","Multi-government","Dicatorship","Communist","Confederacy","Democracy","Corporate State"]
const ecoTypes = ["Rich Industrial", "Average Industrial", "Poor Industrial", "Mainly Industrial", "Mainly Agricultural", "Rich Agricultural", "Average Agricultural", "Poor Agricultural"]
const speTypes = [["Large ", "Fierce ", "Small "], ["Green ", "Red ", "Yellow ", "Blue ", "Black ", "Harmless "], ["Slimy ", "Bug-Eyed ", "Horned ", "Bony ", "Fat ", "Furry "], ["Rodents", "Frogs", "Lizards", "Lobsters", "Birds", "Humanoids", "Felines", "Insects"]]

// allow higher dimensional arrays
//makeArray = (n, cb) =>
//    [...Array(n).keys()]
//    .map(i => cb ? cb(i) : i)
//  makeMatrix = ([head, ...tail], cb, pos) =>
//    head ? makeArray(head, i => makeMatrix(
//     tail, cb, [...(pos || []), i]
//    )) : cb ? cb(pos) : 0


var sys = []

var galDisp = 0
var sysDisp
var sysCen
var shortRange = false

const canvas = document.getElementById('galCanvas');
const ctx = canvas.getContext('2d');
ctx.fillStyle = "yellow ";
mW = canvas.width
mH = canvas.height
mC = canvas.width / 256
const title = document.getElementById("title")
const poiSys = document.getElementById("pointSystem")
const sysDatScr = document.getElementById("sysDatScr")
const sysDatTitle = document.getElementById("sysDatTitle")
const sysDatText = document.getElementById("sysDatText")


sysDatText.innerHTML = window.visualViewport.width


const nextGalBut = document.getElementById("nextGal")




systemSelected = false
for (g = 0; g < 8; g++){

    g0 = s0
    g1 = s1
    g2 = s2 

    sys[g] = []
                                              

    for (s = 0; s < 256; s++){

 
        sys[g][s] = sysDat(s0,s1,s2)



        twist()
        twist()
        twist()
        twist()
    }

    s0 = (rot8(hi(g0)) << 8) + rot8(lo(g0))
    s1 = (rot8(hi(g1)) << 8) + rot8(lo(g1))
    s2 = (rot8(hi(g2)) << 8) + rot8(lo(g2))
}   

galDisp = 0
for (s = 0; s < 256; s++){
ctx.fillRect( sys[0][s].x * mC, sys[0][s].y * mC, sys[0][s].pw, 1 );
}

//let canvasElem = document.getElementById("galCanvas");

canvas.addEventListener("click", function() {    
    clickedGalMap()
}); 

canvas.addEventListener("mousemove", function(f) {
    getMousePosition(canvas, f);
});

nextGalBut.addEventListener("click", function(){
    if (shortRange) {galDisp --}
    nextGalaxy()

})

function nextGalaxy(){

    ctx.clearRect(0, 0, mW, mH)
    sysDatTitle.innerHTML = ""
    sysDatText.innerHTML = ""
    nextGalBut.innerHTML = "next galaxy"
    systemSelected = false
    shortRange = false



    if (galDisp == 7){
        galDisp = 0
    }else{
        galDisp ++
    }

    title.innerHTML = `GALACTIC CHART ${galDisp+1}`

    for (s = 0; s < 256; s++){
        ctx.fillRect( sys[galDisp][s].x * 2, sys[galDisp][s].y * 2, sys[galDisp][s].pw, 1 );
        }

}


function clickedGalMap(){

    let animx = []
    let animy = []
    let xOff = 0
    let yOff = 0

    if (shortRange){
        galDisp --
        nextGalaxy()
    }

    if (!systemSelected) return
        sysCen = sysDisp

        x = sys[galDisp][sysDisp].x * 2
        y = sys[galDisp][sysDisp].y * 2
        xOff = 256 - x
        yOff = 128 - y

        for (let n = 0; n < 256; n++){
            x = sys[galDisp][n].x * 2
            y = sys[galDisp][n].y * 2
            x = x - 256
            y = y - 128
            animx[n] = x
            animy[n] = y
        }
        

        i = 1
        step = 0.05
        mag = 4

        

        curCenX = sys[galDisp][sysCen].x * 2
        curCenY = sys[galDisp][sysCen].y * 2


zoomIntID = setInterval(draw,10)


function draw(){

    ctx.clearRect(0, 0, 512, 256)
    xshift = xOff * ((i - 1)/3)
    yshift = yOff * ((i - 1)/3)
        for (let s = 0; s < 256; s++){
            x = sys[galDisp][s].x * 2
            y = sys[galDisp][s].y * 2
            x = x + xshift
            y = y + yshift
            x = ((x - curCenX) * i) + curCenX
            y = ((y - curCenY) * i) + curCenY
            if (s==sysCen){
                curCenX = x
                curCenY = y
                }
            ctx.fillRect(x,y, sys[galDisp][s].pw, 1)
                }                                            
    i = i + step  
    if (i > mag){
        clearInterval(zoomIntID)
     
        shortRangeChart()
    }
}



}

function shortRangeChart(){
    ctx.clearRect(0, 0, 512, 256)
    shortRange = true
    title.innerHTML = `SHORT RANGE CHART`
    nextGalBut.innerHTML = "back"

for (let s = 0; s <256; s++){
    xd = sys[galDisp][s].x - sys[galDisp][sysCen].x
    yd = sys[galDisp][s].y - sys[galDisp][sysCen].y
//    if ((Math.abs(sys[galDisp][s].x - sys[galDisp][sysCen].x) < 32) & (Math.abs(sys[galDisp][s].y - sys[galDisp][sysCen].y) < 16)) 
    if ((Math.abs(xd) < 32) && (Math.abs(yd) < 16))
        {
            ctx.fillRect(256 + (xd * 8), 128 + (yd * 8), sys[galDisp][s].pw, 1 );
           
    }
}


}




function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    x = x / 2
    y = y / 2

    if (shortRange){
        x = ((x - 128) / 4) +  (sys[galDisp][sysCen].x)
        y = ((y - 64) / 4) +  (sys[galDisp][sysCen].y)
    }
   

    for (s = 0; s < 256; s++){
        xdif = Math.abs(sys[galDisp][s].x - x) + (shortRange)
        ydif = Math.abs(sys[galDisp][s].y - y) + (shortRange)
        
        if (xdif < 2 && ydif < 2){
            showSysData()
        }
        if (xdif == 0 && ydif == 0){
            showSysData()
        }
    }

}

function showSysData(){
    sysDatTitle.innerHTML = "DATA ON SYSTEM " + sys[galDisp][s].name
    
    str1 = "Economy: " + sys[galDisp][s].eco
    str2 = "Government: " + govTypes[sys[galDisp][s].gov]
    str3 = "Tech.Level: " + sys[galDisp][s].tec
    str4 = "Population: " + sys[galDisp][s].pop + " Billion"
    str5 = "(" + sys[galDisp][s].spe + ")"
    str6 = "Gross Productivity: " + sys[galDisp][s].pro + " M Cr"
    str7 = "Average Radius: " + sys[galDisp][s].rad + " km"

    sysDatText.innerHTML = `<p>${str1}</p><p>${str2}</p><p>${str3}</p><p>${str4}</p><p>${str5}</p><p>${str6}</p><p>${str7}</p>` 
    systemSelected = true
    sysDisp = s
}

function twist(){
    tmp = s0 + s1
    tmp = wrap_16(tmp)
    s0 = s1
    s1 = s2
    s2 = tmp + s1
    s2 = wrap_16(s2)
}



function genSysName(s0,s1,s2){
 
    sysName = ""
  
    bit = s0 & 0b01000000  //get the 6th bit of s0 to decide if we do 4 or 3 text token loops
    
    if (bit > 0) {
        pairs = 4
    }
    else{
        pairs = 3
    }  
 
    for (let n = 0; n < pairs; n++){    // token loop
        bits = (s2 & 0b0001111100000000) >> 8   // get bits 8-12 of s2, i.e. 0-4 of s2_hi  
        if (bits>0){    // if those bits are non-zero then lookup up a text token to add to system name
            nextTwoChars = twoCharTokens[bits]
            sysName=sysName.concat(nextTwoChars)
        }else{
        }
    
    // Twist seeds keeping them wrapped to 16 bits
    tmp = s0 + s1
    tmp = wrap_16(tmp)
    s0 = s1
    s1 = s2
    s2 = tmp + s1
    s2 = wrap_16(s2)

    }
    
    return sysName
}   




function sysCoord(s0,s1,s2){
    x = hi(s1)
    y = hi(s0) >> 1 // galactic chart half height
    zz = lo(s2) | 0b01010000
    if (zz > 143){
        pw = 1
    }else{
        pw = 2
    }
    // in Elite C appears to be carry flag returned by cpl routine; I've just used the LSB of s0...
    c = s0 & 0b00000001 
    ss = (lo(s2) & 0b00000001) + 2 + c
    return Array(x,y,pw,ss)
}


// return Data on System from seeds AS AN OBJECT
function sysDat(s0,s1,s2){
    
    s0_hi = hi(s0)          // split 16 bit seeds into high and low bytes
    s0_lo = lo(s0)
    s1_hi = hi(s1)
    s1_lo = lo(s1)
    s2_hi = hi(s2)
    s2_lo = lo(s2)

    go = (s1_lo & 0b00111000) >> 3  // gov is 3 bits

    ec = s0_hi & 0b111      // Economy is 3 bits
    if (go < 2){            // If government is anarchy or feudal then
        ec = ec | 0b010     // set bit 1 of economy so it can't be rich
    }

    flipEcon = ec ^ 0b111   // flip all 3 bits of economy, used in tech & productivity calculations

    // Tech level = flipped_economy + (s1_hi AND %11) + (government / 2)
    // On 6502 division is done using LSR and the addition uses ADC, 
    // so we round up the division for odd-numbered government types
    te = flipEcon + (s1_hi & 0b11) + Math.round(go / 2)
    // internal variable 0-14 on 6502 incremented by TT25 routine to display as 1-15

    po = (te * 4) + ec + go + 1     // population = (tech level * 4) + economy + government + 1

    // Build species descr          iption string:
    huBit = (s2_lo & 0b10000000)    // if bit 7 of s2_lo is clear then human
       if (huBit == 0){
        sp = "Human Colonials"
    }else{                          // otherwise alien preceded by 0-3 adjectives
        sp = ""
        a = (s2_hi & 0b11100) >> 2          // Set a = bits 2-4 of s2_hi
        if (a < 3){
            sp = sp.concat(speTypes[0][a])  // add adjective if 0-2
        }
        a = (s2_hi & 0b11100000) >> 5       // Set a = bits 5-7 of s2_hi
        if (a < 6 ){
            sp = sp.concat(speTypes[1][a])  // add adjective if 0-5
        }
        a = (s0_hi ^ hi(s1)) & 0b111        // Set a = bits 0-2 of (s0_hi EOR s1_hi)
        if (a < 6 ){
            sp = sp.concat(speTypes[2][a])  // add adjective if 0-5   
        }
        a = a + (s2_hi & 0b11)              // add bits 0-1 of s2_hi to a from last step 
        a = a & 0b111                       // and take bits 0-2 of the result
        sp = sp.concat(speTypes[3][a])      // add species
    }

    // Gross productivity =
    // (flipped_economy + 3) * (government + 4) * population * 8
    pr = (flipEcon + 3) * (go + 4) * po * 8

    // Average radius =
    // ((s2_hi AND %1111) + 11) * 256 + s1_hi               
    ra = ((s2_hi & 0b1111) + 11) * 256 + s1_hi

    // Coordinates
    x = s1_hi
    y = s0_hi >> 1     // galactic chart is half height
    zz = s2_lo | 0b01010000
    if (zz > 143){      // pixel width
        pw = 1
    }else{
        pw = 2
    }
    // in Elite C appears to be carry flag returned by cpl routine; I've just used the LSB of s0...
    c = s0 & 0b00000001 
    ss = (lo(s2) & 0b00000001) + 2 + c

    // Return data with incremented tech level and population in billions to 1 decimal place
    return {name: genSysName(s0,s1,s2), eco: ec, gov: go, tec: te + 1, pop: po / 10, spe: sp, pro: pr, rad: ra, x: x, y: y, pw: pw, ss: ss, s0: s0, s1: s1, s2: s2}
}

// return high 8 bit byte of a 16 bit integer
function hi(n){
    masked = n & 0b1111111100000000
    return masked / 256
}

// return low 8 bit byte of a 16 bit integer 
function lo(n){
    masked = n & 0b0000000011111111
    return masked
}

// rotate 16 bit integer left one bit
function rot16(n){
    n = (n << 1) | (n >> 15)
    n = n & 0b1111111111111111
    return n
}

// rotate 8 bit integer left one bit
function rot8(n){
    n = (n << 1) | (n >> 7)
    n = n & 0b11111111
    return n
}

// return least significant 16 bits of integer
function wrap_16(n){
    return n & 0b1111111111111111
}

