
class FlockParams {
    constructor() {
        this.maxForce = 0.08
        this.maxSpeed = 3.7
        this.perceptionRadius = 200
        this.alignAmp = 1
        this.cohesionAmp = 1
        this.separationAmp = 1
    }
}

let flockParams = new FlockParams()
const gui = new dat.GUI()
gui.add(flockParams, 'alignAmp', 0.5, 2)
gui.add(flockParams, 'cohesionAmp', 0.5, 2)
gui.add(flockParams, 'separationAmp', 0.5, 2)
gui.add(flockParams, 'maxSpeed', 2, 6)
gui.add(flockParams, 'maxForce', .05, 3)
gui.add(flockParams, 'perceptionRadius', 20, 300)

/*==================
Ripple
===================*/
class Ripple {
    constructor(x, y) {
        this.position = createVector(x, y)
        this.size = random(50, 100)
        this.lifespan = 60
        this.color = color(0, 0, 0)
        this.sizeStep = random(2, 3)
        this.lifeStep = random(1, 2)
    }

    show() {
        this.color.setAlpha(this.lifespan)
        stroke(this.color)
        strokeWeight(1)
        noFill()
        ellipse(this.position.x, this.position.y, this.size, this.size)
    }

    update() {
        this.size = this.size + this.sizeStep
        this.lifespan = this.lifespan - this.lifeStep
    }
}



/*==================
Koi
===================*/

// cont koiColors = []

class Koi {
    constructor(x, y) {
        this.offsetX = random(-100, 100)
        this.offsetY = random(-100, 100)
        this.position = createVector(x + this.offsetX, y + this.offsetY)
        this.velocity = p5.Vector.random2D()
        this.velocity.setMag(random(2, 10))
        this.acceleration = createVector()
        this.maxForce = flockParams.maxForce
        this.maxSpeed = flockParams.maxSpeed
        this.baseSize = int(random(15, 20))
        this.bodyLength = this.baseSize * 2
        this.body = new Array(this.bodyLength).fill({...this.position})
    }

    align(kois) {
        // let perceptionRadius = 50
        let steering = createVector()
        let total = 0
        for (let other of kois) {
            let d = dist(
                this.position.x,
                this.position.y,
                other.position.x,
                other.position.y
            )
            if (d < flockParams.perceptionRadius && other != this) {
                steering.add(other.velocity)
                total++
            }
        }
        if (total > 0) {
            steering.div(total)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }
        return steering
    }

    cohesion(kois) {
        let steering = createVector()
        let total = 0
        for (let other of kois) {
            let d = dist(
                this.position.x,
                this.position.y,
                other.position.x,
                other.position.y
            )
            if (d < flockParams.perceptionRadius && other != this) {
                steering.add(other.position)
                total++
            }
        }
        if (total > 0) {
            steering.div(total)
            steering.sub(this.position)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }
        return steering
    }

    separation(kois) {
        // let perceptionRadius = 100
        let steering = createVector()
        let total = 0
        for (let other of kois) {
            let d = dist(
                this.position.x,
                this.position.y,
                other.position.x,
                other.position.y
            )
            if (d < flockParams.perceptionRadius && other != this) {
                let diff = p5.Vector.sub(this.position, other.position)
                diff.div(d)
                steering.add(diff)
                total++
            }
        }
        if (total > 0) {
            steering.div(total)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }
        return steering
    }

    avoid(obstacle) {
        let steering = createVector()
        let d = dist(
            this.position.x,
            this.position.y,
            obstacle.x,
            obstacle.y
        )
        if (d < flockParams.perceptionRadius) {
            let diff = p5.Vector.sub(this.position, obstacle)
            diff.div(d)
            steering.add(diff)
            steering.setMag(flockParams.maxSpeed)
            steering.sub(this.velocity)
            steering.limit(flockParams.maxForce)
        }


        return steering
    }

    edges() {
        if (this.position.x > width + 50) {
            this.position.x = -50
        } else if (this.position.x < -50) {
            this.position.x = width + 50
        }
        if (this.position.y > height + 50) {
            this.position.y = -50
        } else if (this.position.y < -50) {
            this.position.y = height + 50
        }
    }

    flock(kois) {
        this.acceleration.mult(0)
        let alignment = this.align(kois)
        let cohesion = this.cohesion(kois)
        let separation = this.separation(kois)

        let mouseObstacle = createVector(mouseX, mouseY)
        let avoid = this.avoid(mouseObstacle)

        alignment.mult(flockParams.alignAmp)
        cohesion.mult(flockParams.cohesionAmp)
        separation.mult(flockParams.separationAmp)
        
        this.acceleration.add(avoid)
        this.acceleration.add(separation)
        this.acceleration.add(alignment)
        this.acceleration.add(cohesion)
    }


    updateBody() {
        this.body.unshift({...this.position})
        this.body.pop()
    }

    show() {
        noStroke()
        this.body.forEach((b, index) => {
            let size
            if ( index < this.bodyLength / 6 ) {
                size = this.baseSize + index * 1.8
                fill(251, 36, 40, this.bodyLength - index)
            } else {
                fill(0, 0, 0, 50 - index)
                size = this.baseSize * 1.8 - index
            }
            
            ellipse(b.x, b.y, size, size)
        })
    }

    showShadow() {
        noStroke()
        this.body.forEach((b, index) => {
            let size
            if ( index < this.bodyLength / 6 ) {
                size = this.baseSize + index * 1.8
            } else {
                // fill(255, 255, 255, 50 - index)
                size = this.baseSize * 1.8 - index
            }

            fill(200, 200, 200, 20)
            ellipse(b.x + 50, b.y + 50, size, size)
        })
    }

    update() {
        this.position.add(this.velocity)
        this.velocity.add(this.acceleration)
        this.velocity.limit(flockParams.maxSpeed)
        this.updateBody()
    }
}



/*==================
Sketch: setup, draw, ect
===================*/

const flock = []
const ripples = []
const koiNumber = 20

function setup() {
    createCanvas(windowWidth, windowHeight)
    const centerX = random(width - 200, 200)
    const centerY = random(height - 200, 200)
    new Array(koiNumber).fill(1).map(el => {
        flock.push(new Koi(centerX, centerY))
    })
}

function draw() {
    background(230)

    // shadow
    flock.forEach(koi => {
        koi.showShadow()
    })

    flock.forEach(koi => {
        koi.edges()
        koi.flock(flock)
        koi.update()
        koi.show()
    })

    if (frameCount % 30 === 0) {
        ripples.push(new Ripple(random(width), random(height)))
    }
    console.log(frameCount)

    ripples.forEach((r, i) => {
        r.update()
        r.show()
        if (r.lifespan < 0 ) {
            ripples.slice(i, 1)
        }
    })

}

/*==================
Sketch: click to ripple
===================*/
function mouseClicked() {
    ripples.push(new Ripple(mouseX, mouseY))
}