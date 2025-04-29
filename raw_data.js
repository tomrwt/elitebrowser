 // initial seeds
 const rootSeed = [0x5A4A,0x0248,0xB753]

 s0 = rootSeed[0]
 s1 = rootSeed[1]
 s2 = rootSeed[2]
 
 
 // twoCharTokens text tokens 128-159 from Elite source code variable QQ16 (token 143 is "A?": not sure why, the ? isn't printed in system names)
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
 
 var shortRange = false
 
 var sysDisp
 var sysCen
 
 
 
 
 
 const table = document.getElementById("sTBody")
 const title = document.getElementById("title")


  
 for (g = 0; g < 8; g++){
 
     g0 = s0
     g1 = s1
     g2 = s2 
 
     sys[g] = []
                                               
     console.log("seeds for galaxy",g,":",s0,s1,s2)
 
     for (s = 0; s < 256; s++){
 
 //        console.log("Seeds for galaxy",g,"system",s,": ",s0, s1, s2)
  
         sys[g][s] = sysDat(s0,s1,s2)
 
 
 //        title.innerHTML = `GALACTIC CHART ${g+1}`
 
         let row=table.insertRow()
         let galNo = row.insertCell(0)
         galNo.innerHTML = g
         let sysNo = row.insertCell(1)
         sysNo.innerHTML = s
         let sysNa = row.insertCell(2)
         sysNa.innerHTML = sys[g][s].name
         let econTy = row.insertCell(3)
         econTy.innerHTML = sys[g][s].eco
         let govTy = row.insertCell(4)
         govTy.innerHTML = sys[g][s].gov
         let techLe = row.insertCell(5)  
         techLe.innerHTML = sys[g][s].tec
         let pop = row.insertCell(6)
         pop.innerHTML = sys[g][s].pop
         let speTy = row.insertCell(7)
         speTy.innerHTML = sys[g][s].spe
         let pro = row.insertCell(8)
         pro.innerHTML = sys[g][s].pro
         let rad = row.insertCell(9)
         rad.innerHTML = sys[g][s].rad
         let xco = row.insertCell(10)
         xco.innerHTML = sys[g][s].x
         let yco = row.insertCell(11)
         yco.innerHTML = sys[g][s].y
         let wid = row.insertCell(12)
         wid.innerHTML = sys[g][s].pw
 
         twist()
         twist()
         twist()
         twist()
     }
 
     s0 = (rot8(hi(g0)) << 8) + rot8(lo(g0))
     s1 = (rot8(hi(g1)) << 8) + rot8(lo(g1))
     s2 = (rot8(hi(g2)) << 8) + rot8(lo(g2))
 }   
 

 
 

 
 
 function twist(){
     tmp = s0 + s1
     tmp = wrap_16(tmp)
     s0 = s1
     s1 = s2
     s2 = tmp + s1
     s2 = wrap_16(s2)
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

 function genSysName(s0,s1,s2){
 
    sysName = ""
  
    bit = s0 & 0b01000000  //get the 6th bit of s0 to decide if we do 4 or 3 text token loops
    
    if (bit > 0) {
        pairs = 4
    }
    else{
        pairs = 3
    }
    
    console.log("bit 6 of s0 =",bit," so loop",pairs,"times")
    
    for (let n = 0; n < pairs; n++){    // token loop
        bits = (s2 & 0b0001111100000000) >> 8   // get bits 8-12 of s2, i.e. 0-4 of s2_hi  
        if (bits>0){    // if those bits are non-zero then lookup up a text token to add to system name
            nextTwoChars = twoCharTokens[bits]
            sysName=sysName.concat(nextTwoChars)
            console.log("bits 0-4 of s2_hi=",bits,"= text token",nextTwoChars)
        }else{
            console.log("bits 0-4 of s2_hi=",bits,"so no text to add")
        }
    
    // Twist seeds keeping them wrapped to 16 bits
    tmp = s0 + s1
    tmp = wrap_16(tmp)
    s0 = s1
    s1 = s2
    s2 = tmp + s1
    s2 = wrap_16(s2)

    }
    
    console.log(sysName)
    return sysName
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
 
 