//aka p5 map

export const  map_range = (value, low1, high1, low2, high2) => {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}


//Check scroll direction
let lastScrollPos = 0
export function scrollDir(scrollPos){
    let ret = scrollPos - lastScrollPos < 0 ? 'up' : 'down'
    lastScrollPos = scrollPos
    return ret
}

